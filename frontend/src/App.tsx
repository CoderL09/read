import Dashboard from './pages/Dashboard'
import Path from './pages/Path'
import Progress from './pages/Progress'
import Upload from './pages/Upload'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/path" element={<Path />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
    </BrowserRouter>
  )
}
