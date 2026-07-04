import axios from 'axios'
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  FileText,
  Flame,
  Loader2,
  LockKeyhole,
  Search,
  Sparkles,
  Target,
  Upload as UploadIcon,
  WandSparkles,
  X,
  XCircle,
} from 'lucide-react'
import type { ChangeEvent, DragEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mediaUrl } from '../lib/api'

type UploadedBook = {
  id: string
  title: string
  author: string
  wordCount: number
  totalChapters: number
  coverUrl: string
}

type UploadResponse = {
  message: string
  book: UploadedBook
}

type UploadResult = {
  book: UploadedBook
  file: File
}

type GenStatus = 'idle' | 'starting' | 'polling' | 'completed' | 'failed'

const progressMessages = [
  { min: 0,  text: 'Summoning the AI mentor...' },
  { min: 15, text: 'Decoding the text structure...' },
  { min: 35, text: 'Crafting your game stages...' },
  { min: 55, text: 'Enriching vocabulary targets...' },
  { min: 75, text: 'Polishing the quest map...' },
  { min: 90, text: 'Almost there — final touches...' },
]

function progressMessage(pct: number): string {
  for (let i = progressMessages.length - 1; i >= 0; i--) {
    if (pct >= progressMessages[i].min) return progressMessages[i].text
  }
  return progressMessages[0].text
}

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4000/api' })

