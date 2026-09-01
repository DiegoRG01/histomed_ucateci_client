# Rediseño CRUD de Estudiante: página con tabs — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) o superpowers:executing-plans para ejecutar este plan tarea por tarea. Los pasos usan checkbox (`- [ ]`) para tracking.

**Goal:** Reemplazar el crear/editar de `Estudiante` (hoy un `FormDialog` modal, implementado en `docs/plans/06-estudiantes-crud.md`) por una **página completa** con **tabs** ("Datos personales" / "Referencias" / "Historial clínico"), de forma que al crear un estudiante se puedan agregar de inmediato su médico de referencia, sus contactos de emergencia, alergias, condiciones físicas, enfermedades y medicamentos habituales.

**Contexto del cambio:** El backend fue refactorizado (Plan 11/12 del lado backend) para exponer 6 sub-recursos con DTOs JSON tipados y CRUD real, reemplazando el diseño viejo (`@RequestParam`/`Map<String,Object>` sin tipar) documentado en `docs/cruds/04-estudiantes-ficha-medica.md` y `docs/plans/frontend/03-endpoints-estudiantes.md` — ambos quedan desactualizados y se corrigen en la Task 15.

**Decisión de flujo:** los sub-recursos requieren `estudianteId`, así que se guarda primero "Datos personales" (`POST /estudiantes` → obtiene id) y recién ahí se habilitan las tabs "Referencias"/"Historial clínico"; cada alta/edición/baja dentro de ellas es una llamada API inmediata e independiente, no se acumula en un submit final. En edición, las 3 tabs están habilitadas desde el primer render.

**Architecture:** Reutiliza `createResourceApi`/`createResourceApiFlatList` (`src/lib/api-factory.ts` — el `basePath` es un string interpolado en runtime, funciona con rutas anidadas `/estudiantes/${id}/alergias` sin cambios), `createCrudHooks` (`src/lib/crud-hooks-factory.ts`), `mapApiErrorToForm` (`src/lib/form-errors.ts`), el CRUD core de Estudiante ya existente (`estudiantes-api.ts`, `use-estudiantes.ts`), el form puro `EstudianteForm.tsx` (se reutiliza en la tab "Datos personales"), el catálogo `useMedicamentos.useList()` (`src/features/inventario/hooks/useInventario.ts`, para selects de Alergia/MedicamentoHabitual), y los componentes compartidos `DataTable`, `ConfirmDeleteDialog`, `PageHeader`. Se elimina `EstudianteFormDialog.tsx` y el flujo `?nuevo`/`?editar` de `EstudianteListPage.tsx` (quedan sin uso). Se agrega `src/components/ui/tabs.tsx` (shadcn/ui Tabs, no existe hoy en el repo).

**Tech Stack:** React 19, TypeScript, react-router-dom v7, @tanstack/react-query, react-hook-form + zod v4 (`zod/v4`) + `@hookform/resolvers/zod`, radix-ui (import unificado `{ X as XPrimitive } from "radix-ui"`, mismo patrón que `checkbox.tsx`/`select.tsx`), Tailwind v4, lucide-react, sonner.

**Notas de plan (importantes para el implementador):**
- **NO commits.** Regla de CLAUDE.md: nunca commitear sin orden explícita. Cada task termina con lint/typecheck, sin `git commit`.
- No hay test runner en el repo. Verificación por task: `pnpm exec tsc -b && pnpm lint` (exit 0; `exhaustive-deps` es warn, no error). Verificación final: `pnpm build`.
- `TooltipProvider` ya envuelve toda la app vía `SidebarProvider` (`src/components/ui/sidebar.tsx:137`) — `Tooltip` se puede usar en cualquier página sin provider adicional.
- `ConfirmDeleteDialog.tsx` tiene hoy hardcodeado el label `"Desactivar"/"Desactivando..."` — para los sub-recursos (borrado real, no desactivación) hay que extenderlo con `confirmLabel`/`pendingLabel` opcionales (default = los actuales, no rompe usos existentes).
- **Asunción a verificar contra el backend real al ejecutar:** se asume que `GET` de los 6 sub-recursos devuelve **array plano**, no `Page<T>` — por eso se usa `createResourceApiFlatList`. Si el backend pagina, cambiar a `createResourceApi` y leer `.content` (cambio de una línea por sub-recurso, no afecta `create`/`update`/`remove`).
- Roles: rutas `/estudiantes/nuevo` y `/estudiantes/:id/editar` con `RoleGuard allow={["ADMIN","ENFERMERIA"]}`. Dentro de la página, ADMIN y ENFERMERIA tienen los mismos permisos sobre sub-recursos (a diferencia de "Desactivar" Estudiante, que sigue siendo solo ADMIN).

