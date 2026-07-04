import { BookOpen, Image, Languages, Search, WandSparkles, X } from 'lucide-react'
import type { CSSProperties } from 'react'

interface Props {
  visible: boolean
  position: { x: number; y: number }
  selectedText: string
  onGrammar: () => void
  onTranslation: () => void
  onSkeleton: () => void
  onVocab: () => void
  onImage: () => void
  onClose: () => void
  bgColor: string
}

export default function SelectionAIActions({ visible, position, selectedText, onGrammar, onTranslation, onSkeleton, onVocab, onImage, onClose, bgColor }: Props) {
  if (!visible || selectedText.length < 3) return null
  const isLight = bgColor !== 'dark'
  const isScene = /landscape|forest|mountain|castle|garden|street|sky|river|ocean|beach|sunlight|shadow|morning|night|storm|mist|fog|rain|snow|field|desert|island|valley|cliff|cave|temple|bridge|window|door|hall|room|palace|village|city|tower|wall|gate|path|road|tree|flower|grass|wind|cloud|moon|star|dawn|dusk|twilight|stood|walked|ran|looked|wore|smiled/i.test(selectedText)
  const left = Math.max(12, Math.min(position.x, window.innerWidth - 520))
  const top = Math.max(76, Math.min(position.y, window.innerHeight - 150))
  const buttonClass = `flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-semibold transition ${isLight ? 'hover:bg-black/[.045]' : 'hover:bg-white/[.07]'}`

  return (
    <aside className={`selection-ai-bar fixed inset-x-3 bottom-20 z-50 rounded-2xl border p-1.5 shadow-[0_18px_60px_rgba(0,0,0,.25)] backdrop-blur-2xl sm:inset-x-auto sm:bottom-auto ${isLight ? 'border-black/[.08] bg-white/94 text-[#3b342d]' : 'border-white/10 bg-[#14191a]/94 text-cream'}`} style={{ '--selection-left': `${left}px`, '--selection-top': `${top}px` } as CSSProperties}>
      <div className={`mb-1 flex items-center justify-between gap-3 rounded-xl px-3 py-1.5 text-[9px] sm:hidden ${isLight ? 'bg-black/[.025]' : 'bg-white/[.035]'}`}><span className="truncate opacity-45">“{selectedText}”</span><button className="shrink-0 opacity-35" onClick={onClose}><X size={12} /></button></div>
      <div className="flex items-center gap-0.5 overflow-x-auto">
        <button className={buttonClass} type="button" onClick={onGrammar}><WandSparkles size={13} /> 解析语法</button>
        <button className={buttonClass} type="button" onClick={onTranslation}><Languages size={13} /> 翻译</button>
        <button className={buttonClass} type="button" onClick={onSkeleton}><BookOpen size={13} /> 主干</button>
        <button className={buttonClass} type="button" onClick={onVocab}><Search size={13} /> 难词</button>
        {isScene && <button className={`${buttonClass} text-purple-500`} type="button" onClick={onImage}><Image size={13} /> 生成画面</button>}
        <button className="hidden h-8 w-8 shrink-0 place-items-center rounded-full opacity-30 transition hover:opacity-70 sm:grid" type="button" onClick={onClose}><X size={12} /></button>
      </div>
    </aside>
  )
}
