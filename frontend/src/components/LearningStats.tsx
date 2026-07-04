import { Flame, Sparkles, TrendingUp } from 'lucide-react'
import { useId } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'

export const xpActivityData = [
  { day: 'Mon', xp: 180 },
  { day: 'Tue', xp: 320 },
  { day: 'Wed', xp: 260 },
  { day: 'Thu', xp: 470 },
  { day: 'Fri', xp: 390 },
  { day: 'Sat', xp: 680 },
  { day: 'Sun', xp: 540 },
]

export const heroAttributesData = [
  { attribute: 'Vocabulary', value: 86, fullMark: 100 },
  { attribute: 'Grammar', value: 72, fullMark: 100 },
  { attribute: 'Reading Speed', value: 78, fullMark: 100 },
  { attribute: 'Comprehension', value: 91, fullMark: 100 },
  { attribute: 'Consistency', value: 82, fullMark: 100 },
]

function XpTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-amber-400/20 bg-gray-950/95 px-3.5 py-3 shadow-[0_12px_35px_rgba(0,0,0,.45)] backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-gray-500">{label}</p>
      <p className="mt-1 flex items-center gap-2 text-sm font-bold text-amber-300">
        <Flame size={14} aria-hidden="true" />
        {Number(payload[0].value).toLocaleString()} XP
      </p>
    </div>
  )
}

function AttributeTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null

  const attribute = String(payload[0].payload.attribute)

  return (
    <div className="rounded-xl border border-purple-400/20 bg-gray-950/95 px-3.5 py-3 shadow-[0_12px_35px_rgba(0,0,0,.45)] backdrop-blur-md">
      <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-gray-500">{attribute}</p>
      <p className="mt-1 flex items-center gap-2 text-sm font-bold text-purple-300">
        <Sparkles size={14} aria-hidden="true" />
        {payload[0].value} / 100
      </p>
    </div>
  )
}

function ChartHeader({
  eyebrow,
  title,
  value,
  accent,
}: {
  eyebrow: string
  title: string
  value: string
  accent: 'amber' | 'purple'
}) {
  const accentClass = accent === 'amber' ? 'text-amber-400' : 'text-purple-400'

  return (
    <header className="flex items-start justify-between gap-5 px-1">
      <div>
        <p className={`text-[10px] font-bold uppercase tracking-[.24em] ${accentClass}`}>{eyebrow}</p>
        <h3 className="mt-2 font-serif text-2xl text-gray-100">{title}</h3>
      </div>
      <div className="text-right">
        <strong className={`block text-xl ${accentClass}`}>{value}</strong>
        <span className="text-[10px] uppercase tracking-wider text-gray-500">Current</span>
      </div>
    </header>
  )
}

export function LearningStats() {
  const instanceId = useId().replace(/:/g, '')
  const gradientId = `xp-gradient-${instanceId}`
  const glowId = `attribute-glow-${instanceId}`
  const totalXp = xpActivityData.reduce((total, item) => total + item.xp, 0)

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[.07] bg-gray-900 p-5 text-gray-100 shadow-[0_28px_90px_rgba(0,0,0,.35)] sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute -left-24 -top-28 h-64 w-64 rounded-full bg-purple-600/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-amber-500/[.08] blur-3xl" />

      <header className="relative mb-7 flex flex-col gap-3 border-b border-white/[.06] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.28em] text-emerald-400">
            <Sparkles size={13} aria-hidden="true" /> Character analytics
          </p>
          <h2 className="mt-2 font-serif text-3xl text-gray-50">Learning Stats</h2>
          <p className="mt-2 text-sm text-gray-500">Your power grows with every page.</p>
        </div>
        <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[.07] px-3 py-1.5 text-xs font-semibold text-emerald-300">
          <TrendingUp size={14} aria-hidden="true" /> +18% this week
        </div>
      </header>

      <div className="relative grid gap-5 xl:grid-cols-[1.18fr_.82fr]">
        <article className="min-w-0 rounded-2xl border border-white/[.06] bg-black/20 p-4 sm:p-6">
          <ChartHeader eyebrow="7 day streak" title="XP Activity" value={`${totalXp.toLocaleString()} XP`} accent="amber" />

          <div className="mt-6 h-[290px] w-full" aria-label="Experience points gained during the last seven days">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={xpActivityData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="55%" stopColor="#f97316" stopOpacity={0.16} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,.035)" strokeDasharray="3 7" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#4b5563', fontSize: 10 }} width={42} />
                <Tooltip content={XpTooltip} cursor={{ stroke: 'rgba(245,158,11,.18)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="xp"
                  isAnimationActive={false}
                  stroke="#f59e0b"
                  strokeWidth={3}
                  fill={`url(#${gradientId})`}
                  activeDot={{ r: 6, fill: '#111827', stroke: '#fbbf24', strokeWidth: 3 }}
                  dot={{ r: 3, fill: '#111827', stroke: '#f59e0b', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-white/[.06] bg-black/20 p-4 sm:p-6">
          <ChartHeader eyebrow="Level 12 reader" title="Hero Attributes" value="82 PWR" accent="purple" />

          <div className="mt-3 h-[313px] w-full" aria-label="English learning attributes out of one hundred">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={heroAttributesData} outerRadius="67%" margin={{ top: 20, right: 30, bottom: 16, left: 30 }}>
                <defs>
                  <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <PolarGrid gridType="polygon" stroke="rgba(167,139,250,.16)" radialLines />
                <PolarAngleAxis
                  dataKey="attribute"
                  tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 600 }}
                  tickLine={false}
                />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip content={AttributeTooltip} />
                <Radar
                  dataKey="value"
                  isAnimationActive={false}
                  stroke="#a78bfa"
                  strokeWidth={2.5}
                  fill="#7c3aed"
                  fillOpacity={0.3}
                  filter={`url(#${glowId})`}
                  dot={{ r: 3, fill: '#c4b5fd', strokeWidth: 0 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>
    </section>
  )
}

export default LearningStats
