import Cookies from 'js-cookie'
import { decodeJwt, isExpired } from './jwt'

const COOKIE_NAME = 'histomed_token'

export function getToken(): string | null {
  const token = Cookies.get(COOKIE_NAME)
  if (!token) return null
  const claims = decodeJwt(token)
  if (!claims || isExpired(claims)) {
    clearToken()
    return null
  }
  return token
}

export function setToken(token: string): void {
  const claims = decodeJwt(token)
  Cookies.set(COOKIE_NAME, token, {
    expires: claims ? new Date(claims.exp * 1000) : undefined,
    sameSite: 'strict',
    secure: import.meta.env.PROD,
  })
}

export function clearToken(): void {
  Cookies.remove(COOKIE_NAME)
}
