import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IStage extends Document {
  bookId: mongoose.Types.ObjectId;
  chapterIndex: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const StageSchema = new Schema<IStage>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true },
    chapterIndex: { type: Number, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

StageSchema.index({ bookId: 1, chapterIndex: 1 }, { unique: true });

export const Stage: Model<IStage> =
  mongoose.models.Stage ?? mongoose.model<IStage>("Stage", StageSchema);
