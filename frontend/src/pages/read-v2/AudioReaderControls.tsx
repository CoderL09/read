import { motion } from 'framer-motion'
import { Pause, Play, Square, Volume2 } from 'lucide-react'

interface Props {
  isPlaying: boolean
  isPaused: boolean
  speed: number
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onSpeedChange: (speed: number) => void
  bgColor: string
}

const speeds = [0.5, 0.75, 1, 1.25, 1.5]

export default function AudioReaderControls({ isPlaying, isPaused, speed, onPlay, onPause, onResume, onStop, onSpeedChange, bgColor }: Props) {
  const isLight = bgColor !== 'dark'
  const active = isPlaying || isPaused

  return (
    <motion.div
      className={`fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex max-w-[calc(100vw-5.5rem)] -translate-x-1/2 items-center gap-1 rounded-full border p-1.5 pr-2 shadow-[0_14px_45px_rgba(0,0,0,.18)] backdrop-blur-2xl sm:max-w-none ${isLight ? 'border-black/[.08] bg-white/88 text-[#3a332b]' : 'border-white/10 bg-[#121718]/90 text-cream'}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <button className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition ${isLight ? 'bg-[#17201d] text-white hover:bg-[#26332e]' : 'bg-cream text-[#121716] hover:bg-white'}`} type="button" onClick={active ? (isPaused ? onResume : onPause) : onPlay} aria-label={active ? (isPaused ? 'Resume' : 'Pause') : 'Read this page'}>
        {isPlaying && !isPaused ? <Pause size={16} fill="currentColor" /> : <Play className="translate-x-px" size={16} fill="currentColor" />}
      </button>
      {active ? (
        <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full opacity-35 transition hover:opacity-80" type="button" onClick={onStop} aria-label="Stop"><Square size={11} fill="currentColor" /></button>
      ) : (
        <span className="hidden items-center gap-1.5 px-2 text-[10px] font-semibold opacity-45 sm:flex"><Volume2 size={13} /> Read page</span>
      )}
      <span className="mx-1 h-5 w-px bg-current opacity-10" />
      <div className="flex items-center gap-0.5 overflow-x-auto">
        {speeds.map((value) => (
          <button key={value} className={`shrink-0 rounded-full px-2 py-1.5 text-[9px] font-bold transition ${Math.abs(value - speed) < .01 ? isLight ? 'bg-amber-100 text-amber-700' : 'bg-amber-400/15 text-amber-300' : 'opacity-30 hover:opacity-65'}`} type="button" onClick={() => onSpeedChange(value)}>{value}×</button>
        ))}
      </div>
    </motion.div>
  )
}
