import { Router, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
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

const readerAgentPrompt = PromptTemplate.fromTemplate(`
You help Chinese learners build native English reading intuition. Meaning and reading rhythm come first; grammar is only supporting evidence. Analyze only the supplied text.
The requested action is: {action}.
Existing meaning chunks, when available, are: {existingGroups}. Preserve them unless they clearly violate natural spoken rhythm.

When producing phraseGroups, do not follow a grammar tree. Use natural meaning chunks that can be spoken in one breath. Keep phrasal verbs, fixed expressions, verb-object units, relative clauses, and prepositional phrases together. Never isolate function words. Prefer fewer complete units over many short fragments.

Return valid JSON only, without markdown fences, using this schema:
{{
  "original": "the supplied English text",
  "translation": "natural Chinese translation",
  "skeleton": "concise subject + predicate + object/complement structure",
  "phraseGroups": [{{"text":"exact phrase", "grammarRole":"subject|predicate|object|complement|adverbial|attribute|clause|coordination", "roleHint":"brief Chinese explanation"}}],
  "grammarNotes": "clear Chinese explanation appropriate to the requested action",
  "difficultWords": [{{"word":"word or phrase", "meaning":"Chinese meaning with contextual nuance"}}],
  "learningTip": "one practical learning tip in Chinese"
}}

For translation, keep the explanation concise. For skeleton, emphasize the core structure. For vocab, emphasize difficultWords.
For scene, set grammar fields to empty values and put a vivid 50-80 word English image prompt in grammarNotes, a Chinese visual explanation in translation, and 3-6 visual keywords in difficultWords.

Text:
{text}
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

chatRouter.post("/books/:bookId/reader-agent", async (req: Request, res: Response) => {
  try {
    const bookId = req.params.bookId as string;
    const { text, action, existingGroups = [] } = req.body as {
      text?: string;
      action?: "grammar" | "translation" | "skeleton" | "vocab" | "scene";
      existingGroups?: Array<{ text: string; grammarRole?: string }>;
    };

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({ error: "Invalid bookId format" });
      return;
    }
    if (!text?.trim() || text.length > 2500) {
      res.status(400).json({ error: "Text is required and must be under 2500 characters" });
      return;
    }
    if (!action || !["grammar", "translation", "skeleton", "vocab", "scene"].includes(action)) {
      res.status(400).json({ error: "Unsupported reader action" });
      return;
    }

    const chain = readerAgentPrompt.pipe(buildChatModel());
    const response = await chain.invoke({
      action,
      text: text.trim(),
      existingGroups: existingGroups.length ? JSON.stringify(existingGroups) : "none",
    });
    const content = typeof response === "string" ? response : (response as any).content ?? String(response);
    res.json({ content });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[reader-agent] Error:", message);
    res.status(500).json({ error: "Failed to analyze reading selection", detail: message });
  }
});

chatRouter.post("/books/:bookId/scene-image", async (req: Request, res: Response) => {
  try {
    const bookId = req.params.bookId as string;
    const { prompt } = req.body as { prompt?: string };
    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({ error: "Invalid bookId format" });
      return;
    }
    if (!prompt?.trim() || prompt.length > 1800) {
      res.status(400).json({ error: "Prompt is required and must be under 1800 characters" });
      return;
    }

    const apiKey = process.env.SILICONFLOW_API_KEY;
    if (!apiKey) {
      res.status(503).json({ error: "Image generation is not configured" });
      return;
    }

    const response = await fetch("https://api.siliconflow.cn/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.SILICONFLOW_IMAGE_MODEL || "Qwen/Qwen-Image",
        prompt: prompt.trim(),
        negative_prompt: "text, watermark, logo, UI, distorted anatomy, low quality",
        image_size: "1472x1140",
        batch_size: 1,
        num_inference_steps: 20,
        guidance_scale: 7.5,
        cfg: 4,
      }),
    });
    const data = await response.json() as { images?: Array<{ url?: string }>; message?: string };
    if (!response.ok || !data.images?.[0]?.url) {
      throw new Error(data.message || `Image provider returned ${response.status}`);
    }
    const generated = await fetch(data.images[0].url);
    if (!generated.ok) throw new Error("Generated image could not be persisted");
    const contentType = generated.headers.get("content-type") || "image/png";
    const extension = contentType.includes("jpeg") ? "jpg" : contentType.includes("webp") ? "webp" : "png";
    const directory = path.resolve("public/uploads/scenes");
    await fs.mkdir(directory, { recursive: true });
    const filename = `${bookId}-${randomUUID()}.${extension}`;
    await fs.writeFile(path.join(directory, filename), Buffer.from(await generated.arrayBuffer()));
    res.json({ imageUrl: `/uploads/scenes/${filename}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[scene-image] Error:", message);
    res.status(500).json({ error: "Failed to generate scene image", detail: message });
  }
});

export default chatRouter;
