import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/app/routes/ProtectedRoute'
import { AppLayout } from '@/app/layout/AppLayout'
import { LoginPage } from '@/features/auth/components/LoginPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<div>Dashboard placeholder</div>} />
      </Route>
    </Routes>
  )
}
