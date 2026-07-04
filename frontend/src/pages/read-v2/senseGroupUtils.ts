import type { SentenceChunkFromAPI, AnnotatedSentence, GrammarRole, PhraseGroup, ReaderFont, ReadingPage, ReadingParagraph, UserReadingSettings } from './types'
import { DEFAULT_SETTINGS } from './types'

// ---- Page splitting ----
const WORDS_PER_PAGE = 300

function countWords(text: string): number {
  return text.trim().split(/\s+/).length
}

export function splitIntoPages(
  content: string,
  chunks: SentenceChunkFromAPI[] | null,
): ReadingPage[] {
  if (!content || content.trim().length === 0) return []

  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim().length > 0)
  const pages: ReadingPage[] = []
  let currentPage: ReadingParagraph[] = []
  let pageWordCount = 0
  let paraIndex = 0

  for (const paraText of paragraphs) {
    const wordCount = countWords(paraText)
    const sentences = splitIntoSentencesFromChunks(paraText, chunks, paraIndex)

    if (sentences.length === 0) continue

    // If adding this paragraph would exceed page limit and we already have content
    if (pageWordCount + wordCount > WORDS_PER_PAGE && currentPage.length > 0) {
      pages.push({ pageIndex: pages.length, paragraphs: currentPage })
      currentPage = []
      pageWordCount = 0
    }

    currentPage.push({ id: `p-${paraIndex}`, index: paraIndex, sentences })
    pageWordCount += wordCount
    paraIndex++
  }

  if (currentPage.length > 0) {
    pages.push({ pageIndex: pages.length, paragraphs: currentPage })
  }

  return pages.length > 0 ? pages : [{ pageIndex: 0, paragraphs: [] }]
}

