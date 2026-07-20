import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login placeholder</div>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div>Dashboard placeholder</div>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
