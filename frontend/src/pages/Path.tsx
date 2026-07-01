import axios from 'axios'
import {
  ArrowRight,
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  Flame,
  LockKeyhole,
  MessageCircle,
  Shield,
  Sparkles,
  Send,
  Target,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

type Chapter = {
  id: string
  chapterIndex: number
  content: string
}

type Book = {
  id: string
  title: string
  totalChapters: number
}

type ChapterResponse = {
  book: Book
  chapters: Chapter[]
}

type Stage = {
  index: number
  title: string
}

const fallbackTitles = [
  'The Call to Adventure',
  'Crossing the Threshold',
  'Trials in the Wild',
  'Allies and Enemies',
  'The Hidden Truth',
  'Shadows Deepen',
  'The Inner Journey',
  'The Final Challenge',
  'Dawn of Understanding',
  'A New Beginning',
]

const fallbackStages = fallbackTitles.map((title, index) => ({ index: index + 1, title }))
const nodeX = [29, 40, 31, 43, 33, 44, 31, 40, 29, 39]

function PathNav() {
  return (
    <nav className="flex min-h-16 items-center justify-between gap-4 border-b border-white/[.06] px-4 sm:px-7">
      <Link className="font-serif text-xl text-cream" to="/">ReadQuest</Link>
      <div className="hidden items-center gap-5 text-[10px] text-cream/60 min-[480px]:flex lg:gap-9 lg:text-xs">
        <Link className="hover:text-cream" to="/">Home</Link>
        <a className="hover:text-cream" href="#library">Library</a>
        <Link className="border-b-2 border-copper py-6 text-cream" to="/path">Quests</Link>
        <Link className="hover:text-cream" to="/progress">Profile</Link>
        <a className="hover:text-cream" href="#guild">Guild</a>
      </div>
      <div className="flex items-center gap-4 text-[10px] text-cream/55">
        <span className="hidden items-center gap-2 sm:flex"><Flame size={19} className="text-orange-500" fill="currentColor" /> <b className="text-copper">12</b></span>
        <div className="hidden w-24 lg:block">
          <span>XP 2,450 / 3,500</span>
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[70%] bg-copper" /></div>
        </div>
        <span className="h-9 w-9 rounded-full border border-copper/40 bg-[url('/assets/readquest-portal.png')] bg-cover bg-center" />
        <ChevronDown size={13} />
      </div>
    </nav>
  )
}

function JourneySidebar({ title }: { title: string }) {
  const growth = [
    ['Wisdom', 'Lv. 6', 'bg-purple-700/50', Sparkles],
    ['Vocabulary', 'Lv. 7', 'bg-green-700/50', BookOpen],
    ['Empathy', 'Lv. 5', 'bg-amber-700/50', Shield],
    ['Imagination', 'Lv. 6', 'bg-blue-700/50', Sparkles],
  ] as const

  return (
    <aside className="px-4 py-10 sm:px-5">
      <h1 className="font-serif text-5xl leading-[.95] text-cream lg:text-6xl">Your<br />Learning<br />Path</h1>
      <div className="mt-7 flex items-center gap-2 text-copper"><span className="h-px w-8 bg-copper" /><Sparkles size={12} /></div>
      <p className="mt-6 text-xs leading-6 text-cream/65">Every chapter you conquer builds the hero you become.</p>

      <section className="mt-8 rounded-lg border border-white/[.08] bg-white/[.035] p-4 text-center">
        <div className="mx-auto h-24 w-24 rounded-full border border-copper/40 bg-[url('/assets/readquest-portal.png')] bg-cover bg-center shadow-[0_0_28px_rgba(229,139,72,.15)]" />
        <small className="mt-4 block text-[9px] text-cream/35">Current Title</small>
        <h2 className="mt-1 font-serif text-xl text-cream">{title}</h2>
        <div className="mt-5 flex items-center gap-2 text-[9px] text-cream/55"><span>Level 7</span><span className="h-px flex-1 bg-copper/45" /></div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[64%] bg-copper" /></div>
        <p className="mt-2 text-left text-[9px] text-cream/45">1,250 / 2,000 XP</p>

        <div className="mt-6 border-t border-white/[.07] pt-5 text-left">
          <h3 className="mb-4 text-[10px] text-cream/65">Character Growth</h3>
          {growth.map(([label, level, color, Icon]) => (
            <div className="mb-3 flex items-center gap-3 text-[9px]" key={label}>
              <span className={`grid h-7 w-7 place-items-center rounded-md ${color}`}><Icon size={13} /></span>
              <span className="flex-1 text-cream/75">{label}</span>
              <span className="text-cream/35">{level}</span>
            </div>
          ))}
        </div>
      </section>

      <figure className="mt-5 overflow-hidden rounded-lg border border-white/[.07] bg-[#0b1113]">
        <div className="h-64 bg-[url('/assets/readquest-portal.png')] bg-cover bg-center opacity-75" />
        <blockquote className="p-5 font-serif text-2xl leading-[1.35] text-[#ead5b7]">“The more you read,<br />the more worlds<br />you wield.”</blockquote>
      </figure>
    </aside>
  )
}

function GoalCard() {
  return (
    <aside className="absolute right-3 top-4 z-20 w-36 rounded-lg border border-white/10 bg-[#0b1113] p-4 text-cream shadow-2xl sm:right-5 sm:top-6 sm:w-40 lg:w-48">
      <header className="flex items-center justify-between text-[10px]"><span>Today's Goal</span><Target size={17} className="text-copper" /></header>
      <p className="mt-6 text-[10px] text-cream/65">Learn 50 new words</p>
      <strong className="mt-1 block font-serif text-2xl font-medium">32 <span className="text-base text-cream/35">/ 50</span></strong>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[64%] bg-gradient-to-r from-orange-500 to-amber-200" /></div>
      <dl className="mt-5 space-y-4 border-t border-white/[.07] pt-4 text-[9px]">
        <div className="flex justify-between"><dt className="text-cream/55">XP Reward</dt><dd className="text-copper">200 XP</dd></div>
        <div className="flex justify-between"><dt className="text-cream/55">Daily Streak</dt><dd><Flame size={11} className="mr-1 inline text-orange-500" />12 days</dd></div>
      </dl>
      <Link className="mt-5 flex items-center justify-between rounded-md bg-cream px-4 py-3 text-[10px] font-semibold text-slate-deep" to="/progress">View Full Path <ArrowRight size={14} /></Link>
    </aside>
  )
}

function QuestMap({ stages }: { stages: Stage[] }) {
  const mapHeight = Math.max(1080, stages.length * 137)
  const points = useMemo(
    () => stages.map((_, index) => ({ x: nodeX[index % nodeX.length] * 10, y: 80 + index * 132 })),
    [stages],
  )
  const pathData = points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const midY = ((previous?.y ?? 0) + point.y) / 2
    return `${path} C ${previous?.x ?? point.x} ${midY}, ${point.x} ${midY}, ${point.x} ${point.y}`
  }, '')

  return (
    <section
      className="relative overflow-hidden rounded-lg bg-[#eadbc0] text-[#263027] shadow-[0_25px_80px_rgba(0,0,0,.35)]"
      style={{ minHeight: mapHeight, backgroundImage: "url('/assets/learning-map-clean.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-[#efe1c7]/45 mix-blend-screen" />
      <GoalCard />
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 1000 ${mapHeight}`} preserveAspectRatio="none" aria-hidden="true">
        <path d={pathData} fill="none" stroke="#40513f" strokeWidth="3" strokeDasharray="8 9" opacity=".7" />
      </svg>

      {stages.map((stage, index) => {
        const status = index < 4 ? 'complete' : index === 4 ? 'current' : 'locked'
        const left = nodeX[index % nodeX.length]
        return (
          <article
            className="absolute z-10 flex items-center gap-4"
            key={stage.index}
            style={{ left: `${left}%`, top: 50 + index * 132, transform: 'translateX(-28px)' }}
          >
            <div
              className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full border font-serif text-xl shadow-lg ${
                status === 'complete'
                  ? 'border-[#294b32] bg-[#294b32] text-cream'
                  : status === 'current'
                    ? 'border-orange-300 bg-orange-600 text-white shadow-[0_0_0_9px_rgba(238,157,70,.20),0_0_30px_rgba(229,139,72,.75)]'
                    : 'border-[#c7b899] bg-[#f2e6cf] text-[#253028]'
              }`}
            >
              {String(stage.index).padStart(2, '0')}
              <span className={`absolute -bottom-1 grid h-5 w-5 place-items-center rounded-full ${status === 'complete' ? 'bg-[#294b32]' : status === 'current' ? 'bg-orange-600' : 'bg-[#f2e6cf]'}`}>
                {status === 'complete' ? <Check size={12} /> : status === 'current' ? <Sparkles size={11} /> : <LockKeyhole size={10} />}
              </span>
            </div>
            <div className="w-32 text-[9px] sm:w-40">
              <strong className={status === 'current' ? 'text-orange-700' : ''}>Chapter {stage.index}</strong>
              <p className="mt-1 truncate text-[10px]">{stage.title}</p>
              <small className={`mt-2 flex items-center gap-1 ${status === 'current' ? 'text-orange-700' : 'text-[#586157]'}`}>
                {status === 'complete' ? <Check size={9} /> : status === 'current' ? <span className="h-1.5 w-1.5 rounded-full bg-orange-600" /> : <LockKeyhole size={8} />}
                {status === 'complete' ? 'Completed' : status === 'current' ? 'In Progress' : 'Locked'}
              </small>
            </div>
          </article>
        )
      })}
      <div className="absolute bottom-8 right-8 font-serif text-2xl text-[#536052]/70">N<br /><span className="text-4xl">✦</span></div>
    </section>
  )
}