## Contratos de datos del backend (nuevos)

Todos los paths van bajo `/estudiantes/{estudianteId}/...` salvo el catálogo `Contacto` (plano). `apiClient` ya antepone la base, igual que el uso actual de `/estudiantes`.

| Recurso | Path | Verbos | Request | Response |
|---|---|---|---|---|
| Alergia | `/estudiantes/{id}/alergias` | POST/GET/GET{id}/PUT/DELETE | `{nombre, tipoAlergia, medicamentoId?}` | `{id, nombre, tipoAlergia, medicamentoId\|null}` |
| Condición física | `/estudiantes/{id}/condiciones` | POST/GET/GET{id}/PUT/DELETE | `{nombre, descripcion?, impideDonacionSangre}` | `{id, nombre, descripcion\|null, impideDonacionSangre}` |
| Enfermedad | `/estudiantes/{id}/enfermedades` | POST/GET/GET{id}/PUT/DELETE (en construcción) | `{nombre, esCronica, impideDonacionSangre}` | `{id, nombre, esCronica, impideDonacionSangre}` |
| Medicamento habitual | `/estudiantes/{id}/medicamentos` | POST/GET/GET{id}/PUT/DELETE (en construcción) | `{medicamentoId, dosis?, frecuencia?}` | `{id, estudianteId, medicamentoId, medicamentoNombre, dosis\|null, frecuencia\|null}` |
| Contacto (catálogo) | `/contactos` | POST/GET/GET{id} | `{nombre, telefono, email?}` | `{id, nombre, telefono, email\|null}` |
| ContactoEstudiante | `/estudiantes/{id}/contactos` | POST/GET/GET{id}/PUT/DELETE | POST:`{contactoId, parentesco?, esPrincipal?}` PUT:`{parentesco?, esPrincipal}` | `{id, estudianteId, contactoId, contactoNombre, contactoTelefono, contactoEmail\|null, parentesco\|null, esPrincipal}` |
| MedicoReferencia (singleton) | `/estudiantes/{id}/medico-referencia` | POST (guardar/upsert), GET (obtener, 404 si no hay) | `{nombre, especialidad?, telefono?, hospitalClinica?}` | `{id, nombre, especialidad\|null, telefono\|null, hospitalClinica\|null, estudianteId}` |

`TipoAlergia = 'MEDICAMENTO' | 'ALIMENTO' | 'AMBIENTAL' | 'OTRO'`. `medicamentoId` en Alergia solo aplica cuando `tipoAlergia === 'MEDICAMENTO'`. El backend garantiza "un solo contacto principal por estudiante" (desmarca automáticamente el anterior) — el frontend solo hace refetch tras cada mutación, no replica esa regla.

---

### Task 1: Extender `ConfirmDeleteDialog.tsx` con labels configurables

**Files:**
- Modify: `src/components/shared/ConfirmDeleteDialog.tsx`

- [ ] **Step 1:** Añadir props opcionales `confirmLabel = "Desactivar"` y `pendingLabel = "Desactivando..."`, usarlas en vez de los strings hardcodeados en `AlertDialogAction`. No cambia ningún uso existente (Estudiante sigue mostrando "Desactivar").

- [ ] **Step 2: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 2: Componente `Tabs` de shadcn/ui

**Files:**
- Create: `src/components/ui/tabs.tsx`

- [ ] **Step 1:** Crear siguiendo el mismo patrón que `checkbox.tsx`/`select.tsx` (import unificado `radix-ui`, `data-slot`, `cn`):

```tsx
import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" className={cn("flex flex-col gap-2", className)} {...props} />
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 w-fit items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground",
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:text-muted-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 dark:data-[state=active]:text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content data-slot="tabs-content" className={cn("flex-1 outline-none", className)} {...props} />
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
```

- [ ] **Step 2: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 3: Tipos de dominio de los 6 sub-recursos

**Files:**
- Modify: `src/features/estudiantes/types.ts`

- [ ] **Step 1:** Añadir al final del archivo (no tocar lo existente):

