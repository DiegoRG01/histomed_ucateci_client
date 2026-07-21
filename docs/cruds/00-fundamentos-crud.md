# 00 - Fundamentos CRUD

## Contexto y objetivo

El sistema HistoMed UCATECI tendrá ~20 entidades gestionables por CRUD (ver roadmap del backend en
`docs/03-roadmap.md` del repo `histomed_ucateci`). Sin infraestructura compartida, cada entidad repetiría el mismo
boilerplate de API + hooks + tabla + formulario + confirmación de borrado. Este documento define esa infraestructura
una sola vez para que los documentos `01-*.md` a `08-*.md` solo tengan que describir lo específico de cada entidad.

**Este archivo se implementa primero, antes que cualquier CRUD de entidad.** Ningún otro doc de `docs/cruds/` es
ejecutable sin esto.

## Estado backend

No aplica (esto es infraestructura de frontend, no consume un módulo de dominio concreto). Sí depende de contratos
ya estables del backend:
- Forma de paginación Spring (`Page<T>`: `content`, `totalElements`, `totalPages`, `number`, `size`).
- Forma de error uniforme `ApiError` (`timestamp`, `status`, `error`, `message`, `path`, `fieldErrors?`).
- Borrado lógico (`activo` boolean) en toda entidad `Auditable`.
- Roles: `ADMIN`, `ENFERMERIA`, `ALMACEN`, `CONSULTA`, usados en `@PreAuthorize` por endpoint.

## Confirmado en el frontend actual

- `apiClient` (`src/lib/api-client.ts`): instancia axios con interceptor de auth (Bearer desde cookie) e
  interceptor de respuesta que desempaqueta `ApiError` y maneja 401 (`setUnauthorizedHandler`). **Reusar tal cual,
  no crear otra instancia axios.**
- `AuthContext.user = { username, roles: string[] }` (`src/features/auth/context/AuthContext.tsx`) — los roles ya
  están disponibles vía `useAuth()`. No hace falta ningún cambio en auth para poder filtrar por rol.
- `react-query` v5 con un único `QueryClient` provisto en `src/app/providers/AppProviders.tsx`.
- shadcn instalado hoy: `button`, `card`, `form`, `input`, `label`, `sonner`. Estilo `new-york` (`components.json`),
  por lo que `npx shadcn add <componente>` funciona sin configuración adicional.
- Zod v4 + `@hookform/resolvers/zod` ya en uso (ver `LoginForm.tsx`) para validación de formularios.
- `src/app/routes.tsx` centraliza rutas; `ProtectedRoute` está definido inline ahí mismo. No existe layout de app
  (sidebar/navbar) ni `Outlet`.

## Piezas a crear

### 1. `src/types/pagination.ts`

```ts
export type PageResponse<T> = {
  content: T[]
  totalElements: number
  totalPages: number
  number: number // página actual (0-based, coincide con Spring)
  size: number
}
```

### 2. `src/lib/api-factory.ts`

Factory de funciones API sobre `apiClient`, para no reescribir `get/post/put/delete` por entidad.

```ts
import { apiClient } from './api-client'
import type { PageResponse } from '@/types/pagination'

export function createResourceApi<TDto, TCreate, TUpdate = TCreate>(basePath: string) {
  return {
    list: (params: { filtro?: string; page?: number; size?: number } = {}) =>
      apiClient.get<PageResponse<TDto>>(basePath, { params }).then((r) => r.data),
    getById: (id: number | string) =>
      apiClient.get<TDto>(`${basePath}/${id}`).then((r) => r.data),
    create: (body: TCreate) =>
      apiClient.post<TDto>(basePath, body).then((r) => r.data),
    update: (id: number | string, body: TUpdate) =>
      apiClient.put<TDto>(`${basePath}/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      apiClient.delete<void>(`${basePath}/${id}`).then(() => undefined),
  }
}

