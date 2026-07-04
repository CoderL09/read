import { BarChart3, BookOpen, Flame, Home, Map, Plus, Sparkles } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'

const navigation = [
  { label: 'Home', to: '/', icon: Home, end: true },
  { label: 'Library', to: '/library', icon: BookOpen },
  { label: 'Quest', to: '/path', icon: Map },
  { label: 'Progress', to: '/progress', icon: BarChart3 },
]

function navClass({ isActive }: { isActive: boolean }) {
  return `group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition duration-300 ${
    isActive ? 'bg-white/[.07] text-cream' : 'text-cream/50 hover:bg-white/[.04] hover:text-cream'
  }`
}

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[#070b0d] text-cream">
      <div className="fixed inset-x-0 top-0 z-50 border-b border-white/[.06] bg-[#070b0d]/80 backdrop-blur-xl">
        <header className="mx-auto flex h-[72px] max-w-[1320px] items-center justify-between gap-5 px-4 sm:px-7">
          <NavLink className="group flex items-center gap-3" to="/" aria-label="ReadQuest home">
            <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-amber-300/20 bg-[#0c1514] shadow-[0_0_24px_rgba(52,211,153,.10)] transition duration-300 group-hover:scale-105 group-hover:border-emerald-300/35">
              <img className="h-full w-full object-cover" src="/assets/readquest-crest.webp" alt="" />
            </span>
            <span>
              <strong className="block font-serif text-lg leading-none tracking-tight">ReadQuest</strong>
              <small className="mt-1 hidden text-[8px] font-bold uppercase tracking-[.24em] text-emerald-400/70 sm:block">Read · Learn · Level up</small>
            </span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {navigation.map(({ label, to, icon: Icon, end }) => (
              <NavLink className={navClass} to={to} end={end} key={to}>
                <Icon size={15} strokeWidth={1.8} /> {label}
                <span className="absolute inset-x-3 -bottom-[17px] h-px scale-x-0 bg-amber-400 transition group-[.active]:scale-x-100" />
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-orange-400/10 bg-orange-400/[.06] px-3 py-2 text-xs sm:flex">
              <Flame className="animate-[ember_2s_ease-in-out_infinite] text-orange-400" size={15} fill="currentColor" />
              <strong className="text-amber-200">12</strong>
              <span className="text-cream/35">day streak</span>
            </div>
            <NavLink className="group flex items-center gap-2 rounded-xl bg-cream px-3.5 py-2.5 text-xs font-bold text-slate-deep transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_10px_30px_rgba(239,177,95,.15)]" to="/upload">
              <Plus size={15} className="transition group-hover:rotate-90" />
              <span className="hidden sm:inline">Add book</span>
            </NavLink>
            <button className="grid h-10 w-10 place-items-center rounded-full border border-emerald-300/20 bg-emerald-400/[.08] text-emerald-300 transition hover:border-emerald-300/40 hover:bg-emerald-400/[.14]" type="button" aria-label="Open account menu">
              <Sparkles size={16} />
            </button>
          </div>
        </header>
      </div>

      <div className="pt-[72px] pb-20 md:pb-0">
        <Outlet />
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-2xl border border-white/10 bg-[#0c1214]/95 p-1.5 shadow-2xl backdrop-blur-xl md:hidden" aria-label="Mobile navigation">
        {navigation.map(({ label, to, icon: Icon, end }) => (
          <NavLink className={({ isActive }) => `flex flex-col items-center gap-1 rounded-xl py-2 text-[9px] transition ${isActive ? 'bg-white/[.08] text-amber-300' : 'text-cream/40'}`} to={to} end={end} key={to}>
            <Icon size={18} /> {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

