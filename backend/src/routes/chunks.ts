import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import { Stage } from "../models/Stage.js";
import { getOrCreateChunks } from "../services/sense-chunk-parser.js";

const chunksRouter = Router();

chunksRouter.get("/stages/:stageId/chunks", async (req: Request, res: Response) => {
  try {
    const stageId = req.params.stageId as string;

    if (!mongoose.Types.ObjectId.isValid(stageId)) {
      res.status(400).json({ error: "Invalid stageId format" });
      return;
    }

    const stage = await Stage.findById(stageId).select("content chapterIndex");
    if (!stage) {
      res.status(404).json({ error: "Stage not found" });
      return;
    }

    if (!stage.content || stage.content.trim().length < 30) {
      res.status(422).json({ error: "Stage content is too short for meaningful chunking" });
      return;
    }

    const sentences = await getOrCreateChunks(stageId, stage.content);

    res.json({
      stageId,
      chapterIndex: stage.chapterIndex,
      sentenceCount: sentences.length,
      sentences,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[chunks] Error:", message);
    res.status(500).json({ error: "Failed to parse sense groups", detail: message });
  }
});

export default chunksRouter;
