import { ArrowRight, BookOpen, Check, Flame, Play, Sparkles, Target, Trophy, WandSparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CompanionAvatar, CompanionSelector, EvolutionBadge, InteractiveCompanion, companions, useEvolutionStage, useSelectedCompanion } from '../components/Companion'
import { api, mediaUrl, type Book } from '../lib/api'

const missions = [
  { title: 'Read for 15 minutes', progress: 72, reward: '+80 XP', icon: BookOpen, color: 'emerald' },
  { title: 'Master 20 new words', progress: 64, reward: '+120 XP', icon: WandSparkles, color: 'purple' },
  { title: 'Complete one quiz', progress: 100, reward: '+60 XP', icon: Target, color: 'amber' },
] as const

const achievements = [
  { label: 'Wordsmith', detail: '1,000 words mastered', icon: WandSparkles, tone: 'text-purple-300 bg-purple-400/10 border-purple-300/15' },
  { label: 'On Fire', detail: '12 day reading streak', icon: Flame, tone: 'text-orange-300 bg-orange-400/10 border-orange-300/15' },
  { label: 'Pathfinder', detail: '25 stages conquered', icon: Trophy, tone: 'text-amber-300 bg-amber-400/10 border-amber-300/15' },
]

function BookCover({ book }: { book: Book }) {
  return book.coverUrl ? (
    <img className="h-full w-full object-cover" src={mediaUrl(book.coverUrl)} alt={`Cover of ${book.title}`} />
  ) : (
    <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_50%_20%,rgba(52,211,153,.25),transparent_45%),linear-gradient(145deg,#182320,#080d0f)] p-5 text-center">
      <BookOpen className="mb-3 text-emerald-300/70" size={28} />
      <span className="font-serif text-sm text-cream/80">{book.title}</span>
    </div>
  )
}

