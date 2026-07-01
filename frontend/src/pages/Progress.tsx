import {
  ArrowRight,
  BookOpen,
  ChevronDown,
  Flame,
  Languages,
  NotebookPen,
  Trophy,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

const accent = '#e58b48'

type Stat = {
  label: string
  value: string
  icon: LucideIcon
}

const stats: Stat[] = [
  { label: 'Books Read', value: '12', icon: BookOpen },
  { label: 'Words Learned', value: '1,245', icon: Languages },
  { label: 'Quizzes Taken', value: '48', icon: NotebookPen },
  { label: 'Current Streak', value: '12 days', icon: Flame },
]

const activity = [
  {
    title: 'Completed “The Alchemist”',
    detail: "Great choice! You've earned 200 XP.",
    category: 'Achievement',
    time: '2h ago',
    icon: Trophy,
  },
  {
    title: 'Learned 25 new words',
    detail: 'Keep expanding your vocabulary.',
    category: 'Vocabulary',
    time: '5h ago',
    icon: Languages,
  },
  {
    title: '12-day reading streak',
    detail: 'Consistency is your superpower.',
    category: 'Streak',
    time: '1d ago',
    icon: Flame,
  },
  {
    title: 'Scored 90% on History Quiz',
    detail: "You're mastering the content!",
    category: 'Quiz',
    time: '2d ago',
    icon: NotebookPen,
  },
]

const chartPoints = [
  [54, 222],
  [165, 178],
  [276, 198],
  [387, 127],
  [498, 62],
  [609, 116],
  [720, 48],
]

function ProgressNav() {
  return (
    <nav className="flex min-h-16 items-center justify-between gap-5 border-b border-white/[.035] px-5 sm:px-8 lg:px-1">
      <Link to="/" className="font-serif text-xl text-cream">
        ReadQuest
      </Link>
      <div className="hidden items-center gap-4 text-[10px] text-cream/70 min-[480px]:flex md:gap-9 md:text-xs">
        <Link className="text-copper" to="/">Dashboard</Link>
        <a className="transition hover:text-cream" href="#library">Library</a>
        <Link className="transition hover:text-cream" to="/path">Quests</Link>
        <a className="transition hover:text-cream" href="#analytics">Analytics</a>
      </div>
      <button
        className="flex items-center gap-2 text-cream/70"
        type="button"
        aria-label="Open account menu"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full border border-copper/45 bg-copper/20 text-xs text-cream">A</span>
        <ChevronDown size={14} strokeWidth={1.5} />
      </button>
    </nav>
  )
}

function ProgressOverview() {
  return (
    <section className="grid items-center gap-10 py-14 min-[520px]:grid-cols-[180px_170px_minmax(0,1fr)] min-[520px]:gap-1 md:grid-cols-[.72fr_1fr_1.02fr] md:gap-8 lg:gap-10 lg:py-20">
      <header>
        <h1 className="font-serif text-6xl leading-[.92] text-cream min-[520px]:text-[52px] md:text-6xl lg:text-7xl">
          Your<br />Progress
        </h1>
        <p className="mt-7 max-w-60 text-sm leading-7 text-cream/55 min-[520px]:text-xs min-[520px]:leading-6 lg:text-sm lg:leading-7">
          Track your reading journey and celebrate every milestone.
        </p>
      </header>

      <div className="relative mx-auto h-64 w-64 min-[520px]:h-40 min-[520px]:w-40 md:h-56 md:w-56 lg:h-64 lg:w-64" aria-label="68 percent overall progress">
        <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90" role="img">
          <circle cx="110" cy="110" r="91" fill="none" stroke="rgba(241,234,223,.10)" strokeWidth="14" />
          <circle
            cx="110"
            cy="110"
            r="91"
            fill="none"
            stroke={accent}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray="571.8"
            strokeDashoffset="183"
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <strong className="font-serif text-6xl font-medium text-copper min-[520px]:text-5xl lg:text-6xl">68%</strong>
            <span className="mt-2 block text-xs text-cream/75">Overall Progress</span>
          </div>
        </div>
      </div>

      <dl className="divide-y divide-white/10">
        {stats.map(({ label, value, icon: Icon }) => (
          <div className="grid grid-cols-[44px_1fr_auto] items-center gap-4 py-4 min-[520px]:grid-cols-[30px_1fr_auto] min-[520px]:gap-1 md:grid-cols-[38px_1fr_auto] md:gap-3 lg:grid-cols-[44px_1fr_auto] lg:gap-4" key={label}>
            <dt className="grid h-10 w-10 place-items-center rounded-lg border border-white/[.055] bg-white/[.035] text-copper min-[520px]:h-7 min-[520px]:w-7 md:h-9 md:w-9 lg:h-10 lg:w-10">
              <Icon size={20} strokeWidth={1.7} />
            </dt>
            <dd className="text-xs text-cream/70 min-[520px]:text-[8px] md:text-[10px] lg:text-xs">{label}</dd>
            <dd className="text-lg font-semibold text-copper min-[520px]:text-xs md:text-base lg:text-lg">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

function XpChart() {
  const points = chartPoints.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `M ${chartPoints[0][0]} ${chartPoints[0][1]} ${chartPoints
    .slice(1)
    .map(([x, y]) => `L ${x} ${y}`)
    .join(' ')} L 720 260 L 54 260 Z`

  return (
    <section className="rounded-lg border border-white/[.07] bg-white/[.035] px-5 py-6 sm:px-8 sm:py-8">
      <header className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-cream">XP Gained Over Time</h2>
        <button className="flex items-center gap-3 rounded-md border border-white/[.07] px-4 py-3 text-xs text-cream/65" type="button">
          7 Days <ChevronDown size={13} />
        </button>
      </header>

      <div className="mt-7 overflow-x-auto pb-2">
        <svg className="w-full" viewBox="0 0 770 320" role="img" aria-label="XP gained from May 11 to May 17">
          <defs>
            <linearGradient id="xp-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={accent} stopOpacity=".28" />
              <stop offset="1" stopColor={accent} stopOpacity=".02" />
            </linearGradient>
          </defs>
          {[28, 76, 124, 172, 220, 260].map((y, index) => (
            <g key={y}>
              <line x1="54" x2="720" y1={y} y2={y} stroke="rgba(241,234,223,.09)" strokeDasharray="3 5" />
              <text x="0" y={y + 4} fill="rgba(241,234,223,.48)" fontSize="11">
                {[1500, 1250, 1000, 750, 500, 0][index].toLocaleString()}
              </text>
            </g>
          ))}
          <path d={area} fill="url(#xp-area)" />
          <polyline points={points} fill="none" stroke={accent} strokeWidth="2.5" strokeLinejoin="round" />
          {chartPoints.map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="5.5" fill="#171b1c" stroke={accent} strokeWidth="2.5" />
          ))}
          {['May 11', 'May 12', 'May 13', 'May 14', 'May 15', 'May 16', 'May 17'].map((label, index) => (
            <text key={label} x={54 + index * 111} y="294" textAnchor="middle" fill="rgba(241,234,223,.48)" fontSize="11">
              {label}
            </text>
          ))}
        </svg>
      </div>

      <footer className="flex items-center justify-between border-t border-white/[.07] pt-5 text-sm text-cream/55">
        <span className="flex items-center gap-3"><i className="h-3 w-3 rounded-full bg-copper" />XP Gained</span>
        <span>Total XP: <strong className="ml-1 text-xl text-copper">7,250</strong></span>
      </footer>
    </section>
  )
}

function RecentActivity() {
  return (
    <section className="rounded-lg border border-white/[.07] bg-white/[.035] px-5 py-6 sm:px-8 sm:py-8">
      <header className="flex items-center justify-between gap-5">
        <h2 className="font-serif text-2xl text-cream">Recent Activity</h2>
        <button className="flex items-center gap-3 text-xs text-copper" type="button">
          View all activity <ArrowRight size={15} />
        </button>
      </header>
      <div className="mt-5 divide-y divide-white/[.07]">
        {activity.map(({ title, detail, category, time, icon: Icon }) => (
          <article className="grid grid-cols-[48px_1fr_auto] items-center gap-4 py-5 sm:grid-cols-[48px_1fr_100px_60px]" key={title}>
            <span className="grid h-12 w-12 place-items-center rounded-lg border border-white/[.06] bg-white/[.04] text-copper">
              <Icon size={22} strokeWidth={1.8} />
            </span>
            <div>
              <h3 className="text-sm font-medium text-cream/90">{title}</h3>
              <p className="mt-1 text-xs text-cream/45">{detail}</p>
            </div>
            <span className="hidden w-fit rounded-full bg-copper/10 px-3 py-1.5 text-[10px] text-copper sm:inline-block">{category}</span>
            <time className="text-right text-xs text-cream/40">{time}</time>
          </article>
        ))}
      </div>
    </section>
  )
}

function QuoteBanner() {
  return (
    <figure
      className="relative min-h-72 overflow-hidden rounded-lg bg-cream bg-cover bg-center text-slate-deep sm:min-h-80"
      style={{ backgroundImage: "url('/assets/quote-mountain-clean.png')" }}
    >
      <blockquote className="relative z-[1] max-w-xl px-7 py-8 sm:px-12 sm:py-10">
        <span className="font-serif text-6xl leading-none text-copper">“</span>
        <p className="mt-2 font-serif text-2xl leading-[1.35] sm:text-3xl">
          The more that you read,<br />
          the more things you will know.<br />
          The more that you learn,<br />
          the more places you’ll go.
        </p>
        <figcaption className="mt-8 flex items-center gap-4 text-xs font-semibold uppercase text-copper">
          <span className="h-px w-7 bg-copper" /> Dr. Seuss
        </figcaption>
      </blockquote>
    </figure>
  )
}

export default function Progress() {
  return (
    <main className="min-h-screen bg-[#0c1011] text-cream">
      <div className="mx-auto max-w-[1160px] px-4 pb-10 sm:px-7 lg:px-10">
        <ProgressNav />
        <ProgressOverview />
        <div className="space-y-7">
          <XpChart />
          <RecentActivity />
          <QuoteBanner />
        </div>
      </div>
    </main>
  )
}
