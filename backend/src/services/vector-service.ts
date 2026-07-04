import { OpenAIEmbeddings } from "@langchain/openai";
import mongoose from "mongoose";
import { BookChunk, type IBookChunk } from "../models/BookChunk.js";
import { Stage } from "../models/Stage.js";
import { Book } from "../models/Book.js";

const CHUNK_SIZE = 500;
const EMBEDDING_BATCH_SIZE = 20;
const TOP_K = 3;

function buildEmbeddings(): OpenAIEmbeddings {
  return new OpenAIEmbeddings({
    apiKey: process.env.SILICONFLOW_API_KEY,
    modelName: "BAAI/bge-m3",
    configuration: {
      baseURL: "https://api.siliconflow.cn/v1",
    },
  });
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  if (a.every((v) => v === 0) || b.every((v) => v === 0)) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

function chunkByCharCount(text: string, size: number): string[] {
  const chunks: string[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    chunks.push(text.slice(cursor, cursor + size));
    cursor += size;
  }

  return chunks;
}

export async function embedAndSaveBook(bookId: string): Promise<number> {
  const objectId = new mongoose.Types.ObjectId(bookId);
  const embeddings = buildEmbeddings();

  const stages = await Stage.find({ bookId: objectId }).sort({ chapterIndex: 1 });
  if (stages.length === 0) {
    throw new Error("No stages found for this book — run the generation pipeline first");
  }

  await BookChunk.deleteMany({ bookId: objectId });

  const chunks: { stageId: mongoose.Types.ObjectId; content: string }[] = [];

  for (const stage of stages) {
    const subChunks = chunkByCharCount(stage.content, CHUNK_SIZE);
    for (const sub of subChunks) {
      if (sub.trim().length < 20) continue;
      chunks.push({ stageId: stage._id as mongoose.Types.ObjectId, content: sub });
    }
  }

  let saved = 0;
  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
    const vectors = await embeddings.embedDocuments(batch.map((c) => c.content));

    const docs = batch.map((chunk, idx) => ({
      bookId: objectId,
      stageId: chunk.stageId,
      content: chunk.content,
      embedding: vectors[idx],
    }));

    await BookChunk.insertMany(docs);
    saved += docs.length;
    console.log(`[embed] Batch ${Math.floor(i / EMBEDDING_BATCH_SIZE) + 1} — ${docs.length} chunks embedded`);
  }

  console.log(`[embed] Book ${bookId} fully indexed — ${saved} chunks saved`);
  return saved;
}

interface SearchResult {
  chunk: IBookChunk;
  score: number;
}

export async function searchRelevantChunks(
  bookId: string,
  question: string,
  limit: number = TOP_K,
): Promise<SearchResult[]> {
  const objectId = new mongoose.Types.ObjectId(bookId);
  const chunks = await BookChunk.find({ bookId: objectId });

  if (chunks.length === 0) {
    return [];
  }

  const embeddings = buildEmbeddings();
  const questionVector = await embeddings.embedQuery(question);

  const scored = chunks.map((chunk) => ({
    chunk,
    score: cosineSimilarity(questionVector, chunk.embedding),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
