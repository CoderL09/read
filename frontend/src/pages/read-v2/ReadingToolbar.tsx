import { ArrowLeft, Eye, EyeOff, Layers3, Palette, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { AnnotationMode } from './types'

interface Props {
  title: string
  chapterTitle: string
  annotationMode: AnnotationMode
  onAnnotationModeChange: (mode: AnnotationMode) => void
  isPlaying: boolean
  onSettingsClick: () => void
  bgColor: string
  page: number
  totalPages: number
}

const modes: { mode: AnnotationMode; icon: typeof Eye; label: string }[] = [
  { mode: 'off', icon: EyeOff, label: '原文' },
  { mode: 'simple', icon: Eye, label: '节奏' },
  { mode: 'detailed', icon: Layers3, label: '结构' },
]

export default function ReadingToolbar({ title, chapterTitle, annotationMode, onAnnotationModeChange, isPlaying, onSettingsClick, bgColor, page, totalPages }: Props) {
  const navigate = useNavigate()
  const isLight = bgColor !== 'dark'
  const progress = ((page + 1) / Math.max(totalPages, 1)) * 100

  return (
    <header className={`sticky top-0 z-30 border-b backdrop-blur-2xl ${isLight ? 'border-black/[.07] bg-white/82 text-[#312b24]' : 'border-white/[.07] bg-[#121617]/86 text-cream'}`}>
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-3 sm:h-[72px] sm:px-6">
        <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-current/10 opacity-55 transition hover:opacity-100" type="button" onClick={() => navigate('/path')} aria-label="Back to quest map"><ArrowLeft size={17} /></button>

        <div className="min-w-0 flex-1 pl-1 sm:pl-2">
          <p className="truncate text-[9px] font-bold uppercase tracking-[.18em] opacity-35">{title}</p>
          <div className="mt-1 flex items-center gap-2">
            <h1 className="truncate font-serif text-sm font-semibold sm:text-base">{chapterTitle}</h1>
            {isPlaying && <span className="hidden items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-emerald-500 sm:flex"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Listening</span>}
          </div>
        </div>

        <div className={`flex items-center rounded-full border p-1 ${isLight ? 'border-black/[.07] bg-black/[.025]' : 'border-white/[.08] bg-white/[.03]'}`} aria-label="Sense group display mode">
          {modes.map(({ mode, icon: Icon, label }) => (
            <button
              key={mode}
              className={`flex h-8 items-center gap-1.5 rounded-full px-2.5 text-[10px] font-semibold transition sm:px-3 ${annotationMode === mode ? isLight ? 'bg-white text-[#2a251f] shadow-sm' : 'bg-white/10 text-white shadow-sm' : 'opacity-35 hover:opacity-70'}`}
              type="button"
              onClick={() => onAnnotationModeChange(mode)}
              title={`${label}模式`}
            >
              <Icon size={13} /><span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </div>

        <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-current/10 opacity-55 transition hover:rotate-6 hover:opacity-100" type="button" onClick={onSettingsClick} aria-label="Reading preferences"><Palette size={16} /></button>
        <div className="hidden min-w-14 text-right sm:block"><b className="text-xs">{page + 1}</b><span className="text-[10px] opacity-30"> / {totalPages}</span></div>
      </div>
      <div className={`h-[2px] ${isLight ? 'bg-black/[.035]' : 'bg-white/[.04]'}`}><div className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-purple-400 transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
      {annotationMode !== 'off' && <div className={`hidden border-t px-6 py-2 text-center text-[9px] sm:block ${isLight ? 'border-black/[.04] bg-[#faf7f1]/65 text-[#8a7966]' : 'border-white/[.04] bg-white/[.018] text-white/35'}`}><Sparkles className="mr-1.5 inline text-amber-500" size={10} />{annotationMode === 'simple' ? '节奏模式：按母语者自然停顿组织意义，不逐词拆解' : '结构模式：需要时再查看意义块之间的关系'}</div>}
    </header>
  )
}