```ts
export type TipoAlergia = 'MEDICAMENTO' | 'ALIMENTO' | 'AMBIENTAL' | 'OTRO'
export type AlergiaRequest = { nombre: string; tipoAlergia: TipoAlergia; medicamentoId?: number }
export type AlergiaResponse = { id: number; nombre: string; tipoAlergia: TipoAlergia; medicamentoId: number | null }

export type CondicionFisicaRequest = { nombre: string; descripcion?: string; impideDonacionSangre: boolean }
export type CondicionFisicaResponse = {
  id: number
  nombre: string
  descripcion: string | null
  impideDonacionSangre: boolean
}

export type EnfermedadRequest = { nombre: string; esCronica: boolean; impideDonacionSangre: boolean }
export type EnfermedadResponse = { id: number; nombre: string; esCronica: boolean; impideDonacionSangre: boolean }

export type MedicamentoHabitualRequest = { medicamentoId: number; dosis?: string; frecuencia?: string }
export type MedicamentoHabitualResponse = {
  id: number
  estudianteId: number
  medicamentoId: number
  medicamentoNombre: string
  dosis: string | null
  frecuencia: string | null
}

export type ContactoRequest = { nombre: string; telefono: string; email?: string }
export type ContactoResponse = { id: number; nombre: string; telefono: string; email: string | null }

export type ContactoEstudianteRequest = { contactoId: number; parentesco?: string; esPrincipal?: boolean }
export type ContactoEstudianteUpdateRequest = { parentesco?: string; esPrincipal: boolean }
export type ContactoEstudianteResponse = {
  id: number
  estudianteId: number
  contactoId: number
  contactoNombre: string
  contactoTelefono: string
  contactoEmail: string | null
  parentesco: string | null
  esPrincipal: boolean
}

export type MedicoReferenciaRequest = {
  nombre: string
  especialidad?: string
  telefono?: string
  hospitalClinica?: string
}
export type MedicoReferenciaResponse = {
  id: number
  nombre: string
  especialidad: string | null
  telefono: string | null
  hospitalClinica: string | null
  estudianteId: number
}
```

- [ ] **Step 2: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 4: Capa API de los sub-recursos

**Files:**
- Create: `src/features/estudiantes/api/alergias-api.ts`
- Create: `src/features/estudiantes/api/condiciones-api.ts`
- Create: `src/features/estudiantes/api/enfermedades-api.ts`
- Create: `src/features/estudiantes/api/medicamentos-habituales-api.ts`
- Create: `src/features/estudiantes/api/contactos-api.ts`
- Create: `src/features/estudiantes/api/contactos-estudiante-api.ts`
- Create: `src/features/estudiantes/api/medico-referencia-api.ts`

- [ ] **Step 1:** Los 4 sub-recursos de historial clínico son idénticos en forma — `createResourceApiFlatList` parametrizado por `estudianteId`:

```ts
// alergias-api.ts
import { createResourceApiFlatList } from '@/lib/api-factory'
import type { AlergiaRequest, AlergiaResponse } from '../types'

export function alergiasApi(estudianteId: number | string) {
  return createResourceApiFlatList<AlergiaResponse, AlergiaRequest>(`/estudiantes/${estudianteId}/alergias`)
}
```

Replicar igual en `condiciones-api.ts` (`condicionesApi`, `/estudiantes/${id}/condiciones`), `enfermedades-api.ts` (`enfermedadesApi`, `/estudiantes/${id}/enfermedades`), `medicamentos-habituales-api.ts` (`medicamentosHabitualesApi`, `/estudiantes/${id}/medicamentos`).

- [ ] **Step 2: `contactos-api.ts`** (catálogo — sin `update`/`remove` documentados, no usa las factories):

```ts
import { apiClient } from '@/lib/api-client'
import type { ContactoRequest, ContactoResponse } from '../types'

export function listContactos() {
  return apiClient.get<ContactoResponse[]>('/contactos').then((r) => r.data)
}

export function createContacto(body: ContactoRequest) {
  return apiClient.post<ContactoResponse>('/contactos', body).then((r) => r.data)
}
```

- [ ] **Step 3: `contactos-estudiante-api.ts`** (CRUD completo, `TUpdate` distinto de `TCreate`):

```ts
import { createResourceApiFlatList } from '@/lib/api-factory'
import type {
  ContactoEstudianteRequest,
  ContactoEstudianteResponse,
  ContactoEstudianteUpdateRequest,
} from '../types'

export function contactosEstudianteApi(estudianteId: number | string) {
  return createResourceApiFlatList<ContactoEstudianteResponse, ContactoEstudianteRequest, ContactoEstudianteUpdateRequest>(
    `/estudiantes/${estudianteId}/contactos`,
  )
}
```

- [ ] **Step 4: `medico-referencia-api.ts`** (singleton — POST upsert, GET que puede ser 404):

```ts
import { apiClient, type ApiError } from '@/lib/api-client'
import type { MedicoReferenciaRequest, MedicoReferenciaResponse } from '../types'

export async function getMedicoReferencia(estudianteId: number) {
  try {
    const { data } = await apiClient.get<MedicoReferenciaResponse>(`/estudiantes/${estudianteId}/medico-referencia`)
    return data
  } catch (error) {
    if ((error as ApiError).status === 404) return null
    throw error
  }
}

export function saveMedicoReferencia(estudianteId: number, body: MedicoReferenciaRequest) {
  return apiClient
    .post<MedicoReferenciaResponse>(`/estudiantes/${estudianteId}/medico-referencia`, body)
    .then((r) => r.data)
}
```

