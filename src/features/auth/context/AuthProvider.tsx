import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext, type AuthUser } from './AuthContext'
import { getToken, setToken, clearToken } from '@/lib/auth-token'
import { decodeJwt } from '@/lib/jwt'
import { setUnauthorizedHandler } from '@/lib/api-client'

function userFromToken(token: string): AuthUser | null {
  const claims = decodeJwt(token)
  if (!claims) return null
  return { username: claims.sub, roles: claims.roles.split(',').filter(Boolean) }
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
