import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { Book } from '../models/Book'
import { Chapter } from '../models/Chapter'

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 360,
  chunkOverlap: 40,
  separators: ['. ', '! ', '? ', '; ', '\n\n', '\n', ', ', ' ', ''],
})

export async function uploadBook(req: Request, res: Response, next: NextFunction) {
  let bookId: mongoose.Types.ObjectId | undefined

  try {
    if (!req.file) {
      res.status(400).json({ message: 'Please upload a TXT file using the file field.' })
      return
    }

    const text = req.file.buffer.toString('utf8').replace(/^\uFEFF/u, '').trim()
    if (!text) {
      res.status(400).json({ message: 'The uploaded TXT file is empty.' })
      return
    }

    const chunks = (await splitter.splitText(text)).map((chunk) => chunk.trim()).filter(Boolean)
    if (chunks.length === 0) {
      res.status(422).json({ message: 'No readable English content was found.' })
      return
    }

    const title = req.file.originalname.replace(/\.txt$/iu, '').trim() || 'Untitled Book'
    const book = await Book.create({
      title,
      originalFileName: req.file.originalname,
      totalChapters: chunks.length,
    })
    bookId = book._id

    await Chapter.insertMany(
      chunks.map((content, index) => ({
        bookId: book._id,
        chapterIndex: index + 1,
        content,
      })),
    )

    res.status(201).json({
      message: 'Book uploaded and split successfully.',
      book: {
        id: book.id,
        title: book.title,
        totalChapters: chunks.length,
      },
    })
  } catch (error) {
    if (bookId) {
      await Promise.allSettled([
        Chapter.deleteMany({ bookId }),
        Book.findByIdAndDelete(bookId),
      ])
    }
    next(error)
  }
}

export async function getBookChapters(req: Request, res: Response, next: NextFunction) {
  try {
    const { bookId } = req.params
    if (!bookId || !mongoose.isValidObjectId(bookId)) {
      res.status(400).json({ message: 'Invalid book id.' })
      return
    }

    const book = await Book.findById(bookId).lean()
    if (!book) {
      res.status(404).json({ message: 'Book not found.' })
      return
    }

    const chapters = await Chapter.find({ bookId })
      .select('_id chapterIndex content')
      .sort({ chapterIndex: 1 })
      .lean()

    res.json({
      book: {
        id: book._id,
        title: book.title,
        totalChapters: book.totalChapters,
      },
      chapters: chapters.map((chapter) => ({
        id: chapter._id,
        chapterIndex: chapter.chapterIndex,
        content: chapter.content,
      })),
    })
  } catch (error) {
    next(error)
  }
}