- [ ] **Step 5: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 5: Hooks CRUD de los sub-recursos

**Files:**
- Create: `src/features/estudiantes/hooks/use-alergias.ts`
- Create: `src/features/estudiantes/hooks/use-condiciones.ts`
- Create: `src/features/estudiantes/hooks/use-enfermedades.ts`
- Create: `src/features/estudiantes/hooks/use-medicamentos-habituales.ts`
- Create: `src/features/estudiantes/hooks/use-contactos.ts`
- Create: `src/features/estudiantes/hooks/use-contactos-estudiante.ts`
- Create: `src/features/estudiantes/hooks/use-medico-referencia.ts`

- [ ] **Step 1:** Patrón repetido para los 4 de historial clínico:

```ts
// use-alergias.ts
import { createCrudHooks } from '@/lib/crud-hooks-factory'
import { alergiasApi } from '../api/alergias-api'
import type { AlergiaRequest, AlergiaResponse } from '../types'

export function useAlergias(estudianteId: number) {
  return createCrudHooks<AlergiaResponse, AlergiaRequest, AlergiaRequest, AlergiaResponse[]>(
    `estudiantes/${estudianteId}/alergias`,
    alergiasApi(estudianteId),
  )
}
```

Replicar como `useCondiciones(estudianteId)`, `useEnfermedades(estudianteId)`, `useMedicamentosHabituales(estudianteId)` con sus tipos y `queryKey` propios. **Nota Rules of Hooks:** esto es seguro porque `createCrudHooks`/`createResourceApiFlatList` no llaman hooks al construirse — solo devuelven funciones que internamente llaman `useQuery`/`useMutation` cuando se invocan (`.useList()`, `.useCreate()`, etc.), así el orden de hooks por render no cambia.

- [ ] **Step 2: `use-contactos.ts`** (catálogo, hooks manuales):

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createContacto, listContactos } from '../api/contactos-api'

export function useContactosCatalogo() {
  return useQuery({ queryKey: ['contactos'], queryFn: listContactos })
}

export function useCreateContacto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createContacto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contactos'] }),
  })
}
```

- [ ] **Step 3: `use-contactos-estudiante.ts`**:

```ts
import { createCrudHooks } from '@/lib/crud-hooks-factory'
import { contactosEstudianteApi } from '../api/contactos-estudiante-api'
import type { ContactoEstudianteRequest, ContactoEstudianteResponse, ContactoEstudianteUpdateRequest } from '../types'

export function useContactosEstudiante(estudianteId: number) {
  return createCrudHooks<ContactoEstudianteResponse, ContactoEstudianteRequest, ContactoEstudianteUpdateRequest, ContactoEstudianteResponse[]>(
    `estudiantes/${estudianteId}/contactos`,
    contactosEstudianteApi(estudianteId),
  )
}
```

- [ ] **Step 4: `use-medico-referencia.ts`** (ad-hoc, GET puede ser `null`):

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMedicoReferencia, saveMedicoReferencia } from '../api/medico-referencia-api'
import type { MedicoReferenciaRequest } from '../types'

export function useMedicoReferencia(estudianteId: number) {
  return useQuery({
    queryKey: ['estudiantes', estudianteId, 'medico-referencia'],
    queryFn: () => getMedicoReferencia(estudianteId),
  })
}

export function useSaveMedicoReferencia(estudianteId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: MedicoReferenciaRequest) => saveMedicoReferencia(estudianteId, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estudiantes', estudianteId, 'medico-referencia'] }),
  })
}
```

- [ ] **Step 5: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 6: Alergias — form + sección embebida (plantilla)

**Files:**
- Create: `src/features/estudiantes/components/AlergiaForm.tsx`
- Create: `src/features/estudiantes/components/AlergiasSection.tsx`

- [ ] **Step 1: `AlergiaForm.tsx`** — mismo contrato `form/onSubmit/onCancel/isPending` que `EstudianteForm.tsx`; `medicamentoId` (Select poblado con `useMedicamentos.useList({ size: 100 })`) solo visible cuando `tipoAlergia === 'MEDICAMENTO'`, y se limpia a `null` si cambia a otro tipo.

- [ ] **Step 2: `AlergiasSection.tsx`** — `Card` con: el `AlergiaForm` siempre visible arriba (alterna entre modo alta y modo edición al hacer click en "Editar" de una fila, vía `useState<AlergiaResponse|null>` local); `DataTable` (columnas: Nombre, Tipo) debajo con `rowActions` = editar (carga el form) + `ConfirmDeleteDialog(confirmLabel="Eliminar")`. zod: `nombre` requerido, `tipoAlergia` requerido (enum con `''` + `.refine`), `medicamentoId` con `.refine` cruzado a nivel de objeto (`tipoAlergia !== 'MEDICAMENTO' || medicamentoId !== null`, `path:['medicamentoId']`). Cada submit hace `createMutation`/`updateMutation` de `useAlergias(estudianteId)` + `mapApiErrorToForm` en el catch + reset del form al terminar.

