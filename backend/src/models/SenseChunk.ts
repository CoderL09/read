import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface ISentenceChunk {
  originalSentence: string;
  chunks: string[];
}

export interface ISenseChunk extends Document {
  stageId: mongoose.Types.ObjectId;
  sentences: ISentenceChunk[];
  createdAt: Date;
  updatedAt: Date;
}

const SentenceChunkSubSchema = new Schema<ISentenceChunk>(
  {
    originalSentence: { type: String, required: true },
    chunks: { type: [String], required: true },
  },
  { _id: false },
);

const SenseChunkSchema = new Schema<ISenseChunk>(
  {
    stageId: { type: Schema.Types.ObjectId, ref: "Stage", required: true, unique: true, index: true },
    sentences: { type: [SentenceChunkSubSchema], required: true },
  },
  { timestamps: true },
);

export const SenseChunk: Model<ISenseChunk> =
  mongoose.models.SenseChunk ?? mongoose.model<ISenseChunk>("SenseChunk", SenseChunkSchema);
