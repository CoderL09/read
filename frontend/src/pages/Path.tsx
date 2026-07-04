import { ArrowRight, BookOpen, Check, Flame, LockKeyhole, Sparkles, Target, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CompanionAvatar, getStoredCompanion, useEvolutionStage } from '../components/Companion'
import { api, mediaUrl, type Book } from '../lib/api'

type Chapter = { id: string; chapterIndex: number; content: string }
type ChapterResponse = { book: Book; chapters: Chapter[] }
type Stage = { index: number; title: string }

const fallbackStages = ['The Call to Adventure', 'Crossing the Threshold', 'Trials in the Wild', 'Allies and Enemies', 'The Hidden Truth', 'Shadows Deepen', 'The Inner Journey', 'The Final Challenge'].map((title, index) => ({ index: index + 1, title }))
const nodeX = [32, 44, 35, 49, 38, 50, 34, 45]

function JourneySidebar({ book }: { book: Book | null }) {
  const companionStage = useEvolutionStage(book)

  return (
    <aside className="px-5 py-10 lg:sticky lg:top-[72px] lg:h-[calc(100vh-72px)] lg:overflow-y-auto lg:px-7">
      <p className="text-[10px] font-bold uppercase tracking-[.24em] text-emerald-300">Current campaign</p>
      <h1 className="mt-4 font-serif text-5xl leading-[.92] text-cream lg:text-6xl">Your<br />Quest<br />Map</h1>
      <p className="mt-6 max-w-xs text-xs leading-6 text-cream/45">Conquer one stage at a time. Every chapter strengthens your English hero.</p>

      <div className="relative mx-auto mt-4 h-36 w-36">
        <CompanionAvatar companionId={getStoredCompanion()} stage={companionStage} className="h-full w-full" showEvolution={false} />
      </div>

      <article className="interactive-card mt-8 rounded-2xl border border-white/[.07] bg-white/[.025] p-5">
        <div className="flex items-center gap-4">
          <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md border border-white/10 bg-[#111a20]">
            {book?.coverUrl ? <img className="h-full w-full object-cover" src={mediaUrl(book.coverUrl)} alt="" /> : <div className="grid h-full place-items-center"><BookOpen className="text-emerald-300/50" size={19} /></div>}
          </div>
          <div className="min-w-0"><small className="text-[9px] uppercase tracking-wider text-cream/30">Reading now</small><h2 className="mt-1 truncate font-serif text-lg">{book?.title ?? 'Choose a book'}</h2><p className="mt-1 truncate text-[10px] text-cream/35">{book?.author ?? 'Your next world awaits'}</p></div>
        </div>
        <div className="mt-5 flex justify-between text-[10px]"><span className="text-cream/35">Hero level</span><strong className="text-amber-300">Level 7</strong></div>
        <div className="progress-shine mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full w-[64%] rounded-full bg-gradient-to-r from-amber-500 to-amber-200" /></div>
      </article>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4"><Flame className="text-orange-400" size={17} /><strong className="mt-3 block text-xl">12</strong><span className="text-[9px] text-cream/35">Day streak</span></div>
        <div className="rounded-xl border border-white/[.06] bg-white/[.02] p-4"><Trophy className="text-purple-300" size={17} /><strong className="mt-3 block text-xl">2,450</strong><span className="text-[9px] text-cream/35">Total XP</span></div>
      </div>

      <Link className="group mt-6 flex items-center justify-between rounded-xl border border-white/[.07] px-4 py-3 text-xs text-cream/55 transition hover:border-amber-300/20 hover:text-amber-200" to="/library">Switch book <ArrowRight className="transition group-hover:translate-x-1" size={14} /></Link>
    </aside>
  )
}

function GoalCard() {
  return (
    <aside className="absolute right-3 top-3 z-20 w-40 rounded-2xl border border-white/10 bg-[#091011]/90 p-4 text-cream shadow-2xl backdrop-blur-md sm:right-6 sm:top-6 sm:w-48">
      <header className="flex items-center justify-between text-[10px]"><span>Today&apos;s goal</span><Target size={16} className="text-amber-300" /></header>
      <strong className="mt-5 block font-serif text-2xl">32 <span className="text-base text-cream/30">/ 50 words</span></strong>
      <div className="progress-shine mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[64%] bg-gradient-to-r from-orange-500 to-amber-200" /></div>
      <p className="mt-4 flex justify-between text-[9px] text-cream/40"><span>Reward</span><b className="text-amber-300">+200 XP</b></p>
    </aside>
  )
}

function QuestMap({ stages }: { stages: Stage[] }) {
  const mapHeight = Math.max(1040, stages.length * 136)
  const points = useMemo(() => stages.map((_, index) => ({ x: nodeX[index % nodeX.length] * 10, y: 100 + index * 132 })), [stages])
  const pathData = points.reduce((path, point, index) => {
    if (!index) return `M ${point.x} ${point.y}`
    const previous = points[index - 1]
    const midY = (previous.y + point.y) / 2
    return `${path} C ${previous.x} ${midY}, ${point.x} ${midY}, ${point.x} ${point.y}`
  }, '')

  return (
    <section className="relative overflow-hidden rounded-3xl bg-[#eadbc0] text-[#263027] shadow-[0_28px_90px_rgba(0,0,0,.35)]" style={{ minHeight: mapHeight, backgroundImage: "url('/assets/learning-map-clean.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-[#efe1c7]/45 mix-blend-screen" /><GoalCard />
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 1000 ${mapHeight}`} preserveAspectRatio="none" aria-hidden="true"><path d={pathData} fill="none" stroke="#40513f" strokeWidth="3" strokeDasharray="8 9" opacity=".62" /></svg>
      {stages.map((stage, index) => {
        const status = index < 3 ? 'complete' : index === 3 ? 'current' : 'locked'
        return (
          <article className="quest-node absolute z-10 flex items-center gap-4" style={{ left: `${nodeX[index % nodeX.length]}%`, top: 72 + index * 132, transform: 'translateX(-28px)', animationDelay: `${index * 70}ms` }} key={stage.index}>
            <button className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full border font-serif text-lg shadow-lg transition hover:scale-110 ${status === 'complete' ? 'border-[#294b32] bg-[#294b32] text-cream' : status === 'current' ? 'animate-[quest-pulse_2.2s_ease-in-out_infinite] border-orange-300 bg-orange-600 text-white shadow-[0_0_0_9px_rgba(238,157,70,.20),0_0_30px_rgba(229,139,72,.65)]' : 'border-[#c7b899] bg-[#f2e6cf] text-[#253028]'}`} type="button" aria-label={`Chapter ${stage.index}, ${status}`}>
              {String(stage.index).padStart(2, '0')}<span className="absolute -bottom-1 grid h-5 w-5 place-items-center rounded-full bg-inherit">{status === 'complete' ? <Check size={11} /> : status === 'current' ? <Sparkles size={10} /> : <LockKeyhole size={9} />}</span>
            </button>
            <div className="w-32 text-[9px] sm:w-44"><strong className={status === 'current' ? 'text-orange-700' : ''}>Chapter {stage.index}</strong><p className="mt-1 truncate text-[10px]">{stage.title}</p><small className="mt-2 flex items-center gap-1 text-[#586157]">{status === 'complete' ? 'Completed' : status === 'current' ? 'In progress' : 'Locked'}</small></div>
          </article>
        )
      })}
    </section>
  )
}

export default function Path() {
  const [book, setBook] = useState<Book | null>(null)
  const [stages, setStages] = useState<Stage[]>(fallbackStages)

  useEffect(() => {
    const controller = new AbortController()
    async function loadQuest() {
      let bookId = localStorage.getItem('readquest.bookId') ?? ''
      if (!bookId) {
        const { data } = await api.get<Book[]>('/books', { signal: controller.signal })
        bookId = data.find((item) => item.status === 'completed' || item.totalChapters > 0)?.id ?? ''
      }
      if (!bookId) return
      const { data } = await api.get<ChapterResponse>(`/books/${bookId}/chapters`, { signal: controller.signal })
      setBook(data.book)
      if (data.chapters.length) setStages(data.chapters.map((chapter) => ({ index: chapter.chapterIndex, title: `Reading stage ${chapter.chapterIndex}` })))
    }
    void loadQuest().catch(() => undefined)
    return () => controller.abort()
  }, [])

  return <main className="min-h-screen bg-[#070d10] text-cream"><div className="mx-auto grid max-w-[1280px] min-[600px]:grid-cols-[190px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)]"><JourneySidebar book={book} /><div className="p-3 sm:p-5 lg:p-7"><QuestMap stages={stages} /></div></div></main>
}
