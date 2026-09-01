# CRUD completo de Estudiante — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el CRUD completo del recurso `Estudiante` según `docs/superpowers/specs/2026-08-15-estudiantes-crud-design.md`: listado paginado real en `/estudiantes` (reemplaza el `PlaceholderPage`), formulario de creación/edición, y acciones Editar/Desactivar en la ficha `EstudianteFichaPage.tsx` ya existente.

**Contexto del cambio:** El spec `2026-08-15-dashboard-design.md` fue modificado para delegar explícitamente las acciones de editar/desactivar de `/estudiantes/:id` y el listado `/estudiantes` a este spec CRUD (`docs/plans/06-estudiantes-crud.md` ejecuta esa delegación).

**Architecture:** Reutiliza las fábricas existentes `createResourceApi`/`createResourceApiFlatList` (`src/lib/api-factory.ts`) y `createCrudHooks` (`src/lib/crud-hooks-factory.ts`), el patrón de `MedicamentoListPage.tsx` (list + form + rowActions), y los componentes compartidos `DataTable`, `PaginationBar`, `FormDialog`, `ConfirmDeleteDialog`, `PageHeader`. El diálogo se abre/cierra mediante query params (`?nuevo`, `?editar={id}`) como fuente de verdad — sin efectos que llamen `setState` (la regla `react-hooks/set-state-in-effect` es error en este repo; se usa `form.reset` dentro de un efecto en `EstudianteFormDialog`, verificado que no la dispara).

**Tech Stack:** React 19, TypeScript, react-router-dom v7 (`useSearchParams`), @tanstack/react-query, react-hook-form + zod v4 (`zod/v4`) + `@hookform/resolvers/zod`, radix-ui (Select/Dialog/AlertDialog ya envueltos), Tailwind v4, lucide-react, sonner.

**Notas de plan (importantes para el implementador):**
- **NO commits.** Regla de CLAUDE.md: nunca commitear sin orden explícita. Cada task termina con lint/typecheck, sin `git commit`.
- **No hay test runner** en el repo. La verificación de cada task es `pnpm lint` y `pnpm exec tsc -b` (ambos deben salir con exit 0; `exhaustive-deps` es warn, no error). La verificación final es `pnpm build`.
- Lint activo incluye las reglas del React Compiler (`react-hooks/set-state-in-effect`, `set-state-in-render`, `immutability`, `purity`) como errores. **NO** llamar setters de `useState` de forma síncrona dentro de `useEffect`; derivar el estado del diálogo desde los query params en el render. `form.reset(...)` dentro de un efecto NO dispara `set-state-in-effect` (verificado).
- `createResourceApi` (pagina) para `/estudiantes`; `createResourceApiFlatList` (array plano) para `/catalogos/carreras` y `/seguros-medicos`.
- `Badge` solo tiene variantes `default|secondary|destructive|outline|ghost|link` — no usar `variant="warning"`.

---

### Task 1: Types de dominio (añadir a `estudiantes/types.ts`)

**Files:**
- Modify: `src/features/estudiantes/types.ts`

- [x] **Step 1: Añadir los tipos `Sexo`, `GrupoSanguineo` y `CreateEstudianteRequest`**

Añadir al final del archivo (después de `EstudianteResponse`, que no se toca):

```ts
export type Sexo = 'M' | 'F' | 'OTRO'
export type GrupoSanguineo =
  | 'O_POS'
  | 'O_NEG'
  | 'A_POS'
  | 'A_NEG'
  | 'B_POS'
  | 'B_NEG'
  | 'AB_POS'
  | 'AB_NEG'

export type CreateEstudianteRequest = {
  matricula: string
  cedula: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  sexo: Sexo
  grupoSanguineo: GrupoSanguineo
  email: string
  telefono?: string
  carreraId: number
  seguroMedicoId?: number
}
```

- [x] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 2: API CRUD de estudiantes

**Files:**
- Modify: `src/features/estudiantes/api/estudiantes-api.ts`

- [x] **Step 1: Añadir `estudiantesCrudApi`**

Añadir los imports y la instancia al final del archivo actual (las funciones `searchEstudiantes`/`getFichaEmergencia` no se tocan):

```ts
import { createResourceApi } from '@/lib/api-factory'
import type { CreateEstudianteRequest } from '../types'

export const estudiantesCrudApi = createResourceApi<EstudianteResponse, CreateEstudianteRequest>(
  '/estudiantes',
)
```

