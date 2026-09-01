import { createContext } from 'react'

export type AuthUser = { username: string; roles: string[] }

export type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  setSession: (token: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
