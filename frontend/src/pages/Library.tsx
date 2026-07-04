import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { ArrowLeft, ArrowRight, BookOpen, Loader2, Plus, Search, Sparkles, WandSparkles, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CompanionAvatar, getStoredCompanion, useEvolutionStage } from '../components/Companion'
import { api, mediaUrl, type Book } from '../lib/api'

function Cover({ book }: { book: Book }) {
  if (book.coverUrl) return <img className="h-full w-full object-cover" src={mediaUrl(book.coverUrl)} alt={`Cover of ${book.title}`} />

  return (
    <div className="grid h-full w-full place-items-center bg-[radial-gradient(circle_at_45%_15%,rgba(167,139,250,.28),transparent_42%),linear-gradient(145deg,#192724,#080d0f)] p-7 text-center">
      <div><BookOpen className="mx-auto text-emerald-300/60" size={34} /><p className="mt-5 font-serif text-xl leading-tight text-cream/85">{book.title}</p></div>
    </div>
  )
}

function EnterQuestTransition({ book }: { book: Book }) {
  return (
    <motion.div className="fixed inset-0 z-[80] grid place-items-center overflow-hidden bg-[#030607]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute h-[45vw] w-[45vw] rounded-full bg-amber-300/20 blur-3xl" initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1, 2.7], opacity: [0, 0.8, 0] }} transition={{ duration: 1.05, ease: [0.65, 0, 0.35, 1] }} />
      <motion.div className="absolute h-[32vw] w-[32vw] rounded-full border border-emerald-200/30" initial={{ scale: 0.2, rotate: 0 }} animate={{ scale: 3, rotate: 180, opacity: 0 }} transition={{ duration: 1, ease: 'easeIn' }} />
      <motion.div className="relative aspect-[.72/1] w-[min(36vw,280px)] overflow-hidden rounded-2xl shadow-[0_0_100px_rgba(239,177,95,.5)]" layoutId={`book-${book.id}`} initial={{ scale: 1, rotateY: 0, z: 0 }} animate={{ scale: [1, 1.12, 0.12], rotateY: [0, -8, 30], rotateZ: [0, -2, 8], z: [0, 120, -400], filter: ['brightness(1)', 'brightness(2.8)', 'brightness(6)'] }} transition={{ duration: 1.05, times: [0, 0.45, 1], ease: [0.76, 0, 0.24, 1] }}>
        <Cover book={book} />
      </motion.div>
      <motion.p className="absolute bottom-[15%] text-[10px] font-bold uppercase tracking-[.28em] text-amber-200" initial={{ opacity: 0, y: 12 }} animate={{ opacity: [0, 1, 0], y: 0 }} transition={{ duration: 0.9 }}>Entering quest map</motion.p>
    </motion.div>
  )
}