// Para entidades cuyo backend aún no pagina el listado (ej. Usuario hoy: GET devuelve array plano)
export function createResourceApiFlatList<TDto, TCreate, TUpdate = TCreate>(basePath: string) {
  return {
    list: () => apiClient.get<TDto[]>(basePath).then((r) => r.data),
    getById: (id: number | string) =>
      apiClient.get<TDto>(`${basePath}/${id}`).then((r) => r.data),
    create: (body: TCreate) =>
      apiClient.post<TDto>(basePath, body).then((r) => r.data),
    update: (id: number | string, body: TUpdate) =>
      apiClient.put<TDto>(`${basePath}/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      apiClient.delete<void>(`${basePath}/${id}`).then(() => undefined),
  }
}
```

No incluir métodos que el backend no expone todavía (ej. si un controller no tiene `PUT`, el doc de esa entidad no
debe invocar `update`, aunque la factory lo ofrezca genéricamente — es responsabilidad del doc de módulo omitirlo).

### 3. `src/lib/crud-hooks-factory.ts`

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function createCrudHooks<TDto, TCreate, TUpdate>(
  queryKey: string,
  api: {
    list: (params?: any) => Promise<any>
    getById: (id: number | string) => Promise<TDto>
    create: (body: TCreate) => Promise<TDto>
    update: (id: number | string, body: TUpdate) => Promise<TDto>
    remove: (id: number | string) => Promise<void>
  },
) {
  return {
    useList: (params?: any) =>
      useQuery({ queryKey: [queryKey, 'list', params], queryFn: () => api.list(params) }),

    useGetById: (id: number | string | undefined) =>
      useQuery({
        queryKey: [queryKey, id],
        queryFn: () => api.getById(id as number | string),
        enabled: id !== undefined,
      }),

    useCreate: () => {
      const queryClient = useQueryClient()
      return useMutation({
        mutationFn: api.create,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      })
    },

    useUpdate: () => {
      const queryClient = useQueryClient()
      return useMutation({
        mutationFn: ({ id, body }: { id: number | string; body: TUpdate }) => api.update(id, body),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      })
    },

    useRemove: () => {
      const queryClient = useQueryClient()
      return useMutation({
        mutationFn: (id: number | string) => api.remove(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] }),
      })
    },
  }
}
```

Cada `src/features/<entidad>/hooks/index.ts` la usa así:

```ts
const api = createResourceApi<PatientDto, CreatePatientRequest, UpdatePatientRequest>('/pacientes')
export const { useList: usePatients, useGetById: usePatient, useCreate: useCreatePatient,
  useUpdate: useUpdatePatient, useRemove: useRemovePatient } = createCrudHooks('patients', api)
```

Hooks especiales (sub-recursos, workflows de estado, validaciones) se escriben a mano en el mismo `hooks/` de la
entidad, fuera de la factory.

### 4. `src/lib/form-errors.ts`

```ts
import type { UseFormSetError, FieldValues, Path } from 'react-hook-form'
import { toast } from 'sonner'
import type { ApiError } from './api-client'

export function mapApiErrorToForm<T extends FieldValues>(error: ApiError, setError: UseFormSetError<T>) {
  if (error.fieldErrors?.length) {
    for (const fe of error.fieldErrors) {
      setError(fe.field as Path<T>, { message: fe.message })
    }
    return
  }
  toast.error(error.message ?? 'Ocurrió un error inesperado')
}
```

### 5. Componentes compartidos (`src/components/shared/`)

- **`DataTable.tsx`**: tabla genérica dirigida por props, **sin** `@tanstack/react-table` (proyecto estudiantil,
  evitar dependencia/abstracción extra que no se necesita todavía). Props: `columns: { header: string; cell: (row: T) => ReactNode }[]`, `data: T[]`, `isLoading?: boolean`, `emptyMessage?: string`, `rowActions?: (row: T) => ReactNode`. Envuelve el componente shadcn `table` + `skeleton` (loading) + estado vacío.
- **`Pagination.tsx`**: envuelve shadcn `pagination`, props `{ page, totalPages, onPageChange }`.
- **`ConfirmDeleteDialog.tsx`**: envuelve shadcn `alert-dialog`. Props: `{ trigger: ReactNode; title: string; description: string; onConfirm: () => void; isPending?: boolean }`. Usarlo enmarcando el texto como "desactivar", no "eliminar" (borrado lógico).
- **`FormDialog.tsx`**: envuelve shadcn `dialog`. Props: `{ open, onOpenChange, title, description?, children }`. Cada formulario de entidad se monta dentro como `children`.
- **`PageHeader.tsx`**: título + acción principal (botón "Nuevo X"), fila reusada en cada página de lista.

### 6. Layout de aplicación

- **`src/app/layout/nav-config.ts`**: array `{ label: string; path: string; icon: LucideIcon; roles: Role[] }[]`,
  una entrada por módulo (Estudiantes, Inventario, Requisiciones, Visitas, Reportes, Usuarios, Catálogos).
- **`src/app/layout/AppLayout.tsx`**: sidebar/topbar que renderiza `nav-config` filtrado por
  `useAuth().user.roles`, y un `<Outlet/>` (react-router-dom v7) para las páginas hijas.
- Envolver las rutas protegidas en `AppLayout` en `src/app/routes.tsx`:
  ```tsx
  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    <Route path="/" element={<DashboardPage />} />
    {/* rutas de cada módulo se añaden aquí en sus propios docs */}
  </Route>
  ```

### 7. Guards de ruta

- Extraer `ProtectedRoute` de `routes.tsx` a `src/app/routes/ProtectedRoute.tsx` (mismo comportamiento actual, solo
  mover de archivo).
- Nuevo `src/app/routes/RoleGuard.tsx`:
  ```tsx
  type Role = 'ADMIN' | 'ENFERMERIA' | 'ALMACEN' | 'CONSULTA'

  export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
    const { user } = useAuth()
    const hasAccess = user !== null && user.roles.some((r) => allow.includes(r as Role))
    return hasAccess ? <>{children}</> : <Navigate to="/" replace />
  }
  ```
  Nota: los roles en el JWT llegan como string (`JwtClaims.roles`) — confirmar en `AuthProvider` si ya vienen como
  array separado (`AuthUser.roles: string[]` así lo sugiere) o si falta un `.split(',')`; ajustar al implementar, no
  es un bloqueo de diseño.

### 8. Componentes shadcn a instalar

```
npx shadcn add table dialog alert-dialog select dropdown-menu textarea checkbox badge pagination skeleton
```

## Dependencias y orden de implementación

1. `src/types/pagination.ts`
2. `src/lib/api-factory.ts`, `src/lib/crud-hooks-factory.ts`, `src/lib/form-errors.ts`
3. Instalar componentes shadcn faltantes
4. `src/components/shared/*` (DataTable, Pagination, ConfirmDeleteDialog, FormDialog, PageHeader)
5. `src/app/routes/ProtectedRoute.tsx` + `RoleGuard.tsx`
6. `src/app/layout/nav-config.ts` + `AppLayout.tsx`, envolver rutas protegidas
7. A partir de aquí, cualquier doc `01-*.md` a `08-*.md` es implementable.

## Pendientes / preguntas abiertas

- Confirmar si `nombreCompleto` sigue vacío por el bug de backend conocido (`src/features/auth/types.ts` lo
  documenta) al momento de mostrar el usuario logueado en `AppLayout`.
- Si algún módulo requiere tablas con más de ~8 columnas o edición inline, reevaluar si `DataTable.tsx` hecho a mano
  sigue siendo suficiente o conviene introducir `@tanstack/react-table` en ese momento (no anticipar ahora).
