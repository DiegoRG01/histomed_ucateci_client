import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { ReactNode } from 'react'

type Role = 'ADMIN' | 'ENFERMERIA' | 'ALMACEN' | 'CONSULTA'

export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user } = useAuth()
  const hasAccess = user !== null && user.roles.some((r) => allow.includes(r as Role))
  return hasAccess ? <>{children}</> : <Navigate to="/" replace />
}
