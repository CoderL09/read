import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import mongoose from "mongoose";
import { SenseChunk } from "../models/SenseChunk.js";
import type { ISentenceChunk } from "../models/SenseChunk.js";

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
You are a senior IELTS reading tutor and cognitive linguist specialising in English sense-group chunking.

Your task: parse the passage below sentence by sentence.  For each sentence, split it into natural **sense groups** — the smallest meaningful, breath-group units that a fluent reader would mentally pause at.

**Chunking rules (strict)**:

1. **Subject phrase boundaries** — "The old master / walked slowly" (split after the full subject NP).
2. **Verb phrase boundaries** — "walked slowly / into the deep forest" (split after the full VP before a PP).
3. **Prepositional phrases** — start a new chunk at each prepositional phrase: "in the early morning", "into the deep forest", "with great patience".
4. **Clause markers** — split before "who", "which", "that" (relative), "because", "although", "when", "while", "if", "where", "before", "after", "since", "unless", "until".
5. **Non-finite verb phrases** — split before participial phrases: "..., / standing quietly", "..., / lost in thought".  Split before infinitives used as adverbials: "... / to find his way".
6. **Conjunctions** — split before "and", "but", "or", "nor", "yet", "so" when joining independent clauses.
7. **Do NOT split** single short words (articles, short prepositions, pronouns) into their own chunks.  Attach them to the phrase they modify: "in the forest" stays as one chunk, not "in / the / forest".
8. **Fluency check** — almost every chunk should feel like a natural "breath group" with 2-7 words.  If a chunk is only 1 word, merge it with the adjacent chunk unless it is a clause marker.
9. **Reconstruction test** — joining all chunks in order with a single space between them MUST exactly reconstruct the original sentence.

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

  for (const sentence of output.sentences) {
    const reconstructed = sentence.chunks.join(" ");
    const original = sentence.originalSentence.replace(/\s+/g, " ").trim();
    if (reconstructed !== original) {
      console.warn(
        `[chunks] Reconstruction mismatch: "${original}" vs "${reconstructed}"`,
      );
    }
  }

  return output.sentences;
}

export async function getOrCreateChunks(
  stageId: string,
  stageContent: string,
): Promise<ISentenceChunk[]> {
  const objectId = new mongoose.Types.ObjectId(stageId);

  const cached = await SenseChunk.findOne({ stageId: objectId });
  if (cached) {
    return cached.sentences;
  }

  const sentences = await parseSenseGroups(stageContent);

  await SenseChunk.create({ stageId: objectId, sentences });

  return sentences;
}
