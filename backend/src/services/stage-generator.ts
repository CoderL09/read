import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import mongoose from "mongoose";
import { Book } from "../models/Book.js";
import { Stage } from "../models/Stage.js";
import { SenseChunk } from "../models/SenseChunk.js";
import { extractText } from "./file-reader.js";
import { chunkText, splitByChapters, trimToFirstChapter } from "./text-splitter.js";
import { parseLocalSenseGroups } from "./local-sense-chunk.js";

const COARSE_CHUNK_SIZE = 15000;
const DEFAULT_WORDS_PER_QUEST = 500;
const AI_CONCURRENCY = 3;

const StageItemSchema = z.object({
  chapterIndex: z.number().int().positive().describe("Sequential chapter index within this chunk, starting from 1"),
  stageTitle: z.string().min(1).max(40).describe("A short story-driven title for this stage, 2-5 words"),
  stageSummary: z.string().min(1).max(120).describe("One-sentence plot summary of what happens in this stage"),
  content: z.string().describe("The full stage content, a coherent reading unit"),
});

const StagesOutputSchema = z.object({
  stages: z.array(StageItemSchema).min(1).describe("Array of reading stages extracted from the text chunk"),
});

type StageItem = z.infer<typeof StageItemSchema>;

function buildModel(maxTokens?: number): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: process.env.SILICONFLOW_API_KEY,
    modelName: "zai-org/GLM-5.2",
    temperature: 0.3,
    maxTokens: maxTokens ?? 4096,
    configuration: {
      baseURL: "https://api.siliconflow.cn/v1",
    },
  });
}

function buildQuestPrompt(targetChars: number): PromptTemplate {
  return PromptTemplate.fromTemplate(`
You are an expert at segmenting English prose into game-like reading stages.

Your task: take the provided text chunk and split it into self-contained stages of approximately ${targetChars} characters each. Follow these strict rules:

1. **Natural boundaries** — always split at sentence boundaries. Never cut a sentence in half.
2. **Coherence** — each stage must be a complete, meaningful unit.
3. **Chain together** — stages should flow in sequence.
4. **Approximate length** — target ${targetChars} characters per stage.
5. **Include all text** — do not skip any content.
6. **Title each stage** — give every stage a short story-driven title (2-5 words).
7. **Summarize each stage** — write one brief sentence.

Text chunk:
---
{chunk}
---
`);
}

async function runQuestPipeline(
  bookId: string,
  objectId: mongoose.Types.ObjectId,
  fullText: string,
  wordsPerQuest: number,
): Promise<number> {
  const stageTargetChars = wordsPerQuest * 5;
  const chunks = chunkText(fullText, COARSE_CHUNK_SIZE, 200);
  if (chunks.length === 0) throw new Error("Text splitting produced zero chunks");

  const prompt = buildQuestPrompt(stageTargetChars);
  let globalChapterIndex = 0;

  for (let batchStart = 0; batchStart < chunks.length; batchStart += AI_CONCURRENCY) {
    const batch = chunks.slice(batchStart, batchStart + AI_CONCURRENCY);
    const batchOffset = batchStart;

    const batchResults = await Promise.all(
      batch.map(async (chunk, i) => {
        const model = buildModel();
        const chain = prompt.pipe(model.withStructuredOutput(StagesOutputSchema));
        try {
          const output = await chain.invoke({ chunk: chunk.trim() });
          return { index: i, output, ok: true as const };
        } catch (err) {
          console.error(`[quest] Chunk ${batchOffset + i + 1}/${chunks.length} failed:`, err);
          return { index: i, output: null, ok: false as const };
        }
      }),
    );

    const sorted = batchResults.sort((a, b) => a.index - b.index);

    for (const { output, ok } of sorted) {
      if (!ok || !output) continue;

      const stageDocs = output.stages.map((stage: StageItem) => ({
        bookId: objectId,
        chapterIndex: globalChapterIndex + stage.chapterIndex,
        content: stage.content,
        stageTitle: stage.stageTitle,
        stageSummary: stage.stageSummary,
      }));

      globalChapterIndex += stageDocs.length;
      await Stage.insertMany(stageDocs);
    }

    const completedCount = batchStart + batch.length;
    await Book.findByIdAndUpdate(objectId, {
      progress: Math.round((completedCount / chunks.length) * 100),
      totalChapters: globalChapterIndex,
    });
  }

  return globalChapterIndex;
}

async function runContinuousPipeline(
  bookId: string,
  objectId: mongoose.Types.ObjectId,
  fullText: string,
): Promise<number> {
  const chapters = splitByChapters(fullText);
  if (chapters.length === 0) throw new Error("No chapters found in text");

  const stageDocs = chapters.map((content, i) => ({
    bookId: objectId,
    chapterIndex: i + 1,
    content: content.trim(),
    stageTitle: `Chapter ${i + 1}`,
    stageSummary: "",
  }));

  const saved = await Stage.insertMany(stageDocs);

  for (let i = 0; i < saved.length; i++) {
    const stage = saved[i];
    const sentences = parseLocalSenseGroups(chapters[i]);
    await SenseChunk.create({ stageId: stage._id, sentences });
  }

  await Book.findByIdAndUpdate(objectId, {
    progress: 100,
    totalChapters: stageDocs.length,
  });

  console.log(`[continuous] Book ${bookId} split into ${stageDocs.length} chapters with local sense groups`);
  return stageDocs.length;
}

export async function runGenerationPipeline(
  bookId: string,
  wordsPerQuest: number = DEFAULT_WORDS_PER_QUEST,
  mode: "quest" | "continuous" = "quest",
): Promise<void> {
  const objectId = new mongoose.Types.ObjectId(bookId);

  try {
    const book = await Book.findById(objectId);
    if (!book) {
      console.error(`[pipeline] Book ${bookId} not found`);
      return;
    }

    book.status = "processing";
    book.progress = 0;
    await book.save();

    let fullText = await extractText(book.filePath);
    fullText = trimToFirstChapter(fullText);

    // A failed or interrupted run may have left partial stages behind. A new
    // run replaces them instead of failing on the (bookId, chapterIndex) index.
    await Stage.deleteMany({ bookId: objectId });

    const totalStages = mode === "continuous"
      ? await runContinuousPipeline(bookId, objectId, fullText)
      : await runQuestPipeline(bookId, objectId, fullText, wordsPerQuest);

    await Book.findByIdAndUpdate(objectId, {
      status: "completed",
      progress: 100,
      totalChapters: totalStages,
      readingMode: mode,
    });

    console.log(`[pipeline] Book ${bookId} completed (${mode}) — ${totalStages} stages`);

    setImmediate(async () => {
      try {
        const { embedAndSaveBook } = await import("./vector-service.js");
        const count = await embedAndSaveBook(bookId);
        console.log(`[pipeline] Book ${bookId} embedding done — ${count} chunks indexed`);
      } catch (embedErr) {
        console.error(`[pipeline] Book ${bookId} embedding failed:`, embedErr);
      }
    });
  } catch (error: unknown) {
    console.error(`[pipeline] Book ${bookId} failed:`, error);

    try {
      await Book.findByIdAndUpdate(objectId, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown pipeline error",
        progress: 0,
      });
    } catch (dbError) {
      console.error(`[pipeline] Failed to update book ${bookId} status to 'failed':`, dbError);
    }
  }
}
