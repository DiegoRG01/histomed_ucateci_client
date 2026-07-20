import { jwtDecode } from 'jwt-decode'

export type JwtClaims = {
  sub: string
  roles: string
  iat: number
  exp: number
}

export function decodeJwt(token: string): JwtClaims | null {
  try {
    return jwtDecode<JwtClaims>(token)
  } catch {
    return null
  }
}

export function isExpired(claims: Pick<JwtClaims, 'exp'>): boolean {
  return Date.now() >= claims.exp * 1000
}