export default function Dashboard() {
  const [books, setBooks] = useState<Book[]>([])
  const [selectedCompanion, setSelectedCompanion] = useSelectedCompanion()

  useEffect(() => {
    const controller = new AbortController()
    api.get<Book[]>('/books', { signal: controller.signal }).then(({ data }) => setBooks(data)).catch(() => undefined)
    return () => controller.abort()
  }, [])

  const activeBook = books.find((book) => book.id === localStorage.getItem('readquest.bookId'))
    ?? books.find((book) => book.status === 'completed')
    ?? books.find((book) => book.totalChapters > 0)
  const evolutionStage = useEvolutionStage(activeBook)
  const companion = companions.find((item) => item.id === selectedCompanion) ?? companions[0]

  return (
    <main className="overflow-hidden">
      <section className="relative isolate min-h-[690px] overflow-hidden border-b border-white/[.06]">
        <img className="absolute inset-0 h-full w-full object-cover object-[68%_center]" src="/assets/readquest-hero-v2.webp" alt="A magical book opening a path toward a crystal mountain" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#070b0d_0%,rgba(7,11,13,.94)_34%,rgba(7,11,13,.22)_72%,rgba(7,11,13,.35)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#070b0d] to-transparent" />
        <div className="ambient-orb absolute left-[44%] top-28 h-40 w-40 rounded-full bg-purple-500/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-[690px] max-w-[1320px] items-center px-5 py-20 sm:px-8">
          <div className="reveal-in min-w-0 max-w-[650px]">
            <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[.07] px-3 py-2 text-[10px] font-bold uppercase tracking-[.22em] text-emerald-300">
              <Sparkles size={13} /> AI-powered reading RPG
            </p>
            <h1 className="mt-7 font-serif text-[clamp(3.7rem,7vw,7rem)] leading-[.88] tracking-[-.045em] text-cream">
              Every page<br />makes you <em className="font-normal text-amber-300">stronger.</em>
            </h1>
            <p className="mt-7 max-w-xl text-base leading-8 text-cream/55 sm:text-lg">
              Turn the books you already love into focused English quests—complete stages, master vocabulary, and watch your hero attributes grow.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link className="shimmer-button group inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-cream px-5 text-sm font-extrabold text-slate-deep transition hover:-translate-y-1 sm:w-auto sm:px-7" to={activeBook ? '/path' : '/upload'}>
                <Play size={17} fill="currentColor" /> {activeBook ? 'Continue your quest' : 'Start your first quest'}
                <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </Link>
              <Link className="inline-flex min-h-14 w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-black/20 px-5 text-sm font-bold text-cream/75 backdrop-blur transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/[.06] hover:text-cream sm:w-auto sm:px-7" to="/library">
                Explore library
              </Link>
            </div>
            <dl className="mt-10 flex flex-wrap gap-x-9 gap-y-4 border-t border-white/[.08] pt-6">
              {[['1,245', 'Words mastered'], ['48', 'Quizzes cleared'], ['92%', 'Comprehension']].map(([value, label]) => (
                <div key={label}><dt className="text-xl font-bold text-cream">{value}</dt><dd className="mt-1 text-[10px] uppercase tracking-wider text-cream/35">{label}</dd></div>
              ))}
            </dl>
          </div>
          <div className="pointer-events-auto absolute bottom-2 right-4 z-10 hidden w-[290px] lg:block xl:right-12 xl:w-[340px]">
            <InteractiveCompanion companionId={selectedCompanion} stage={evolutionStage} className="aspect-square w-full" />
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 whitespace-nowrap"><EvolutionBadge stage={evolutionStage} /></div>
          </div>
        </div>
      </section>

      <section className="relative border-b border-white/[.06] bg-[radial-gradient(circle_at_20%_50%,rgba(52,211,153,.07),transparent_34%),#070b0d]">
        <div className="mx-auto grid max-w-[1320px] items-center gap-8 px-5 py-12 sm:px-8 md:grid-cols-[minmax(220px,.72fr)_1.28fr] lg:py-16">
          <div className="relative mx-auto aspect-square w-[min(72vw,320px)] lg:hidden">
            <CompanionAvatar companionId={selectedCompanion} stage={evolutionStage} className="h-full w-full" />
          </div>
          <div className="hidden lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-emerald-300">Reading companion</p>
            <h2 className="mt-3 font-serif text-4xl">Meet {companion.name}.</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-cream/45">{companion.personality} Your companion evolves automatically as your reading and quiz mastery grows.</p>
            <div className="mt-6"><EvolutionBadge stage={evolutionStage} /></div>
          </div>
          <div className="rounded-3xl border border-white/[.07] bg-white/[.025] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">Choose your companion</p><h3 className="mt-2 font-serif text-2xl">Who reads beside you?</h3></div><span className="hidden rounded-full border border-white/10 px-3 py-1.5 text-[9px] text-cream/35 sm:block">Selection saved</span></div>
            <div className="mt-5"><CompanionSelector selected={selectedCompanion} onSelect={setSelectedCompanion} /></div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[9px] text-cream/35"><span className={evolutionStage >= 1 ? 'text-amber-200' : ''}>01 · Baby</span><span className={evolutionStage >= 2 ? 'text-amber-200' : ''}>02 · Youth</span><span className={evolutionStage >= 3 ? 'text-amber-200' : ''}>03 · Final</span></div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.24em] text-amber-400">Your next move</p><h2 className="mt-3 font-serif text-4xl sm:text-5xl">Today&apos;s adventure</h2></div>
          <p className="max-w-sm text-sm leading-6 text-cream/40">Small wins compound. Finish today&apos;s missions to protect your 12-day streak.</p>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <article className="interactive-card relative overflow-hidden rounded-3xl border border-white/[.07] bg-[#0d1416] p-6 sm:p-8">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-400/[.08] blur-3xl" />
            {activeBook ? (
              <div className="relative grid items-center gap-7 sm:grid-cols-[130px_1fr]">
                <div className="aspect-[.72/1] overflow-hidden rounded-xl border border-white/10 shadow-2xl"><BookCover book={activeBook} /></div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300">Active quest</p>
                  <h3 className="mt-3 font-serif text-3xl">{activeBook.title}</h3><p className="mt-2 text-sm text-cream/40">{activeBook.author}</p>
                  <div className="mt-7 flex items-end justify-between text-xs"><span className="text-cream/45">Quest preparation</span><strong className="text-emerald-300">{activeBook.status === 'completed' ? 'Ready' : `${activeBook.progress}%`}</strong></div>
                  <div className="progress-shine mt-3 h-2 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" style={{ width: `${activeBook.status === 'completed' ? 72 : activeBook.progress}%` }} /></div>
                  <Link className="group mt-7 inline-flex items-center gap-2 text-sm font-bold text-cream transition hover:text-amber-300" to="/path">Open quest map <ArrowRight size={15} className="transition group-hover:translate-x-1" /></Link>
                </div>
              </div>
            ) : (
              <div className="relative grid min-h-64 place-items-center text-center"><div><BookOpen className="mx-auto text-emerald-300" size={38} /><h3 className="mt-5 font-serif text-3xl">Your first world awaits</h3><p className="mt-3 text-sm text-cream/45">Upload a book and let AI shape it into a learning path.</p><Link className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cream px-5 py-3 text-sm font-bold text-slate-deep" to="/upload">Add a book <ArrowRight size={15} /></Link></div></div>
            )}
          </article>

          <div className="grid gap-3">
            {missions.map(({ title, progress, reward, icon: Icon, color }, index) => (
              <article className="interactive-card group rounded-2xl border border-white/[.06] bg-white/[.025] p-5 transition" style={{ animationDelay: `${index * 90}ms` }} key={title}>
                <div className="flex items-center gap-4">
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${color === 'emerald' ? 'border-emerald-300/15 bg-emerald-400/10 text-emerald-300' : color === 'purple' ? 'border-purple-300/15 bg-purple-400/10 text-purple-300' : 'border-amber-300/15 bg-amber-400/10 text-amber-300'}`}><Icon size={19} /></span>
                  <div className="min-w-0 flex-1"><div className="flex justify-between gap-3"><h3 className="truncate text-sm font-semibold">{title}</h3><span className="text-[10px] font-bold text-amber-300">{reward}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[.06]"><div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-200 transition-all duration-700 group-hover:brightness-125" style={{ width: `${progress}%` }} /></div></div>
                  {progress === 100 ? <Check className="text-emerald-300" size={18} /> : <span className="text-xs text-cream/35">{progress}%</span>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/[.06] bg-white/[.018]">
        <div className="mx-auto max-w-[1320px] px-5 py-16 sm:px-8">
          <p className="text-[10px] font-bold uppercase tracking-[.24em] text-purple-300">Achievement cabinet</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {achievements.map(({ label, detail, icon: Icon, tone }) => <article className="interactive-card flex items-center gap-4 rounded-2xl border border-white/[.06] bg-[#0b1113] p-5" key={label}><span className={`grid h-12 w-12 place-items-center rounded-2xl border ${tone}`}><Icon size={21} /></span><div><h3 className="font-serif text-xl">{label}</h3><p className="mt-1 text-xs text-cream/35">{detail}</p></div></article>)}
          </div>
        </div>
      </section>
    </main>
  )
}
