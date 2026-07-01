import { Schema, model } from 'mongoose'

const bookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    originalFileName: { type: String, required: true, trim: true },
    totalChapters: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true },
)

export const Book = model('Book', bookSchema)