- [ ] **Step 3: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 7: Condiciones físicas, Enfermedades y Medicamentos habituales (mismo patrón que Task 6)

**Files:**
- Create: `src/features/estudiantes/components/CondicionForm.tsx`, `CondicionesSection.tsx`
- Create: `src/features/estudiantes/components/EnfermedadForm.tsx`, `EnfermedadesSection.tsx`
- Create: `src/features/estudiantes/components/MedicamentoHabitualForm.tsx`, `MedicamentosHabitualesSection.tsx`

Replicar exactamente la estructura de `AlergiaForm`/`AlergiasSection` (mismo contrato de props, mismo `Card`+`DataTable`+alta/edición inline+`ConfirmDeleteDialog(confirmLabel="Eliminar")`), con estos deltas:

- [ ] **Step 1: Condición física** — campos `nombre` (input), `descripcion` (textarea opcional), `impideDonacionSangre` (checkbox). Columnas: Nombre, Descripción (`row.descripcion ?? '—'`), Impide donación (`<Badge variant={row.impideDonacionSangre ? 'destructive' : 'outline'}>{row.impideDonacionSangre ? 'Sí' : 'No'}</Badge>`).

- [ ] **Step 2: Enfermedad** — campos `nombre`, `esCronica` (checkbox), `impideDonacionSangre` (checkbox). Columnas: Nombre, Crónica (Sí/No), Impide donación (Sí/No, mismo `Badge`).

- [ ] **Step 3: Medicamento habitual** — `medicamentoId` (Select requerido, `useMedicamentos.useList({ size: 100 })`, zod `z.number().min(1, 'Seleccione un medicamento')`), `dosis`/`frecuencia` (inputs opcionales). Columnas: Medicamento (`row.medicamentoNombre`), Dosis (`row.dosis ?? '—'`), Frecuencia (`row.frecuencia ?? '—'`).

- [ ] **Step 4: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 8: Médico de referencia (singleton — form sin lista)

**Files:**
- Create: `src/features/estudiantes/components/MedicoReferenciaForm.tsx`
- Create: `src/features/estudiantes/components/MedicoReferenciaSection.tsx`

- [ ] **Step 1: `MedicoReferenciaForm.tsx`** — campos `nombre` (requerido), `especialidad`, `telefono`, `hospitalClinica` (opcionales). Mismo contrato `form/onSubmit/isPending` pero **sin** `onCancel` (no hay modo edición separado: el mismo botón "Guardar" crea o reemplaza, porque el POST es upsert).

- [ ] **Step 2: `MedicoReferenciaSection.tsx`** — `useMedicoReferencia(estudianteId)` (puede devolver `null`), `useEffect` con `form.reset(...)` cuando llegan los datos (mismo patrón verificado en `EstudianteFormDialog.tsx`: no dispara `react-hooks/set-state-in-effect`), `Skeleton` mientras `isLoading`, `useSaveMedicoReferencia(estudianteId)` en el submit + `mapApiErrorToForm` en el catch.

- [ ] **Step 3: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 9: Contactos — decisión de UX y componentes

**Decisión:** flujo **"crear y vincular en un solo paso"** (2 POST encadenados: `POST /contactos` → `POST /estudiantes/{id}/contactos` con el id resultante), sin buscador/typeahead sobre el catálogo existente. Justificación YAGNI: el catálogo `Contacto` no tiene pantalla de gestión propia ni consumidor hoy fuera de este flujo; construir búsqueda con debounce y estado "seleccionado vs. nuevo" es complejidad sin caso de uso probado — se puede añadir como v2 (`Popover`/`Command` sobre `useContactosCatalogo()`) si hace falta reutilizar contactos entre estudiantes.

**Files:**
- Create: `src/features/estudiantes/components/ContactoForm.tsx`
- Create: `src/features/estudiantes/components/ContactosSection.tsx`

- [ ] **Step 1: `ContactoForm.tsx`** — prop `mode: 'crear' | 'editar'`. En `mode="editar"`, los campos `nombre`/`telefono`/`email` quedan `disabled` (solo informativos) porque `ContactoEstudianteUpdateRequest` no permite reasignar `contactoId` y no existe `PUT /contactos`; solo `parentesco` y `esPrincipal` (checkbox) son editables. Mostrar una nota (`text-xs text-muted-foreground`) explicando por qué esos campos están deshabilitados en modo edición.

