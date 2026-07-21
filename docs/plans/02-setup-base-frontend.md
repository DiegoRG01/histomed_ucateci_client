# Setup base del frontend (routing, HTTP client, auth, shadcn/ui)

## Contexto

La pantalla de login y todas las pantallas futuras necesitan infraestructura que hoy no existe: routing, cliente HTTP con manejo de JWT, estado de sesión, componentes UI base de shadcn/ui, y manejo de errores/toasts. Este plan deja esa infraestructura funcionando con un stub de dashboard protegido, sin implementar ninguna pantalla real todavía (el login se implementa en `03-pantalla-login.md`, que depende de este plan ya ejecutado).

Estado de partida: scaffold Vite + React 19 + TS con estructura de carpetas por feature ya creada (`01-estructura-carpetas-frontend.md`), todo su contenido son placeholders `export {}`. Tailwind v4 (CSS-first) ya está instalado y funcionando, con tokens de marca en `@theme` dentro de `src/styles/globals.css`. No hay `components.json`, ni alias `@/*`, ni router, ni cliente HTTP.

## Decisiones de diseño

- **react-router-dom v7**, API declarativa clásica (`BrowserRouter` + `Routes`/`Route`), no el router de datos (`createBrowserRouter`). No hay loaders/actions planeados; más simple de razonar para un agente ejecutor.
- **jwt-decode** para leer claims del JWT sin verificar firma (no se necesita verificación, el backend ya valida todo).
- **Utilidades de token en `src/lib/`, no en `features/auth/`**: `src/lib/api-client.ts` (infraestructura) necesita leer el token en cada request. Si el helper viviera en `features/auth/`, `lib/` dependería de `features/`, invirtiendo la jerarquía de capas. El helper de cookie es genérico ("un JWT en una cookie"), no lógica de negocio.
- **AuthContext/AuthProvider en `src/features/auth/`** (sí son lógica de dominio: roles, usuario, login/logout). `src/app/providers/AppProviders.tsx` los compone junto con `QueryClientProvider`.
- **Mecanismo anti-ciclo para 401**: `api-client.ts` expone `setUnauthorizedHandler(fn)`. `AuthProvider` se registra a sí mismo (`setUnauthorizedHandler(() => logout())`) en un `useEffect`. Así `lib/` nunca importa `features/auth/`.
- **Cookie de sesión** (no localStorage, decisión del usuario): nombre `histomed_token`, `sameSite: 'strict'`, `secure: true` solo en producción, expiración = claim `exp` del JWT decodificado (no un TTL fijo). El backend no setea cookies — el frontend guarda el JWT recibido en el body de `/auth/login` en su propia cookie (no HttpOnly, porque JS necesita leerla para armar el header `Authorization`).
- **shadcn/ui**: style `new-york`, baseColor `neutral`, `cssVariables: true`. Tras el init, se reemplazan las variables de color autogeneradas por las ya definidas en el proyecto (`--color-primary`, etc. de CLAUDE.md), añadiendo los `-foreground`/auxiliares que faltan.
- **Limpieza de `globals.css`**: se elimina el CSS heredado del template de Vite (`--text`, `#root{border-inline...}`, `h1/h2/code`, dark-mode media query del template) que rompe el layout de pantallas reales.

### Tokens de color finales en `@theme` (`src/styles/globals.css`)

```css
@theme {
  --color-primary: #0057a8;
  --color-primary-foreground: #ffffff;

  --color-secondary: #c9a227;
  --color-secondary-foreground: #1f2937;

  --color-background: #ffffff;
  --color-foreground: #0f172a;

  --color-muted: #f8fafc;
  --color-muted-foreground: #64748b;

  --color-border: #e5e7eb;
  --color-input: #e5e7eb;
  --color-ring: #0057a8;

  --color-card: #ffffff;
  --color-card-foreground: #0f172a;

  --color-popover: #ffffff;
  --color-popover-foreground: #0f172a;

  --color-accent: #f8fafc;
  --color-accent-foreground: #0f172a;

  --color-success: #16a34a;
  --color-warning: #f59e0b;

  --color-destructive: #dc2626;
  --color-destructive-foreground: #ffffff;

  --radius: 0.5rem;
}

body {
  @apply bg-background text-foreground;
}
```

