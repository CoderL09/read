export type GrammarRole =
  | 'subject'
  | 'predicate'
  | 'object'
  | 'complement'
  | 'adverbial'
  | 'attribute'
  | 'clause'
  | 'coordination'

export interface PhraseGroup {
  id: string
  text: string
  grammarRole?: GrammarRole
  roleHint?: string
}

export interface AnnotatedSentence {
  id: string
  original: string
  phraseGroups: PhraseGroup[]
  translation?: string
  skeleton?: string
  grammarNotes?: string
  difficultWords?: { word: string; meaning: string }[]
}

export interface ReadingParagraph {
  id: string
  index: number
  sentences: AnnotatedSentence[]
}

export interface ReadingPage {
  pageIndex: number
  paragraphs: ReadingParagraph[]
}

export type AnnotationMode = 'off' | 'simple' | 'detailed'
export type ReaderFont = 'literary' | 'serif' | 'humanist' | 'sans' | 'mono'

export interface UserReadingSettings {
  annotationMode: AnnotationMode
  bgColor: 'white' | 'cream' | 'green' | 'dark'
  fontSize: number
  lineHeight: number
  fontFamily: ReaderFont
  ttsSpeed: number
}

export const DEFAULT_SETTINGS: UserReadingSettings = {
  annotationMode: 'simple',
  bgColor: 'cream',
  fontSize: 18,
  lineHeight: 2.0,
  fontFamily: 'literary',
  ttsSpeed: 1.0,
}

export interface ComprehensionStatus {
  pageIndex: number
  status: 'mastered' | 'fuzzy' | 'review'
}

export interface AudioReaderState {
  isPlaying: boolean
  isPaused: boolean
  currentSentenceIndex: number
  currentPhraseIndex: number
  speed: number
}

export interface AIAgentState {
  isOpen: boolean
  loading: boolean
  selectedText: string
  sentenceId: string | null
  type: 'grammar' | 'translation' | 'skeleton' | 'vocab' | null
  result: GrammarAnalysis | null
}

export interface GrammarAnalysis {
  original: string
  translation: string
  skeleton: string
  phraseGroups: PhraseGroup[]
  grammarNotes: string
  difficultWords: { word: string; meaning: string }[]
  learningTip: string
}

export interface ImageGenerationState {
  isOpen: boolean
  loading: boolean
  prompt: string
  selectedText: string
  imageUrl: string
  keywords: string[]
  explanation: string
}

export interface ComprehensionSummary {
  mainIdea: string
  keySentence: string
  questions: string[]
  trickySentence: string
}

export interface SentenceChunkFromAPI {
  originalSentence: string
  chunks: string[]
}

export interface ChapterFromAPI {
  id: string
  chapterIndex: number
  content: string
  stageTitle?: string
  stageSummary?: string
}