- [ ] **Step 2: `ContactosSection.tsx`** — misma estructura de `AlergiasSection` (Card + form alta/edición + `DataTable` + `ConfirmDeleteDialog(confirmLabel="Eliminar")`), pero el `onSubmit` bifurca:

```ts
async function onSubmit(values: ContactoFormValues) {
  try {
    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.id,
        body: { parentesco: values.parentesco || undefined, esPrincipal: values.esPrincipal },
      })
      toast.success('Contacto actualizado')
    } else {
      const contacto = await createContactoMutation.mutateAsync({
        nombre: values.nombre,
        telefono: values.telefono,
        email: values.email || undefined,
      })
      await createContactoEstudianteMutation.mutateAsync({
        contactoId: contacto.id,
        parentesco: values.parentesco || undefined,
        esPrincipal: values.esPrincipal,
      })
      toast.success('Contacto agregado')
    }
    cancelEdit()
  } catch (error) {
    mapApiErrorToForm(error as ApiError, form.setError)
  }
}
```

`createContactoMutation` viene de `useCreateContacto()`; `createContactoEstudianteMutation`/`updateMutation`/`removeMutation` de `useContactosEstudiante(estudianteId).useCreate/.useUpdate/.useRemove`. Al editar, precargar el form con `row.contactoNombre`/`contactoTelefono`/`contactoEmail`/`parentesco`/`esPrincipal` y `mode="editar"`; en alta, `mode="crear"`. Columnas: Nombre (`contactoNombre`), Teléfono (`contactoTelefono`), Parentesco (`parentesco ?? '—'`), Principal (`<Badge>` si `esPrincipal`). No replicar en el cliente la regla "un solo principal" — el backend ya la garantiza; solo refrescar tras cada mutación (ya lo hace `createCrudHooks` vía `invalidateQueries`).

- [ ] **Step 3: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 10: Tabs compuestas — "Referencias" e "Historial clínico"

**Files:**
- Create: `src/features/estudiantes/components/ReferenciasTab.tsx`
- Create: `src/features/estudiantes/components/HistorialClinicoTab.tsx`

- [ ] **Step 1: `ReferenciasTab.tsx`** — `<div className="space-y-6">` con `<MedicoReferenciaSection estudianteId={estudianteId} />` + `<ContactosSection estudianteId={estudianteId} />`.

- [ ] **Step 2: `HistorialClinicoTab.tsx`** — `<div className="space-y-6">` con `AlergiasSection`, `CondicionesSection`, `EnfermedadesSection`, `MedicamentosHabitualesSection` (todas con prop `estudianteId`).

- [ ] **Step 3: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 11: Tab "Datos personales"

**Files:**
- Create: `src/features/estudiantes/components/DatosPersonalesTab.tsx`

Migra el schema/`resetValuesFrom`/`FORM_DEFAULT_VALUES`/mutaciones de `EstudianteFormDialog.tsx` (sin cambios de lógica) a un contenedor sin diálogo, con un callback `onCreated` para que la página padre reciba el `EstudianteResponse` recién creado/actualizado y pueda desbloquear las otras tabs.

- [ ] **Step 1:** Crear el archivo:

```tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { mapApiErrorToForm } from '@/lib/form-errors'
import type { ApiError } from '@/lib/api-client'
import { useEstudiantes } from '../hooks/use-estudiantes'
import type { CreateEstudianteRequest, EstudianteResponse, GrupoSanguineo, Sexo } from '../types'
import { EstudianteForm, type EstudianteFormValues } from './EstudianteForm'

// schema, FORM_DEFAULT_VALUES y resetValuesFrom: copiar tal cual de EstudianteFormDialog.tsx (sin cambios)

type DatosPersonalesTabProps = {
  estudiante: EstudianteResponse | null
  onCreated: (result: EstudianteResponse) => void
}

export function DatosPersonalesTab({ estudiante, onCreated }: DatosPersonalesTabProps) {
  const createMutation = useEstudiantes.useCreate()
  const updateMutation = useEstudiantes.useUpdate()

  const form = useForm<EstudianteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: estudiante ? resetValuesFrom(estudiante) : FORM_DEFAULT_VALUES,
  })

  useEffect(() => {
    if (estudiante) form.reset(resetValuesFrom(estudiante))
  }, [estudiante, form])

  async function onSubmit(values: EstudianteFormValues) {
    const body: CreateEstudianteRequest = {
      // mismo mapeo que EstudianteFormDialog.tsx
    }
    try {
      if (estudiante) {
        const updated = await updateMutation.mutateAsync({ id: estudiante.id, body })
        toast.success('Estudiante actualizado')
        onCreated(updated)
      } else {
        const created = await createMutation.mutateAsync(body)
        toast.success('Estudiante creado. Ahora puede completar sus referencias e historial clínico.')
        onCreated(created)
      }
    } catch (error) {
      mapApiErrorToForm(error as ApiError, form.setError)
    }
  }

  return (
    <EstudianteForm
      form={form}
      onSubmit={onSubmit}
      onCancel={() => history.back()}
      isPending={createMutation.isPending || updateMutation.isPending}
    />
  )
}
```

