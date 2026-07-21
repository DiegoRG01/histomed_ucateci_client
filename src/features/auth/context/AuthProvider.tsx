import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from './AuthContext'
import { getToken, setToken, clearToken } from '@/lib/auth-token'
import { decodeJwt } from '@/lib/jwt'
import { setUnauthorizedHandler } from '@/lib/api-client'

function userFromToken(token: string): AuthUser | null {
  const claims = decodeJwt(token)
  if (!claims) return null
  // El backend emite las authorities de Spring Security con prefijo "ROLE_" (ver
  // UserDetailsServiceImpl del repo core); se retira para que coincida con el tipo Role del frontend.
  const roles = claims.roles
    .split(',')
    .filter(Boolean)
    .map((r) => r.replace(/^ROLE_/, ''))
  return { username: claims.sub, roles }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = getToken()
    return token ? userFromToken(token) : null
  })

  useEffect(() => {
    setUnauthorizedHandler(() => logout())
  }, [])

  function setSession(token: string) {
    setToken(token)
    setUser(userFromToken(token))
  }

  function logout() {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, setSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
