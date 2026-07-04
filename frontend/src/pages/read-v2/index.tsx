import { ArrowLeft, ArrowRight, BookOpen, Clock3, Loader2, Sparkles } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, mediaUrl } from '../../lib/api'

import AudioReaderControls from './AudioReaderControls'
import ComprehensionCheck from './ComprehensionCheck'
import GrammarAgentPanel from './GrammarAgentPanel'
import ImageAgentPanel from './ImageAgentPanel'
import PhraseAnnotatedText from './PhraseAnnotatedText'
import ReadingSettingsPanel from './ReadingSettingsPanel'
import ReadingToolbar from './ReadingToolbar'
import ReadingCompanionDock from './ReadingCompanionDock'
import SelectionAIActions from './SelectionAIActions'
import {
  applySimplePhraseGroups,
  BG_COLORS,
  getFontClass,
  loadSettings,
  saveSettings,
  splitIntoPages,
} from './senseGroupUtils'
import type {
  AIAgentState,
  AnnotationMode,
  ComprehensionStatus,
  GrammarAnalysis,
  ImageGenerationState,
  PhraseGroup,
  ReadingPage,
  ComprehensionSummary,
  UserReadingSettings,
} from './types'
import { useAudioReader } from './useAudioReader'
import { useReadingData, useSenseChunks } from './useReadingData'

