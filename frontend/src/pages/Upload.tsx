import axios from 'axios'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  FileText,
  Flame,
  LockKeyhole,
  Search,
  Sparkles,
  Upload as UploadIcon,
  WandSparkles,
  X,
} from 'lucide-react'
import type { ChangeEvent, DragEvent } from 'react'
import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type UploadedBook = {
  id: string
  title: string
  totalChapters: number
}

type UploadResponse = {
  message: string
  book: UploadedBook
}

type UploadResult = {
  book: UploadedBook
  file: File
}

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4000/api' })

function UploadNav() {
  return (
    <nav className="flex min-h-16 items-center justify-between gap-4 border-b border-white/[.055] px-5 sm:px-8">
      <Link className="flex items-center gap-3 font-serif text-xl text-cream" to="/">
        <Sparkles size={18} className="text-orange-500" /> Read<span className="text-copper">Quest</span>
      </Link>
      <div className="hidden items-center gap-5 text-[10px] text-cream/45 min-[500px]:flex lg:gap-9">
        <Link className="hover:text-cream" to="/">Dashboard</Link>
        <Link className="hover:text-cream" to="/path">Quests</Link>
        <Link className="hover:text-cream" to="/progress">Progress</Link>
        <a className="hover:text-cream" href="#library">Library</a>
        <a className="hover:text-cream" href="#analytics">Analytics</a>
      </div>
      <div className="flex items-center gap-4 text-xs text-cream/65">
        <span className="hidden items-center gap-1.5 sm:flex"><Flame size={15} fill="currentColor" className="text-orange-500" />12</span>
        <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[.04]">AJ</span>
        <ChevronDown size={12} />
      </div>
    </nav>
  )
}

function QuestSteps() {
  const steps = [
    { title: 'Upload any book', body: 'Choose a UTF-8 TXT file (up to 10MB).', icon: UploadIcon },
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
          aria-label="Choose a TXT file"
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <span className="animate-pulse text-sm">...</span> : <UploadIcon size={31} strokeWidth={1.8} />}
        </button>
        <input ref={inputRef} type="file" className="sr-only" accept=".txt,text/plain" onChange={selectFile} />
        <h2 className="mt-5 font-serif text-3xl text-cream">Upload a Book</h2>
        <p className="mt-3 text-sm text-cream/50">{busy ? 'Analyzing and creating chapters...' : 'Drag and drop your file here'}</p>
        <button className="mt-2 text-sm text-copper underline underline-offset-4 disabled:cursor-wait" type="button" disabled={busy} onClick={() => inputRef.current?.click()}>or click to browse</button>
        <p className="mt-5 text-[10px] text-cream/35">UTF-8 TXT up to 10MB</p>
      </div>
    </div>
  )
}

function SuccessCard({ result, onReview }: { result: UploadResult; onReview: () => void }) {
  const size = `${(result.file.size / 1024 / 1024).toFixed(2)} MB`
  return (
    <section className="rounded-lg border border-white/[.07] bg-white/[.025] p-4 sm:p-5">
      <h2 className="flex items-center gap-2 font-serif text-lg text-green-500"><Check size={17} className="rounded-full border border-green-500 p-0.5" /> Upload successful</h2>
      <p className="mt-2 text-[10px] text-cream/35">We've received your book and it's ready to become a quest.</p>
      <div className="mt-4 rounded-lg border border-white/[.07] bg-[#090e10] p-4">
        <div className="grid grid-cols-[52px_1fr_auto] gap-4">
          <span className="grid h-16 w-12 place-items-center rounded-md bg-[#ead7b7] text-[#283033]"><FileText size={24} /></span>
          <div className="min-w-0">
            <h3 className="truncate font-serif text-lg text-cream">{result.file.name}</h3>
            <p className="mt-1 text-[10px] text-cream/40">Unknown author</p>
            <dl className="mt-3 grid grid-cols-[1fr_auto] gap-y-2 border-t border-white/[.06] pt-3 text-[9px] text-cream/40">
              <dt className="flex items-center gap-2"><BookOpen size={10} /> Estimated total chapters</dt><dd className="text-cream/70">{result.book.totalChapters}</dd>
              <dt>File size</dt><dd className="text-cream/70">{size}</dd>
            </dl>
          </div>
          <Check size={17} className="text-green-500" />
        </div>
        <button className="mt-5 flex w-full items-center justify-center gap-3 rounded-md bg-orange-600 px-4 py-3 text-xs font-semibold text-white transition hover:bg-orange-500" type="button" onClick={onReview}>Generate My Quest <ArrowRight size={15} /></button>
      </div>
      <p className="mt-4 flex items-center gap-2 text-[9px] text-cream/30"><LockKeyhole size={10} /> Your file is secure and will only be used to generate your quest.</p>
    </section>
  )
}

