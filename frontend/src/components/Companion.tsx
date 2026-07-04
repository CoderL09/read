import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { Check, Sparkles, X } from 'lucide-react'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import type { Book } from '../lib/api'

export type CompanionId = 'xiaohe' | 'ember' | 'sprig'
export type EvolutionStage = 1 | 2 | 3

export const companions = [
  {
    id: 'xiaohe' as const,
    name: '小禾',
    title: '黄色河马',
    personality: '温柔又有耐心，喜欢陪你慢慢读。',
    image: '/assets/companions/xiaohe-v2.webp',
    accent: '#f5c451',
  },
  {
    id: 'ember' as const,
    name: '烬火',
    title: '炽热精灵',
    personality: '越连胜越兴奋，是冲刺任务的好搭档。',
    image: '/assets/companions/ember.webp',
    accent: '#fb7a32',
  },
  {
    id: 'sprig' as const,
    name: '芽芽',
    title: '森林芽苗',
    personality: '安静、聪明，擅长发现句子里的线索。',
    image: '/assets/companions/sprig.webp',
    accent: '#9fbd67',
  },
]

const stageLabels: Record<EvolutionStage, { name: string; label: string }> = {
  1: { name: 'Baby', label: '初生形态' },
  2: { name: 'Youth', label: '成长形态' },
  3: { name: 'Final', label: '觉醒形态' },
}

export function getStoredCompanion(): CompanionId {
  const stored = localStorage.getItem('readquest.companion')
  return stored === 'ember' || stored === 'sprig' ? stored : 'xiaohe'
}

export function getEvolutionStage(book?: Book | null): EvolutionStage {
  const correctQuizCount = Number(localStorage.getItem('readquest.quizCorrect') ?? 0)
  const masteredGrammar = localStorage.getItem('readquest.grammarMastered') === 'true'

  if (masteredGrammar || book?.status === 'completed') return 3
  if ((book?.wordCount ?? 0) > 5000 || correctQuizCount >= 10) return 2
  return 1
}

export function recordQuizResult(isCorrect: boolean) {
  if (!isCorrect) return
  const current = Number(localStorage.getItem('readquest.quizCorrect') ?? 0)
  localStorage.setItem('readquest.quizCorrect', String(current + 1))
  window.dispatchEvent(new Event('readquest:progress'))
}

export function markGrammarMastered(mastered = true) {
  localStorage.setItem('readquest.grammarMastered', String(mastered))
  window.dispatchEvent(new Event('readquest:progress'))
}

export function useEvolutionStage(book?: Book | null) {
  const [stage, setStage] = useState<EvolutionStage>(() => getEvolutionStage(book))

  useEffect(() => {
    const update = () => setStage(getEvolutionStage(book))
    update()
    window.addEventListener('storage', update)
    window.addEventListener('readquest:progress', update)
    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('readquest:progress', update)
    }
  }, [book])

  return stage
}

export function useSelectedCompanion() {
  const [selected, setSelected] = useState<CompanionId>(getStoredCompanion)

  useEffect(() => {
    localStorage.setItem('readquest.companion', selected)
  }, [selected])

  return [selected, setSelected] as const
}