export default function ReadingDetailPage() {
  const { stageId } = useParams<{ stageId: string }>()
  const { book, currentChapter, loading, error } = useReadingData(stageId)
  const { chunks } = useSenseChunks(stageId)

  // Settings
  const [settings, setSettings] = useState<UserReadingSettings>(loadSettings)
  const [showSettings, setShowSettings] = useState(false)

  // Page navigation
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  // Annotation
  const [annotationMode, setAnnotationMode] = useState<AnnotationMode>(settings.annotationMode)

  // AI Agent
  const [agent, setAgent] = useState<AIAgentState>({
    isOpen: false,
    loading: false,
    selectedText: '',
    sentenceId: null,
    type: null,
    result: null,
  })

  // Image agent
  const [imageGen, setImageGen] = useState<ImageGenerationState>({
    isOpen: false,
    loading: false,
    prompt: '',
    selectedText: '',
    imageUrl: '',
    keywords: [],
    explanation: '',
  })

  // Selection toolbar
  const [selection, setSelection] = useState<{
    visible: boolean
    position: { x: number; y: number }
    text: string
    sentenceId: string | null
  }>({ visible: false, position: { x: 0, y: 0 }, text: '', sentenceId: null })

  // Comprehension
  const [comprehension, setComprehension] = useState<{
    visible: boolean
    summary: ComprehensionSummary | null
  }>({ visible: false, summary: null })
  const [comprehensionLog, setComprehensionLog] = useState<ComprehensionStatus[]>([])

  // Audio
  const audio = useAudioReader(settings.ttsSpeed)

  // Refs
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Build pages from content
  const pages: ReadingPage[] = useMemo(
    () => (currentChapter ? splitIntoPages(currentChapter.content, chunks) : []),
    [currentChapter, chunks],
  )

  const currentPage = pages[currentPageIndex] ?? { pageIndex: 0, paragraphs: [] }

  // Apply simple phrase groups to sentences when in simple mode
  const processedParagraphs = useMemo(() => {
    if (annotationMode === 'off') return currentPage.paragraphs
    return currentPage.paragraphs.map((p) => ({
      ...p,
      sentences: p.sentences.map((s) => {
        if (s.phraseGroups.length <= 1) {
          return applySimplePhraseGroups(s)
        }
        return s
      }),
    }))
  }, [currentPage, annotationMode])

  // All sentences for audio navigation
  const allSentences = useMemo(
    () => processedParagraphs.flatMap((p) => p.sentences),
    [processedParagraphs],
  )

  const pageWordCount = useMemo(() => allSentences.reduce((count, sentence) => count + sentence.original.trim().split(/\s+/).length, 0), [allSentences])
  const pageSummary = useMemo(() => buildPageSummary(allSentences), [allSentences])

  // Persist settings
  const updateSettings = useCallback((s: UserReadingSettings) => {
    setSettings(s)
    setAnnotationMode(s.annotationMode)
    saveSettings(s)
  }, [])

  // Navigation
  const goToNextPage = useCallback(() => {
    if (comprehension.visible) return
    setComprehension({ visible: false, summary: null })
    audio.stop()
    if (currentPageIndex < pages.length - 1) {
      const entry = comprehensionLog.find((item) => item.pageIndex === currentPageIndex)
      if (!entry) {
        setComprehension({ visible: true, summary: null })
      } else {
        setCurrentPageIndex(currentPageIndex + 1)
      }
    }
  }, [currentPageIndex, pages.length, comprehension.visible, comprehensionLog, audio])

  const goToPrevPage = useCallback(() => {
    setComprehension({ visible: false, summary: null })
    audio.stop()
    if (currentPageIndex > 0) setCurrentPageIndex(currentPageIndex - 1)
  }, [currentPageIndex, audio])

  // Comprehension handling
  const handleMastered = useCallback(() => {
    setComprehensionLog((prev) => [...prev, { pageIndex: currentPageIndex, status: 'mastered' }])
    setComprehension({ visible: false, summary: null })
    if (currentPageIndex < pages.length - 1) setCurrentPageIndex(currentPageIndex + 1)
  }, [currentPageIndex, pages.length])

  const handleFuzzy = useCallback(() => {
    setComprehensionLog((prev) => [...prev, { pageIndex: currentPageIndex, status: 'fuzzy' }])
    setComprehension({ visible: true, summary: pageSummary })
  }, [currentPageIndex, pageSummary])

  const handleReview = useCallback(() => {
    setComprehensionLog((prev) => [...prev, { pageIndex: currentPageIndex, status: 'review' }])
    setComprehension({ visible: true, summary: pageSummary })
  }, [currentPageIndex, pageSummary])

  const handleDismissComprehension = useCallback(() => {
    setComprehension({ visible: false, summary: null })
    if (currentPageIndex < pages.length - 1) setCurrentPageIndex(currentPageIndex + 1)
  }, [currentPageIndex, pages.length])

  // Audio
  const handlePlayPage = useCallback(() => {
    audio.playPage(allSentences, annotationMode)
  }, [audio, allSentences, annotationMode])

  const handleSentenceClick = useCallback(
    (sentenceIdx: number) => {
      if (audio.state.isPlaying && !audio.state.isPaused) return
      audio.playSentence(allSentences, sentenceIdx, annotationMode)
    },
    [audio, allSentences, annotationMode],
  )

  // AI calls
  const callAI = useCallback(
    async (type: AIAgentState['type'] | 'scene', text: string, existingGroups: PhraseGroup[] = []): Promise<GrammarAnalysis> => {
      const bookId = localStorage.getItem('readquest.bookId') ?? ''
      try {
        const { data } = await api.post<{ content: string }>(`/books/${bookId}/reader-agent`, {
          text,
          action: type,
          existingGroups: existingGroups.map(({ text: groupText, grammarRole }) => ({ text: groupText, grammarRole })),
        })

        const jsonMatch = data.content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as GrammarAnalysis
          return { ...parsed, original: parsed.original || text, phraseGroups: parsed.phraseGroups ?? [], difficultWords: parsed.difficultWords ?? [] }
        }

        return {
          original: text,
          translation: type === 'translation' ? data.content : '',
          skeleton: '',
          phraseGroups: [],
          grammarNotes: '',
          difficultWords: [],
          learningTip: '',
        }
      } catch {
        return {
          original: text,
          translation: '',
          skeleton: '',
          phraseGroups: [],
          grammarNotes: 'AI analysis unavailable. Try again.',
          difficultWords: [],
          learningTip: '',
        }
      }
    },
    [],
  )

  const handleAgentAction = useCallback(
    async (type: AIAgentState['type']) => {
      const text = selection.text
      const sentence = allSentences.find((item) => item.id === selection.sentenceId)
      setSelection({ visible: false, position: { x: 0, y: 0 }, text: '', sentenceId: null })
      setAgent({ isOpen: true, loading: true, selectedText: text, sentenceId: selection.sentenceId, type, result: null })

      const result = await callAI(type, text, sentence?.phraseGroups)
      setAgent((prev) => ({ ...prev, loading: false, result }))
    },
    [selection.text, selection.sentenceId, callAI, allSentences],
  )

  const handleImageGen = useCallback(async () => {
    const text = selection.text
    setSelection({ visible: false, position: { x: 0, y: 0 }, text: '', sentenceId: null })
    setImageGen((prev) => ({ ...prev, isOpen: true, loading: true, selectedText: text }))

    try {
      const bookId = localStorage.getItem('readquest.bookId') ?? ''
      const scene = await callAI('scene', text)
      const prompt = scene.grammarNotes
      if (!prompt || prompt.includes('unavailable')) throw new Error('Scene prompt unavailable')
      const keywords = scene.difficultWords.map((item) => item.word)
      setImageGen((prev) => ({
        ...prev,
        prompt,
        keywords,
        explanation: scene.translation,
        imageUrl: '',
      }))
      const { data } = await api.post<{ imageUrl: string }>(`/books/${bookId}/scene-image`, { prompt })
      setImageGen((prev) => ({ ...prev, loading: false, imageUrl: data.imageUrl }))
    } catch {
      setImageGen((prev) => ({ ...prev, loading: false, explanation: 'Image generation unavailable.' }))
    }
  }, [selection.text, callAI])

  // Text selection handler
  const handleTextSelect = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      // Small delay so click on a button can register
      timeoutRef.current = setTimeout(() => {
        setSelection((prev) => (prev.visible ? { ...prev, visible: false } : prev))
      }, 200)
      return
    }

    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const text = sel.toString().trim()

    if (text.length < 3) return

    setSelection({
      visible: true,
      position: {
        x: rect.left + rect.width / 2 - 170,
        y: rect.top - 60,
      },
      text,
      sentenceId: null,
    })
  }, [])

  // Close callbacks
  const closeAgent = useCallback(() => setAgent((p) => ({ ...p, isOpen: false })), [])
  const closeImageGen = useCallback(() => setImageGen((p) => ({ ...p, isOpen: false })), [])
  const closeSelection = useCallback(() => {
    setSelection({ visible: false, position: { x: 0, y: 0 }, text: '', sentenceId: null })
  }, [])

  const handleSentenceSelect = useCallback((sentenceId: string, text: string, rect: DOMRect) => {
    if (window.getSelection()?.toString().trim()) return
    setSelection({
      visible: true,
      position: { x: rect.left + rect.width / 2 - 240, y: rect.bottom + 10 },
      text,
      sentenceId,
    })
  }, [])

  // Stop audio on page change
  useEffect(() => {
    audio.stop()
  }, [currentPageIndex])

  // Sync annotation mode to settings
  useEffect(() => {
    updateSettings({ ...settings, annotationMode })
  }, [annotationMode])

  // Sync TTS speed
  useEffect(() => {
    updateSettings({ ...settings, ttsSpeed: settings.ttsSpeed })
  }, [])

  const colors = BG_COLORS[settings.bgColor]
  const fontClass = getFontClass(settings.fontFamily)
  const isLight = settings.bgColor !== 'dark'

  if (loading) {
    return (
      <main className={`grid min-h-screen place-items-center ${colors.bg}`}>
        <div className="text-center">
          <Loader2 className="mx-auto animate-spin text-amber-400" size={32} />
          <p className={`mt-4 text-xs ${colors.muted}`}>Opening your chapter...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className={`grid min-h-screen place-items-center ${colors.bg} px-6`}>
        <div className="text-center max-w-sm">
          <p className={`font-serif text-xl ${isLight ? 'text-red-500' : 'text-red-300'}`}>{error}</p>
        </div>
      </main>
    )
  }

  if (!currentChapter) {
    return (
      <main className={`grid min-h-screen place-items-center ${colors.bg} px-6`}>
        <div className="text-center">
          <p className={colors.muted}>Content not available</p>
        </div>
      </main>
    )
  }

  const chapterTitle = currentChapter.stageTitle || `Chapter ${currentChapter.chapterIndex}`

  return (
    <main className={`min-h-screen ${colors.bg} ${fontClass} ${colors.text}`}>
      <ReadingToolbar
        title={book?.title ?? ''}
        chapterTitle={chapterTitle}
        annotationMode={annotationMode}
        onAnnotationModeChange={setAnnotationMode}
        isPlaying={audio.state.isPlaying && !audio.state.isPaused}
        onSettingsClick={() => setShowSettings(true)}
        bgColor={settings.bgColor}
        page={currentPageIndex}
        totalPages={pages.length}
      />

      <div className="reader-page-shell relative px-3 py-5 sm:px-6 sm:py-9">
        <aside className={`fixed left-5 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border p-1.5 backdrop-blur-xl 2xl:block ${isLight ? 'border-black/[.06] bg-white/60' : 'border-white/[.07] bg-white/[.025]'}`} aria-label="Chapter page progress">
          {pages.map((pageItem, index) => <button key={pageItem.pageIndex} className={`my-1 block h-2.5 w-2.5 rounded-full transition ${index === currentPageIndex ? 'scale-125 bg-amber-400' : index < currentPageIndex ? 'bg-emerald-400/60' : isLight ? 'bg-black/10 hover:bg-black/20' : 'bg-white/10 hover:bg-white/20'}`} type="button" onClick={() => { audio.stop(); setCurrentPageIndex(index) }} aria-label={`Go to page ${index + 1}`} />)}
        </aside>

        <section className={`reader-document mx-auto max-w-[980px] overflow-visible rounded-[1.5rem] border px-5 shadow-[0_30px_100px_rgba(48,36,20,.08)] sm:rounded-[2rem] sm:px-12 lg:px-20 ${isLight ? 'border-black/[.055] bg-white/48' : 'border-white/[.065] bg-black/10'}`}>
          <header className={`mx-auto max-w-[760px] border-b pb-7 pt-9 sm:pb-9 sm:pt-12 ${isLight ? 'border-black/[.07]' : 'border-white/[.07]'}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.22em] text-emerald-500"><BookOpen size={12} /> Chapter {currentChapter.chapterIndex}</p>
              <div className={`flex items-center gap-3 text-[9px] ${colors.muted}`}><span className="flex items-center gap-1"><Clock3 size={11} /> ~{Math.max(1, Math.ceil(pageWordCount / 180))} min</span><span>{pageWordCount} words</span></div>
            </div>
            <h2 className="mt-4 text-balance font-serif text-[clamp(2rem,5vw,3.4rem)] leading-[1.05] tracking-[-.035em]">{chapterTitle}</h2>
            <p className={`mt-4 flex items-center gap-2 text-[10px] ${colors.muted}`}><Sparkles size={11} className="text-amber-500" /> Click a sentence to listen and ask AI · Select a scene to visualize it</p>
          </header>

          <PhraseAnnotatedText
            paragraphs={processedParagraphs}
            annotationMode={annotationMode}
            fontSize={settings.fontSize}
            lineHeight={settings.lineHeight}
            fontFamily={settings.fontFamily}
            bgColor={settings.bgColor}
            currentAudioSentence={audio.state.currentSentenceIndex}
            currentAudioPhrase={audio.state.currentPhraseIndex}
            onSentenceClick={handleSentenceClick}
            onSentenceSelect={handleSentenceSelect}
            onTextSelect={handleTextSelect}
          />

          <nav className={`mx-auto flex max-w-[760px] items-center justify-between gap-3 border-t pb-28 pt-7 sm:pb-24 ${isLight ? 'border-black/[.07]' : 'border-white/[.07]'}`} aria-label="Page navigation">
            <button className={`group flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-[10px] font-semibold transition sm:px-5 sm:text-xs ${currentPageIndex > 0 ? 'border-current/10 opacity-60 hover:-translate-x-1 hover:opacity-100' : 'cursor-not-allowed border-current/5 opacity-20'}`} type="button" disabled={currentPageIndex === 0} onClick={goToPrevPage}><ArrowLeft size={14} /> <span className="hidden sm:inline">Previous page</span><span className="sm:hidden">Prev</span></button>
            <span className={`text-[10px] ${colors.muted}`}>{currentPageIndex + 1} of {pages.length}</span>
            <button className={`group flex items-center gap-2 rounded-full px-3.5 py-2.5 text-[10px] font-semibold transition sm:px-5 sm:text-xs ${currentPageIndex < pages.length - 1 ? isLight ? 'bg-[#17201d] text-white hover:translate-x-1' : 'bg-cream text-[#111716] hover:translate-x-1' : 'cursor-not-allowed border border-current/5 opacity-20'}`} type="button" disabled={currentPageIndex >= pages.length - 1} onClick={goToNextPage}><span className="hidden sm:inline">Next page</span><span className="sm:hidden">Next</span><ArrowRight size={14} /></button>
          </nav>
        </section>
      </div>

      {/* Audio controls */}
      {allSentences.length > 0 && (
        <AudioReaderControls
          isPlaying={audio.state.isPlaying}
          isPaused={audio.state.isPaused}
          speed={settings.ttsSpeed}
          onPlay={handlePlayPage}
          onPause={audio.pause}
          onResume={audio.resume}
          onStop={audio.stop}
          onSpeedChange={(s) => updateSettings({ ...settings, ttsSpeed: s })}
          bgColor={settings.bgColor}
        />
      )}

      {/* Selection toolbar */}
      <SelectionAIActions
        visible={selection.visible}
        position={selection.position}
        selectedText={selection.text}
        onGrammar={() => handleAgentAction('grammar')}
        onTranslation={() => handleAgentAction('translation')}
        onSkeleton={() => handleAgentAction('skeleton')}
        onVocab={() => handleAgentAction('vocab')}
        onImage={handleImageGen}
        onClose={closeSelection}
        bgColor={settings.bgColor}
      />

      {/* Grammar agent panel */}
      <GrammarAgentPanel
        isOpen={agent.isOpen}
        loading={agent.loading}
        analysis={agent.result}
        onClose={closeAgent}
        bgColor={settings.bgColor}
      />

      {/* Image agent panel */}
      <ImageAgentPanel
        isOpen={imageGen.isOpen}
        loading={imageGen.loading}
        selectedText={imageGen.selectedText}
        imageUrl={imageGen.imageUrl ? mediaUrl(imageGen.imageUrl) : ''}
        prompt={imageGen.prompt}
        keywords={imageGen.keywords}
        explanation={imageGen.explanation}
        onClose={closeImageGen}
        bgColor={settings.bgColor}
      />

      {/* Comprehension check */}
      <ComprehensionCheck
        visible={comprehension.visible}
        onMastered={handleMastered}
        onFuzzy={handleFuzzy}
        onReview={handleReview}
        onDismiss={handleDismissComprehension}
        summary={comprehension.summary}
        bgColor={settings.bgColor}
      />

      {/* Settings panel */}
      <ReadingSettingsPanel
        isOpen={showSettings}
        settings={settings}
        onChange={updateSettings}
        onClose={() => setShowSettings(false)}
        bgColor={settings.bgColor}
      />

      <ReadingCompanionDock
        page={currentPageIndex}
        totalPages={pages.length}
        isPlaying={audio.state.isPlaying && !audio.state.isPaused}
        bgColor={settings.bgColor}
        onPlay={handlePlayPage}
        onSettings={() => setShowSettings(true)}
      />
    </main>
  )
}

function buildPageSummary(sentences: Array<{ original: string }>): ComprehensionSummary {
  const texts = sentences.map((sentence) => sentence.original.trim()).filter(Boolean)
  const keySentence = [...texts].sort((a, b) => b.length - a.length)[0] ?? ''
  const first = texts[0] ?? ''
  const second = texts[1] ?? ''
  return {
    mainIdea: first || '回顾这一页的人物、动作与情境变化。',
    keySentence,
    questions: [
      `What is the main action or change described${first ? ' at the beginning of this page' : ''}?`,
      second ? `How does “${second.slice(0, 54)}${second.length > 54 ? '…' : ''}” develop the scene?` : 'Which detail best supports the main idea?',
    ],
    trickySentence: keySentence || first,
  }
}
