import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IQuestion {
  word: string;
  sentence: string;
  options: string[];
  correctAnswer: string;
}

export interface IQuiz extends Document {
  stageId: mongoose.Types.ObjectId;
  questions: IQuestion[];
  createdAt: Date;
  updatedAt: Date;
}

const QuizSchema = new Schema<IQuiz>(
  {
    stageId: { type: Schema.Types.ObjectId, ref: "Stage", required: true, unique: true, index: true },
    questions: [
      {
        word: { type: String, required: true },
        sentence: { type: String, required: true },
        options: { type: [String], required: true, validate: (v: string[]) => v.length === 4 },
        correctAnswer: { type: String, required: true },
      },
    ],
  },
  { timestamps: true },
);

export const Quiz: Model<IQuiz> =
  mongoose.models.Quiz ?? mongoose.model<IQuiz>("Quiz", QuizSchema);