Justificación de contraste: `primary` (#0057A8, azul oscuro) → foreground blanco (ratio alto). `secondary` (#C9A227, dorado medio) → foreground gris oscuro `#1f2937` (blanco fallaría WCAG AA sobre dorado). `muted`/`accent` (fondos claros) → foreground slate. `destructive` (rojo) → blanco.

## Pasos de implementación

### 1. Instalar dependencias

```bash
pnpm add react-router-dom@^7 @tanstack/react-query@^5 axios js-cookie jwt-decode \
  react-hook-form zod @hookform/resolvers \
  clsx tailwind-merge class-variance-authority lucide-react
pnpm add -D @types/js-cookie
```

### 2. Alias `@/*`

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

`tsconfig.app.json` — añadir dentro de `compilerOptions`:

```json
"baseUrl": ".",
"paths": { "@/*": ["./src/*"] }
```

### 3. Inicializar shadcn/ui e instalar componentes

```bash
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button input label form card sonner
```

Durante `init`: style `new-york`, base color `neutral`, CSS variables `yes`, ruta CSS `src/styles/globals.css`. Después, editar `src/styles/globals.css`:
- eliminar el CSS legado del template Vite,
- reemplazar el bloque `@theme` autogenerado por el bloque final de la sección anterior.

`components.json` resultante debe tener `aliases.components: "@/components"`, `aliases.utils: "@/lib/utils"`, `aliases.ui: "@/components/ui"`.

### 4. `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 5. `src/lib/jwt.ts`

```ts
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
```

### 6. `src/lib/auth-token.ts`

```ts
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
```

### 7. `src/lib/api-client.ts`

```ts
import axios from 'axios'
import { getToken, clearToken } from './auth-token'

export type ApiError = {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  fieldErrors?: { field: string; message: string; rejectedValue: unknown }[]
}

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1'

export const apiClient = axios.create({ baseURL })

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = error.response?.data as ApiError | undefined
    if (error.response?.status === 401) {
      clearToken()
      onUnauthorized?.()
    }
    return Promise.reject(apiError ?? error)
  },
)
```

Nota: el mapeo de 403/500 a toasts de sonner no se hace aquí (evitaría acoplar `lib/` a UI); se hace en un handler global similar registrado desde `AppProviders` en una iteración futura, fuera de alcance estricto de este plan y del login.

### 8. `src/features/auth/context/AuthContext.tsx` y `AuthProvider.tsx`

```ts
// AuthContext.tsx
import { createContext } from 'react'

export type AuthUser = { username: string; roles: string[] }

export type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  setSession: (token: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
```

```tsx
// AuthProvider.tsx
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
```

`src/features/auth/hooks/useAuth.ts`:

```ts
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
```

(El login real con `useMutation` que llama `setSession` se implementa en el plan 03 — este plan solo deja `setSession`/`logout` disponibles.)

### 9. `src/app/providers/AppProviders.tsx`

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/context/AuthProvider'
import { Toaster } from '@/components/ui/sonner'
import type { ReactNode } from 'react'

const queryClient = new QueryClient()

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          {children}
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
```

### 10. `src/app/routes.tsx` con `ProtectedRoute`

```tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { ReactNode } from 'react'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login placeholder</div>} />
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
```

### 11. `src/app/App.tsx`

```tsx
import { AppProviders } from './providers/AppProviders'
import { AppRoutes } from './routes'

function App() {
  return (
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  )
}

export default App
```

### 12. Variables de entorno

Crear `.env.example` (no `.env`, para no commitear secretos locales):

```
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

### 13. Actualizar `CLAUDE.md`

Actualizar la sección "Project state" reemplazando la descripción de scaffold vacío por una mención breve de que routing/auth/UI base ya existen (sin duplicar el detalle de este plan).

## Archivos a crear/modificar

- `vite.config.ts` (modificar — alias)
- `tsconfig.app.json` (modificar — baseUrl/paths)
- `package.json` (modificar — dependencias)
- `components.json` (crear — shadcn init)
- `src/styles/globals.css` (modificar — limpiar legado + tokens)
- `src/components/ui/{button,input,label,form,card,sonner}.tsx` (crear — shadcn CLI)
- `src/lib/utils.ts` (modificar)
- `src/lib/jwt.ts` (crear)
- `src/lib/auth-token.ts` (crear)
- `src/lib/api-client.ts` (modificar)
- `src/features/auth/context/AuthContext.tsx` (crear)
- `src/features/auth/context/AuthProvider.tsx` (crear)
- `src/features/auth/hooks/useAuth.ts` (crear)
- `src/app/providers/AppProviders.tsx` (crear)
- `src/app/routes.tsx` (modificar)
- `src/app/App.tsx` (modificar)
- `.env.example` (crear)
- `CLAUDE.md` (modificar — sección "Project state")

## Verificación

- `pnpm build` compila sin errores de TS (alias resuelto, imports válidos).
- `pnpm lint` sin errores.
- `pnpm dev`, navegar a `http://localhost:5173/` → redirige a `/login` (sin sesión).
- Navegar directo a `/login` → renderiza el placeholder sin redirecciones.
- Inspeccionar cookies del navegador: no debe existir `histomed_token` sin sesión.
- Confirmar visualmente que `globals.css` limpio no rompe el layout (sin borde en `#root`, sin texto centrado forzado).
