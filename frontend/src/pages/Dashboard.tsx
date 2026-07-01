import axios from 'axios'
import type { ChangeEvent, CSSProperties, DragEvent, RefObject, ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'

const assets = {
  portal: '/assets/readquest-portal.png',
  map: '/assets/learning-map-texture.png',
  quote: '/assets/quote-mountain-clean.png',
}

type CssVars = CSSProperties & {
  '--node-delay'?: string
}

type BookSummary = {
  id: string
  title: string
  totalChapters: number
}

type Chapter = {
  id: string
  chapterIndex: number
  content: string
}

type ChaptersResponse = {
  book: BookSummary
  chapters: Chapter[]
}

type UploadResponse = {
  message: string
  book: BookSummary
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4000/api',
})

function animateNumber(
  element: HTMLElement | null,
  target: number,
  duration: number,
  formatter: (value: number) => string = (value) => String(value),
) {
  if (!element) return

  const output = element
  const start = performance.now()

  function frame(now: number) {
    const progress = Math.min((now - start) / duration, 1)
    const eased = 1 - (1 - progress) ** 3
    output.textContent = formatter(Math.round(target * eased))

    if (progress < 1) {
      requestAnimationFrame(frame)
    }
  }

  requestAnimationFrame(frame)
}

function useTilt() {
  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-tilt]'))

    const cleanups = cards.map((card) => {
      const move = (event: MouseEvent) => {
        const rect = card.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        const rotateY = (x / rect.width - 0.5) * 10
        const rotateX = (0.5 - y / rect.height) * 10

        card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`
      }

      const leave = () => {
        card.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0)'
      }

      card.addEventListener('mousemove', move)
      card.addEventListener('mouseleave', leave)

      return () => {
        card.removeEventListener('mousemove', move)
        card.removeEventListener('mouseleave', leave)
      }
    })

    return () => cleanups.forEach((cleanup) => cleanup())
  }, [])
}

function useScrollAnimations() {
  const pathRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const pathObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          entry.target
            .querySelectorAll('.path-node')
            .forEach((node) => node.classList.add('visible'))
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.28 },
    )

    const progressObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          document.querySelector('.ring-progress')?.classList.add('active')
          animateNumber(document.querySelector('#ringPercent'), 68, 1200, (value) => `${value}%`)
          animateNumber(document.querySelector('#wordsCounter'), 1245, 1100, (value) =>
            value.toLocaleString('en-US'),
          )
          observer.unobserve(entry.target)
        })
      },
      { threshold: 0.42 },
    )

    const pathElement = pathRef.current
    const progressElement = progressRef.current

    if (pathElement) pathObserver.observe(pathElement)
    if (progressElement) progressObserver.observe(progressElement)

    return () => {
      pathObserver.disconnect()
      progressObserver.disconnect()
    }
  }, [])

  return { pathRef, progressRef }
}

function Nav() {
  return (
    <nav className="relative z-10 flex items-center justify-between gap-5">
      <Link to="/" className="font-serif text-xl text-cream">
        ReadQuest
      </Link>
      <div className="hidden gap-9 text-sm text-cream/70 md:flex">
        <Link className="transition hover:text-cream" to="/path">
          Path
        </Link>
        <Link className="transition hover:text-cream" to="/progress">
          Progress
        </Link>
        <Link className="transition hover:text-cream" to="/upload">
          Upload
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 text-xs text-cream/60 sm:flex">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-copper/15 text-amber">
            12
          </span>
          <span>
            <strong className="block text-cream">12</strong>
            Fire Streak
          </span>
        </div>
        <div className="hidden w-36 text-right text-[11px] text-cream/60 lg:block">
          2,350 / 5,000 XP
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream/10">
            <div className="h-full w-[47%] rounded-full bg-amber" />
          </div>
        </div>
        <button className="rounded-full border border-cream/10 bg-cream/5 px-4 py-2.5 text-sm text-cream/80 transition hover:bg-cream/10">
          Account
        </button>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="hero-bg grid-bg relative min-h-screen px-6 py-7 sm:px-10 lg:px-[70px]">
      <Nav />
      <div className="relative z-[1] grid min-h-[calc(100vh-76px)] items-center gap-12 pt-10 lg:grid-cols-[.98fr_1.02fr]">
        <div>
          <p className="reveal-up mb-7 text-[13px] font-extrabold uppercase tracking-[.28em] text-copper">
            Story-powered English
          </p>
          <h1 className="reveal-up delay-1 flex flex-col gap-2 font-serif text-[clamp(4.2rem,10vw,9rem)] font-semibold leading-[.9] tracking-normal text-cream">
            <span>Read.</span>
            <span>Learn.</span>
            <span>Level Up.</span>
          </h1>
          <p className="reveal-up delay-2 mt-10 max-w-[540px] text-[17px] leading-[1.85] text-cream/65 sm:text-lg">
            Master English through stories you love. Track progress, earn XP, and build unstoppable
            reading momentum.
          </p>
          <div className="reveal-up delay-3 mt-10 flex flex-wrap gap-5 max-sm:flex-col">
            <Link
              className="inline-flex min-h-[56px] items-center justify-center rounded-[22px] bg-cream px-9 text-base font-extrabold text-slate-deep shadow-[0_18px_50px_rgba(215,155,121,.16)] transition hover:-translate-y-0.5 hover:bg-cream-soft max-sm:w-full"
              to="/upload"
            >
              Continue Reading -&gt;
            </Link>
            <Link
              className="inline-flex min-h-[56px] items-center justify-center rounded-[22px] border border-cream/10 px-9 text-base font-extrabold text-cream/75 transition hover:-translate-y-0.5 hover:bg-cream/10 max-sm:w-full"
              to="/path"
            >
              View Quest
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[690px]">
          <div className="absolute -inset-[9%] bg-[radial-gradient(circle,rgba(215,155,121,.24),transparent_62%)] blur-2xl" />
          <div className="relative mx-auto aspect-[.72/1] w-[min(86vw,420px)] max-h-[650px] overflow-hidden rounded-b-[24px] rounded-t-[48%] border border-cream/10 bg-black shadow-[0_30px_120px_rgba(0,0,0,.50)] sm:w-[min(74vw,420px)]">
            <img
              className="portal-image h-full w-full object-cover"
              src={assets.portal}
              alt="A glowing mountain archway portal"
            />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-deep to-transparent" />
          </div>
          <article
            className="tilt-card absolute -bottom-8 right-0 hidden w-80 rounded-[24px] border border-cream/10 bg-slate-card/95 p-6 shadow-[0_30px_120px_rgba(0,0,0,.50)] backdrop-blur md:block"
            data-tilt
          >
            <div className="tilt-lift">
              <div className="flex items-center gap-3 text-sm text-cream/55">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber/10 text-amber">
                  28%
                </span>
                Current Book
              </div>
              <h2 className="mt-4 text-2xl font-bold text-cream">The Alchemist</h2>
              <p className="mt-1 text-sm text-cream/60">Paulo Coelho</p>
              <div className="mt-7 flex justify-between text-sm text-cream/70">
                <span>Chapter 7 of 25</span>
                <span>28%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-cream/10">
                <div className="h-full w-[28%] rounded-full bg-copper" />
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  )
}

function UploadSection({ onUploaded }: { onUploaded: (book: BookSummary) => void }) {
  const steps = ['Upload any book', "We'll analyze it", 'Get instant vocabulary lists and quizzes', 'Start learning with gamified progress']
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [hasError, setHasError] = useState(false)

  async function uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.txt')) {
      setHasError(true)
      setFeedback('Please choose a UTF-8 TXT file.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setHasError(true)
      setFeedback('The file must be smaller than 10MB.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    setIsUploading(true)
    setHasError(false)
    setFeedback(`Preparing ${file.name}...`)

    try {
      const { data } = await api.post<UploadResponse>('/books/upload', formData)
      setFeedback(`${data.book.title} is ready with ${data.book.totalChapters} stages.`)
      onUploaded(data.book)
    } catch (error) {
      setHasError(true)
      setFeedback(
        axios.isAxiosError<{ message?: string }>(error)
          ? error.response?.data.message ?? 'Upload failed. Please check the API server.'
          : 'Upload failed. Please try again.',
      )
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void uploadFile(file)
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void uploadFile(file)
  }

  return (
    <section id="upload" className="bg-slate-deep px-6 pb-14 sm:px-10 lg:px-[70px]">
      <div className="grid gap-5 rounded-[24px] border border-cream/10 p-4 sm:p-5 md:grid-cols-[1fr_.52fr]">
        <div
          className={`tilt-card rounded-[24px] border border-dashed p-8 transition sm:p-11 ${
            isDragging ? 'border-copper bg-copper/10' : 'border-cream/25 bg-cream/[.025]'
          }`}
          data-tilt
          onDragEnter={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false)
          }}
          onDrop={handleDrop}
        >
          <div className="tilt-lift">
            <button
              type="button"
              className="mb-7 grid h-16 w-16 place-items-center rounded-[18px] bg-[#dfc9b8] text-3xl font-bold text-slate-deep transition hover:bg-cream disabled:cursor-wait disabled:opacity-60"
              aria-label="Choose a TXT book"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? '...' : '+'}
            </button>
            <input
              ref={inputRef}
              className="sr-only"
              type="file"
              accept=".txt,text/plain"
              onChange={handleFileInput}
            />
            <h2 className="font-serif text-4xl text-cream">Upload a Book</h2>
            <button
              type="button"
              className="mt-5 max-w-md text-left text-lg leading-8 text-cream/70 transition hover:text-cream disabled:cursor-wait"
              disabled={isUploading}
              onClick={() => inputRef.current?.click()}
            >
              {isUploading ? 'Creating your learning path...' : 'Drag and drop your file here or click to browse'}
            </button>
            <p className="mt-7 text-sm text-cream/45">UTF-8 TXT up to 10MB</p>
            {feedback && (
              <p className={`mt-4 text-sm ${hasError ? 'text-red-300' : 'text-sage'}`} role="status">
                {feedback}
              </p>
            )}
          </div>
        </div>
        <aside className="rounded-[24px] border border-cream/10 bg-slate-card/70 p-8 sm:p-10">
          <h3 className="font-serif text-3xl text-cream">Start your quest</h3>
          <ul className="mt-7 space-y-5 text-sm text-cream/75">
            {steps.map((item, index) => (
              <li className="flex gap-3" key={item}>
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-cream/10 text-xs">
                  {index + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  )
}

function LearningPath({
  pathRef,
  book,
  chapters,
  isLoading,
  error,
}: {
  pathRef: RefObject<HTMLDivElement | null>
  book: BookSummary | null
  chapters: Chapter[]
  isLoading: boolean
  error: string
}) {

  return (
    <section
      id="path"
      className="relative overflow-hidden rounded-t-[24px] bg-cream px-6 py-14 text-slate-deep sm:px-10 lg:px-[70px]"
    >
      <div
        className="absolute inset-x-0 bottom-0 h-80 bg-cover bg-bottom opacity-30 mix-blend-multiply"
        style={{ backgroundImage: `url(${assets.map})` }}
      />
      <header className="relative z-[1] mb-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-serif text-5xl leading-none sm:text-6xl">Learning Path</h2>
          <p className="mt-3 text-sm text-slate-deep/70">
            {book ? `${book.title} - ${chapters.length} stages` : 'Upload a TXT book to create your quest'}
          </p>
        </div>
        <Link
          className="w-fit rounded-2xl border border-slate-deep/30 px-7 py-4 text-sm font-extrabold transition hover:bg-slate-deep hover:text-cream"
          to="/progress"
        >
          View Full Path
        </Link>
      </header>

      <div ref={pathRef} className="relative z-[1] min-h-[320px]">
        {isLoading && <p className="py-20 text-center text-slate-deep/60">Loading your quest...</p>}
        {error && <p className="py-20 text-center text-red-800">{error}</p>}
        {!isLoading && !error && chapters.length === 0 && (
          <p className="py-20 text-center text-slate-deep/60">Your chapter map will appear here.</p>
        )}

        <div className="grid grid-cols-2 gap-x-8 gap-y-12 py-8 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
          {chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              className={`path-node visible relative grid justify-items-center ${index % 3 === 1 ? 'lg:translate-y-12' : ''}`}
              style={{ '--node-delay': `${Math.min(index * 55, 600)}ms` } as CssVars}
              title={chapter.content.slice(0, 140)}
            >
              <p className="mb-3 text-center text-xs font-extrabold">
                {chapter.chapterIndex === 1 ? 'Start' : `Stage ${chapter.chapterIndex}`}
              </p>
              <div className="relative grid h-24 w-24 place-items-center rounded-full bg-slate-deep text-2xl font-extrabold text-cream shadow-xl">
                {chapter.chapterIndex}
                <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-copper text-xs text-slate-deep ring-4 ring-cream">
                  GO
                </span>
              </div>
            </div>
          ))}
        </div>

        {book && chapters.length > 0 && <article
          className="tilt-card relative mt-14 ml-auto w-full rounded-[18px] bg-slate-card p-7 text-cream shadow-[0_30px_120px_rgba(0,0,0,.50)] md:w-96"
          data-tilt
        >
          <small className="text-cream/55">New quest ready</small>
          <h3 className="mt-3 font-serif text-2xl">{book.title}</h3>
          <p className="mt-5 text-sm text-cream/60">Your book has been shaped into focused reading stages.</p>
          <p className="mt-7 flex justify-between text-sm text-sage">
            <span>Total stages</span>
            <strong>{chapters.length}</strong>
          </p>
        </article>}
      </div>
    </section>
  )
}

type Stat = {
  icon: string
  label: string
  value: ReactNode
}

function ProgressSection({ progressRef }: { progressRef: RefObject<HTMLDivElement | null> }) {
  const stats: Stat[] = [
    { icon: '12', label: 'Books Read', value: '12' },
    { icon: 'XP', label: 'Words Learned', value: <span id="wordsCounter">0</span> },
    { icon: '88', label: 'Quizzes Taken', value: '48' },
    { icon: '12', label: 'Current Streak', value: '12 days' },
  ]

  const activities = [
    ['The Alchemist', 'Chapter 7 completed', '+120 XP', '2h ago', 'rounded-xl bg-copper/80', 'Book'],
    ['Vocabulary Quiz', 'Score: 88%', '+80 XP', '5h ago', 'rounded-full bg-sage text-slate-deep', 'Quiz'],
    ['New Words', 'Learned 15 new words', '+30 XP', '1d ago', 'rounded-full bg-sky-700 text-cream', 'Word'],
  ]

  return (
    <section id="progress" className="bg-slate-deep px-6 py-14 sm:px-10 lg:px-[70px]">
      <div className="grid gap-12 lg:grid-cols-[.95fr_1.05fr]">
        <div className="border-b border-cream/10 pb-10 lg:border-b-0 lg:border-r lg:pr-14">
          <h2 className="font-serif text-2xl">Your Progress</h2>
          <p className="mt-2 text-sm text-cream/60">See how far you've come</p>
          <div className="mt-8 grid items-center gap-8 sm:grid-cols-[180px_1fr]">
            <div ref={progressRef} className="relative h-44 w-44">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(241,234,223,.11)" strokeWidth="12" />
                <circle
                  className="ring-progress"
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="#d79b79"
                  strokeWidth="12"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <strong id="ringPercent" className="font-serif text-4xl">
                    0%
                  </strong>
                  <span className="mt-2 block text-xs text-cream/65">Overall Progress</span>
                </div>
              </div>
            </div>
            <dl className="grid gap-5 text-sm">
              {stats.map((stat) => (
                <div className="flex items-center gap-4" key={stat.label}>
                  <dt className="grid h-9 w-9 place-items-center rounded-full bg-cream/10 text-xs font-bold">
                    {stat.icon}
                  </dt>
                  <dd>
                    <span className="block text-cream/55">{stat.label}</span>
                    <strong>{stat.value}</strong>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div>
          <h2 className="font-serif text-2xl">Recent Activity</h2>
          <p className="mt-2 text-sm text-cream/60">Keep the momentum going</p>
          <div className="mt-8 divide-y divide-cream/10">
            {activities.map(([title, text, xp, time, iconClass, icon]) => (
              <div
                className="grid grid-cols-[48px_1fr_auto_auto] items-center gap-4 py-5 max-sm:grid-cols-[48px_1fr_auto]"
                key={title}
              >
                <div className={`grid h-12 w-12 place-items-center text-xs font-bold ${iconClass}`}>{icon}</div>
                <div>
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-1 text-sm text-cream/55">{text}</p>
                </div>
                <span className="text-sm text-amber">{xp}</span>
                <span className="text-xs text-cream/45 max-sm:hidden">{time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <figure className="mt-12 overflow-hidden rounded-[24px] bg-cream text-slate-deep">
        <div
          className="grid min-h-44 items-center bg-cover bg-center px-6 py-8 sm:grid-cols-[.8fr_1fr] sm:px-10"
          style={{ backgroundImage: `url(${assets.quote})` }}
        >
          <blockquote className="max-w-[420px]">
            <span className="block font-serif text-5xl leading-none text-slate-deep/60">"</span>
            <p className="font-serif text-[26px] leading-[1.08] sm:text-[34px] sm:leading-[1.05]">
              A book is a dream that you hold in your hands.
            </p>
            <figcaption className="mt-4 text-xs text-slate-deep/70">- Neil Gaiman</figcaption>
          </blockquote>
        </div>
      </figure>
    </section>
  )
}

function Dashboard() {
  useTilt()
  const { pathRef, progressRef } = useScrollAnimations()
  const [activeBookId, setActiveBookId] = useState(() => {
    const queryBookId = new URLSearchParams(window.location.search).get('bookId')
    return queryBookId ?? localStorage.getItem('readquest.bookId') ?? ''
  })
  const [book, setBook] = useState<BookSummary | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isPathLoading, setIsPathLoading] = useState(Boolean(activeBookId))
  const [pathError, setPathError] = useState('')

  useEffect(() => {
    if (!activeBookId) return

    const controller = new AbortController()
    setIsPathLoading(true)
    setPathError('')

    api
      .get<ChaptersResponse>(`/books/${activeBookId}/chapters`, { signal: controller.signal })
      .then(({ data }) => {
        setBook(data.book)
        setChapters(data.chapters)
      })
      .catch((error: unknown) => {
        if (axios.isCancel(error)) return
        setPathError('We could not load this learning path. Upload the book again.')
        localStorage.removeItem('readquest.bookId')
      })
      .finally(() => setIsPathLoading(false))

    return () => controller.abort()
  }, [activeBookId])

  useEffect(() => {
    if (window.location.hash !== '#path' || chapters.length === 0) return

    const timer = window.setTimeout(() => {
      document.querySelector('#path')?.scrollIntoView()
    }, 100)

    return () => window.clearTimeout(timer)
  }, [chapters.length])

  function handleUploaded(uploadedBook: BookSummary) {
    setBook(uploadedBook)
    setChapters([])
    setIsPathLoading(true)
    localStorage.setItem('readquest.bookId', uploadedBook.id)
    setActiveBookId(uploadedBook.id)
  }

  return (
    <main className="mx-auto max-w-[1440px] overflow-hidden bg-slate-deep shadow-[0_30px_120px_rgba(0,0,0,.50)]">
      <Hero />
      <UploadSection onUploaded={handleUploaded} />
      <LearningPath
        pathRef={pathRef}
        book={book}
        chapters={chapters}
        isLoading={isPathLoading}
        error={pathError}
      />
      <ProgressSection progressRef={progressRef} />
    </main>
  )
}

export default Dashboard
