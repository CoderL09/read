import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IBookChunk extends Document {
  bookId: mongoose.Types.ObjectId;
  stageId: mongoose.Types.ObjectId;
  content: string;
  embedding: number[];
  createdAt: Date;
}

const BookChunkSchema = new Schema<IBookChunk>(
  {
    bookId: { type: Schema.Types.ObjectId, ref: "Book", required: true, index: true },
    stageId: { type: Schema.Types.ObjectId, ref: "Stage", required: true },
    content: { type: String, required: true },
    embedding: { type: [Number], required: true },
  },
  { timestamps: true },
);

BookChunkSchema.index({ bookId: 1, stageId: 1 }, { unique: true });

export const BookChunk: Model<IBookChunk> =
  mongoose.models.BookChunk ?? mongoose.model<IBookChunk>("BookChunk", BookChunkSchema);