function EvolutionParticles({ accent }: { accent: string }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: 12 }, (_, index) => {
        const angle = (index / 12) * Math.PI * 2
        const x = Math.cos(angle) * (76 + (index % 3) * 14)
        const y = Math.sin(angle) * (76 + (index % 2) * 18)
        return (
          <motion.i
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full"
            key={index}
            style={{ backgroundColor: index % 3 === 0 ? '#fff7d6' : accent, boxShadow: `0 0 10px ${accent}` }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
            animate={{ x, y, opacity: [0, 1, 0], scale: [0, 1.4, 0] }}
            transition={{ duration: 1.1, delay: index * 0.035, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}

export function CompanionAvatar({
  companionId,
  stage,
  className = '',
  showEvolution = true,
  children,
}: {
  companionId: CompanionId
  stage: EvolutionStage
  className?: string
  showEvolution?: boolean
  children?: ReactNode
}) {
  const reducedMotion = useReducedMotion()
  const companion = companions.find((item) => item.id === companionId) ?? companions[0]
  const stageScale = stage === 1 ? 0.88 : stage === 2 ? 0.97 : 1.05

  return (
    <div className={`relative grid place-items-center ${className}`}>
      <motion.div
        className="companion-platform"
        style={{ '--companion-accent': companion.accent } as CSSProperties}
        animate={reducedMotion ? undefined : { scale: [0.94, 1.04, 0.94], opacity: [0.52, 0.82, 0.52] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <motion.div
        className="absolute inset-[17%] rounded-full blur-2xl"
        style={{ backgroundColor: companion.accent }}
        animate={reducedMotion ? { opacity: 0.16 } : { opacity: [0.1, stage === 3 ? 0.34 : 0.2, 0.1], scale: [0.82, 1.1, 0.82] }}
        transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {stage === 3 && (
        <motion.div
          className="absolute inset-[13%] rounded-full border border-dashed"
          style={{ borderColor: `${companion.accent}77` }}
          animate={reducedMotion ? undefined : { rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <motion.div
        className="relative h-full w-full"
        key={`${companionId}-${stage}`}
        initial={reducedMotion ? false : { opacity: 0.45, scale: 0.72, filter: 'brightness(3) blur(5px)' }}
        animate={{ opacity: 1, scale: stageScale, filter: 'brightness(1) blur(0px)' }}
        transition={{ duration: reducedMotion ? 0.15 : 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          className="relative h-full w-full origin-bottom"
          animate={reducedMotion ? undefined : { y: [0, -8, 0, -3, 0], rotate: [0, -1.2, 0, 1.2, 0], scaleY: [1, 1.015, 1, 0.965, 1], scaleX: [1, 0.992, 1, 1.018, 1] }}
          transition={{ duration: 4.6, repeat: Infinity, repeatDelay: 0.4, ease: 'easeInOut' }}
        >
          <img className="h-full w-full object-contain drop-shadow-[0_24px_35px_rgba(0,0,0,.38)]" src={companion.image} alt={`${companion.name}, ${stageLabels[stage].label}`} />
          {children}
        </motion.div>
      </motion.div>

      {showEvolution && <EvolutionParticles accent={companion.accent} />}
    </div>
  )
}

export function CompanionSelector({
  selected,
  onSelect,
}: {
  selected: CompanionId
  onSelect: (id: CompanionId) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Choose a reading companion">
      {companions.map((companion) => {
        const active = selected === companion.id
        return (
          <motion.button
            className={`relative overflow-hidden rounded-xl border px-2 py-2 text-center transition ${active ? 'border-white/25 bg-white/[.1]' : 'border-white/[.06] bg-black/15 text-cream/40 hover:bg-white/[.05]'}`}
            type="button"
            role="radio"
            aria-checked={active}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(companion.id)}
            key={companion.id}
          >
            <img className="mx-auto h-12 w-12 object-contain" src={companion.image} alt="" />
            <span className="mt-1 block text-[10px] font-bold text-cream/80">{companion.name}</span>
            {active && <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-emerald-300 text-[#07100d]"><Check size={9} strokeWidth={3} /></span>}
          </motion.button>
        )
      })}
    </div>
  )
}

export function EvolutionBadge({ stage }: { stage: EvolutionStage }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[9px] font-bold uppercase tracking-[.16em] text-cream/55 backdrop-blur">
      <Sparkles size={11} className="text-amber-300" /> Stage {stage} · {stageLabels[stage].name}
    </div>
  )
}

type Reaction = 'idle' | 'shy' | 'tantrum' | 'dizzy' | 'fallen'

const eyeProfiles: Record<CompanionId, { eyes: [number, number]; top: number; paw: string }> = {
  xiaohe: { eyes: [42, 63.5], top: 33.5, paw: '#efad2d' },
  ember: { eyes: [42.5, 58.5], top: 30.5, paw: '#e96622' },
  sprig: { eyes: [42.5, 59], top: 31, paw: '#91ad5f' },
}

const userAttributes = [
  ['Vocabulary', 86, '#34d399'],
  ['Grammar', 72, '#a78bfa'],
  ['Reading speed', 78, '#60a5fa'],
  ['Comprehension', 91, '#fbbf24'],
  ['Consistency', 82, '#fb923c'],
] as const

function CompanionStatsPanel({
  name,
  stage,
  onClose,
}: {
  name: string
  stage: EvolutionStage
  onClose: () => void
}) {
  return (
    <motion.aside
      className="absolute right-[78%] top-[5%] z-40 w-64 rounded-2xl border border-white/10 bg-[#081012]/95 p-4 text-left shadow-[0_25px_80px_rgba(0,0,0,.55)] backdrop-blur-xl"
      initial={{ opacity: 0, x: 20, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 14, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      onPointerDown={(event) => event.stopPropagation()}
      onPointerUp={(event) => event.stopPropagation()}
    >
      <header className="flex items-start justify-between gap-3 border-b border-white/[.07] pb-3">
        <div><p className="text-[8px] font-bold uppercase tracking-[.2em] text-emerald-300">Soul link</p><h3 className="mt-1 font-serif text-lg text-cream">{name} · Your attributes</h3></div>
        <button className="grid h-7 w-7 place-items-center rounded-full border border-white/10 text-cream/40 transition hover:text-cream" type="button" onClick={onClose} aria-label="Close attributes"><X size={12} /></button>
      </header>
      <div className="mt-4 space-y-3">
        {userAttributes.map(([label, value, color]) => (
          <div key={label}>
            <div className="flex justify-between text-[9px]"><span className="text-cream/45">{label}</span><b style={{ color }}>{value}</b></div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[.07]"><motion.div className="h-full origin-left rounded-full" style={{ backgroundColor: color }} initial={{ scaleX: 0 }} animate={{ scaleX: value / 100 }} transition={{ duration: 0.65, delay: 0.08 }} /></div>
          </div>
        ))}
      </div>
      <footer className="mt-4 flex items-center justify-between rounded-xl bg-white/[.035] px-3 py-2 text-[9px]"><span className="text-cream/35">Evolution</span><strong className="text-amber-200">Stage {stage}</strong></footer>
    </motion.aside>
  )
}

export function InteractiveCompanion({
  companionId,
  stage,
  className = '',
}: {
  companionId: CompanionId
  stage: EvolutionStage
  className?: string
}) {
  const companion = companions.find((item) => item.id === companionId) ?? companions[0]
  const profile = eyeProfiles[companionId]
  const reducedMotion = useReducedMotion()
  const [reaction, setReaction] = useState<Reaction>('idle')
  const [showStats, setShowStats] = useState(false)
  const gazeXValue = useMotionValue(0)
  const gazeYValue = useMotionValue(0)
  const gazeX = useSpring(gazeXValue, { stiffness: 280, damping: 24 })
  const gazeY = useSpring(gazeYValue, { stiffness: 280, damping: 24 })
  const timers = useRef<number[]>([])
  const spin = useRef({ angle: 0, time: 0, distance: 0, direction: 0 })

  useEffect(() => () => timers.current.forEach((timer) => window.clearTimeout(timer)), [])

  function schedule(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay)
    timers.current.push(timer)
  }

  function resetReaction(delay = 1700) {
    schedule(() => setReaction('idle'), reducedMotion ? 80 : delay)
  }

  function triggerFaceReaction() {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
    setReaction('shy')
    schedule(() => setReaction('tantrum'), reducedMotion ? 80 : 650)
    resetReaction(1850)
  }

  function triggerFall() {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
    setReaction('fallen')
    resetReaction(1800)
  }

  function triggerDizzy() {
    if (reaction !== 'idle') return
    setReaction('dizzy')
    spin.current.distance = 0
    schedule(() => setReaction('fallen'), reducedMotion ? 80 : 1050)
    resetReaction(2450)
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const dx = event.clientX - (rect.left + rect.width / 2)
    const dy = event.clientY - (rect.top + rect.height / 2)
    const nx = Math.max(-1, Math.min(1, dx / (rect.width * 0.42)))
    const ny = Math.max(-1, Math.min(1, dy / (rect.height * 0.42)))
    gazeXValue.set(nx * 5)
    gazeYValue.set(ny * 4)

    const angle = Math.atan2(dy, dx)
    const now = performance.now()
    if (!spin.current.time || now - spin.current.time > 180) {
      spin.current = { angle, time: now, distance: 0, direction: 0 }
      return
    }

    let delta = angle - spin.current.angle
    if (delta > Math.PI) delta -= Math.PI * 2
    if (delta < -Math.PI) delta += Math.PI * 2
    const direction = Math.sign(delta)
    const radius = Math.hypot(dx, dy)

    if (radius > rect.width * 0.18 && Math.abs(delta) > 0.025) {
      spin.current.distance = direction === spin.current.direction
        ? spin.current.distance + Math.abs(delta)
        : Math.max(0, spin.current.distance - Math.abs(delta) * 2.2)
      spin.current.direction = direction
      if (spin.current.distance > Math.PI * 2.6) triggerDizzy()
    }
    spin.current.angle = angle
    spin.current.time = now
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const yRatio = (event.clientY - rect.top) / rect.height
    setShowStats(true)
    if (reaction === 'dizzy') return
    if (yRatio < 0.54) triggerFaceReaction()
    else triggerFall()
  }

  const reactionAnimation = reaction === 'fallen'
    ? { rotate: 82, x: 24, y: 52, scale: 0.96 }
    : reaction === 'dizzy'
      ? { rotate: [0, -7, 8, -10, 9, 0], x: [0, -5, 5, -6, 4, 0], y: [0, 4, -3, 5, 0] }
      : reaction === 'tantrum'
        ? { rotate: [0, -6, 6, -7, 7, -4, 0], x: [0, -8, 8, -9, 9, 0], y: [0, -5, 0, -7, 0] }
        : reaction === 'shy'
          ? { scale: 0.97, y: 5, rotate: -2 }
          : { rotate: 0, x: 0, y: 0, scale: 1 }

  return (
    <div
      className={`relative cursor-pointer select-none ${className}`}
      role="button"
      tabIndex={0}
      aria-label={`Interact with ${companion.name} and view your attributes`}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => { gazeXValue.set(0); gazeYValue.set(0); spin.current.distance = 0 }}
      onPointerUp={handlePointerUp}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          setShowStats(true)
          triggerFaceReaction()
        }
      }}
    >
      <AnimatePresence>{showStats && <CompanionStatsPanel name={companion.name} stage={stage} onClose={() => setShowStats(false)} />}</AnimatePresence>

      <motion.div
        className="relative h-full w-full origin-[52%_82%]"
        animate={reducedMotion ? undefined : reactionAnimation}
        transition={reaction === 'fallen' ? { type: 'spring', stiffness: 160, damping: 13 } : { duration: reaction === 'idle' ? 0.35 : 0.65, ease: 'easeInOut' }}
      >
        <CompanionAvatar companionId={companionId} stage={stage} className="h-full w-full" showEvolution={false}>
          {profile.eyes.map((left, index) => (
            <motion.span
              className="pointer-events-none absolute aspect-square w-[4.2%] rounded-full bg-[radial-gradient(circle_at_65%_28%,white_0_8%,#1a140d_10%_58%,#030303_60%)] shadow-[0_0_4px_rgba(255,255,255,.22)]"
              style={{ left: `${left}%`, top: `${profile.top}%`, x: gazeX, y: gazeY }}
              aria-hidden="true"
              key={index}
            />
          ))}

          <AnimatePresence>
            {reaction === 'shy' && (
              <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {profile.eyes.map((left, index) => (
                  <motion.i
                    className="absolute h-[13%] w-[10%] rounded-[50%_50%_45%_45%] border border-black/10"
                    style={{ left: `${left - 2}%`, top: `${profile.top + 15}%`, backgroundColor: profile.paw, transformOrigin: '50% 100%' }}
                    initial={{ y: 24, rotate: index ? 24 : -24 }}
                    animate={{ y: -30, rotate: index ? -12 : 12 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    key={index}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {reaction === 'dizzy' && (
              <motion.div className="pointer-events-none absolute inset-x-[25%] top-[16%] h-[22%]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {['✦', '★', '✧'].map((star, index) => <motion.span className="absolute text-xl text-amber-200" style={{ left: `${index * 38}%` }} animate={{ y: [0, -12, 0], rotate: [0, 180, 360] }} transition={{ duration: 0.7 + index * 0.15, repeat: Infinity }} key={star}>{star}</motion.span>)}
              </motion.div>
            )}
          </AnimatePresence>
        </CompanionAvatar>
      </motion.div>

      <AnimatePresence>
        {reaction !== 'idle' && <motion.div className="pointer-events-none absolute bottom-[6%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[.16em] text-cream/60 backdrop-blur" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{reaction === 'shy' ? 'Hey, my face!' : reaction === 'tantrum' ? 'Tiny protest!' : reaction === 'dizzy' ? 'Too spinny…' : 'I fell over.'}</motion.div>}
      </AnimatePresence>
    </div>
  )
}
