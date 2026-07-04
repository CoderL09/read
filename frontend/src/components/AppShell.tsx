import { motion, useReducedMotion } from 'framer-motion'
import { BarChart3, BookOpen, Flame, Home, Map, Plus, Sparkles } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'

const AmbientScene = lazy(() => import('./AmbientScene'))

const navigation = [
  { label: 'Home', to: '/', icon: Home, end: true },
  { label: 'Library', to: '/library', icon: BookOpen },
  { label: 'Quest', to: '/path', icon: Map },
  { label: 'Progress', to: '/progress', icon: BarChart3 },
]

function navClass({ isActive }: { isActive: boolean }) {
  return `group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm transition duration-300 ${
    isActive ? 'bg-white/[.09] text-cream shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]' : 'text-cream/48 hover:bg-white/[.04] hover:text-cream'
  }`
}

function ReadingProgressLine() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const update = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight
      setProgress(distance > 0 ? Math.min(1, window.scrollY / distance) : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return <span className="absolute inset-x-0 bottom-0 h-px origin-left bg-gradient-to-r from-emerald-400 via-amber-300 to-purple-400" style={{ transform: `scaleX(${progress})` }} />
}

export default function AppShell() {
  const location = useLocation()
  const reducedMotion = useReducedMotion()
  const readingMode = location.pathname.startsWith('/read') || location.pathname.startsWith('/reader')

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="relative min-h-screen bg-[#070b0d] text-cream">
      <a className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-full bg-cream px-4 py-2 text-xs font-bold text-slate-deep transition focus:translate-y-0" href="#main-content">Skip to content</a>
      <Suspense fallback={null}><AmbientScene quiet={readingMode} /></Suspense>
      {!readingMode && <div className="fixed inset-x-0 top-0 z-50 border-b border-white/[.06] bg-[#070b0d]/72 shadow-[0_10px_40px_rgba(0,0,0,.12)] backdrop-blur-2xl backdrop-saturate-150">
        <header className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-4 px-4 sm:px-7">
          <NavLink className="group flex items-center gap-3" to="/" aria-label="ReadQuest home">
            <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-amber-300/20 bg-[#0c1514] shadow-[0_0_24px_rgba(52,211,153,.10)] transition duration-300 group-hover:scale-105 group-hover:border-emerald-300/35">
              <img className="h-full w-full object-cover" src="/assets/readquest-crest.webp" alt="" />
            </span>
            <span>
              <strong className="block font-serif text-lg leading-none tracking-tight">ReadQuest</strong>
              <small className="mt-1 hidden text-[8px] font-bold uppercase tracking-[.24em] text-emerald-400/70 sm:block">Read · Learn · Level up</small>
            </span>
          </NavLink>

          <nav className="hidden items-center gap-0.5 rounded-full border border-white/[.055] bg-white/[.025] p-1 md:flex" aria-label="Primary navigation">
            {navigation.map(({ label, to, icon: Icon, end }) => (
              <NavLink className={navClass} to={to} end={end} key={to}>
                <Icon size={15} strokeWidth={1.8} /> {label}
                <span className="absolute inset-x-5 -bottom-1 h-px scale-x-0 bg-amber-300 transition group-[.active]:scale-x-100" />
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-orange-400/10 bg-orange-400/[.06] px-3 py-2 text-xs sm:flex">
              <Flame className="animate-[ember_2s_ease-in-out_infinite] text-orange-400" size={15} fill="currentColor" />
              <strong className="text-amber-200">12</strong>
              <span className="text-cream/35">day streak</span>
            </div>
            <NavLink className="shimmer-button group flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-xs font-bold text-slate-deep transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_30px_rgba(239,177,95,.15)]" to="/upload">
              <Plus size={15} className="transition group-hover:rotate-90" />
              <span className="hidden sm:inline">Add book</span>
            </NavLink>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-emerald-300/20 bg-emerald-400/[.08] text-emerald-300 transition hover:border-emerald-300/40 hover:bg-emerald-400/[.14]" type="button" aria-label="Open account menu">
              <Sparkles size={16} />
            </button>
          </div>
        </header>
        <ReadingProgressLine />
      </div>}

      <motion.div
        className={`relative z-[2] ${readingMode ? '' : 'pt-[72px] pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0'}`}
        id="main-content"
        key={location.pathname}
        initial={reducedMotion ? false : { opacity: 0, y: 8, filter: 'blur(3px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: reducedMotion ? 0 : 0.52, ease: [0.22, 1, 0.36, 1] }}
      >
        <Outlet />
      </motion.div>

      {!readingMode && <nav className="fixed inset-x-3 bottom-[calc(.75rem+env(safe-area-inset-bottom))] z-50 grid grid-cols-4 rounded-[1.35rem] border border-white/10 bg-[#0c1214]/88 p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.5)] backdrop-blur-2xl md:hidden" aria-label="Mobile navigation">
        {navigation.map(({ label, to, icon: Icon, end }) => (
          <NavLink className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl py-2 text-[9px] transition ${isActive ? 'bg-white/[.08] text-amber-300' : 'text-cream/40'}`} to={to} end={end} key={to}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>}
    </div>
  )
}
