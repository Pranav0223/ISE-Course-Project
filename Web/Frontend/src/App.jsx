import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'

import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import DashboardScreen from './screens/DashboardScreen'
import PolicyInputScreen from './screens/PolicyInputScreen'
import SimulationScreen from './screens/SimulationScreen'
import ResultsScreen from './screens/ResultsScreen'
import CitizensScreen from './screens/CitizensScreen'
import AppShell from './components/AppShell'

function ProtectedRoute({ children }) {
  const { isAuth, loading } = useAuth()
  if (loading) return <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', fontFamily:'var(--font-sans)', color:'var(--ink-3)', fontSize:'0.9rem' }}>Loading…</div>
  if (!isAuth) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuth, loading } = useAuth()
  if (loading) return null
  if (isAuth) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterScreen /></PublicRoute>} />

          {/* Protected – inside AppShell (sidebar + topbar) */}
          <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardScreen />} />
            <Route path="policy" element={<PolicyInputScreen />} />
            <Route path="simulate" element={<SimulationScreen />} />
            <Route path="results" element={<ResultsScreen />} />
            <Route path="citizens" element={<CitizensScreen />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
