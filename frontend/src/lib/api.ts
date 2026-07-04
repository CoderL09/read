import axios from 'axios'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:4000/api'

export const api = axios.create({ baseURL: apiBaseUrl })

export function mediaUrl(url: string) {
  if (!url || !url.startsWith('/')) return url
  return `${apiBaseUrl.replace(/\/api\/?$/, '')}${url}`
}

export type Book = {
  id: string
  title: string
  author: string
  coverUrl: string
  status: 'uploaded' | 'processing' | 'completed' | 'failed'
  progress: number
  wordCount: number
  totalChapters: number
  readingMode?: 'quest' | 'continuous'
}