Nota: `createResourceApi` expone `list`/`getById`/`create`/`update`/`remove`. El `update` usará `TUpdate = TCreate` (mismo body en POST y PUT).

- [x] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 3: Hooks CRUD (`use-estudiantes.ts`)

**Files:**
- Create: `src/features/estudiantes/hooks/use-estudiantes.ts`

- [x] **Step 1: Crear el archivo**

```ts
import { createCrudHooks } from '@/lib/crud-hooks-factory'
import type { PageResponse } from '@/types/pagination'
import type { CreateEstudianteRequest, EstudianteResponse } from '../types'
import { estudiantesCrudApi } from '../api/estudiantes-api'

export const useEstudiantes = createCrudHooks<
  EstudianteResponse,
  CreateEstudianteRequest,
  CreateEstudianteRequest,
  PageResponse<EstudianteResponse>
>('estudiantes', estudiantesCrudApi)
```

Esto expone `useEstudiantes.useList`, `.useGetById`, `.useCreate`, `.useUpdate`, `.useRemove`. La invalidación en create/update/remove (`invalidateQueries(['estudiantes'])`) refresca también `useEstudianteSearch` y `useEstudianteFicha` (mismo prefijo) — deseado.

- [x] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 4: Hooks de catálogos (carreras y seguros médicos)

**Files:**
- Create: `src/features/catalogos/hooks/useCarreras.ts`
- Create: `src/features/catalogos/hooks/useSegurosMedicos.ts`

- [x] **Step 1: Crear `useCarreras.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { createResourceApiFlatList } from '@/lib/api-factory'
import type { Carrera, CreateCarreraRequest } from '../types'

const carrerasApi = createResourceApiFlatList<Carrera, CreateCarreraRequest>('/catalogos/carreras')

export function useCarreras() {
  return useQuery({
    queryKey: ['catalogos', 'carreras'],
    queryFn: () => carrerasApi.list(),
  })
}
```

- [x] **Step 2: Crear `useSegurosMedicos.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { createResourceApiFlatList } from '@/lib/api-factory'
import type { SeguroMedico, CreateSeguroMedicoRequest } from '../types'

const segurosMedicosApi = createResourceApiFlatList<SeguroMedico, CreateSeguroMedicoRequest>(
  '/seguros-medicos',
)

export function useSegurosMedicos() {
  return useQuery({
    queryKey: ['catalogos', 'seguros-medicos'],
    queryFn: () => segurosMedicosApi.list(),
  })
}
```

Nota: la respuesta del backend para carreras/seguros es un array plano (por eso `FlatList`). El campo `activo` del tipo frontend no existe en la respuesta real; no se renderiza.

- [x] **Step 3: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 5: `EstudianteForm.tsx`

**Files:**
- Create: `src/features/estudiantes/components/EstudianteForm.tsx`

Mismo contrato que `MedicamentoForm.tsx` / `LoteForm.tsx` (recibe `form`/`onSubmit`/`onCancel`/`isPending` desde el contenedor del diálogo).

- [x] **Step 1: Crear el archivo**

