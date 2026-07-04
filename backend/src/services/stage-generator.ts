import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import mongoose from "mongoose";
import { Book } from "../models/Book.js";
import { Stage } from "../models/Stage.js";
import { extractText } from "./file-reader.js";
import { chunkText } from "./text-splitter.js";

const COARSE_CHUNK_SIZE = 15000;
const STAGE_TARGET_SIZE = 500;

const StageItemSchema = z.object({
  chapterIndex: z.number().int().positive().describe("Sequential chapter index within this chunk, starting from 1"),
  content: z.string().describe("The full stage content, approximately 400-600 characters, forming a coherent reading unit"),
});

const StagesOutputSchema = z.object({
  stages: z.array(StageItemSchema).min(1).describe("Array of reading stages extracted from the text chunk"),
});

type StagesOutput = z.infer<typeof StagesOutputSchema>;

function buildModel(): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: process.env.SILICONFLOW_API_KEY,
    modelName: "zai-org/GLM-5.2",
    temperature: 0.4,
    configuration: {
      baseURL: "https://api.siliconflow.cn/v1",
    },
  });
}

const stagePrompt = PromptTemplate.fromTemplate(`
You are an expert at segmenting English prose into game-like reading stages for language learners (similar to Duolingo).

Your task: take the provided text chunk and split it into self-contained stages of approximately 400-600 characters each. Follow these strict rules:

1. **Natural boundaries** — always split at sentence boundaries. Never cut a sentence in half.
2. **Coherence** — each stage must be a complete, meaningful unit that a learner can read independently.
3. **Chain together** — stages should flow in sequence so that reading them in order tells a continuous story.
4. **Approximate length** — target 400-600 characters per stage. If a passage is shorter, use it as-is. If a sentence is very long, keep it intact rather than fragmenting it.
5. **Include all text** — do not skip or summarize any content. Every word of the original text must appear in exactly one stage.

Text chunk:
---
{chunk}
---
`);

export async function runGenerationPipeline(bookId: string): Promise<void> {
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

    const fullText = await extractText(book.filePath);

    const chunks = chunkText(fullText, COARSE_CHUNK_SIZE, 200);
    if (chunks.length === 0) {
      throw new Error("Text splitting produced zero chunks");
    }

    const model = buildModel();
    const chain = stagePrompt.pipe(model.withStructuredOutput(StagesOutputSchema));

    let globalChapterIndex = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        const output: StagesOutput = await chain.invoke({ chunk: chunk.trim() });

        const stageDocs = output.stages.map((stage) => ({
          bookId: objectId,
          chapterIndex: globalChapterIndex + stage.chapterIndex,
          content: stage.content,
        }));

        globalChapterIndex += stageDocs.length;

        await Stage.insertMany(stageDocs);

        book.progress = Math.round(((i + 1) / chunks.length) * 100);
        book.totalChapters = globalChapterIndex;
        await book.save();
      } catch (err) {
        console.error(`[pipeline] Chunk ${i + 1}/${chunks.length} failed:`, err);

        book.progress = Math.round(((i + 1) / chunks.length) * 100);
        await book.save();

        if (i === 0) {
          throw err;
        }
      }
    }

    book.status = "completed";
    book.progress = 100;
    await book.save();
    console.log(`[pipeline] Book ${bookId} completed — ${globalChapterIndex} stages generated`);

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
