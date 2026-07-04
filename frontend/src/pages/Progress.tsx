import { ArrowRight, BookOpen, Flame, Languages, NotebookPen, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import LearningStats from '../components/LearningStats'

const stats: { label: string; value: string; icon: LucideIcon }[] = [
  { label: 'Books Read', value: '12', icon: BookOpen },
  { label: 'Words Learned', value: '1,245', icon: Languages },
  { label: 'Quizzes Taken', value: '48', icon: NotebookPen },
  { label: 'Current Streak', value: '12 days', icon: Flame },
]

const activity = [
  { title: 'Completed The Alchemist', detail: "Great work — you've earned 200 XP.", category: 'Achievement', time: '2h ago', icon: Trophy },
  { title: 'Learned 25 new words', detail: 'Your vocabulary power keeps growing.', category: 'Vocabulary', time: '5h ago', icon: Languages },
  { title: '12-day reading streak', detail: 'Consistency is your superpower.', category: 'Streak', time: '1d ago', icon: Flame },
  { title: 'Scored 90% on History Quiz', detail: "You're mastering the content.", category: 'Quiz', time: '2d ago', icon: NotebookPen },
]

function ProgressOverview() {
  return (
    <section className="grid items-center gap-10 py-14 sm:grid-cols-2 md:gap-8 lg:grid-cols-[.72fr_.8fr_1fr] lg:py-20">
      <header><p className="text-[10px] font-bold uppercase tracking-[.24em] text-purple-300">Character sheet</p><h1 className="mt-4 font-serif text-6xl leading-[.9] text-cream lg:text-7xl">Your<br />Progress</h1><p className="mt-6 max-w-60 text-sm leading-7 text-cream/45">See the reader you&apos;re becoming, one quest at a time.</p></header>
      <div className="relative mx-auto h-52 w-52 lg:h-64 lg:w-64" aria-label="68 percent overall progress">
        <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90" role="img"><circle cx="110" cy="110" r="91" fill="none" stroke="rgba(241,234,223,.08)" strokeWidth="13" /><circle cx="110" cy="110" r="91" fill="none" stroke="#e58b48" strokeWidth="13" strokeLinecap="round" strokeDasharray="571.8" strokeDashoffset="183" /></svg>
        <div className="absolute inset-0 grid place-items-center text-center"><div><strong className="font-serif text-5xl text-amber-300 lg:text-6xl">68%</strong><span className="mt-2 block text-[10px] uppercase tracking-wider text-cream/35">Overall mastery</span></div></div>
      </div>
      <dl className="divide-y divide-white/[.07] sm:col-span-2 lg:col-span-1">{stats.map(({ label, value, icon: Icon }) => <div className="grid grid-cols-[40px_1fr_auto] items-center gap-4 py-4" key={label}><dt className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.06] bg-white/[.03] text-amber-300"><Icon size={18} /></dt><dd className="text-xs text-cream/45">{label}</dd><dd className="font-semibold text-cream">{value}</dd></div>)}</dl>
    </section>
  )
}

function RecentActivity() {
  return (
    <section className="rounded-3xl border border-white/[.07] bg-white/[.025] p-5 sm:p-8">
      <header className="flex items-center justify-between gap-5"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300">Quest log</p><h2 className="mt-2 font-serif text-3xl">Recent activity</h2></div><button className="group flex items-center gap-2 text-xs text-amber-300" type="button">View all <ArrowRight className="transition group-hover:translate-x-1" size={14} /></button></header>
      <div className="mt-6 divide-y divide-white/[.06]">{activity.map(({ title, detail, category, time, icon: Icon }) => <article className="group grid grid-cols-[44px_1fr_auto] items-center gap-4 py-5 sm:grid-cols-[44px_1fr_100px_60px]" key={title}><span className="grid h-11 w-11 place-items-center rounded-xl border border-white/[.06] bg-white/[.03] text-amber-300 transition group-hover:scale-105 group-hover:bg-amber-400/10"><Icon size={19} /></span><div><h3 className="text-sm text-cream/85">{title}</h3><p className="mt-1 text-xs text-cream/35">{detail}</p></div><span className="hidden w-fit rounded-full bg-purple-400/[.08] px-3 py-1.5 text-[9px] text-purple-300 sm:inline-block">{category}</span><time className="text-right text-[10px] text-cream/30">{time}</time></article>)}</div>
    </section>
  )
}

export default function Progress() {
  return <main className="min-h-screen bg-[#0a0f11] text-cream"><div className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-7"><ProgressOverview /><div className="space-y-7"><LearningStats /><RecentActivity /></div></div></main>
}