export default function Library() {
  const navigate = useNavigate()
  const railRef = useRef<HTMLDivElement>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState(0)
  const [enteringBook, setEnteringBook] = useState<Book | null>(null)
  const [selectingBook, setSelectingBook] = useState<Book | null>(null)
  const [genMode, setGenMode] = useState<'quest' | 'continuous'>('quest')
  const [genWords, setGenWords] = useState(500)
  const [genBusy, setGenBusy] = useState(false)
  const [genStatus, setGenStatus] = useState<'idle' | 'generating' | 'polling' | 'completed' | 'failed'>('idle')
  const [genProgress, setGenProgress] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reducedMotion = useReducedMotion()

  const { scrollXProgress } = useScroll({ container: railRef, axis: 'x' })
  const smoothProgress = useSpring(scrollXProgress, { stiffness: 90, damping: 24, mass: 0.35 })
  const starsX = useTransform(smoothProgress, [0, 1], ['0%', '-10%'])
  const mountainsX = useTransform(smoothProgress, [0, 1], ['0%', '-20%'])
  const mistX = useTransform(smoothProgress, [0, 1], ['0%', '-34%'])
  const progressScale = useTransform(smoothProgress, [0, 1], [0.04, 1])

  useEffect(() => {
    const controller = new AbortController()
    api.get<Book[]>('/books', { signal: controller.signal }).then(({ data }) => setBooks(data)).catch(() => undefined).finally(() => setLoading(false))
    return () => controller.abort()
  }, [])

  const filteredBooks = useMemo(() => books.filter((book) => `${book.title} ${book.author}`.toLowerCase().includes(query.toLowerCase())), [books, query])
  const activeBook = filteredBooks[activeIndex] ?? filteredBooks[0]
  const companionStage = useEvolutionStage(activeBook)

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return

    const wheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
      event.preventDefault()
      rail.scrollLeft += event.deltaY * 1.05
    }
    const updateActive = () => {
      const cards = Array.from(rail.querySelectorAll<HTMLElement>('[data-book-card]'))
      const center = rail.scrollLeft + rail.clientWidth / 2
      let closest = 0
      let distance = Number.POSITIVE_INFINITY
      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2
        if (Math.abs(cardCenter - center) < distance) {
          distance = Math.abs(cardCenter - center)
          closest = index
        }
      })
      setActiveIndex(closest)
    }

    rail.addEventListener('wheel', wheel, { passive: false })
    rail.addEventListener('scroll', updateActive, { passive: true })
    return () => {
      rail.removeEventListener('wheel', wheel)
      rail.removeEventListener('scroll', updateActive)
    }
  }, [filteredBooks.length])

  function stopPolling() {
    if (pollRef.current) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }

  function pollGenerationStatus(bookId: string) {
    stopPolling()
    setGenStatus('polling')

    pollRef.current = window.setInterval(async () => {
      try {
        const { data } = await api.get<{ status: string; progress: number; errorMessage?: string }>(
          `/books/${bookId}/status`,
        )

        setGenProgress(data.progress)

        if (data.status === 'completed') {
          stopPolling()
          setGenProgress(100)
          localStorage.setItem('readquest.bookId', bookId)
          setSelectingBook(null)
          const target = books.find((b) => b.id === bookId)
          if (target) {
            setEnteringBook(target)
            window.setTimeout(() => {
              setGenBusy(false)
              setGenStatus('idle')
              setGenProgress(0)
              navigate('/path')
            }, reducedMotion ? 120 : 1050)
          }
        } else if (data.status === 'failed') {
          stopPolling()
          setGenStatus('failed')
          setGenBusy(false)
        }
      } catch {
        // Tolerate transient network failures while polling
      }
    }, 3000)
  }

  function openSelector(book: Book) {
    if (enteringBook) return

    if (book.status === 'processing') {
      stopPolling()
      setGenMode('quest')
      setGenWords(500)
      setGenProgress(book.progress)
      setSelectingBook(book)
      pollGenerationStatus(book.id)
      return
    }

    const ready = book.status === 'completed' || book.totalChapters > 0
    if (!ready) return
    setGenMode('quest')
    setGenWords(500)
    setSelectingBook(book)
    setGenStatus('idle')
    setGenProgress(0)
  }

  async function startReading() {
    const book = selectingBook
    if (!book || genBusy) return

    if (book.status === 'completed') {
      localStorage.setItem('readquest.bookId', book.id)
      setSelectingBook(null)
      setEnteringBook(book)
      window.setTimeout(() => navigate('/path'), reducedMotion ? 120 : 1050)
      return
    }

    setGenBusy(true)
    setGenStatus('generating')

    try {
      await api.post(`/books/${book.id}/generate`, {
        mode: genMode,
        wordsPerQuest: genMode === 'quest' ? genWords : undefined,
      })
      localStorage.setItem('readquest.bookId', book.id)
      setGenBusy(false)
      pollGenerationStatus(book.id)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number } }
      if (axiosErr.response?.status === 409) {
        setGenBusy(false)
        pollGenerationStatus(book.id)
      } else {
        setGenBusy(false)
        setGenStatus('failed')
      }
    }
  }

  function nudge(direction: -1 | 1) {
    railRef.current?.scrollBy({ left: direction * Math.min(window.innerWidth * 0.72, 620), behavior: 'smooth' })
  }

  return (
    <main className="relative h-[calc(100svh-72px)] min-h-[560px] overflow-hidden bg-[#04080b] text-cream sm:min-h-[620px]">
      <motion.div className="pointer-events-none absolute -inset-x-[15%] inset-y-0 opacity-70" style={{ x: starsX, backgroundImage: 'radial-gradient(circle at 12% 22%, rgba(255,255,255,.7) 0 1px, transparent 1.5px), radial-gradient(circle at 72% 30%, rgba(167,139,250,.72) 0 1px, transparent 1.6px), radial-gradient(circle at 45% 72%, rgba(52,211,153,.55) 0 1px, transparent 1.4px)', backgroundSize: '150px 150px, 230px 230px, 190px 190px' }} />
      <motion.div className="pointer-events-none absolute -inset-x-[24%] inset-y-0 bg-[url('/assets/readquest-hero-v2.webp')] bg-cover bg-center opacity-35" style={{ x: mountainsX, scale: 1.08 }} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(4,8,11,.9),transparent_30%,transparent_70%,rgba(4,8,11,.86)),linear-gradient(0deg,#04080b_0%,transparent_44%,rgba(4,8,11,.68)_100%)]" />
      <motion.div className="pointer-events-none absolute -inset-x-[25%] bottom-[-18%] h-[62%] bg-[radial-gradient(ellipse_at_center,rgba(180,215,201,.16),transparent_60%)] blur-2xl" style={{ x: mistX }} />

      <header className="absolute inset-x-0 top-0 z-30 flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-start sm:justify-between sm:px-9 lg:px-14">
        <div>
          <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.28em] text-emerald-300"><Sparkles size={12} /> The wandering library</p>
          <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Choose your next world.</h1>
          <p className="mt-2 text-xs text-cream/35">Swipe, drag or use the mouse wheel to travel.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-cream/40 backdrop-blur-md focus-within:border-emerald-300/30"><Search size={14} /><input className="w-32 bg-transparent text-xs text-cream outline-none placeholder:text-cream/25 sm:w-44" placeholder="Find a book" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <Link className="grid h-10 w-10 place-items-center rounded-xl bg-cream text-slate-deep transition hover:-translate-y-0.5" to="/upload" aria-label="Add book"><Plus size={17} /></Link>
        </div>
      </header>

      {loading ? (
        <div className="relative z-10 grid h-full place-items-center"><Loader2 className="animate-spin text-emerald-300" size={32} /></div>
      ) : filteredBooks.length ? (
        <div ref={railRef} className="cinema-rail relative z-10 flex h-full snap-x snap-mandatory items-center gap-[clamp(3rem,9vw,10rem)] overflow-x-auto overflow-y-hidden px-[16vw] pb-10 pt-32 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filteredBooks.map((book, index) => {
            const active = index === activeIndex
            const completed = book.status === 'completed'
            const isProcessing = book.status === 'processing'
            const canOpen = completed || isProcessing || book.totalChapters > 0
            return (
              <motion.article className="relative shrink-0 snap-center [perspective:1200px]" data-book-card key={book.id} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.08, 0.5), duration: 0.65 }}>
                <motion.button
                  className="group relative block text-left"
                  type="button"
                  disabled={!canOpen}
                  onClick={() => openSelector(book)}
                  animate={{ scale: active ? 1.08 : 0.88, opacity: active ? 1 : 0.58, rotateY: active ? 0 : index < activeIndex ? 8 : -8, z: active ? 80 : 0 }}
                  whileHover={canOpen ? { scale: active ? 1.12 : 0.94, y: -12, rotateY: 0 } : undefined}
                  whileTap={canOpen ? { scale: 1.02 } : undefined}
                  transition={{ type: 'spring', stiffness: 180, damping: 22 }}
                >
                  <motion.div className="relative aspect-[.72/1] w-[clamp(210px,22vw,310px)] overflow-hidden rounded-[18px_24px_24px_18px] border border-white/15 bg-[#101719] shadow-[0_35px_90px_rgba(0,0,0,.62)]" layoutId={`book-${book.id}`}>
                    <Cover book={book} />
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/45 via-transparent to-white/10" />
                    <div className="book-spine-glow absolute inset-y-0 left-0 w-[8%] border-r border-white/10 bg-black/35" />
                    {!completed && <div className="absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm"><div className="text-center"><Loader2 className="mx-auto animate-spin text-amber-300" size={23} /><p className="mt-3 text-[9px] uppercase tracking-wider text-amber-200">{isProcessing ? `Forging · ${book.progress}%` : 'Ready to forge'}</p></div></div>}
                    {completed && <div className="absolute inset-x-0 bottom-0 translate-y-5 bg-gradient-to-t from-black/85 to-transparent px-5 pb-5 pt-16 opacity-0 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100"><span className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.16em] text-amber-200">Enter quest <ArrowRight size={14} /></span></div>}
                  </motion.div>
                  <div className="mx-auto mt-7 max-w-[280px] text-center"><p className="text-[9px] font-bold uppercase tracking-[.2em] text-emerald-300/65">Volume {String(index + 1).padStart(2, '0')}</p><h2 className="mt-2 truncate font-serif text-2xl text-cream">{book.title}</h2><p className="mt-1 truncate text-xs text-cream/35">{book.author || 'Unknown author'}</p></div>
                </motion.button>
                {active && <motion.div className="absolute -bottom-10 left-1/2 h-px w-24 -translate-x-1/2 bg-gradient-to-r from-transparent via-amber-300 to-transparent" layoutId="active-book-line" />}
              </motion.article>
            )
          })}
          <div className="w-[8vw] shrink-0" aria-hidden="true" />
        </div>
      ) : (
        <section className="relative z-10 grid h-full place-items-center px-6 text-center"><div><BookOpen className="mx-auto text-cream/20" size={48} /><h2 className="mt-5 font-serif text-3xl">{query ? 'No world answers that name' : 'The shelves are waiting'}</h2><p className="mt-3 text-sm text-cream/40">{query ? 'Try another title or author.' : 'Upload your first book to light a new star.'}</p>{!query && <Link className="mt-6 inline-flex items-center gap-2 rounded-xl bg-cream px-5 py-3 text-sm font-bold text-slate-deep" to="/upload">Add your first book <ArrowRight size={15} /></Link>}</div></section>
      )}

      {filteredBooks.length > 0 && (
        <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-5 pb-5 sm:px-9 lg:px-14">
          <div className="pointer-events-auto hidden items-end gap-2 sm:flex">
            <CompanionAvatar companionId={getStoredCompanion()} stage={companionStage} className="h-24 w-24" showEvolution={false} />
            <div className="mb-3 rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[9px] text-cream/55 backdrop-blur">Your companion is exploring too</div>
          </div>
          <div className="pointer-events-auto ml-auto flex items-center gap-3">
            <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/30 text-cream/60 backdrop-blur transition hover:border-white/25 hover:text-cream" type="button" onClick={() => nudge(-1)} aria-label="Previous book"><ArrowLeft size={16} /></button>
            <div className="h-1 w-28 overflow-hidden rounded-full bg-white/10 sm:w-44"><motion.div className="h-full origin-left rounded-full bg-gradient-to-r from-emerald-300 to-amber-300" style={{ scaleX: progressScale }} /></div>
            <span className="w-12 text-center font-serif text-sm text-cream/55">{String(activeIndex + 1).padStart(2, '0')} / {String(filteredBooks.length).padStart(2, '0')}</span>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/30 text-cream/60 backdrop-blur transition hover:border-white/25 hover:text-cream" type="button" onClick={() => nudge(1)} aria-label="Next book"><ArrowRight size={16} /></button>
          </div>
        </footer>
      )}

      <AnimatePresence>
        {selectingBook && (
          <motion.div
            className="fixed inset-0 z-60 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
          >
            <motion.section
              className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101518] p-6 shadow-2xl"
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
            >
              {genStatus === 'generating' || genStatus === 'polling' ? (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-amber-300">Forging your quest</p>
                      <h2 className="mt-2 font-serif text-2xl text-cream">{selectingBook.title}</h2>
                    </div>
                    <button
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-cream/40 hover:text-cream"
                      type="button"
                      onClick={() => { stopPolling(); setSelectingBook(null); setGenStatus('idle'); setGenProgress(0) }}
                    >
                      <X size={15} />
                    </button>
                  </div>
                  <div className="mt-6 space-y-5">
                    <div className="flex justify-center">
                      <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-amber-400/30 bg-amber-500/10">
                        <Loader2 size={24} className="animate-spin text-amber-400" />
                      </div>
                    </div>
                    <p className="text-center text-sm text-cream/60">The AI is processing your book — this may take a few minutes.</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] text-cream/40">
                        <span>0%</span>
                        <span>{genProgress}%</span>
                        <span>100%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-cream/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-700 ease-out" style={{ width: `${genProgress}%` }} />
                      </div>
                    </div>
                    <p className="text-center text-[9px] text-cream/25">You may close this dialog — processing continues in the background.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300">Choose your path</p>
                      <h2 className="mt-2 font-serif text-2xl text-cream">{selectingBook.title}</h2>
                    </div>
                    <button
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-cream/40 hover:text-cream"
                      type="button"
                      onClick={() => setSelectingBook(null)}
                    >
                      <X size={15} />
                    </button>
                  </div>

                  <div className="mt-6 space-y-3">
                    {([
                      {
                        mode: 'continuous' as const,
                        icon: BookOpen,
                        title: 'Continuous Reading',
                        desc: 'Seamlessly read the entire book with AI-powered sense-group slashes.',
                      },
                      {
                        mode: 'quest' as const,
                        icon: WandSparkles,
                        title: 'Quest Mode',
                        desc: 'Turn the book into game stages. Level up as you conquer.',
                      },
                    ]).map(({ mode, icon: Icon, title, desc }) => (
                      <button
                        key={mode}
                        className={`w-full rounded-xl border p-4 text-left transition ${
                          genMode === mode
                            ? 'border-amber-400/30 bg-amber-500/[0.08]'
                            : 'border-white/[.07] hover:border-white/15'
                        }`}
                        type="button"
                        onClick={() => setGenMode(mode)}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                            genMode === mode ? 'bg-amber-500/15 text-amber-300' : 'bg-white/[.04] text-cream/40'
                          }`}>
                            <Icon size={16} />
                          </span>
                          <div>
                            <strong className="block text-sm text-cream">{title}</strong>
                            <span className="mt-1 block text-[10px] leading-5 text-cream/40">{desc}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {genMode === 'quest' && (
                    <div className="mt-4 rounded-xl border border-white/[.07] bg-white/[.02] p-4">
                      <p className="text-[10px] text-cream/50">
                        Words per stage: <strong className="text-cream">{genWords}</strong>
                      </p>
                      <input
                        className="mt-3 w-full h-2 appearance-none rounded-full bg-white/10 accent-amber-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
                        type="range"
                        min={300}
                        max={1000}
                        step={50}
                        value={genWords}
                        onChange={(e) => setGenWords(Number(e.target.value))}
                      />
                      <div className="mt-2 flex justify-between text-[9px] text-cream/30">
                        <span>300</span><span>1000</span>
                      </div>
                    </div>
                  )}

                  <button
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500/90 px-5 py-3.5 text-sm font-bold text-[#0c0f11] transition hover:bg-amber-400 disabled:opacity-50"
                    type="button"
                    disabled={genBusy}
                    onClick={() => void startReading()}
                  >
                    {genBusy ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                    {genBusy ? 'Generating...' : 'Start Reading'}
                  </button>

                  <p className="mt-3 text-center text-[9px] text-cream/25">
                    The AI will process your book. This may take a few minutes.
                  </p>
                </>
              )}
            </motion.section>
          </motion.div>
        )}
        {enteringBook && <EnterQuestTransition book={enteringBook} />}
      </AnimatePresence>
    </main>
  )
}
