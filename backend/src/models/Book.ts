import mongoose, { type Document, type Model, Schema } from "mongoose";

export type BookStatus = "uploaded" | "processing" | "completed" | "failed";

export interface IBook extends Document {
  title: string;
  author: string;
  filePath: string;
  fileHash: string;
  status: BookStatus;
  progress: number;
  errorMessage?: string;
  wordCount: number;
  totalChapters: number;
  coverUrl: string;
  readingMode: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true },
    author: { type: String, default: "Unknown Author" },
    filePath: { type: String, required: true },
    fileHash: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ["uploaded", "processing", "completed", "failed"],
      default: "uploaded",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    errorMessage: { type: String, default: null },
    wordCount: { type: Number, default: 0 },
    totalChapters: { type: Number, default: 0 },
    coverUrl: { type: String, default: "" },
    readingMode: { type: String, default: "" },
  },
  { timestamps: true },
);

export const Book: Model<IBook> =
  mongoose.models.Book ?? mongoose.model<IBook>("Book", BookSchema);
