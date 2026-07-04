import { ArrowLeft, Minus, Plus } from 'lucide-react'
import type { ReaderFont, UserReadingSettings } from './types'

interface Props {
  isOpen: boolean
  settings: UserReadingSettings
  onChange: (s: UserReadingSettings) => void
  onClose: () => void
  bgColor: string
}

const BG_OPTIONS: { key: UserReadingSettings['bgColor']; label: string; sample: string }[] = [
  { key: 'white', label: 'White', sample: 'bg-white' },
  { key: 'cream', label: 'Cream', sample: 'bg-[#faf8f5]' },
  { key: 'green', label: 'Eye care', sample: 'bg-[#e8f0e3]' },
  { key: 'dark', label: 'Dark', sample: 'bg-[#1a1d1f]' },
]

const FONT_OPTIONS: { key: ReaderFont; label: string; detail: string; sample: string }[] = [
  { key: 'literary', label: 'Literary', detail: '沉浸阅读', sample: 'reader-font-literary' },
  { key: 'serif', label: 'Classic', detail: '传统衬线', sample: 'reader-font-serif' },
  { key: 'humanist', label: 'Humanist', detail: '英语学习', sample: 'reader-font-humanist' },
  { key: 'sans', label: 'Modern', detail: '简洁现代', sample: 'reader-font-sans' },
  { key: 'mono', label: 'Focus', detail: '逐词聚焦', sample: 'reader-font-mono' },
]

export default function ReadingSettingsPanel({ isOpen, settings, onChange, onClose, bgColor }: Props) {
  if (!isOpen) return null

  const isLight = bgColor !== 'dark'

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div
        className={`relative w-full max-w-xs h-full overflow-y-auto border-l shadow-2xl ${
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
          <h2 className="font-serif text-base">Reading Settings</h2>
        </div>

        <div className="p-5 space-y-7">
          {/* Background */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-3">
              Background
            </p>
            <div className="grid grid-cols-4 gap-2">
              {BG_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className={`rounded-lg p-2 text-center text-[10px] border-2 transition ${
                    settings.bgColor === opt.key
                      ? isLight ? 'border-amber-400' : 'border-amber-400'
                      : isLight ? 'border-gray-100 hover:border-gray-300' : 'border-white/[.06] hover:border-white/20'
                  } ${opt.sample}`}
                  type="button"
                  onClick={() => onChange({ ...settings, bgColor: opt.key })}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full border ${
                      opt.key === 'dark' ? 'border-white/20 bg-white/10' : 'border-gray-300 bg-white'
                    }`}
                  />
                  <span className="mt-1 block">{opt.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Font size */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-3">
              Font size · {settings.fontSize}px
            </p>
            <div className="flex items-center gap-4">
              <button
                className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
                  isLight ? 'border-gray-200 hover:bg-gray-50' : 'border-white/10 hover:bg-white/10'
                }`}
                type="button"
                onClick={() => settings.fontSize > 14 && onChange({ ...settings, fontSize: settings.fontSize - 1 })}
              >
                <Minus size={14} />
              </button>
              <input
                className="flex-1 h-1.5 appearance-none rounded-full bg-gray-200 accent-amber-500"
                type="range"
                min={14}
                max={24}
                step={1}
                value={settings.fontSize}
                onChange={(e) => onChange({ ...settings, fontSize: Number(e.target.value) })}
              />
              <button
                className={`grid h-8 w-8 place-items-center rounded-lg border transition ${
                  isLight ? 'border-gray-200 hover:bg-gray-50' : 'border-white/10 hover:bg-white/10'
                }`}
                type="button"
                onClick={() => settings.fontSize < 24 && onChange({ ...settings, fontSize: settings.fontSize + 1 })}
              >
                <Plus size={14} />
              </button>
            </div>
          </section>

          {/* Line height */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-3">
              Line height · {settings.lineHeight.toFixed(1)}
            </p>
            <input
              className="w-full h-1.5 appearance-none rounded-full bg-gray-200 accent-amber-500"
              type="range"
              min={1.4}
              max={2.4}
              step={0.1}
              value={settings.lineHeight}
              onChange={(e) => onChange({ ...settings, lineHeight: Number(e.target.value) })}
            />
          </section>

          {/* Font family */}
          <section>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-3">
              Font
            </p>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  className={`rounded-xl border-2 px-3 py-3 text-left text-xs transition ${
                    settings.fontFamily === opt.key
                      ? isLight ? 'border-amber-400' : 'border-amber-400'
                      : isLight ? 'border-gray-100 hover:border-gray-300' : 'border-white/[.06] hover:border-white/20'
                  }`}
                  type="button"
                  onClick={() => onChange({ ...settings, fontFamily: opt.key })}
                >
                  <span className={`block text-base ${opt.sample}`}>Aa · {opt.label}</span>
                  <small className={`mt-1 block text-[9px] ${isLight ? 'text-gray-400' : 'text-white/35'}`}>{opt.detail}</small>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