```tsx
import type { UseFormReturn } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCarreras } from '@/features/catalogos/hooks/useCarreras'
import { useSegurosMedicos } from '@/features/catalogos/hooks/useSegurosMedicos'
import type { GrupoSanguineo, Sexo } from '../types'

type EstudianteFormValues = {
  matricula: string
  cedula: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  sexo: '' | Sexo
  grupoSanguineo: '' | GrupoSanguineo
  email: string
  telefono: string
  carreraId: number
  seguroMedicoId: number | null
}

export type { EstudianteFormValues }

type EstudianteFormProps = {
  form: UseFormReturn<EstudianteFormValues, object, EstudianteFormValues>
  onSubmit: (values: EstudianteFormValues) => Promise<void>
  onCancel: () => void
  isPending: boolean
}

const SEXOS: Sexo[] = ['M', 'F', 'OTRO']
const GRUPOS_SANGUINEOS: GrupoSanguineo[] = [
  'O_POS',
  'O_NEG',
  'A_POS',
  'A_NEG',
  'B_POS',
  'B_NEG',
  'AB_POS',
  'AB_NEG',
]

export function EstudianteForm({ form, onSubmit, onCancel, isPending }: EstudianteFormProps) {
  const { data: carrerasData } = useCarreras()
  const carreras = carrerasData ?? []
  const { data: segurosData } = useSegurosMedicos()
  const seguros = segurosData ?? []

  return (
    <form onSubmit={form.handleSubmit((v) => onSubmit(v as EstudianteFormValues))} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="matricula">Matrícula</Label>
          <Input id="matricula" {...form.register('matricula')} placeholder="Matrícula" />
          {form.formState.errors.matricula && (
            <p className="text-sm text-destructive">{form.formState.errors.matricula.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cedula">Cédula</Label>
          <Input id="cedula" {...form.register('cedula')} placeholder="Cédula" />
          {form.formState.errors.cedula && (
            <p className="text-sm text-destructive">{form.formState.errors.cedula.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nombre">Nombre</Label>
          <Input id="nombre" {...form.register('nombre')} placeholder="Nombre" />
          {form.formState.errors.nombre && (
            <p className="text-sm text-destructive">{form.formState.errors.nombre.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" {...form.register('apellido')} placeholder="Apellido" />
          {form.formState.errors.apellido && (
            <p className="text-sm text-destructive">{form.formState.errors.apellido.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
          <Input id="fechaNacimiento" type="date" {...form.register('fechaNacimiento')} />
          {form.formState.errors.fechaNacimiento && (
            <p className="text-sm text-destructive">{form.formState.errors.fechaNacimiento.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Sexo</Label>
          <Select
            value={form.watch('sexo')}
            onValueChange={(value) => form.setValue('sexo', value as Sexo)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un sexo" />
            </SelectTrigger>
            <SelectContent>
              {SEXOS.map((sexo) => (
                <SelectItem key={sexo} value={sexo}>
                  {sexo === 'OTRO' ? 'Otro' : sexo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.sexo && (
            <p className="text-sm text-destructive">{form.formState.errors.sexo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Grupo sanguíneo</Label>
          <Select
            value={form.watch('grupoSanguineo')}
            onValueChange={(value) => form.setValue('grupoSanguineo', value as GrupoSanguineo)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione un grupo sanguíneo" />
            </SelectTrigger>
            <SelectContent>
              {GRUPOS_SANGUINEOS.map((grupo) => (
                <SelectItem key={grupo} value={grupo}>
                  {grupo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.grupoSanguineo && (
            <p className="text-sm text-destructive">{form.formState.errors.grupoSanguineo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register('email')} placeholder="correo@ejemplo.com" />
          {form.formState.errors.email && (
            <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Teléfono</Label>
          <Input id="telefono" {...form.register('telefono')} placeholder="Teléfono (opcional)" />
        </div>

        <div className="space-y-2">
          <Label>Carrera</Label>
          <Select
            value={form.watch('carreraId') ? String(form.watch('carreraId')) : ''}
            onValueChange={(value) => form.setValue('carreraId', Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Seleccione una carrera" />
            </SelectTrigger>
            <SelectContent>
              {carreras.map((carrera) => (
                <SelectItem key={carrera.id} value={String(carrera.id)}>
                  {carrera.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.carreraId && (
            <p className="text-sm text-destructive">{form.formState.errors.carreraId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Seguro médico</Label>
          <Select
            value={form.watch('seguroMedicoId') ? String(form.watch('seguroMedicoId')) : ''}
            onValueChange={(value) =>
              form.setValue('seguroMedicoId', value === '' ? null : Number(value))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Sin seguro médico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin seguro médico</SelectItem>
              {seguros.map((seguro) => (
                <SelectItem key={seguro.id} value={String(seguro.id)}>
                  {seguro.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.seguroMedicoId && (
            <p className="text-sm text-destructive">{form.formState.errors.seguroMedicoId.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar'}
        </Button>
      </div>
    </form>
  )
}
```

- [x] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 6: `EstudianteFormDialog.tsx`

**Files:**
- Create: `src/features/estudiantes/components/EstudianteFormDialog.tsx`

Contenedor que posee el `useForm`, el schema zod, y las mutaciones create/update. Se resetea el form con `form.reset` dentro de un `useEffect` (patrón verificado: no dispara `react-hooks/set-state-in-effect`).

- [x] **Step 1: Crear el archivo**

