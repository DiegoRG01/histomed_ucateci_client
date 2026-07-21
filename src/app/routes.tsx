import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from '@/app/routes/ProtectedRoute'
import { RoleGuard } from '@/app/routes/RoleGuard'
import { AppLayout } from '@/app/layout/AppLayout'
import { LoginPage } from '@/features/auth/components/LoginPage'
import { TipoMedicamentoListPage } from '@/features/catalogos/components/TipoMedicamentoListPage'

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
        <Route
          path="/catalogos/tipos-medicamento"
          element={
            <RoleGuard allow={['ADMIN', 'ALMACEN']}>
              <TipoMedicamentoListPage />
            </RoleGuard>
          }
        />
      </Route>
    </Routes>
  )
}
