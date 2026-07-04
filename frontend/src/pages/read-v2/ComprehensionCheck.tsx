import { BookOpen, Check, HelpCircle, RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  visible: boolean
  onMastered: () => void
  onFuzzy: () => void
  onReview: () => void
  onDismiss: () => void
  summary: { mainIdea: string; keySentence: string; questions: string[]; trickySentence: string } | null
  bgColor: string
}

export default function ComprehensionCheck({
  visible,
  onMastered,
  onFuzzy,
  onReview,
  onDismiss,
  summary,
  bgColor,
}: Props) {
  const [showDetail, setShowDetail] = useState(false)

  useEffect(() => {
    if (visible) setShowDetail(false)
  }, [visible])

  if (!visible) return null

  const isLight = bgColor !== 'dark'
  const btnBase = `flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium transition-all`

  return (
    <div
      className={`fixed inset-x-3 bottom-20 z-40 rounded-3xl border shadow-[0_20px_70px_rgba(0,0,0,.18)] sm:inset-x-0 sm:bottom-4 sm:mx-auto sm:max-w-3xl ${
        isLight
          ? 'bg-white/95 border-gray-200 backdrop-blur'
          : 'bg-[#1a1d1f]/95 border-white/[.06] backdrop-blur'
      }`}
    >
      <div className="mx-auto max-w-2xl px-4 py-4 sm:px-5">
        {!showDetail ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-semibold ${isLight ? 'text-gray-700' : 'text-cream/70'}`}>
                Have you mastered this page?
              </p>
              <button
                className={isLight ? 'text-gray-300 hover:text-gray-500' : 'text-cream/20 hover:text-cream/40'}
                type="button"
                onClick={onDismiss}
              >
                <X size={13} />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className={`${btnBase} ${
                  isLight
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                }`}
                type="button"
                onClick={onMastered}
              >
                <Check size={13} /> Mastered
              </button>
              <button
                className={`${btnBase} ${
                  isLight
                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                }`}
                type="button"
                onClick={() => {
                  setShowDetail(true)
                  onFuzzy()
                }}
              >
                <HelpCircle size={13} /> A bit fuzzy
              </button>
              <button
                className={`${btnBase} ${
                  isLight
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    : 'bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                }`}
                type="button"
                onClick={() => {
                  setShowDetail(true)
                  onReview()
                }}
              >
                <RefreshCw size={13} /> Review again
              </button>
            </div>
          </div>
        ) : summary ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-gray-700' : 'text-cream/70'}`}>
                <BookOpen size={12} /> Page Summary
              </p>
              <button
                className={`text-[10px] ${isLight ? 'text-amber-600 hover:text-amber-800' : 'text-amber-400 hover:text-amber-300'}`}
                type="button"
                onClick={onDismiss}
              >
                Skip & continue
              </button>
            </div>
            <div className={`space-y-3 text-xs ${isLight ? 'text-gray-600' : 'text-cream/55'}`}>
              <p><span className="font-semibold">Main idea:</span> {summary.mainIdea}</p>
              <p><span className="font-semibold">Key sentence:</span> "{summary.keySentence}"</p>
              {summary.questions.map((q, i) => (
                <p key={i}><span className="font-semibold">Q{i + 1}:</span> {q}</p>
              ))}
              <p><span className="font-semibold">Watch out:</span> "{summary.trickySentence}"</p>
            </div>
          </div>
        ) : <div className={`py-4 text-center text-xs ${isLight ? 'text-gray-400' : 'text-cream/35'}`}>正在整理这一页的理解线索…</div>}
      </div>
    </div>
  )
}
