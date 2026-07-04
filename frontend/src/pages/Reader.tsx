import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, List, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CompanionAvatar, getStoredCompanion, useEvolutionStage } from '../components/Companion'
import { api, type Book } from '../lib/api'

type SentenceChunk = {
  originalSentence: string
  chunks: string[]
}

type ChunksResponse = {
  stageId: string
  chapterIndex: number
  sentenceCount: number
  sentences: SentenceChunk[]
}

type ChapterFull = {
  id: string
  chapterIndex: number
  content: string
  stageTitle?: string
  stageSummary?: string
}

type ChaptersResponse = {
  book: Book
  chapters: ChapterFull[]
}

export default function Reader() {
  const navigate = useNavigate()
  const { stageId } = useParams<{ stageId: string }>()
  const [chunks, setChunks] = useState<ChunksResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [senseMode, setSenseMode] = useState(true)
  const [bookChapters, setBookChapters] = useState<ChapterFull[]>([])
  const [book, setBook] = useState<Book | null>(null)
  const [rawContent, setRawContent] = useState('')
  const [tocOpen, setTocOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const companionStage = useEvolutionStage(book)

  const isContinuous = book?.readingMode === 'continuous'

  const currentChapter = useMemo(
    () => bookChapters.find((ch) => ch.id === stageId),
    [bookChapters, stageId],
  )
  const currentIndex = bookChapters.findIndex((ch) => ch.id === stageId)
  const prevChapter = currentIndex > 0 ? bookChapters[currentIndex - 1] : null
  const nextChapter = currentIndex < bookChapters.length - 1 ? bookChapters[currentIndex + 1] : null

  useEffect(() => {
    if (!stageId) return

    const controller = new AbortController()
    let aborted = false

    async function load() {
      const bookId = localStorage.getItem('readquest.bookId')
      if (!bookId) {
        setError('No book selected — pick one from your library first')
        setLoading(false)
        return
      }

      try {
        const { data: chaptersData } = await api.get<ChaptersResponse>(
          `/books/${bookId}/chapters`,
          { signal: controller.signal },
        )
        if (aborted) return

        setBook(chaptersData.book)
        setBookChapters(chaptersData.chapters)

        const chapter = chaptersData.chapters.find((ch) => ch.id === stageId)
        if (chapter) {
          setRawContent(chapter.content)
        }
      } catch {
        if (!aborted) setError('Failed to load book data')
        setLoading(false)
        return
      }

      try {
        const { data: chunksData } = await api.get<ChunksResponse>(
          `/stages/${stageId}/chunks`,
          { signal: controller.signal },
        )
        if (!aborted) {
          setChunks(chunksData)
          setSenseMode(true)
        }
      } catch (err: unknown) {
        const detail =
          err && typeof err === 'object' && 'response' in err
            ? (err as any).response?.data?.detail ?? (err as any).response?.data?.error ?? ''
            : ''
        console.warn('[reader] Sense chunks unavailable, using plain text:', detail)
        setChunks(null)
        setSenseMode(false)
      }

      if (!aborted) setLoading(false)
    }

    void load()

    return () => {
      aborted = true
      controller.abort()
    }
  }, [stageId])

  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0
  }, [stageId])

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080d0f]">
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-amber-300" size={32} />
          <p className="mt-4 text-xs text-cream/40">Opening your chapter...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080d0f] text-cream px-6">
        <div className="text-center max-w-sm">
          <BookOpen className="mx-auto text-cream/15" size={48} />
          <p className="mt-5 font-serif text-xl text-red-300">{error}</p>
          <Link
            className="mt-6 inline-flex items-center gap-2 text-sm text-amber-300 hover:underline"
            to="/path"
          >
            <ArrowLeft size={15} /> Back to quest map
          </Link>
        </div>
      </main>
    )
  }

  const hasContent = chunks || rawContent

  if (!hasContent) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080d0f] text-cream px-6">
        <div className="text-center max-w-sm">
          <BookOpen className="mx-auto text-cream/15" size={48} />
          <p className="mt-5 font-serif text-xl">Content not available</p>
          <p className="mt-2 text-sm text-cream/40">This chapter may not have been generated yet.</p>
          <Link
            className="mt-6 inline-flex items-center gap-2 text-sm text-amber-300 hover:underline"
            to="/path"
          >
            <ArrowLeft size={15} /> Back to quest map
          </Link>
        </div>
      </main>
    )
  }

  const displayContent = chunks?.sentences ?? null
  const chapterTitle = currentChapter?.stageTitle || `Chapter ${currentChapter?.chapterIndex ?? ''}`

  return (
    <main className="min-h-screen bg-[#080d0f] text-cream">
      <nav className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/[.05] bg-[#080d0f]/90 px-5 py-3 backdrop-blur-md">
        <button
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 text-cream/55 transition hover:border-white/25 hover:text-cream"
          type="button"
          onClick={() => navigate('/path')}
          aria-label="Back to quest map"
        >
          <ArrowLeft size={17} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-cream/35">{book?.title ?? ''}</p>
          <p className="truncate text-sm font-semibold">{chapterTitle}</p>
        </div>
        <CompanionAvatar companionId={getStoredCompanion()} stage={companionStage} className="h-8 w-8" showEvolution={false} />
        {displayContent && (
          <button
            className={`rounded-lg border px-3 py-1.5 text-[10px] font-semibold transition ${
              senseMode
                ? 'border-amber-300/40 bg-amber-300/10 text-amber-300'
                : 'border-white/10 text-cream/40'
            }`}
            type="button"
            onClick={() => setSenseMode((prev) => !prev)}
          >
            {senseMode ? 'Sense groups' : 'Plain text'}
          </button>
        )}
        {isContinuous && (
          <button
            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-cream/55 transition hover:border-white/25 hover:text-cream"
            type="button"
            onClick={() => setTocOpen(true)}
            aria-label="Table of contents"
          >
            <List size={16} />
          </button>
        )}
      </nav>

      <div ref={contentRef} className="mx-auto max-w-2xl px-5 pb-10 pt-10">
        {displayContent ? (
          <article className="space-y-10 leading-[2.1]">
            {displayContent.map((sentence, i) => (
              <p key={i} className="text-[17px] text-cream/85">
                {senseMode ? <SenseLine chunks={sentence.chunks} /> : sentence.originalSentence}
              </p>
            ))}
          </article>
        ) : (
          <article className="space-y-10 leading-[2.1]">
            {rawContent.split(/(?<=[.!?])\s+/g).map((sentence, i) => {
              const trimmed = sentence.trim()
              if (!trimmed) return null
              return (
                <p key={i} className="text-[17px] text-cream/85">
                  {trimmed}
                </p>
              )
            })}
          </article>
        )}
      </div>

      {isContinuous && (
        <div className="mx-auto max-w-2xl px-5">
          <div className={`rounded-xl border border-white/[.06] bg-white/[.02] transition-all duration-300 ${tocOpen ? 'mb-4 p-5' : 'mb-16'}`}>
            <button
              className="flex w-full items-center justify-between gap-2 text-xs text-cream/40 hover:text-cream/70 transition"
              type="button"
              onClick={() => setTocOpen((prev) => !prev)}
            >
              <span className="flex items-center gap-2">
                <List size={14} />
                Table of Contents · {bookChapters.length} chapters
              </span>
              <span className="text-[10px]">{tocOpen ? 'collapse' : 'expand'}</span>
            </button>
            {tocOpen && (
              <div className="mt-4 grid grid-cols-1 gap-1 max-h-[40vh] overflow-y-auto">
                {bookChapters.map((ch) => {
                  const active = ch.id === stageId
                  return (
                    <button
                      key={ch.id}
                      className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-left text-sm transition ${
                        active
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-400/15'
                          : 'text-cream/55 hover:bg-white/[.04] hover:text-cream/85'
                      }`}
                      type="button"
                      onClick={() => navigate(`/read/${ch.id}`)}
                    >
                      <span className="shrink-0 w-7 text-[10px] text-cream/25 tabular-nums">
                        {String(ch.chapterIndex).padStart(2, '0')}
                      </span>
                      <span className="truncate">{ch.stageTitle || `Chapter ${ch.chapterIndex}`}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-white/[.06] bg-[#080d0f]/90 px-5 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          {prevChapter ? (
            <button
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-xs text-cream/55 transition hover:border-white/25 hover:text-cream"
              type="button"
              onClick={() => navigate(`/read/${prevChapter.id}`)}
            >
              <ChevronLeft size={15} /> {prevChapter.stageTitle || `Ch. ${prevChapter.chapterIndex}`}
            </button>
          ) : (
            <span />
          )}

          <span className="text-[10px] text-cream/25">
            {currentIndex + 1} / {bookChapters.length}
          </span>

          {nextChapter ? (
            <button
              className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300 transition hover:bg-amber-500/20"
              type="button"
              onClick={() => navigate(`/read/${nextChapter.id}`)}
            >
              {nextChapter.stageTitle || `Ch. ${nextChapter.chapterIndex}`} <ChevronRight size={15} />
            </button>
          ) : (
            <span />
          )}
        </div>
      </footer>
    </main>
  )
}

function SenseLine({ chunks }: { chunks: string[] }) {
  return (
    <>
      {chunks.map((chunk, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-[2px] font-light text-amber-400/60"> / </span>}
          <span className="transition-colors hover:text-amber-200">{chunk}</span>
        </span>
      ))}
    </>
  )
}