function splitIntoSentencesFromChunks(
  paraText: string,
  chunks: SentenceChunkFromAPI[] | null,
  paraIndex: number,
): AnnotatedSentence[] {
  // Keep only chunks that actually belong to this paragraph. The API returns
  // chapter-level chunks, so mapping the full list into every paragraph would
  // duplicate an entire chapter several times.
  if (chunks && chunks.length > 0) {
    const normalizedParagraph = normalizeText(paraText)
    const paragraphChunks = chunks.filter((chunk) => {
      const sentence = normalizeText(chunk.originalSentence)
      return sentence.length > 0 && normalizedParagraph.includes(sentence)
    })

    if (paragraphChunks.length > 0) return paragraphChunks.map((chunk, i) => ({
      id: `s-${paraIndex}-${i}`,
      original: chunk.originalSentence,
      phraseGroups: inferGrammarRoles(chunk.chunks.map((text, ci) => ({ id: `pg-${paraIndex}-${i}-${ci}`, text }))),
    }))
  }

  // Fallback: split by sentence-ending punctuation
  const raw = paraText.replace(/([.!?]["')\]]*)\s+(?=[A-Z"'(])/g, '$1\u0001')
  const sections = raw.split('\u0001')
  return sections
    .map((s, i) => ({
      id: `s-${paraIndex}-${i}`,
      original: s.replace(/\s+/g, ' ').trim(),
      phraseGroups: [
        { id: `pg-${paraIndex}-${i}-0`, text: s.replace(/\s+/g, ' ').trim() },
      ],
    }))
    .filter((s) => s.original.length > 3)
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[“”‘’]/g, (mark) => (mark === '“' || mark === '”' ? '"' : "'"))
    .replace(/\s+/g, ' ')
    .trim()
}

const ROLE_HINTS: Record<GrammarRole, string> = {
  subject: '动作或状态的主体',
  predicate: '句子的核心动作或状态',
  object: '动作所指向的对象',
  complement: '补充说明主语或宾语',
  adverbial: '补充时间、地点、方式或原因',
  attribute: '限定或描述名词',
  clause: '承担完整句子成分的从句',
  coordination: '与前一结构并列推进',
}

export function inferGrammarRoles(groups: PhraseGroup[]): PhraseGroup[] {
  let hasPredicate = false

  return groups.map((group, index) => {
    if (group.grammarRole) return group
    const text = group.text.trim().toLowerCase()
    let grammarRole: GrammarRole

    if (/^(who|which|that|whom|whose|because|although|though|while|unless|until|since|if|when|where|after|before)\b/.test(text)) {
      grammarRole = 'clause'
    } else if (/^(and|but|or|nor|yet|so)\b/.test(text)) {
      grammarRole = 'coordination'
    } else if (/^(in|on|at|to|for|with|from|by|about|into|through|during|over|under|between|within|without|toward|across|along|around|behind|beyond|against)\b/.test(text)) {
      grammarRole = 'adverbial'
    } else if (!hasPredicate && /\b(am|is|are|was|were|be|been|being|have|has|had|do|does|did|can|could|will|would|shall|should|may|might|must|\w+(?:ed|ing))\b/.test(text)) {
      grammarRole = 'predicate'
      hasPredicate = true
    } else if (index === 0 && !hasPredicate) {
      grammarRole = 'subject'
    } else if (hasPredicate) {
      grammarRole = 'object'
    } else {
      grammarRole = 'attribute'
    }

    return { ...group, grammarRole, roleHint: ROLE_HINTS[grammarRole] }
  })
}

// ---- Simple phrase grouping (no AI) ----
export function applySimplePhraseGroups(
  sentence: AnnotatedSentence,
): AnnotatedSentence {
  if (sentence.phraseGroups.length > 1) return sentence
  const text = sentence.original
  const groups = chunkSentenceLocally(text)
  return {
    ...sentence,
    phraseGroups: inferGrammarRoles(groups.map((g, i) => ({
      id: `${sentence.id}-pg-${i}`,
      text: g,
    }))),
  }
}

function chunkSentenceLocally(sentence: string): string[] {
  let result = sentence

  result = result.replace(
    /([,;])?\s+(?=(?:who|which|that|whom|whose)\s)/gi,
    ' / ',
  )
  result = result.replace(
    /([,;])?\s+(?=(?:because|although|though|whereas|while|unless|until|since|after|before|once|whenever|if|when|where)\s)/gi,
    ' / ',
  )
  result = result.replace(
    /([,;])?\s+(?=(?:and|but|or|nor|yet|so)\s+(?:the|a|an|this|that|these|those|it|he|she|they|we|I|you|there|here)\b)/gi,
    ' / ',
  )
  result = result.replace(
    /([,;])\s+(?=(?:standing|sitting|lying|walking|running|looking|staring|gazing|waiting|thinking|knowing|feeling|hoping|wondering|trying|holding|carrying|wearing|smiling|laughing|crying|turning|moving|falling|rising|passing|leaving|arriving|seeming|appearing|remaining|becoming|growing|getting)\s)/gi,
    ' / ',
  )
  result = result.replace(
    /([,;])\s+(?=(?:in|on|at|to|for|with|from|by|about|into|through|during|after|before|over|under|between|within|without|toward|towards|upon|across|along|around|behind|beyond|against)\s+(?:the|a|an|my|your|his|her|our|their|its)\b)\s*/gi,
    ' / ',
  )
  result = result.replace(/\s*\/\s*\/\s*/g, ' / ')

  const chunks = result
    .split(/\s*\/\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  return normalizeRhythmChunks(sentence, chunks)
}

function normalizeRhythmChunks(sentence: string, input: string[]): string[] {
  const chunks = input.map((chunk) => chunk.replace(/\s+/g, ' ').trim()).filter(Boolean)
  const merged: string[] = []
  const functionWordOnly = /^(?:a|an|the|to|of|for|with|from|by|at|in|on|and|but|or|that|who|which)$/i
  const trailingConnector = /\b(?:out of|away from|up to|down to|back to|over to|through to|into|onto|with|from|for|to|of|at|by|up|down|out|off|away|back|over|through)$/i
  const leadingParticle = /^(?:up|down|out|off|away|back|over|through|into|onto)\b/i
  const leadingObject = /^(?:the|a|an|this|that|these|those|my|your|his|her|our|their|its)\b/i

  for (let index = 0; index < chunks.length; index += 1) {
    const chunk = chunks[index]
    if ((chunk.split(/\s+/).length === 1 || functionWordOnly.test(chunk)) && index < chunks.length - 1) {
      chunks[index + 1] = `${chunk} ${chunks[index + 1]}`
      continue
    }
    const previous = merged[merged.length - 1]
    if (previous && (trailingConnector.test(previous) || (leadingParticle.test(chunk) && previous.split(/\s+/).length <= 4) || (leadingObject.test(chunk) && /\b\w+(?:ing|ed)$/.test(previous)))) {
      merged[merged.length - 1] = `${previous} ${chunk}`
      continue
    }
    merged.push(chunk)
  }

  return merged.join(' ').replace(/\s+/g, ' ').trim() === sentence.replace(/\s+/g, ' ').trim()
    ? merged
    : [sentence.replace(/\s+/g, ' ').trim()]
}

// ---- Settings persistence ----
const SETTINGS_KEY = 'readquest.reader-v2.settings'

export function loadSettings(): UserReadingSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Partial<UserReadingSettings>
      const legacyFont = saved.fontFamily === 'serif' || saved.fontFamily === 'sans' ? saved.fontFamily : undefined
      return { ...DEFAULT_SETTINGS, ...saved, fontFamily: legacyFont ?? saved.fontFamily ?? DEFAULT_SETTINGS.fontFamily }
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_SETTINGS }
}

export function saveSettings(settings: UserReadingSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

// ---- Background colors ----
export const BG_COLORS: Record<string, { bg: string; text: string; muted: string }> = {
  white: { bg: 'bg-white', text: 'text-gray-900', muted: 'text-gray-500' },
  cream: { bg: 'bg-[#faf8f5]', text: 'text-[#2d2318]', muted: 'text-[#8c7b6b]' },
  green: { bg: 'bg-[#e8f0e3]', text: 'text-[#2d3a25]', muted: 'text-[#6b7b5d]' },
  dark: { bg: 'bg-[#1a1d1f]', text: 'text-[#d4d4c7]', muted: 'text-[#707070]' },
}

// ---- Font config ----
export function getFontClass(font: ReaderFont): string {
  return `reader-font-${font}`
}
