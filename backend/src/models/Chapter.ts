import { Schema, model } from 'mongoose'

const chapterSchema = new Schema(
  {
    bookId: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
    chapterIndex: { type: Number, required: true, min: 1 },
    content: { type: String, required: true },
  },
  { timestamps: true },
)

chapterSchema.index({ bookId: 1, chapterIndex: 1 }, { unique: true })

export const Chapter = model('Chapter', chapterSchema)
