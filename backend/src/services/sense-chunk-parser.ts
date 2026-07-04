import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import mongoose from "mongoose";
import { SenseChunk } from "../models/SenseChunk.js";
import type { ISentenceChunk } from "../models/SenseChunk.js";
import { normalizeRhythmChunks, parseLocalSenseGroups } from "./local-sense-chunk.js";

const SENSE_CHUNK_STANDARD_VERSION = 2;

const SenseGroupSchema = z.object({
  originalSentence: z
    .string()
    .describe("The complete original sentence from the passage, verbatim"),
  chunks: z
    .array(z.string())
    .min(1)
    .describe(
      "Sense-group segments of the sentence. When joined in order with single spaces, they must reconstruct the original sentence exactly.",
    ),
});

const ChunksOutputSchema = z.object({
  sentences: z
    .array(SenseGroupSchema)
    .min(1)
    .describe("Every sentence in the passage, each parsed into sense groups"),
});

type ChunksOutput = z.infer<typeof ChunksOutputSchema>;

function buildModel(): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: process.env.SILICONFLOW_API_KEY,
    modelName: "zai-org/GLM-5.2",
    temperature: 0.1,
    configuration: {
      baseURL: "https://api.siliconflow.cn/v1",
    },
  });
}

const senseGroupPrompt = PromptTemplate.fromTemplate(`
You design natural English reading rhythm for language learners.

Your task: split each sentence into the larger meaning units a native speaker naturally hears and understands while reading. Meaning and rhythm come first. This is NOT grammar-tree parsing.

**Chunking rules (strict)**:

1. Every chunk can be spoken naturally in one breath and carries one complete piece of meaning.
2. Keep phrasal verbs together: "looked out of", "gave up", "turned away from".
3. Keep a verb with its object or complement whenever they form one idea: "opened the old wooden door".
4. Keep fixed expressions and collocations together.
5. Keep an entire relative clause together. You may place the whole clause in a new chunk, but never split inside it merely because it contains prepositions or verbs.
6. Keep each prepositional phrase intact. Do not automatically make every prepositional phrase a new chunk; split only when a real spoken pause or meaning shift occurs.
7. Never isolate articles, pronouns, auxiliaries, conjunctions, particles, or short prepositions.
8. Prefer fewer, richer chunks. Do not chase a word-count target and do not split just to expose grammar.
9. Joining chunks in order with one space MUST exactly reconstruct the original sentence.

Target pattern:
"The old man / looked out of the window / without saying a word."
Never output:
"The old man / looked / out of / the window / without / saying / a word."

Passage:
---
{stageContent}
---
`);

export async function parseSenseGroups(
  stageContent: string,
): Promise<ISentenceChunk[]> {
  const model = buildModel();
  const chain = senseGroupPrompt.pipe(model.withStructuredOutput(ChunksOutputSchema));

  const trimmed = stageContent.slice(0, 5000);
  const output: ChunksOutput = await chain.invoke({ stageContent: trimmed });

  return output.sentences.map((sentence) => ({
    ...sentence,
    chunks: normalizeRhythmChunks(sentence.originalSentence, sentence.chunks),
  }));
}

export async function getOrCreateChunks(
  stageId: string,
  stageContent: string,
): Promise<ISentenceChunk[]> {
  const objectId = new mongoose.Types.ObjectId(stageId);

  const cached = await SenseChunk.findOne({ stageId: objectId });
  if (cached?.standardVersion === SENSE_CHUNK_STANDARD_VERSION) {
    return cached.sentences;
  }

  let sentences: ISentenceChunk[];
  try {
    sentences = await parseSenseGroups(stageContent);
  } catch (error) {
    console.warn("[chunks] AI rhythm parsing unavailable; using local rhythm parser", error);
    sentences = parseLocalSenseGroups(stageContent);
  }

  await SenseChunk.findOneAndUpdate(
    { stageId: objectId },
    { standardVersion: SENSE_CHUNK_STANDARD_VERSION, sentences },
    { upsert: true, new: true },
  );

  return sentences;
}
