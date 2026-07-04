import { AnimatePresence, motion } from 'framer-motion'
import { Headphones, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { AnnotatedSentence, AnnotationMode, GrammarRole, ReaderFont } from './types'

interface Props {
  paragraphs: { id: string; index: number; sentences: AnnotatedSentence[] }[]
  annotationMode: AnnotationMode
  fontSize: number
  lineHeight: number
  fontFamily: ReaderFont
  bgColor: string
  currentAudioSentence: number
  currentAudioPhrase: number
  onSentenceClick: (sentenceIdx: number) => void
  onSentenceSelect: (sentenceId: string, text: string, rect: DOMRect) => void
  onTextSelect: () => void
}

const roleLabels: Record<GrammarRole, string> = {
  subject: '主语', predicate: '谓语', object: '宾语', complement: '补语',
  adverbial: '状语', attribute: '定语', clause: '从句', coordination: '并列',
}

const roleClasses: Record<GrammarRole, string> = {
  subject: 'phrase-subject',
  predicate: 'phrase-predicate',
  object: 'phrase-object',
  complement: 'phrase-object',
  adverbial: 'phrase-modifier',
  attribute: 'phrase-modifier',
  clause: 'phrase-clause',
  coordination: 'phrase-coordination',
}

export default function PhraseAnnotatedText({
  paragraphs,
  annotationMode,
  fontSize,
  lineHeight,
  fontFamily,
  bgColor,
  currentAudioSentence,
  currentAudioPhrase,
  onSentenceClick,
  onSentenceSelect,
  onTextSelect,
}: Props) {
  const [activePhrase, setActivePhrase] = useState<string | null>(null)
  const isLight = bgColor !== 'dark'
  const offsets = useMemo(() => {
    let offset = 0
    return new Map(paragraphs.map((paragraph) => {
      const entry: [string, number] = [paragraph.id, offset]
      offset += paragraph.sentences.length
      return entry
    }))
  }, [paragraphs])

  return (
    <article
      className={`reader-copy reader-font-${fontFamily} mx-auto max-w-[760px] pb-36 pt-10 sm:pt-14`}
      style={{ fontSize: `${fontSize}px`, lineHeight }}
      onMouseUp={onTextSelect}
    >
      {paragraphs.map((paragraph) => (
        <p key={paragraph.id} className="reader-paragraph">
          {paragraph.sentences.map((sentence, sentenceIndex) => {
            const globalIndex = (offsets.get(paragraph.id) ?? 0) + sentenceIndex
            const audioActive = currentAudioSentence === globalIndex

            return (
              <span
                key={sentence.id}
                className={`reader-sentence group/sentence ${audioActive ? 'is-speaking' : ''}`}
                onClick={(event) => {
                  onSentenceClick(globalIndex)
                  onSentenceSelect(sentence.id, sentence.original, event.currentTarget.getBoundingClientRect())
                }}
              >
                <span className="sentence-audio-cue" aria-hidden="true"><Headphones size={11} /></span>
                {sentence.phraseGroups.map((phrase, phraseIndex) => {
                  const role = phrase.grammarRole
                  const active = activePhrase === phrase.id
                  const speaking = audioActive && currentAudioPhrase === phraseIndex
                  const className = annotationMode === 'detailed' && role
                    ? roleClasses[role]
                    : annotationMode === 'simple'
                      ? 'sense-group-simple'
                      : ''

                  return (
                    <span
                      className={`reader-phrase ${className} ${speaking ? 'is-speaking' : ''}`}
                      key={phrase.id}
                      onPointerEnter={() => role && setActivePhrase(phrase.id)}
                      onPointerLeave={() => setActivePhrase(null)}
                      onClick={(event) => {
                        if (annotationMode === 'detailed' && role) {
                          event.stopPropagation()
                          setActivePhrase(active ? null : phrase.id)
                        }
                      }}
                    >
                      {phrase.text}
                      {annotationMode === 'simple' && phraseIndex < sentence.phraseGroups.length - 1 && (
                        <i className="sense-divider" aria-hidden="true" />
                      )}
                      <AnimatePresence>
                        {annotationMode === 'detailed' && role && active && (
                          <motion.span
                            className={`phrase-tooltip ${isLight ? 'is-light' : ''}`}
                            initial={{ opacity: 0, y: 5, scale: .96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 3 }}
                          >
                            <Sparkles size={10} />
                            <b>{roleLabels[role]}</b>
                            <span>{phrase.roleHint ?? '点击 AI 解析查看完整关系'}</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  )
                })}
                {' '}
              </span>
            )
          })}
        </p>
      ))}
    </article>
  )
}