function PathFooter() {
  return (
    <footer className="mt-7 grid gap-8 border-t border-white/[.06] px-5 py-10 text-[10px] text-cream/45 sm:grid-cols-[1.2fr_repeat(4,1fr)]">
      <div className="flex gap-4"><BookOpen size={42} className="text-copper" /><p className="leading-6 text-cream/70">Keep reading.<br />Keep questing.<br />Keep growing.</p></div>
      {[
        ['About', 'Our Mission', 'How It Works', 'For Schools'],
        ['Resources', 'Blog', 'Help Center', 'Community'],
        ['Legal', 'Terms of Use', 'Privacy Policy', 'Cookie Policy'],
      ].map(([heading, ...links]) => <div key={heading}><strong className="text-cream/70">{heading}</strong>{links.map((item) => <p className="mt-3" key={item}>{item}</p>)}</div>)}
      <div><strong className="text-cream/70">Stay Connected</strong><div className="mt-4 flex gap-3"><MessageCircle size={17} /><Send size={17} /><Camera size={17} /></div></div>
    </footer>
  )
}

export default function Path() {
  const [book, setBook] = useState<Book | null>(null)
  const [stages, setStages] = useState<Stage[]>(fallbackStages)

  useEffect(() => {
    const bookId = localStorage.getItem('readquest.bookId')
    if (!bookId) return

    const controller = new AbortController()
    axios
      .get<ChapterResponse>(`http://127.0.0.1:4000/api/books/${bookId}/chapters`, { signal: controller.signal })
      .then(({ data }) => {
        setBook(data.book)
        setStages(data.chapters.map((chapter) => ({ index: chapter.chapterIndex, title: `Reading Stage ${chapter.chapterIndex}` })))
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [])

  return (
    <main className="min-h-screen bg-[#070d10] text-cream">
      <div className="mx-auto max-w-[1280px]">
        <PathNav />
        <div className="grid min-[540px]:grid-cols-[170px_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)]">
          <JourneySidebar title={book?.title ?? 'World Seeker'} />
          <div className="p-3 sm:p-5 lg:p-7"><QuestMap stages={stages} /></div>
        </div>
        <PathFooter />
      </div>
    </main>
  )
}
