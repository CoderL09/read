import { AnimatePresence, motion } from 'framer-motion'
import { Headphones, MessageCircle, Settings2, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import { CompanionAvatar, companions, getStoredCompanion, type EvolutionStage } from '../../components/Companion'

interface Props {
  page: number
  totalPages: number
  isPlaying: boolean
  bgColor: string
  onPlay: () => void
  onSettings: () => void
}

export default function ReadingCompanionDock({ page, totalPages, isPlaying, bgColor, onPlay, onSettings }: Props) {
  const [open, setOpen] = useState(false)
  const companionId = getStoredCompanion()
  const companion = companions.find((item) => item.id === companionId) ?? companions[0]
  const progress = Math.round(((page + 1) / Math.max(totalPages, 1)) * 100)
  const stage: EvolutionStage = progress > 74 ? 3 : progress > 34 ? 2 : 1
  const isLight = bgColor !== 'dark'
  const message = isPlaying
    ? '我在跟着你的节奏听。点击正文任意句子，可以从那里继续朗读。'
    : page === 0
      ? '先读懂句子的骨架，再看修饰成分。我们慢慢来。'
      : `这一章已经探索了 ${progress}%。遇到长句就点一下，我帮你拆开。`

  return (
    <div className="fixed bottom-24 right-3 z-40 sm:bottom-6 sm:right-6 xl:bottom-auto xl:top-1/2 xl:-translate-y-1/2">
      <AnimatePresence>
        {open && (
          <motion.aside
            className={`absolute bottom-16 right-0 w-[min(330px,calc(100vw-24px))] overflow-hidden rounded-3xl border shadow-[0_24px_80px_rgba(0,0,0,.22)] backdrop-blur-2xl xl:bottom-auto xl:right-20 xl:top-1/2 xl:-translate-y-1/2 ${isLight ? 'border-black/[.08] bg-white/92 text-[#28231d]' : 'border-white/10 bg-[#101516]/94 text-cream'}`}
            initial={{ opacity: 0, y: 12, scale: .94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: .96 }}
          >
            <div className="flex items-start justify-between gap-4 p-5 pb-3">
              <div>
                <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.2em] text-emerald-500"><Sparkles size={11} /> Reading companion</p>
                <h3 className="mt-2 font-serif text-xl">{companion.name} 在陪你读</h3>
              </div>
              <button className="grid h-8 w-8 place-items-center rounded-full border border-current/10 opacity-50 transition hover:opacity-100" type="button" onClick={() => setOpen(false)} aria-label="Close companion"><X size={13} /></button>
            </div>
            <div className={`mx-5 rounded-2xl p-4 text-xs leading-6 ${isLight ? 'bg-[#f6f1e8]' : 'bg-white/[.045]'}`}>
              {message}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between text-[10px] opacity-45"><span>Chapter bond</span><b>{progress}%</b></div>
              <div className={`mt-2 h-1.5 overflow-hidden rounded-full ${isLight ? 'bg-black/[.06]' : 'bg-white/[.07]'}`}><motion.div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-400" animate={{ width: `${progress}%` }} /></div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-semibold transition ${isLight ? 'bg-[#17201d] text-white hover:bg-[#24312c]' : 'bg-cream text-[#101514] hover:bg-white'}`} type="button" onClick={onPlay}><Headphones size={13} /> Listen</button>
                <button className="flex items-center justify-center gap-2 rounded-xl border border-current/10 px-3 py-2.5 text-[11px] font-semibold opacity-65 transition hover:opacity-100" type="button" onClick={onSettings}><Settings2 size={13} /> Reading style</button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <motion.button
        className={`relative grid h-14 w-14 place-items-center rounded-full border shadow-[0_14px_40px_rgba(0,0,0,.22)] backdrop-blur-xl sm:h-16 sm:w-16 ${isLight ? 'border-black/10 bg-white/80' : 'border-white/10 bg-[#121718]/80'}`}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Talk to ${companion.name}`}
        whileHover={{ y: -4, scale: 1.03 }}
        whileTap={{ scale: .94 }}
      >
        <motion.div key={page} initial={{ scale: .82, rotate: -5 }} animate={{ scale: 1, rotate: 0 }} className="h-14 w-14 sm:h-16 sm:w-16"><CompanionAvatar companionId={companionId} stage={stage} className="h-full w-full" showEvolution={false} /></motion.div>
        <span className="absolute -left-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-emerald-500 text-white shadow"><MessageCircle size={10} fill="currentColor" /></span>
        {isPlaying && <span className="absolute bottom-0 right-0 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-white bg-amber-400" />}
      </motion.button>
    </div>
  )
}