```tsx
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod/v4'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'

import { FormDialog } from '@/components/shared/FormDialog'
import { mapApiErrorToForm } from '@/lib/form-errors'
import type { ApiError } from '@/lib/api-client'
import { useEstudiantes } from '../hooks/use-estudiantes'
import type {
  CreateEstudianteRequest,
  EstudianteResponse,
  GrupoSanguineo,
  Sexo,
} from '../types'
import { EstudianteForm, type EstudianteFormValues } from './EstudianteForm'

const schema = z.object({
  matricula: z.string().min(1, 'La matrícula es obligatoria'),
  cedula: z.string().min(1, 'La cédula es obligatoria'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido: z.string().min(1, 'El apellido es obligatorio'),
  fechaNacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
  sexo: z.enum(['', 'M', 'F', 'OTRO']).refine((v) => v !== '', { message: 'Seleccione un sexo' }),
  grupoSanguineo: z
    .enum(['', 'O_POS', 'O_NEG', 'A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG'])
    .refine((v) => v !== '', { message: 'Seleccione un grupo sanguíneo' }),
  email: z.string().min(1, 'El email es obligatorio').email('Ingrese un email válido'),
  telefono: z.string(),
  carreraId: z.number().min(1, 'Seleccione una carrera'),
  seguroMedicoId: z.number().nullable(),
})

const FORM_DEFAULT_VALUES: EstudianteFormValues = {
  matricula: '',
  cedula: '',
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  sexo: '',
  grupoSanguineo: '',
  email: '',
  telefono: '',
  carreraId: 0,
  seguroMedicoId: null,
}

function resetValuesFrom(row: EstudianteResponse): EstudianteFormValues {
  return {
    matricula: row.matricula,
    cedula: row.cedula,
    nombre: row.nombre,
    apellido: row.apellido,
    fechaNacimiento: row.fechaNacimiento,
    sexo: row.sexo as Sexo,
    grupoSanguineo: row.grupoSanguineo as GrupoSanguineo,
    email: row.email,
    telefono: row.telefono,
    carreraId: row.carreraId,
    seguroMedicoId: row.seguroMedicoId,
  }
}

type EstudianteFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: EstudianteResponse | null
}

export function EstudianteFormDialog({ open, onOpenChange, editing }: EstudianteFormDialogProps) {
  const createMutation = useEstudiantes.useCreate()
  const updateMutation = useEstudiantes.useUpdate()

  const form = useForm<EstudianteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: FORM_DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(editing ? resetValuesFrom(editing) : FORM_DEFAULT_VALUES)
    }
  }, [open, editing, form])

  async function onSubmit(values: EstudianteFormValues) {
    const body: CreateEstudianteRequest = {
      matricula: values.matricula,
      cedula: values.cedula,
      nombre: values.nombre,
      apellido: values.apellido,
      fechaNacimiento: values.fechaNacimiento,
      sexo: values.sexo as Sexo,
      grupoSanguineo: values.grupoSanguineo as GrupoSanguineo,
      email: values.email,
      telefono: values.telefono || undefined,
      carreraId: values.carreraId,
      seguroMedicoId: values.seguroMedicoId ?? undefined,
    }
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, body })
        toast.success('Estudiante actualizado')
      } else {
        await createMutation.mutateAsync(body)
        toast.success('Estudiante creado')
      }
      onOpenChange(false)
    } catch (error) {
      mapApiErrorToForm(error as ApiError, form.setError)
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Editar estudiante' : 'Nuevo estudiante'}
    >
      <EstudianteForm
        form={form}
        onSubmit={onSubmit}
        onCancel={() => onOpenChange(false)}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </FormDialog>
  )
}
```

- [x] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 7: `EstudianteListPage.tsx`

**Files:**
- Create: `src/features/estudiantes/components/EstudianteListPage.tsx`

Listado paginado real con búsqueda server-side (debounce 300ms), `DataTable`, `PaginationBar`, y rowActions (editar para ADMIN/ENFERMERIA, desactivar solo ADMIN). El estado del diálogo se deriva de los query params (`?nuevo`, `?editar={id}`) — sin `setState` dentro de efectos.

- [x] **Step 1: Crear el archivo**

