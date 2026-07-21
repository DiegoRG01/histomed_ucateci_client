import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/app/routes/ProtectedRoute'
import { LoginPage } from '@/features/auth/components/LoginPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
