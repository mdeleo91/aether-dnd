import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Pricing from './pages/Pricing.jsx'
import Login from './pages/Login.jsx'
import PlayerLogin from './pages/PlayerLogin.jsx'
import PlayerView from './pages/PlayerView.jsx'
import AppShell from './pages/AppShell.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/join" element={<PlayerLogin />} />
      <Route
        path="/app"
        element={
          <ProtectedRoute requireRole="dm" redirectTo="/login">
            <AppShell />
          </ProtectedRoute>
        }
      />
      <Route
        path="/play"
        element={
          <ProtectedRoute requireRole="player" redirectTo="/join">
            <PlayerView />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Landing />} />
    </Routes>
  )
}