```tsx
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { PaginationBar } from '@/components/shared/Pagination'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useEstudiantes } from '../hooks/use-estudiantes'
import type { EstudianteResponse } from '../types'
import { EstudianteFormDialog } from './EstudianteFormDialog'

export function EstudianteListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtro, setFiltro] = useState('')
  const [debouncedFiltro, setDebouncedFiltro] = useState('')
  const [page, setPage] = useState(0)

  const { user } = useAuth()
  const roles = user?.roles ?? []
  const puedeEscribir = roles.includes('ADMIN') || roles.includes('ENFERMERIA')
  const esAdmin = roles.includes('ADMIN')

  const { data, isLoading } = useEstudiantes.useList({ filtro: debouncedFiltro, page, size: 10 })
  const removeMutation = useEstudiantes.useRemove()

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedFiltro(filtro.trim()), 300)
    return () => clearTimeout(timeout)
  }, [filtro])

  useEffect(() => {
    setPage(0)
  }, [debouncedFiltro])

  const modoNuevo = searchParams.has('nuevo')
  const editarParam = searchParams.get('editar')
  const editarId =
    editarParam !== null && editarParam !== '' && Number.isInteger(Number(editarParam))
      ? Number(editarParam)
      : undefined

  const enPagina =
    editarId !== undefined ? data?.content.find((est) => est.id === editarId) : undefined
  const { data: editarData } = useEstudiantes.useGetById(
    editarId !== undefined && !enPagina ? editarId : undefined,
  )
  const editing = enPagina ?? editarData ?? null
  const dialogOpen = modoNuevo || editing !== null

  function handleDialogOpenChange(open: boolean) {
    if (open) return
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('nuevo')
        next.delete('editar')
        return next
      },
      { replace: true },
    )
  }

  function openCreate() {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('nuevo', '1')
        next.delete('editar')
        return next
      },
      { replace: true },
    )
  }

  function openEdit(row: EstudianteResponse) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('editar', String(row.id))
        next.delete('nuevo')
        return next
      },
      { replace: true },
    )
  }

  const columns: Column<EstudianteResponse>[] = [
    { header: 'Matrícula', cell: (row) => row.matricula },
    { header: 'Cédula', cell: (row) => row.cedula },
    { header: 'Nombre completo', cell: (row) => `${row.nombre} ${row.apellido}` },
    { header: 'Carrera', cell: (row) => row.carreraNombre },
    { header: 'Grupo sanguíneo', cell: (row) => row.grupoSanguineo },
    { header: 'Seguro médico', cell: (row) => row.seguroMedicoNombre ?? '—' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estudiantes"
        action={
          <Button onClick={openCreate}>
            <PlusIcon className="size-4" />
            Nuevo
          </Button>
        }
      />

      <div className="relative max-w-md">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          placeholder="Buscar por matrícula, nombre o apellido..."
          className="pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.content ?? []}
        isLoading={isLoading}
        emptyMessage="No hay estudiantes registrados"
        rowActions={
          puedeEscribir
            ? (row) => (
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon-xs" onClick={() => openEdit(row)}>
                    <PencilIcon />
                  </Button>
                  {esAdmin && (
                    <ConfirmDeleteDialog
                      trigger={
                        <Button variant="ghost" size="icon-xs">
                          <Trash2Icon />
                        </Button>
                      }
                      title="Desactivar estudiante"
                      description={`¿Está seguro que desea desactivar a "${row.nombre} ${row.apellido}"?`}
                      onConfirm={() => removeMutation.mutate(row.id)}
                      isPending={removeMutation.isPending}
                    />
                  )}
                </div>
              )
            : undefined
        }
      />

      <PaginationBar
        page={data?.number ?? 0}
        totalPages={data?.totalPages ?? 0}
        onPageChange={setPage}
      />

      <EstudianteFormDialog
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        editing={editing}
      />
    </div>
  )
}
```

Comportamiento del auto-open desde la ficha: `?editar={id}` → si el estudiante está en la página actual, `enPagina` lo encuentra y se abre al instante; si no, `useGetById` lo busca puntualmente y el diálogo abre al llegar los datos.

- [x] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 8: Acciones en `EstudianteFichaPage.tsx`

**Files:**
- Modify: `src/features/estudiantes/components/EstudianteFichaPage.tsx`

Añadir al header de la ficha (junto al botón "Volver" existente): "Editar" (ADMIN/ENFERMERIA) → `navigate('/estudiantes?editar=' + id)`, y "Desactivar" (solo ADMIN) con `ConfirmDeleteDialog` inline → al confirmar, `useRemove` y `navigate('/dashboard')`. Sin cambios en el resto del contenido.