- [ ] **Step 2: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 12: `EstudianteFormPage.tsx` — orquestación de tabs y bloqueo en modo creación

**Files:**
- Create: `src/features/estudiantes/components/EstudianteFormPage.tsx`

- [ ] **Step 1:** Crear el archivo:

```tsx
import { useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { InfoIcon } from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useEstudiantes } from '../hooks/use-estudiantes'
import type { EstudianteResponse } from '../types'
import { DatosPersonalesTab } from './DatosPersonalesTab'
import { ReferenciasTab } from './ReferenciasTab'
import { HistorialClinicoTab } from './HistorialClinicoTab'

export function EstudianteFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const estudianteIdFromUrl = id ? Number(id) : undefined

  const { data: estudianteData, isLoading } = useEstudiantes.useGetById(estudianteIdFromUrl)
  const [creado, setCreado] = useState<EstudianteResponse | null>(null)
  const [activeTab, setActiveTab] = useState('datos-personales')

  const estudiante = estudianteIdFromUrl ? (estudianteData ?? null) : creado
  const estudianteId = estudiante?.id
  const subRecursosHabilitados = estudianteId !== undefined

  function handleCreated(result: EstudianteResponse) {
    if (!estudianteIdFromUrl) {
      setCreado(result)
      setActiveTab('referencias')
      navigate(`/estudiantes/${result.id}/editar`, { replace: true })
    }
  }

  if (estudianteIdFromUrl && isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Editar estudiante" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title={estudianteIdFromUrl ? 'Editar estudiante' : 'Nuevo estudiante'} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="datos-personales">Datos personales</TabsTrigger>
          <BloqueableTabsTrigger value="referencias" habilitado={subRecursosHabilitados}>
            Referencias
          </BloqueableTabsTrigger>
          <BloqueableTabsTrigger value="historial-clinico" habilitado={subRecursosHabilitados}>
            Historial clínico
          </BloqueableTabsTrigger>
        </TabsList>

        <TabsContent value="datos-personales">
          <DatosPersonalesTab estudiante={estudiante} onCreated={handleCreated} />
        </TabsContent>

        <TabsContent value="referencias">
          {estudianteId !== undefined && <ReferenciasTab estudianteId={estudianteId} />}
        </TabsContent>

        <TabsContent value="historial-clinico">
          {estudianteId !== undefined && <HistorialClinicoTab estudianteId={estudianteId} />}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BloqueableTabsTrigger({
  value,
  habilitado,
  children,
}: {
  value: string
  habilitado: boolean
  children: ReactNode
}) {
  if (habilitado) {
    return <TabsTrigger value={value}>{children}</TabsTrigger>
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex flex-1">
          <TabsTrigger value={value} disabled className="w-full gap-1">
            {children}
            <InfoIcon className="size-3.5" />
          </TabsTrigger>
        </span>
      </TooltipTrigger>
      <TooltipContent>Guarde los datos personales primero para habilitar esta sección</TooltipContent>
    </Tooltip>
  )
}
```

Notas: `navigate(..., { replace: true })` tras crear evita que "Volver" del navegador regrese a un formulario de creación ya usado. `setActiveTab('referencias')` mueve al usuario al siguiente paso lógico pedido en el encargo. En edición, `subRecursosHabilitados` es `true` desde el primer render.

- [ ] **Step 2: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 13: Rutas y actualización de `EstudianteListPage.tsx` / `EstudianteFichaPage.tsx`

**Files:**
- Modify: `src/app/routes.tsx`
- Modify: `src/features/estudiantes/components/EstudianteListPage.tsx`
- Modify: `src/features/estudiantes/components/EstudianteFichaPage.tsx`
- Delete: `src/features/estudiantes/components/EstudianteFormDialog.tsx`

- [ ] **Step 1: `routes.tsx`** — añadir import de `EstudianteFormPage` y las rutas:

```tsx
import { EstudianteFormPage } from "@/features/estudiantes/components/EstudianteFormPage";
// ...
<Route
  path="/estudiantes/nuevo"
  element={
    <RoleGuard allow={["ADMIN", "ENFERMERIA"]}>
      <EstudianteFormPage />
    </RoleGuard>
  }
/>
<Route
  path="/estudiantes/:id/editar"
  element={
    <RoleGuard allow={["ADMIN", "ENFERMERIA"]}>
      <EstudianteFormPage />
    </RoleGuard>
  }
/>
```

