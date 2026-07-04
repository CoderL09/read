import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import mongoose from "mongoose";
import { Book } from "../models/Book.js";
import { runGenerationPipeline } from "../services/stage-generator.js";
import { extractMetadata } from "../services/metadata-extractor.js";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

const UPLOADS_DIR = path.resolve("uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._\u4e00-\u9fff\-]/g, "_");
    cb(null, `${uniqueSuffix}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [".txt", ".pdf", ".epub"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      cb(new Error(`Unsupported file type: ${ext}. Allowed: ${allowed.join(", ")}`));
      return;
    }
    cb(null, true);
  },
});

const booksRouter = Router();

booksRouter.get("/books", async (_req, res) => {
  try {
    const books = await Book.find()
      .sort({ createdAt: -1 })
      .select("title author coverUrl status progress wordCount totalChapters");

    res.json(
      books.map((b) => ({
        id: b._id.toString(),
        title: b.title,
        author: b.author,
        coverUrl: b.coverUrl,
        status: b.status,
        progress: b.progress,
        wordCount: b.wordCount,
        totalChapters: b.totalChapters,
      })),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: "Failed to fetch books", detail: message });
  }
});

booksRouter.post("/books/upload", (req: MulterRequest, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(413).json({ error: "File exceeds 50MB size limit" });
          return;
        }
        res.status(400).json({ error: err.message });
        return;
      }
      if (err.message.startsWith("Unsupported file type")) {
        res.status(400).json({ error: err.message });
        return;
      }
      next(err);
      return;
    }
    handleUpload(req, res).catch(next);
  });
});

async function handleUpload(req: MulterRequest, res: Response) {
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: "No file provided. Use form field name 'file'" });
    return;
  }

  let fileHash: string;
  try {
    fileHash = await computeMd5(file.path);
  } catch (err) {
    await deleteFileSilently(file.path);
    res.status(500).json({ error: "Failed to process the uploaded file" });
    return;
  }

  const existing = await Book.findOne({ fileHash });
  if (existing) {
    await deleteFileSilently(file.path);
    res.status(409).json({
      success: false,
      message: "Duplicate book — this file has already been uploaded",
      bookId: existing._id.toString(),
      book: {
        id: existing._id.toString(),
        title: existing.title,
        author: existing.author,
        wordCount: existing.wordCount,
        totalChapters: existing.totalChapters,
        coverUrl: existing.coverUrl,
      },
    });
    return;
  }

  const book = await Book.create({
    title: path.parse(file.originalname).name,
    author: "Unknown Author",
    filePath: file.path,
    fileHash,
    status: "uploaded",
    progress: 0,
    wordCount: 0,
    totalChapters: 0,
    coverUrl: "",
  });

  let metaTitle = book.title;
  let metaAuthor = book.author;
  let metaWordCount = 0;
  let metaTotalChapters = 0;
  let metaCoverUrl = "";

  try {
    const meta = await extractMetadata(file.path, book._id.toString());
    metaTitle = meta.title;
    metaAuthor = meta.author;
    metaWordCount = meta.wordCount;
    metaTotalChapters = meta.totalChapters;
    metaCoverUrl = meta.coverUrl;

    book.title = meta.title;
    book.author = meta.author;
    book.wordCount = meta.wordCount;
    book.totalChapters = meta.totalChapters;
    book.coverUrl = meta.coverUrl;
    await book.save();
  } catch (err) {
    console.warn("[upload] Metadata extraction failed — using fallback values:", err);
  }

  res.status(201).json({
    message: "File uploaded successfully",
    book: {
      id: book._id.toString(),
      title: metaTitle,
      author: metaAuthor,
      wordCount: metaWordCount,
      totalChapters: metaTotalChapters,
      coverUrl: metaCoverUrl,
    },
  });
}

function computeMd5(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(filePath);

    stream.on("data", (chunk) => { hash.update(chunk as Buffer); });
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", (err) => reject(err));
  });
}

async function deleteFileSilently(filePath: string): Promise<void> {
  try {
    await fsPromises.unlink(filePath);
  } catch (err) {
    console.warn(`[upload] Failed to delete duplicate file ${filePath}:`, err);
  }
}

booksRouter.post("/books/:bookId/generate", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({ error: "Invalid bookId format" });
      return;
    }

    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    if (book.status === "processing") {
      res.status(409).json({
        error: "Generation is already in progress",
        progress: book.progress,
      });
      return;
    }

    book.status = "processing";
    book.progress = 0;
    book.errorMessage = undefined as any;
    await book.save();

    res.json({ success: true, message: "Generation started — check /status for progress" });

    runGenerationPipeline(bookId).catch((err) => {
      console.error(`[route] Background pipeline ${bookId} crashed:`, err);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Generate route error:", message);
    res.status(500).json({ error: "Failed to start generation", detail: message });
  }
});

booksRouter.get("/books/:bookId/status", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({ error: "Invalid bookId format" });
      return;
    }

    const book = await Book.findById(bookId).select("status progress errorMessage");
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    res.json({
      status: book.status,
      progress: book.progress,
      errorMessage: book.errorMessage ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: "Failed to fetch status", detail: message });
  }
});

booksRouter.get("/books/:bookId/chapters", async (req, res) => {
  try {
    const { bookId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(bookId)) {
      res.status(400).json({ error: "Invalid bookId format" });
      return;
    }

    const book = await Book.findById(bookId);
    if (!book) {
      res.status(404).json({ error: "Book not found" });
      return;
    }

    const { Stage } = await import("../models/Stage.js");

    const chapters = await Stage.find({ bookId })
      .sort({ chapterIndex: 1 })
      .select("chapterIndex content");

    res.json({
      book: {
        id: book._id.toString(),
        title: book.title,
        author: book.author,
        totalChapters: book.totalChapters,
        wordCount: book.wordCount,
        coverUrl: book.coverUrl,
      },
      chapters: chapters.map((ch) => ({
        id: (ch._id as mongoose.Types.ObjectId).toString(),
        chapterIndex: ch.chapterIndex,
        content: ch.content,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    res.status(500).json({ error: "Failed to fetch chapters", detail: message });
  }
});

export default booksRouter;
