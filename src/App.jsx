import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Pricing from './pages/Pricing.jsx'
import Login from './pages/Login.jsx'
import AppShell from './pages/AppShell.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/app" element={<AppShell />} />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