function ReviewModal({ result, onClose, onConfirm }: { result: UploadResult; onClose: () => void; onConfirm: () => void }) {
  const size = `${(result.file.size / 1024 / 1024).toFixed(2)} MB`
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <section className="relative w-full max-w-3xl rounded-lg border border-white/10 bg-[#15191a] p-5 shadow-2xl sm:p-7">
        <button className="absolute right-4 top-4 text-cream/55 hover:text-cream" type="button" aria-label="Close review" onClick={onClose}><X size={20} /></button>
        <div className="grid gap-6 sm:grid-cols-[190px_1fr]">
          <div className="grid min-h-64 place-items-center rounded-lg bg-[#eadfc8] p-5 text-center text-[#36322b] shadow-inner">
            <div><BookOpen className="mx-auto mb-5 opacity-40" size={48} /><p className="font-serif text-lg uppercase tracking-[.15em]">{result.book.title}</p><span className="mt-3 block text-xs">ReadQuest Edition</span></div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-orange-500">Review your book</p>
            <h2 id="review-title" className="mt-3 font-serif text-3xl text-cream">{result.book.title}</h2>
            <p className="mt-1 text-xs text-cream/40">Unknown author</p>
            <dl className="mt-5 grid grid-cols-[1fr_auto] gap-y-3 text-[10px]">
              <dt className="text-cream/40">File name</dt><dd className="max-w-48 truncate text-cream/75">{result.file.name}</dd>
              <dt className="text-cream/40">File size</dt><dd>{size}</dd>
              <dt className="text-cream/40">Format</dt><dd>UTF-8 TXT</dd>
              <dt className="text-cream/40">Estimated total chapters</dt><dd>{result.book.totalChapters}</dd>
              <dt className="text-cream/40">Language</dt><dd>English</dd>
            </dl>
            <div className="mt-5 rounded-lg border border-white/[.07] p-4">
              <h3 className="flex items-center gap-2 text-xs text-cream"><Sparkles size={14} className="text-orange-500" /> What happens next?</h3>
              <p className="mt-2 text-[10px] leading-5 text-cream/40">Your chapters are ready. Continue to open the personalized learning path.</p>
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-2 sm:grid-cols-[.7fr_1.3fr]">
          <button className="rounded-md border border-white/10 px-5 py-3 text-xs text-cream/75" type="button" onClick={onClose}>Cancel</button>
          <button className="flex items-center justify-center gap-2 rounded-md bg-orange-600 px-5 py-3 text-xs font-semibold text-white hover:bg-orange-500" type="button" onClick={onConfirm}>Yes, Generate My Quest <WandSparkles size={15} /></button>
        </div>
        <p className="mt-4 flex items-center justify-center gap-2 text-[9px] text-cream/30"><LockKeyhole size={10} /> You can delete your book anytime from your library.</p>
      </section>
    </div>
  )
}

function UploadFooter() {
  return (
    <footer className="mt-10 grid gap-8 border-t border-white/[.06] py-10 text-[9px] text-cream/35 sm:grid-cols-[1.5fr_repeat(3,1fr)]">
      <div><Sparkles size={20} className="text-orange-500" /><p className="mt-4 leading-5">Turn every book into a quest.<br />Learn vocabulary. Beat quizzes.<br />Level up.</p></div>
      {[
        ['Product', 'How It Works', 'Features', 'Pricing', 'FAQ'],
        ['Company', 'About Us', 'Blog', 'Careers', 'Contact'],
        ['Legal', 'Terms of Service', 'Privacy Policy', 'Cookie Policy'],
      ].map(([heading, ...links]) => <div key={heading}><strong className="uppercase tracking-wider text-cream/50">{heading}</strong>{links.map((item) => <p className="mt-3" key={item}>{item}</p>)}</div>)}
    </footer>
  )
}

export default function Upload() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<UploadResult | null>(null)
  const [reviewing, setReviewing] = useState(false)

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.txt')) { setError('Please choose a UTF-8 TXT file.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('The file must be smaller than 10MB.'); return }

    const formData = new FormData()
    formData.append('file', file)
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post<UploadResponse>('/books/upload', formData)
      localStorage.setItem('readquest.bookId', data.book.id)
      setResult({ book: data.book, file })
    } catch (caught) {
      setError(axios.isAxiosError<{ message?: string }>(caught) ? caught.response?.data.message ?? 'Upload failed. Please check the API server.' : 'Upload failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#080d0f] text-cream">
      <div className="mx-auto max-w-[1180px]">
        <UploadNav />
        <div className="px-4 py-10 sm:px-7">
          <div className="grid gap-6 min-[520px]:grid-cols-[minmax(0,1.7fr)_minmax(180px,1fr)] min-[520px]:gap-4 lg:gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.12em] text-orange-500">Upload a book</p>
              <h1 className="mt-5 max-w-xl font-serif text-5xl leading-[.95] text-cream sm:text-6xl">Every book holds<br />a quest.</h1>
              <p className="mt-5 max-w-xl text-xs leading-6 text-cream/45">Upload any book in UTF-8 TXT format and we'll transform it into personalized vocabulary lists, quizzes, and a gamified learning journey.</p>
              <div className="mt-8"><DropZone onFile={(file) => void uploadFile(file)} busy={busy} /></div>
              {error && <p className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-xs text-red-300" role="alert">{error}</p>}
              {result && <div className="mt-5"><SuccessCard result={result} onReview={() => setReviewing(true)} /></div>}
            </div>
            <div className="space-y-5">
              <QuestSteps />
              <blockquote className="rounded-lg border border-white/[.07] bg-white/[.025] p-6">
                <span className="font-serif text-5xl leading-none text-orange-500">“</span>
                <p className="mt-3 font-serif text-lg italic leading-7 text-cream/75">Read. Learn. Conquer.<br />That's the ReadQuest.</p>
                <footer className="mt-6 text-[9px] text-cream/35">– The ReadQuest Team</footer>
              </blockquote>
            </div>
          </div>
          <UploadFooter />
        </div>
      </div>
      {reviewing && result && <ReviewModal result={result} onClose={() => setReviewing(false)} onConfirm={() => navigate('/path')} />}
    </main>
  )
}
