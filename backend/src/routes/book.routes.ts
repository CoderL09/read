import { Router } from 'express'
import multer from 'multer'
import { getBookChapters, uploadBook } from '../controllers/bookController'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    const isTxt = file.originalname.toLowerCase().endsWith('.txt')
    if (!isTxt) {
      callback(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'))
      return
    }

    callback(null, true)
  },
})

export const bookRouter = Router()

bookRouter.post('/upload', upload.single('file'), uploadBook)
bookRouter.get('/:bookId/chapters', getBookChapters)
