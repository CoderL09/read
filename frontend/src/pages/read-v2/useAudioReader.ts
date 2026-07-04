import { useCallback, useRef, useState } from 'react'
import type { AudioReaderState, AnnotatedSentence } from './types'

export function useAudioReader(speed: number) {
  const [state, setState] = useState<AudioReaderState>({
    isPlaying: false,
    isPaused: false,
    currentSentenceIndex: -1,
    currentPhraseIndex: -1,
    speed,
  })

  const synthRef = useRef(window.speechSynthesis)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const queueRef = useRef<Array<{ text: string; sentenceIdx: number; phraseIdx?: number }>>([])
  const pausedRef = useRef(false)
  const activeRef = useRef(false)

  const speakText = useCallback(
    (text: string, sentenceIdx: number, phraseIdx?: number) => {
      const synth = synthRef.current
      synth.cancel() // stop previous
      activeRef.current = true
      pausedRef.current = false

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = speed
      utterance.lang = 'en-US'
      utteranceRef.current = utterance

      utterance.onstart = () => {
        setState((s) => ({
          ...s,
          isPlaying: true,
          isPaused: false,
          currentSentenceIndex: sentenceIdx,
          currentPhraseIndex: phraseIdx ?? -1,
        }))
      }

      utterance.onend = () => {
        activeRef.current = false
        setState((s) => ({
          ...s,
          isPlaying: false,
          isPaused: false,
          currentSentenceIndex: -1,
          currentPhraseIndex: -1,
        }))
      }

      utterance.onerror = () => {
        activeRef.current = false
        setState((s) => ({
          ...s,
          isPlaying: false,
          isPaused: false,
          currentSentenceIndex: -1,
          currentPhraseIndex: -1,
        }))
      }

      synth.speak(utterance)
    },
    [speed],
  )

  const queueSpeak = useCallback(
    (
      items: Array<{ text: string; sentenceIdx: number; phraseIdx?: number }>,
      startIndex: number,
    ) => {
      const synth = synthRef.current
      synth.cancel()
      activeRef.current = true
      pausedRef.current = false

      queueRef.current = items.slice(startIndex)

      const speakNext = () => {
        if (pausedRef.current || !activeRef.current) return
        if (queueRef.current.length === 0) {
          activeRef.current = false
          setState((s) => ({
            ...s,
            isPlaying: false,
            isPaused: false,
            currentSentenceIndex: -1,
            currentPhraseIndex: -1,
          }))
          return
        }

        const item = queueRef.current.shift()!
        const utterance = new SpeechSynthesisUtterance(item.text)
        utterance.rate = speed
        utterance.lang = 'en-US'

        utterance.onstart = () => {
          setState((s) => ({
            ...s,
            isPlaying: true,
            isPaused: false,
            currentSentenceIndex: item.sentenceIdx,
            currentPhraseIndex: item.phraseIdx ?? -1,
          }))
        }

        utterance.onend = () => {
          setTimeout(speakNext, 50)
        }

        utterance.onerror = () => {
          setTimeout(speakNext, 50)
        }

        synth.speak(utterance)
      }

      speakNext()
    },
    [speed],
  )

  const playPage = useCallback(
    (sentences: AnnotatedSentence[], annotationMode: string, startFrom: number = 0) => {
      const items = sentences.flatMap((s, si) => {
        if (si < startFrom) return []
        if (annotationMode === 'detailed' && s.phraseGroups.length > 1) {
          return s.phraseGroups.map((pg, pi) => ({
            text: pg.text,
            sentenceIdx: si,
            phraseIdx: pi,
          }))
        }
        return [{ text: s.original, sentenceIdx: si }]
      })
      queueSpeak(items, 0)
    },
    [queueSpeak],
  )

  const playSentence = useCallback(
    (sentences: AnnotatedSentence[], sentenceIdx: number, annotationMode: string) => {
      const s = sentences[sentenceIdx]
      if (!s) return
      if (annotationMode === 'detailed' && s.phraseGroups.length > 1) {
        const items = s.phraseGroups.map((pg, pi) => ({
          text: pg.text,
          sentenceIdx,
          phraseIdx: pi,
        }))
        queueSpeak(items, 0)
      } else {
        speakText(s.original, sentenceIdx)
      }
    },
    [speakText, queueSpeak],
  )

  const pause = useCallback(() => {
    pausedRef.current = true
    synthRef.current.pause()
    setState((s) => ({ ...s, isPaused: true, isPlaying: false }))
  }, [])

  const resume = useCallback(() => {
    pausedRef.current = false
    synthRef.current.resume()
    setState((s) => ({ ...s, isPaused: false, isPlaying: true }))
  }, [])

  const stop = useCallback(() => {
    activeRef.current = false
    pausedRef.current = false
    synthRef.current.cancel()
    queueRef.current = []
    setState((s) => ({
      ...s,
      isPlaying: false,
      isPaused: false,
      currentSentenceIndex: -1,
      currentPhraseIndex: -1,
    }))
  }, [])

  return { state, playPage, playSentence, pause, resume, stop }
}
