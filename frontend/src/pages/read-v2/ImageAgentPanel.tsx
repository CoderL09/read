import { Image as ImageIcon, Loader2, Sparkles, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  loading: boolean
  selectedText: string
  imageUrl: string | null
  prompt: string
  keywords: string[]
  explanation: string
  onClose: () => void
  bgColor: string
}

export default function ImageAgentPanel({
  isOpen,
  loading,
  selectedText,
  imageUrl,
  prompt,
  keywords,
  explanation,
  onClose,
  bgColor,
}: Props) {
  if (!isOpen) return null

  const isLight = bgColor !== 'dark'

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <div
        className={`relative w-full max-w-2xl rounded-t-3xl border p-5 shadow-2xl sm:rounded-3xl sm:p-6 ${
          isLight
            ? 'bg-white border-gray-200 text-gray-800'
            : 'bg-[#15181a] border-white/10 text-cream'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-base flex items-center gap-2">
            <ImageIcon size={15} className="text-purple-400" /> Visual Scene
          </h2>
          <button
            className={`grid h-7 w-7 place-items-center rounded-lg transition ${
              isLight ? 'hover:bg-gray-100 text-gray-400' : 'hover:bg-white/10 text-cream/40'
            }`}
            type="button"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="animate-spin text-purple-400" size={28} />
            <p className={`mt-3 text-xs ${isLight ? 'text-gray-400' : 'text-cream/40'}`}>
              AI 正在把文字变成画面…
            </p>
          </div>
        ) : imageUrl ? (
          <div className="grid gap-5 sm:grid-cols-[1.1fr_.9fr]">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/5">
              <img src={imageUrl} alt="Generated from the selected book scene" className="h-full min-h-64 w-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.18em] text-purple-500"><Sparkles size={11} /> Scene interpretation</p>
              <blockquote className={`mt-3 border-l-2 pl-3 text-[11px] italic leading-5 ${isLight ? 'border-gray-200 text-gray-500' : 'border-white/10 text-cream/45'}`}>{selectedText}</blockquote>
              {explanation && <p className={`mt-4 text-xs leading-6 ${isLight ? 'text-gray-600' : 'text-cream/65'}`}>{explanation}</p>}
              {keywords.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">
                {keywords.map((kw) => (
                  <span
                    key={kw}
                    className={`rounded-full px-2.5 py-1 text-[10px] ${
                      isLight
                        ? 'bg-purple-50 text-purple-600'
                        : 'bg-purple-500/10 text-purple-300'
                    }`}
                  >
                    {kw}
                  </span>
                ))}
              </div>}
              {prompt && <details className={`mt-5 text-[10px] ${isLight ? 'text-gray-400' : 'text-cream/30'}`}><summary className="cursor-pointer font-semibold">查看生成提示词</summary><p className="mt-2 leading-5">{prompt}</p></details>}
            </div>
          </div>
        ) : <div className={`rounded-2xl border border-dashed p-8 text-center text-xs ${isLight ? 'border-gray-200 text-gray-400' : 'border-white/10 text-cream/35'}`}>{explanation || '画面生成暂不可用，请稍后重试。'}</div>}
      </div>
    </div>
  )
}
