import { Router, type Request, type Response } from "express";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import mongoose from "mongoose";
import { Book } from "../models/Book.js";
import { searchRelevantChunks } from "../services/vector-service.js";

const chatRouter = Router();

function buildChatModel(): ChatOpenAI {
  return new ChatOpenAI({
    apiKey: process.env.SILICONFLOW_API_KEY,
    modelName: "zai-org/GLM-5.2",
    temperature: 0.5,
    configuration: {
      baseURL: "https://api.siliconflow.cn/v1",
    },
  });
}

const ragPrompt = PromptTemplate.fromTemplate(`
You are a friendly reading companion spirit.  Answer the user's question based **only** on the reference context below.  Follow these rules:

1. If the context contains the answer, respond in a warm, encouraging tone — like a helpful tutor.
2. **Keep it concise** — 3 to 6 sentences is enough unless the question demands more detail.
3. If the context does **not** contain enough information to answer, say so politely and decline to speculate.  Never make up facts not present in the context.
4. You may quote short phrases from the context, but do not dump large blocks of text.

Reference context (from the book):
---
{context}
---

User's question:
{question}
`);

chatRouter.post("/books/:bookId/chat", async (req: Request, res: Response) => {
  try {
    const bookId = req.params.bookId as string;
    const { question } = req.body as { question?: string };

    if (!question || question.trim().length === 0) {
      res.status(400).json({ error: "Question is required" });
      return;
    }

    if (question.trim().length > 2000) {
      res.status(400).json({ error: "Question must be under 2000 characters" });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({ error: "Invalid bookId format" });
      return;
    }

    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    if (book.status !== "completed") {
      res.status(422).json({
        error: "Book processing is not yet complete — RAG is unavailable",
        status: book.status,
        progress: book.progress,
      });
      return;
    }

    const results = await searchRelevantChunks(bookId, question.trim());

    if (results.length === 0) {
      res.json({
        answer: "This book hasn't been indexed for search yet.  Please wait for embedding to finish.",
        sources: [],
      });
      return;
    }

    const context = results
      .map((r, i) => `[Excerpt ${i + 1}] (relevance ${(r.score * 100).toFixed(0)}%)\n${r.chunk.content}`)
      .join("\n\n");

    const model = buildChatModel();
    const chain = ragPrompt.pipe(model);

    const response = await chain.invoke({
      context,
      question: question.trim(),
    });

    res.json({
      answer: typeof response === "string" ? response : (response as any).content ?? String(response),
      sources: results.map((r) => ({
        content: r.chunk.content.slice(0, 300),
        score: Math.round(r.score * 100) / 100,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[chat] RAG error:", message);
    res.status(500).json({ error: "Failed to generate answer", detail: message });
  }
});

export default chatRouter;
