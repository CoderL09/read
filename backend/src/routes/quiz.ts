import { Router } from "express";
import mongoose from "mongoose";
import { Quiz } from "../models/Quiz.js";
import { Stage } from "../models/Stage.js";
import { generateQuizzesFromStageContent } from "../services/quiz-generator.js";

const quizRouter = Router();

quizRouter.post("/stages/:stageId/generate-quizzes", async (req, res) => {
  try {
    const { stageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(stageId)) {
      res.status(400).json({ error: "Invalid stageId format" });
      return;
    }

    const stage = await Stage.findById(stageId);
    if (!stage) {
      res.status(404).json({ error: "Stage not found" });
      return;
    }

    if (!stage.content || stage.content.trim().length < 100) {
      res.status(422).json({ error: "Stage content is too short (minimum 100 characters)" });
      return;
    }

    const existingQuiz = await Quiz.findOne({ stageId });
    if (existingQuiz) {
      res.json(existingQuiz);
      return;
    }

    const questions = await generateQuizzesFromStageContent(stage.content);

    const quiz = await Quiz.create({ stageId, questions });

    res.status(201).json(quiz);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Quiz generation error:", message);
    res.status(500).json({ error: "Failed to generate quizzes", detail: message });
  }
});

export default quizRouter;
