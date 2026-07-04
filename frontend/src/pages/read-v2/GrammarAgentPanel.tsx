import { ArrowLeft, BookOpen, Languages, Loader2, Sparkles } from 'lucide-react'
import type { GrammarAnalysis } from './types'

interface Props {
  isOpen: boolean
  loading: boolean
  analysis: GrammarAnalysis | null
  onClose: () => void
  bgColor: string
}

export default function GrammarAgentPanel({ isOpen, loading, analysis, onClose, bgColor }: Props) {
  if (!isOpen) return null

  const isLight = bgColor !== 'dark'

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={`relative w-full max-w-md h-full overflow-y-auto border-l shadow-2xl ${
          isLight
            ? 'bg-white border-gray-200 text-gray-800'
            : 'bg-[#15181a] border-white/10 text-cream'
        }`}
      >
        <div className={`sticky top-0 z-10 flex items-center gap-3 border-b px-4 py-3 backdrop-blur ${
          isLight ? 'bg-white/95 border-gray-100' : 'bg-[#15181a]/95 border-white/[.05]'
        }`}>
          <button
            className={`grid h-8 w-8 place-items-center rounded-lg transition ${
              isLight ? 'hover:bg-gray-100 text-gray-500' : 'hover:bg-white/10 text-cream/50'
            }`}
            type="button"
            onClick={onClose}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="font-serif text-base">Grammar Analysis</h2>
        </div>

        <div className="p-5">
          {loading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="animate-spin text-amber-400" size={28} />
              <p className={`mt-3 text-xs ${isLight ? 'text-gray-400' : 'text-cream/40'}`}>
                AI is analyzing...
              </p>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Original */}
              <section>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-2">Original</p>
                <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-cream/80'}`}>
                  {analysis.original}
                </p>
              </section>

              {/* Translation */}
              <section>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  <Languages size={11} className="inline mr-1" />
                  Translation
                </p>
                <p className={`text-sm leading-relaxed ${isLight ? 'text-gray-700' : 'text-cream/85'}`}>
                  {analysis.translation}
                </p>
              </section>

              {/* Skeleton */}
              <section>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-2">
                  <BookOpen size={11} className="inline mr-1" />
                  Sentence Skeleton
                </p>
                <p className={`text-sm font-semibold ${isLight ? 'text-gray-800' : 'text-cream'}`}>
                  {analysis.skeleton}
                </p>
              </section>

              {/* Phrase Groups */}
              {analysis.phraseGroups.length > 0 && (
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-2">
                    <Sparkles size={11} className="inline mr-1" />
                    Sense Groups
                  </p>
                  <div className="space-y-2">
                    {analysis.phraseGroups
                      .filter((pg) => pg.grammarRole)
                      .map((pg, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-2 text-xs ${
                            isLight ? 'text-gray-600' : 'text-cream/60'
                          }`}
                        >
                          <span className="mt-0.5 shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-500 uppercase">
                            {pg.grammarRole}
                          </span>
                          <span className="leading-relaxed">{pg.text}</span>
                        </div>
                      ))}
                  </div>
                </section>
              )}

              {/* Grammar Notes */}
              <section>
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-2">Grammar Notes</p>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-gray-600' : 'text-cream/55'}`}>
                  {analysis.grammarNotes}
                </p>
              </section>

              {/* Difficult Words */}
              {analysis.difficultWords.length > 0 && (
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400 mb-2">Key Words</p>
                  <div className="space-y-1.5">
                    {analysis.difficultWords.map((dw, i) => (
                      <div key={i} className="flex items-baseline gap-2 text-xs">
                        <span className={`font-semibold ${isLight ? 'text-gray-800' : 'text-cream'}`}>
                          {dw.word}
                        </span>
                        <span className={isLight ? 'text-gray-500' : 'text-cream/45'}>
                          {dw.meaning}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Learning Tip */}
              <section className={`rounded-xl p-4 ${isLight ? 'bg-amber-50' : 'bg-amber-500/5'}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">
                  Learning Tip
                </p>
                <p className={`text-xs leading-relaxed ${isLight ? 'text-gray-600' : 'text-cream/60'}`}>
                  {analysis.learningTip}
                </p>
              </section>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
