import { lazy, Suspense } from 'react'
import AppShell from './components/AppShell'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Library = lazy(() => import('./pages/Library'))
const Path = lazy(() => import('./pages/Path'))
const Progress = lazy(() => import('./pages/Progress'))
const Upload = lazy(() => import('./pages/Upload'))
const Reader = lazy(() => import('./pages/Reader'))
const ReadingDetailPage = lazy(() => import('./pages/read-v2'))

function RouteFallback() {
  return (
    <div className="grid min-h-[calc(100vh-72px)] place-items-center bg-[#070b0d]">
      <div className="text-center">
        <img className="mx-auto h-14 w-14 animate-pulse rounded-2xl" src="/assets/readquest-crest.webp" alt="" />
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[.24em] text-cream/30">Opening the next chapter</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Suspense fallback={<RouteFallback />}><Dashboard /></Suspense>} />
          <Route path="/library" element={<Suspense fallback={<RouteFallback />}><Library /></Suspense>} />
          <Route path="/path" element={<Suspense fallback={<RouteFallback />}><Path /></Suspense>} />
          <Route path="/progress" element={<Suspense fallback={<RouteFallback />}><Progress /></Suspense>} />
          <Route path="/upload" element={<Suspense fallback={<RouteFallback />}><Upload /></Suspense>} />
          <Route path="/read/:stageId" element={<Suspense fallback={<RouteFallback />}><Reader /></Suspense>} />
          <Route path="/reader/:stageId" element={<Suspense fallback={<RouteFallback />}><ReadingDetailPage /></Suspense>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
