# Pantalla de login

## Contexto

Depende de `docs/plans/02-setup-base-frontend.md` ya ejecutado (routing, `AuthProvider`, `api-client` con axios, componentes shadcn/ui base, `cn()`, cookie de token). Este plan implementa el flujo real de autenticación contra el backend: formulario, mutación, persistencia de sesión y redirección.

Contrato de backend relevante (`docs/plans/frontend/01-autenticacion.md`): `POST /api/v1/auth/login` (público), body `{ username, password }` (ambos requeridos), respuesta `{ token, tokenType: "Bearer", username, nombreCompleto }`. Credenciales seed dev: `admin`/`admin`. Credenciales inválidas → 401. **Bug conocido**: `nombreCompleto` siempre viene `""` — no usar para mostrar el nombre del usuario.

## Decisiones de diseño

- El 401 de login (credenciales inválidas) se distingue del 401 "sesión expirada" a nivel de **UI**, no en `api-client.ts`: el interceptor global siempre limpia la cookie en cualquier 401 (inofensivo en login, no hay sesión previa). El mensaje inline se decide en el componente inspeccionando `mutation.error?.status === 401`.
- Ruta contenedora: `src/features/auth/components/LoginPage.tsx` (layout centrado + `LoginForm`), registrada en `routes.tsx` reemplazando el placeholder `<div>Login placeholder</div>` del plan 02.
- Toggle mostrar/ocultar contraseña con `Eye`/`EyeOff` de `lucide-react`, estado local `useState` en `LoginForm`.
- Schema de validación zod definido inline en `LoginForm.tsx` (único consumidor, no amerita archivo separado).

## Pasos de implementación

### 1. `src/features/auth/types.ts`

```ts
export type LoginRequest = {
  username: string
  password: string
}

export type LoginResponse = {
  token: string
  tokenType: 'Bearer'
  username: string
  nombreCompleto: string // siempre "" por bug conocido del backend — no usar para mostrar nombre
}
```

(`AuthUser` ya vive en `context/AuthContext.tsx` del plan 02 — no duplicar aquí.)

### 2. `src/features/auth/api/login.ts`

```ts
import { apiClient } from '@/lib/api-client'
import type { LoginRequest, LoginResponse } from '../types'

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', credentials)
  return data
}
```

### 3. `src/features/auth/hooks/useLogin.ts`

```ts
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/login'
import { useAuth } from './useAuth'

export function useLogin() {
  const { setSession } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setSession(data.token)
      navigate('/', { replace: true })
    },
  })
}
```

El manejo de error inline (401 → "usuario o contraseña incorrectos") se hace en el componente leyendo `mutation.error` como `ApiError`, no en el hook, para poder mapearlo directamente en el JSX.

### 4. `src/features/auth/components/LoginForm.tsx`

```tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { useLogin } from '../hooks/useLogin'
import type { ApiError } from '@/lib/api-client'

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})
type LoginFormValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const mutation = useLogin()

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  const serverError = mutation.error as ApiError | undefined
  const invalidCredentials = serverError?.status === 401

  function onSubmit(values: LoginFormValues) {
    mutation.mutate(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario</FormLabel>
              <FormControl>
                <Input autoComplete="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    {...field}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {invalidCredentials && (
          <p role="alert" className="text-sm text-destructive">
            Usuario o contraseña incorrectos.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Iniciar sesión
        </Button>
      </form>
    </Form>
  )
}
```

Nota de accesibilidad: `FormMessage` de shadcn ya asocia `aria-describedby`/`id` al `FormControl`/input correspondiente para los errores de zod por campo; el error de credenciales (no ligado a un campo específico) usa `role="alert"` manual porque no es un error de campo de RHF.

### 5. `src/features/auth/components/LoginPage.tsx`

```tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LoginForm } from './LoginForm'

export function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-primary">HistoMed UCATECI</CardTitle>
          <CardDescription>Ingresa con tus credenciales de personal</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  )
}
```

### 6. Actualizar `src/app/routes.tsx`

Reemplazar `<Route path="/login" element={<div>Login placeholder</div>} />` por:

```tsx
import { LoginPage } from '@/features/auth/components/LoginPage'
// ...
<Route path="/login" element={<LoginPage />} />
```

## Archivos a crear/modificar

- `src/features/auth/types.ts` (modificar — reemplaza placeholder)
- `src/features/auth/api/login.ts` (crear)
- `src/features/auth/hooks/useLogin.ts` (crear)
- `src/features/auth/components/LoginForm.tsx` (crear)
- `src/features/auth/components/LoginPage.tsx` (crear)
- `src/app/routes.tsx` (modificar — wire `/login`)

## Verificación

1. `pnpm dev`, navegar a `/login`.
2. Submit vacío → errores inline de zod en ambos campos ("El usuario es obligatorio", "La contraseña es obligatoria"), sin llamada de red (verificar en devtools Network).
3. Con backend real en `localhost:8080`: credenciales inválidas (ej. `admin`/`wrong`) → mensaje "Usuario o contraseña incorrectos.", sin toast global (solo inline).
4. Credenciales válidas `admin`/`admin` → botón muestra spinner durante `isPending`, cookie `histomed_token` se crea con expiración ≈ 1h desde ahora, redirección a `/` (dashboard placeholder visible, ya no redirige a `/login`).
5. Si el backend no está disponible: puede mockearse temporalmente reemplazando `login()` por una función que resuelva una promesa con un JWT de prueba (generado manualmente, ej. con jwt.io usando cualquier secreto, solo para validar decodificación de claims y flujo de UI) — remover el mock antes de dar por cerrado el plan.
6. `pnpm build` y `pnpm lint` sin errores.
