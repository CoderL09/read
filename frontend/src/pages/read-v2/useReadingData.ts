import { useEffect, useState } from 'react'
import { api, type Book } from '../../lib/api'
import type { SentenceChunkFromAPI, ChapterFromAPI } from './types'

interface UseReadingDataReturn {
  book: Book | null
  chapters: ChapterFromAPI[]
  currentChapter: ChapterFromAPI | null
  loading: boolean
  error: string
}

export function useReadingData(stageId: string | undefined): UseReadingDataReturn {
  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<ChapterFromAPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!stageId) return
    const controller = new AbortController()

    void (async () => {
      const bookId = localStorage.getItem('readquest.bookId')
      if (!bookId) {
        setError('No book selected')
        setLoading(false)
        return
      }

      try {
        const { data } = await api.get<{ book: Book; chapters: ChapterFromAPI[] }>(
          `/books/${bookId}/chapters`,
          { signal: controller.signal },
        )
        if (!controller.signal.aborted) {
          setBook(data.book)
          setChapters(data.chapters)
        }
      } catch {
        if (!controller.signal.aborted) setError('Failed to load chapters')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [stageId])

  const currentChapter = chapters.find((c) => c.id === stageId) ?? null

  return { book, chapters, currentChapter, loading, error }
}

export function useSenseChunks(stageId: string | undefined): {
  chunks: SentenceChunkFromAPI[] | null
  loading: boolean
} {
  const [chunks, setChunks] = useState<SentenceChunkFromAPI[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!stageId) return
    const controller = new AbortController()

    void (async () => {
      try {
        const { data } = await api.get<{ sentences: SentenceChunkFromAPI[] }>(
          `/stages/${stageId}/chunks`,
          { signal: controller.signal },
        )
        if (!controller.signal.aborted) setChunks(data.sentences)
      } catch {
        if (!controller.signal.aborted) setChunks(null)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [stageId])

  return { chunks, loading }
}