function BookCover({ coverUrl, title, className }: { coverUrl: string; title: string; className?: string }) {
  const [failed, setFailed] = useState(false)

  if (!coverUrl || failed) {
    return (
      <div className={`grid place-items-center bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] ${className ?? ''}`}>
        <div className="text-center px-2">
          <BookOpen className="mx-auto mb-3 opacity-25" size={40} />
          <p className="font-serif text-[10px] uppercase tracking-[.08em] text-cream/40 line-clamp-3 leading-tight">{title}</p>
        </div>
      </div>
    )
  }

  return (
    <img
      src={mediaUrl(coverUrl)}
      alt={`Cover of ${title}`}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}

function QuestSteps() {
  const steps = [
    { title: 'Upload any book', body: 'Choose a TXT, PDF, or EPUB file (up to 50MB).', icon: UploadIcon },
    { title: "We'll analyze it", body: 'Our engine will parse your book and extract what matters.', icon: Search },
    { title: 'Get instant vocabulary lists and quizzes', body: 'Receive tailored content to boost your learning.', icon: FileText },
    { title: 'Start learning with gamified progress', body: 'Earn XP, build streaks, and level up as you learn.', icon: Flame },
  ]

  return (
    <aside className="rounded-lg border border-white/[.07] bg-white/[.025] p-5 sm:p-7">
      <h2 className="font-serif text-3xl text-cream">Start your quest</h2>
      <p className="mt-3 text-xs leading-5 text-cream/45">Follow these steps and let the adventure begin.</p>
      <ol className="relative mt-8 space-y-8 before:absolute before:bottom-5 before:left-[21px] before:top-5 before:border-l before:border-dashed before:border-white/15">
        {steps.map(({ title, body, icon: Icon }, index) => (
          <li className="relative grid grid-cols-[44px_1fr] gap-4" key={title}>
            <span className="z-[1] grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-[#0b1012] text-cream/75"><Icon size={18} /></span>
            <div>
              <h3 className="font-serif text-base text-cream"><span className="text-orange-500">{index + 1}.</span> {title}</h3>
              <p className="mt-2 text-[10px] leading-5 text-cream/40">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </aside>
  )
}

function DropZone({ onFile, busy }: { onFile: (file: File) => void; busy: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onFile(file)
    event.target.value = ''
  }

  function dropFile(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      className={`grid min-h-[310px] place-items-center rounded-lg border border-dashed p-8 text-center transition ${dragging ? 'border-orange-400 bg-orange-500/10' : 'border-orange-500/80 bg-[radial-gradient(circle_at_50%_20%,rgba(229,139,72,.14),transparent_55%)]'}`}
      onDragEnter={(event) => { event.preventDefault(); setDragging(true) }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false) }}
      onDrop={dropFile}
    >
      <div>
        <button
          className="mx-auto grid h-16 w-16 place-items-center rounded-lg bg-[#f1dfc1] text-[#172024] transition hover:bg-cream disabled:cursor-wait disabled:opacity-60"
          type="button"
          disabled={busy}
          aria-label="Choose a TXT, PDF, or EPUB file"
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <span className="animate-pulse text-sm">...</span> : <UploadIcon size={31} strokeWidth={1.8} />}
        </button>
        <input ref={inputRef} type="file" className="sr-only" accept=".txt,.pdf,.epub,text/plain,application/pdf,application/epub+zip" onChange={selectFile} />
        <h2 className="mt-5 font-serif text-3xl text-cream">Upload a Book</h2>
        <p className="mt-3 text-sm text-cream/50">{busy ? 'Analyzing and creating chapters...' : 'Drag and drop your file here'}</p>
        <button className="mt-2 text-sm text-copper underline underline-offset-4 disabled:cursor-wait" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>or click to browse</button>
        <p className="mt-5 text-[10px] text-cream/35">TXT, PDF, EPUB up to 50MB</p>
      </div>
    </div>
  )
}

function SuccessCard({ result, onReview, busy }: { result: UploadResult; onReview: () => void; busy: boolean }) {
  const size = `${(result.file.size / 1024 / 1024).toFixed(2)} MB`
  return (
    <section className="rounded-lg border border-white/[.07] bg-white/[.025] p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-serif text-lg text-green-500"><Check size={17} className="rounded-full border border-green-500 p-0.5" /> Upload successful</h2>
      <p className="mt-2 text-[10px] text-cream/35">We've received your book and it's ready to become a quest.</p>
      <div className="mt-4 rounded-lg border border-white/[.07] bg-[#090e10] p-4">
        <div className="grid grid-cols-[56px_1fr_auto] gap-4">
          <BookCover
            coverUrl={result.book.coverUrl}
            title={result.book.title}
            className="h-[80px] w-[56px] rounded-md shadow-lg"
          />
          <div className="min-w-0">
            <h3 className="truncate font-serif text-lg text-cream">{result.book.title}</h3>
            <p className="mt-1 text-[10px] text-cream/40">{result.book.author}</p>
            <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-2 border-t border-white/[.06] pt-3 text-[9px] text-cream/40">
              <dt className="flex items-center gap-2"><BookOpen size={10} /> Total chapters</dt><dd className="text-cream/70">{result.book.totalChapters || '—'}</dd>
              <dt>Words</dt><dd className="text-cream/70">{result.book.wordCount.toLocaleString()}</dd>
              <dt>File size</dt><dd className="text-cream/70">{size}</dd>
            </dl>
          </div>
          <Check size={17} className="text-green-500" />
        </div>
        <button
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-md bg-orange-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-orange-500 disabled:cursor-wait disabled:opacity-60"
          type="button"
          disabled={busy}
          onClick={onReview}
        >
          {busy ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
          {busy ? 'Generating...' : 'Generate My Quest'}
        </button>
      </div>
      <p className="mt-4 flex items-center gap-2 text-[9px] text-cream/30"><LockKeyhole size={10} /> Your file is secure and will only be used to generate your quest.</p>
    </section>
  )
}

function GenerateProgress({
  progress,
  status,
  onNavigate,
}: {
  progress: number
  status: GenStatus
  onNavigate: () => void
}) {
  const safe = Math.min(100, Math.max(0, progress))

  return (
    <div className="w-full space-y-6">
      {/* Status icon */}
      <div className="flex justify-center">
        {status === 'failed' ? (
          <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-red-400/30 bg-red-500/10">
            <XCircle size={36} className="text-red-400" />
          </div>
        ) : status === 'completed' ? (
          <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-green-400/30 bg-green-500/10">
            <CheckCircle2 size={36} className="text-green-400" />
          </div>
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-full border-2 border-orange-400/30 bg-orange-500/10">
            <WandSparkles size={30} className="animate-pulse text-orange-400" />
          </div>
        )}
      </div>

      {/* Message */}
      <div className="text-center">
        <p className="font-serif text-xl text-cream">
          {status === 'completed' ? 'Quest ready!' : status === 'failed' ? 'Generation failed' : progressMessage(safe)}
        </p>
        <p className="mt-2 text-xs text-cream/50">
          {status === 'completed'
            ? 'Your learning path has been created.  Redirecting...'
            : status === 'failed'
              ? 'An error occurred during processing.  Please try again.'
              : `AI is slicing your book into game stages — ${safe}% complete`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] text-cream/40">
          <span>0%</span>
          <span>{safe}%</span>
          <span>100%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-cream/10">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              status === 'failed'
                ? 'bg-red-500'
                : status === 'completed'
                  ? 'bg-green-500'
                  : 'bg-gradient-to-r from-orange-500 to-amber-400'
            }`}
            style={{ width: `${safe}%` }}
          />
        </div>
        <div
          className="mx-auto h-1 w-3/4 overflow-hidden rounded-full bg-cream/5"
        >
          {status !== 'completed' && status !== 'failed' && (
            <div className="h-full w-1/3 animate-[shimmer_1.6s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          )}
        </div>
      </div>

      {/* Action */}
      {status === 'completed' && (
        <button
          className="mx-auto flex items-center gap-2 rounded-lg bg-copper px-8 py-3 text-sm font-semibold text-slate-deep transition hover:bg-cream"
          type="button"
          onClick={onNavigate}
        >
          Enter Your Quest <ArrowRight size={16} />
        </button>
      )}
      {status === 'failed' && (
        <p className="text-center text-[10px] text-red-300/70">
          Check your network connection and try again. If the problem persists the file may be unsupported.
        </p>
      )}
    </div>
  )
}

function ReviewModal({
  result,
  onClose,
  onGenerating,
  genStatus,
  genProgress,
  onNavigate,
  wordsPerQuest,
  onPacingChange,
}: {
  result: UploadResult
  onClose: () => void
  onGenerating: () => void
  genStatus: GenStatus
  genProgress: number
  onNavigate: () => void
  wordsPerQuest: number
  onPacingChange: (value: number) => void
}) {
  const size = `${(result.file.size / 1024 / 1024).toFixed(2)} MB`
  const isBusy = genStatus === 'starting' || genStatus === 'polling'

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-title"
    >
      <section className="relative w-full max-w-3xl rounded-lg border border-white/10 bg-[#15191a] p-5 shadow-2xl sm:p-7">
        {genStatus === 'idle' && (
          <button
            className="absolute right-4 top-4 text-cream/55 hover:text-cream"
            type="button"
            aria-label="Close review"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        )}

        {genStatus === 'idle' ? (
          <>
            <div className="grid gap-6 sm:grid-cols-[190px_1fr]">
              <div className="relative overflow-hidden rounded-lg shadow-2xl">
                <BookCover
                  coverUrl={result.book.coverUrl}
                  title={result.book.title}
                  className="aspect-[0.72/1] w-full h-full object-cover rounded-lg"
                />
                <div className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/10" />
                <div className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-lg bg-gradient-to-t from-black/60 to-transparent" />
                <span className="absolute bottom-3 left-3 text-[9px] font-medium text-cream/60">ReadQuest Edition</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-orange-500">Review your book</p>
                <h2 id="review-title" className="mt-3 font-serif text-3xl text-cream">{result.book.title}</h2>
                <p className="mt-1 text-xs text-cream/40">{result.book.author}</p>
                <dl className="mt-5 grid grid-cols-[1fr_auto] gap-y-3 text-[10px]">
                  <dt className="text-cream/40">File name</dt>
                  <dd className="max-w-48 truncate text-cream/75">{result.file.name}</dd>
                  <dt className="text-cream/40">File size</dt>
                  <dd>{size}</dd>
                  <dt className="text-cream/40">Format</dt>
                  <dd>{result.file.name.slice(result.file.name.lastIndexOf('.')).toUpperCase().slice(1)}</dd>
                  <dt className="text-cream/40">Words</dt>
                  <dd>{result.book.wordCount.toLocaleString()}</dd>
                  <dt className="text-cream/40">Total chapters</dt>
                  <dd>{result.book.totalChapters || '—'}</dd>
                </dl>
                <div className="mt-5 rounded-lg border border-white/[.07] p-4">
                  <h3 className="flex items-center gap-2 text-xs text-cream">
                    <Target size={14} className="text-orange-500" /> Set your reading pace
                  </h3>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {([
                      { label: 'Easy', words: 500, desc: 'short reads' },
                      { label: 'Standard', words: 1000, desc: 'balanced' },
                      { label: 'Challenge', words: 2000, desc: 'deep dives' },
                    ]).map(({ label, words, desc }) => (
                      <button
                        key={label}
                        className={`rounded-lg border px-3 py-2.5 text-center transition ${
                          wordsPerQuest === words
                            ? 'border-orange-400/50 bg-orange-500/10 text-orange-300'
                            : 'border-white/[.07] text-cream/45 hover:border-white/15 hover:text-cream/70'
                        }`}
                        type="button"
                        onClick={() => onPacingChange(words)}
                      >
                        <span className="block font-serif text-sm">{label}</span>
                        <span className="mt-0.5 block text-[9px] opacity-60">{words}w · {desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-white/[.07] p-4">
                  <h3 className="flex items-center gap-2 text-xs text-cream">
                    <Sparkles size={14} className="text-orange-500" /> What happens next?
                  </h3>
                  <p className="mt-2 text-[10px] leading-5 text-cream/40">
                    The AI will parse your book, split it into game stages, and build a personalised learning path.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 grid gap-2 sm:grid-cols-[.7fr_1.3fr]">
              <button
                className="rounded-md border border-white/10 px-5 py-3 text-xs text-cream/75 hover:bg-white/5 transition"
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="flex items-center justify-center gap-2 rounded-md bg-orange-600 px-5 py-3 text-xs font-semibold text-white transition hover:bg-orange-500"
                type="button"
                onClick={onGenerating}
              >
                Yes, Generate My Quest <WandSparkles size={15} />
              </button>
            </div>
            <p className="mt-4 flex items-center justify-center gap-2 text-[9px] text-cream/30">
              <LockKeyhole size={10} /> You can delete your book anytime from your library.
            </p>
          </>
        ) : (
          <GenerateProgress
            progress={genProgress}
            status={genStatus}
            onNavigate={onNavigate}
          />
        )}

        {isBusy && (
          <p className="mt-6 text-center text-[9px] text-cream/25">
            You may close this dialog — processing continues in the background.
          </p>
        )}
      </section>
    </div>
  )
}

function DuplicateNotice({ book, onGo }: { book: UploadedBook; onGo: () => void }) {
  return (
    <section className="mt-5 rounded-lg border border-amber-400/20 bg-amber-500/[0.06] p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-amber-500/15">
          <BookOpen size={18} className="text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-base text-cream">This book is already in your library!</p>
          <p className="mt-1 text-xs leading-5 text-cream/55">
            No need to re-upload — jump straight to its quest map and pick up where you left off.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[.06] pt-4 text-[10px]">
            <div>
              <dt className="text-cream/35">Title</dt>
              <dd className="mt-0.5 text-cream/80 truncate">{book.title}</dd>
            </div>
            <div>
              <dt className="text-cream/35">Author</dt>
              <dd className="mt-0.5 text-cream/80 truncate">{book.author}</dd>
            </div>
            <div>
              <dt className="text-cream/35">Words</dt>
              <dd className="mt-0.5 text-cream/80">{book.wordCount.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-cream/35">Chapters</dt>
              <dd className="mt-0.5 text-cream/80">{book.totalChapters || '—'}</dd>
            </div>
          </dl>
          <button
            className="mt-5 flex w-full items-center justify-center gap-3 rounded-md bg-orange-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-orange-500"
            type="button"
            onClick={onGo}
          >
            Enter Your Quest <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  )
}

export default function Upload() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<UploadResult | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const [genStatus, setGenStatus] = useState<GenStatus>('idle')
  const [genProgress, setGenProgress] = useState(0)
  const [duplicateBook, setDuplicateBook] = useState<UploadedBook | null>(null)
  const [wordsPerQuest, setWordsPerQuest] = useState(500)

  useEffect(() => () => {
    setGenStatus('idle')
    setGenProgress(0)
  }, [])

  async function uploadFile(file: File) {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))
    if (!['.txt', '.pdf', '.epub'].includes(ext)) { setError('Please choose a TXT, PDF, or EPUB file.'); return }
    if (file.size > 50 * 1024 * 1024) { setError('The file must be smaller than 50MB.'); return }

    const formData = new FormData()
    formData.append('file', file)
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post<UploadResponse>('/books/upload', formData)
      localStorage.setItem('readquest.bookId', data.book.id)
      setResult({ book: data.book, file })
    } catch (caught) {
      if (axios.isAxiosError(caught) && caught.response?.status === 409) {
        const data = caught.response.data as { book?: UploadedBook }
        if (data.book) {
          localStorage.setItem('readquest.bookId', data.book.id)
          setResult({ book: data.book, file })
          setDuplicateBook(data.book)
        } else {
          setError('This file has already been uploaded.')
        }
      } else {
        setError(
          axios.isAxiosError<{ message?: string }>(caught)
            ? caught.response?.data.message ?? 'Upload failed. Please check the API server.'
            : 'Upload failed. Please try again.',
        )
      }
    } finally {
      setBusy(false)
    }
  }

  async function startGeneration() {
    if (!result) return

    setGenStatus('starting')
    setGenProgress(0)

    try {
      await api.post(`/books/${result.book.id}/generate`, { wordsPerQuest })
    } catch (caught) {
      setGenStatus('failed')
      setError(
        axios.isAxiosError<{ error?: string }>(caught)
          ? caught.response?.data.error ?? 'Failed to start generation.'
          : 'Failed to connect to the server.',
      )
      return
    }

    setGenStatus('polling')

    const interval = window.setInterval(async () => {
      try {
        const { data } = await api.get<{ status: string; progress: number; errorMessage?: string }>(
          `/books/${result.book.id}/status`,
        )

        setGenProgress(data.progress)

        if (data.status === 'completed') {
          window.clearInterval(interval)
          setGenStatus('completed')
          setGenProgress(100)

          window.setTimeout(() => {
            navigate('/path')
          }, 1800)
        } else if (data.status === 'failed') {
          window.clearInterval(interval)
          setGenStatus('failed')
          setError(data.errorMessage ?? 'Book generation failed on the server.')
        }
      } catch {
        // tolerate transient failures — keep polling
      }
    }, 3000)

    const cleanup = () => window.clearInterval(interval)
    window.addEventListener('beforeunload', cleanup)
    void interval
  }

  function closeReview() {
    setReviewing(false)
    setGenStatus('idle')
    setGenProgress(0)
    setDuplicateBook(null)
  }

  return (
    <main className="min-h-screen bg-[#080d0f] text-cream">
      <div className="mx-auto max-w-[1180px]">
        <div className="px-4 py-10 sm:px-7">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.7fr)_minmax(220px,1fr)] md:gap-4 lg:gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-orange-500">Upload a book</p>
              <h1 className="mt-5 max-w-xl font-serif text-5xl leading-[.95] text-cream sm:text-6xl">Every book holds<br />a quest.</h1>
              <p className="mt-5 max-w-xl text-xs leading-6 text-cream/45">
                Upload any book in TXT, PDF, or EPUB format and we'll transform it into personalised vocabulary lists, quizzes, and a gamified learning journey.
              </p>
              <div className="mt-8">
                <DropZone onFile={(file) => void uploadFile(file)} busy={busy || genStatus === 'starting'} />
              </div>
              {error && !duplicateBook && (
                <p className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-xs text-red-300" role="alert">
                  {error}
                </p>
              )}
              {duplicateBook && (
                <DuplicateNotice
                  book={duplicateBook}
                  onGo={() => navigate('/path')}
                />
              )}
              {result && !duplicateBook && (
                <div className="mt-5">
                  <SuccessCard result={result} onReview={() => setReviewing(true)} busy={busy} />
                </div>
              )}
            </div>
            <div className="space-y-5">
              <QuestSteps />
              <blockquote className="rounded-lg border border-white/[.07] bg-white/[.025] p-6">
                <span className="font-serif text-5xl leading-none text-orange-500">&#x201C;</span>
                <p className="mt-3 font-serif text-lg italic leading-7 text-cream/75">Read. Learn. Conquer.<br />That's the ReadQuest.</p>
                <footer className="mt-6 text-[9px] text-cream/35">&#x2013; The ReadQuest Team</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>
      {reviewing && result && (
        <ReviewModal
          result={result}
          onClose={closeReview}
          onGenerating={() => void startGeneration()}
          genStatus={genStatus}
          genProgress={genProgress}
          onNavigate={() => navigate('/path')}
          wordsPerQuest={wordsPerQuest}
          onPacingChange={setWordsPerQuest}
        />
      )}
    </main>
  )
}
