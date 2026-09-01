import { Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Role } from '@/types/role'
import type { ReactNode } from 'react'

export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user } = useAuth()
  const hasAccess = user !== null && user.roles.some((r) => allow.includes(r as Role))
  return hasAccess ? <>{children}</> : <Navigate to="/" replace />
}