- [x] **Step 1: Modificar imports y cuerpo**

Reemplazar el bloque de imports (líneas 1-9) por:

```tsx
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDeleteDialog } from '@/components/shared/ConfirmDeleteDialog'
import { useAuth } from '@/features/auth/hooks/useAuth'
import { useEstudianteFicha } from '../hooks/use-estudiante-ficha'
import { useEstudiantes } from '../hooks/use-estudiantes'
```

`InfoItem` y `ListaChips` se mantienen igual.

Reemplazar la firma y el cuerpo inicial del componente (líneas 39-42) por:

```tsx
export function EstudianteFichaPage() {
  const { id } = useParams<{ id: string }>()
  const numericId = id ? Number(id) : undefined
  const navigate = useNavigate()
  const { user } = useAuth()
  const roles = user?.roles ?? []
  const puedeEditar = roles.includes('ADMIN') || roles.includes('ENFERMERIA')
  const esAdmin = roles.includes('ADMIN')

  const { data: ficha, isLoading, isError, refetch } = useEstudianteFicha(numericId)
  const removeMutation = useEstudiantes.useRemove()
```

El bloque de loading y el de error (`isError || !ficha`) se mantienen igual.

Justo después del bloque de error, añadir el handler:

```tsx
  function handleDesactivar(estudianteId: number) {
    removeMutation.mutate(estudianteId, {
      onSuccess: () => {
        toast.success('Estudiante desactivado')
        navigate('/dashboard')
      },
    })
  }
```

Reemplazar el `action` del `PageHeader` (bloque de las líneas 85-93) por:

```tsx
        action={
          <div className="flex flex-wrap items-center gap-2">
            {puedeEditar && (
              <Button variant="outline" onClick={() => navigate(`/estudiantes?editar=${numericId}`)}>
                <PencilIcon /> Editar
              </Button>
            )}
            {esAdmin && (
              <ConfirmDeleteDialog
                trigger={
                  <Button variant="outline">
                    <Trash2Icon /> Desactivar
                  </Button>
                }
                title="Desactivar estudiante"
                description={`¿Está seguro que desea desactivar a "${ficha.nombre} ${ficha.apellido}"?`}
                onConfirm={() => handleDesactivar(ficha.estudianteId)}
                isPending={removeMutation.isPending}
              />
            )}
            <Button variant="outline" asChild>
              <Link to="/dashboard">
                <ArrowLeftIcon /> Volver
              </Link>
            </Button>
          </div>
        }
```

- [x] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 9: Rutas

**Files:**
- Modify: `src/app/routes.tsx`

- [x] **Step 1: Añadir import y reemplazar la ruta placeholder**

Añadir el import (junto al de `EstudianteFichaPage`, línea 13):

```tsx
import { EstudianteListPage } from "@/features/estudiantes/components/EstudianteListPage";
```

Reemplazar el bloque de la ruta `/estudiantes` (líneas 35-38, actualmente un `PlaceholderPage`) por:

```tsx
        <Route
          path="/estudiantes"
          element={
            <RoleGuard allow={["ADMIN", "ENFERMERIA", "CONSULTA"]}>
              <EstudianteListPage />
            </RoleGuard>
          }
        />
```

- [x] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 10: Verificación final

- [x] **Step 1: Build de producción**

Run: `pnpm build`
Expected: `tsc -b` y `vite build` exit 0.

- [x] **Step 2: Lint completo**

Run: `pnpm lint`
Expected: exit 0 sin errores (warnings de `exhaustive-deps` son aceptables).

- [ ] **Step 3: Revisión manual (humana)**

`pnpm dev` →
- `/estudiantes`: buscar, paginar, crear un estudiante, editarlo, desactivarlo (como ADMIN).
- Como ENFERMERIA: puede crear/editar, no ve botón desactivar.
- Como CONSULTA: ve la tabla, sin columna de Acciones.
- Desde `/dashboard`, buscar un estudiante → en su ficha, click "Editar" → confirma que abre `/estudiantes` con el diálogo de edición ya cargado para ese estudiante.
- Desde la ficha, "Desactivar" (ADMIN) → confirma redirect a `/dashboard` y que el estudiante ya no aparece en `/estudiantes`.