- [ ] **Step 2: `EstudianteListPage.tsx`** — quitar `useSearchParams` y todo el manejo de `?nuevo`/`?editar` (`modoNuevo`, `editarParam`, `editarId`, `enPagina`, `editarData`, `editing`, `dialogOpen`, `handleDialogOpenChange`), y el import/uso de `EstudianteFormDialog`. Los botones navegan:

```tsx
import { useNavigate } from 'react-router-dom'
const navigate = useNavigate()
function openCreate() {
  navigate('/estudiantes/nuevo')
}
function openEdit(row: EstudianteResponse) {
  navigate(`/estudiantes/${row.id}/editar`)
}
```

Quitar el `<EstudianteFormDialog .../>` del final del render.

- [ ] **Step 3: `EstudianteFichaPage.tsx`** — cambiar el botón Editar de `navigate(\`/estudiantes?editar=${numericId}\`)` a `navigate(\`/estudiantes/${numericId}/editar\`)`.

- [ ] **Step 4:** Confirmar con `grep -rn "EstudianteFormDialog" src/` que no queda ninguna referencia, y eliminar `src/features/estudiantes/components/EstudianteFormDialog.tsx`.

- [ ] **Step 5: Verificar** — `pnpm exec tsc -b && pnpm lint`

---

### Task 14: Verificación final

- [ ] **Step 1: Build** — `pnpm build` (exit 0).
- [ ] **Step 2: Lint completo** — `pnpm lint` (exit 0; warnings de `exhaustive-deps` aceptables).
- [ ] **Step 3: Revisión manual (humana)** — `pnpm dev`:
  1. **Crear (ADMIN/ENFERMERIA):** `/estudiantes` → "Nuevo" → llenar Datos personales → Guardar → toast + redirect a `/estudiantes/:id/editar`, tab "Referencias" activa y ambas tabs ya habilitadas.
  2. **Referencias:** guardar médico de referencia (confirmar que sirve tanto para crear como para reemplazar); agregar contacto nuevo (ver en devtools 2 requests: `POST /contactos` + `POST /estudiantes/{id}/contactos`); marcar un segundo contacto como principal y confirmar que el primero deja de estarlo tras refetch; editar (solo parentesco/principal) y eliminar un contacto.
  3. **Historial clínico:** alergia tipo `MEDICAMENTO` (aparece select de medicamento) y tipo `ALIMENTO` (no aparece); agregar/editar/eliminar condición física, enfermedad y medicamento habitual.
  4. **Editar estudiante existente:** desde la lista, "Editar" → 3 tabs habilitadas desde el primer render, datos cargados correctamente en las 3.
  5. Desde la ficha (`/estudiantes/:id`), botón "Editar" → navega a `/estudiantes/:id/editar` (no a `/estudiantes?editar=`).
  6. **Roles:** CONSULTA sin botones Nuevo/Editar y bloqueado por `RoleGuard` si navega manualmente a las rutas nuevas; ENFERMERIA con acceso completo a crear/editar/sub-recursos pero sin "Desactivar" en la ficha (comportamiento ya existente).
  7. `/estudiantes?nuevo`/`?editar=` ya no abren nada (quedan inertes).

---

### Task 15: Actualizar documentación desactualizada

**Files:**
- Modify: `docs/cruds/04-estudiantes-ficha-medica.md`
- Modify: `docs/plans/frontend/03-endpoints-estudiantes.md`

- [ ] **Step 1: `docs/plans/frontend/03-endpoints-estudiantes.md`** — reemplazar la sección de sub-recursos con query params/`Map<String,Object>` por la tabla de contratos de este plan (6 recursos, verbos reales por recurso, sin PUT/DELETE para `Contacto`, sin lista/DELETE para `MedicoReferencia`).

- [ ] **Step 2: `docs/cruds/04-estudiantes-ficha-medica.md`** — actualizar la tabla de endpoints, la sección "Rutas frontend nuevas" (reemplazar el modelo de tabs inline vía `FormDialog` en `/estudiantes/:id` por el modelo real: `/estudiantes/nuevo` y `/estudiantes/:id/editar` como página con `Tabs`, `/estudiantes/:id` sigue siendo ficha de solo lectura) y la sección "Componentes a crear" (estructura real: `EstudianteFormPage.tsx` + `DatosPersonalesTab/ReferenciasTab/HistorialClinicoTab` + un Form/Section por sub-recurso). Quitar preguntas abiertas ya resueltas por este plan.

- [ ] **Step 3: Verificar** — revisión de lectura; confirmar que ningún doc menciona ya `Map<String,Object>`, query params para sub-recursos, ni `FormDialog` inline para sub-recursos.
