# Dashboard con búsqueda rápida de estudiantes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el placeholder de `/` por un dashboard responsive con búsqueda rápida de estudiantes, KPIs, alertas y gráficos, más la ficha de emergencia `/estudiantes/:id`.

**Architecture:** Feature folders `src/features/dashboard/` y `src/features/estudiantes/` siguiendo el patrón api/hooks/components del repo. Cada tarjeta consulta de forma independiente con React Query (loading/error propio). El buscador usa `Popover` de radix-ui (el primitivo `command` NO existe en radix-ui ni cmdk está instalado) con dropdown listado a mano. Gráficos CSS/SVG propios (no hay librería de charts).

**Tech Stack:** React 19, TypeScript, react-router-dom v7, @tanstack/react-query, radix-ui, Tailwind v4, axios.

**Notas de plan (importantes para el implementador):**
- **NO commits.** Regla de CLAUDE.md: nunca commitear sin orden explícita. Cada task termina con lint/typecheck, sin `git commit`.
- **No hay test runner** en el repo. La verificación de cada task es `pnpm lint` y `pnpm exec tsc -b`. La verificación final es `pnpm build`.
- El spec pide primitivas `popover`/`command` de radix-ui "sin nueva dependencia", pero radix-ui NO expone `command` (es cmdk). Se usa solo `Popover` y el listado de resultados se renderiza como lista HTML dentro de `PopoverContent`. Verificado en `node_modules`: `Popover: true | Command: false`.
- El spec pide gráficos siguiendo la skill `dataviz`, que no está instalada. Se usan tokens de la paleta del proyecto y bar/donut CSS puros.

---

### Task 1: Types de dominio (estudiantes + dashboard)

**Files:**
- Create: `src/features/estudiantes/types.ts`
- Create: `src/features/dashboard/types.ts`

- [ ] **Step 1: Crear `src/features/estudiantes/types.ts`**

```ts
export interface AptitudDonacion {
  apto: boolean
  motivos: string[]
}

export interface FichaEmergenciaResponse {
  estudianteId: number
  nombre: string
  apellido: string
  grupoSanguineo: string
  email: string
  telefono: string
  carrera: string
  seguroMedico: string
  alergias: string[]
  condicionesFisicas: string[]
  enfermedadesCronicas: string[]
  medicamentosHabituales: string[]
  medicoReferencia: string
  contactoPrincipal: string
  aptitudDonacion: AptitudDonacion
}

export interface EstudianteResponse {
  id: number
  matricula: string
  cedula: string
  nombre: string
  apellido: string
  fechaNacimiento: string
  sexo: string
  grupoSanguineo: string
  email: string
  telefono: string
  carreraId: number
  carreraNombre: string
  seguroMedicoId: number | null
  seguroMedicoNombre: string | null
}
```

- [ ] **Step 2: Crear `src/features/dashboard/types.ts`**

```ts
export interface VisitasPorCarreraReporteResponse {
  carrera: string
  cantidad: number
}

export interface DistribucionGrupoSanguineoReporteResponse {
  grupoSanguineo: string
  cantidad: number
}

export interface StockBajoAlertaResponse {
  insumoId: number
  insumoNombre: string
  stockActual: number
  stockMinimo: number
}

export interface VencimientoProximoAlertaResponse {
  loteId: number
  numeroLote: string
  insumoNombre: string
  fechaVencimiento: string
  cantidadDisponible: number
}
```

- [ ] **Step 3: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 2: Primitiva UI `Popover` (shadcn-style)

**Files:**
- Create: `src/components/ui/popover.tsx`

El repo importa desde el paquete unificado `radix-ui` (ver `src/components/ui/tooltip.tsx`), no desde `@radix-ui/react-popover`.

- [ ] **Step 1: Crear `src/components/ui/popover.tsx`**

```tsx
"use client"

import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border border-border bg-popover p-4 shadow-md outline-hidden",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverAnchor, PopoverContent }
```

- [ ] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 3: API y hooks del dashboard

**Files:**
- Create: `src/features/dashboard/api/dashboard-api.ts`
- Create: `src/features/dashboard/hooks/use-dashboard-queries.ts`

- [ ] **Step 1: Crear `src/features/dashboard/api/dashboard-api.ts`**

```ts
import { apiClient } from '@/lib/api-client'
import type { PageResponse } from '@/types/pagination'
import type { EstudianteResponse } from '@/features/estudiantes/types'
import type {
  StockBajoAlertaResponse,
  VencimientoProximoAlertaResponse,
  DistribucionGrupoSanguineoReporteResponse,
  VisitasPorCarreraReporteResponse,
} from '../types'

export function getStockBajo() {
  return apiClient.get<StockBajoAlertaResponse[]>('/reportes/stock-bajo').then((r) => r.data)
}

export function getVencimientoProximo() {
  return apiClient
    .get<VencimientoProximoAlertaResponse[]>('/reportes/vencimiento-proximo', {
      params: { dias: 30 },
    })
    .then((r) => r.data)
}

export function getDistribucionGrupoSanguineo() {
  return apiClient
    .get<DistribucionGrupoSanguineoReporteResponse[]>('/reportes/distribucion-grupo-sanguineo')
    .then((r) => r.data)
}

export function getVisitasPorCarrera() {
  return apiClient
    .get<VisitasPorCarreraReporteResponse[]>('/reportes/visitas-por-carrera')
    .then((r) => r.data)
}

export function getTotalEstudiantes() {
  return apiClient
    .get<PageResponse<EstudianteResponse>>('/estudiantes', { params: { size: 1 } })
    .then((r) => r.data)
}
```

- [ ] **Step 2: Crear `src/features/dashboard/hooks/use-dashboard-queries.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import {
  getStockBajo,
  getVencimientoProximo,
  getDistribucionGrupoSanguineo,
  getVisitasPorCarrera,
  getTotalEstudiantes,
} from '../api/dashboard-api'

export function useStockBajo() {
  return useQuery({ queryKey: ['dashboard', 'stock-bajo'], queryFn: getStockBajo })
}

export function useVencimientoProximo() {
  return useQuery({
    queryKey: ['dashboard', 'vencimiento-proximo'],
    queryFn: getVencimientoProximo,
  })
}

export function useDistribucionGrupoSanguineo() {
  return useQuery({
    queryKey: ['dashboard', 'distribucion-grupo-sanguineo'],
    queryFn: getDistribucionGrupoSanguineo,
  })
}

export function useVisitasPorCarrera() {
  return useQuery({
    queryKey: ['dashboard', 'visitas-por-carrera'],
    queryFn: getVisitasPorCarrera,
  })
}

export function useTotalEstudiantes() {
  return useQuery({
    queryKey: ['dashboard', 'total-estudiantes'],
    queryFn: getTotalEstudiantes,
  })
}
```

- [ ] **Step 3: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 4: API y hooks de estudiantes

**Files:**
- Create: `src/features/estudiantes/api/estudiantes-api.ts`
- Create: `src/features/estudiantes/hooks/use-estudiante-search.ts`
- Create: `src/features/estudiantes/hooks/use-estudiante-ficha.ts`

- [ ] **Step 1: Crear `src/features/estudiantes/api/estudiantes-api.ts`**

```ts
import { apiClient } from '@/lib/api-client'
import type { PageResponse } from '@/types/pagination'
import type { EstudianteResponse, FichaEmergenciaResponse } from '../types'

export function searchEstudiantes(filtro: string) {
  return apiClient
    .get<PageResponse<EstudianteResponse>>('/estudiantes', {
      params: { filtro, size: 8 },
    })
    .then((r) => r.data)
}

export function getFichaEmergencia(id: number) {
  return apiClient
    .get<FichaEmergenciaResponse>(`/estudiantes/${id}/ficha`)
    .then((r) => r.data)
}
```

- [ ] **Step 2: Crear `src/features/estudiantes/hooks/use-estudiante-search.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { searchEstudiantes } from '../api/estudiantes-api'

export function useEstudianteSearch(filtro: string) {
  const trimmed = filtro.trim()
  return useQuery({
    queryKey: ['estudiantes', 'search', trimmed],
    queryFn: () => searchEstudiantes(trimmed),
    enabled: trimmed.length >= 2,
  })
}
```

- [ ] **Step 3: Crear `src/features/estudiantes/hooks/use-estudiante-ficha.ts`**

```ts
import { useQuery } from '@tanstack/react-query'
import { getFichaEmergencia } from '../api/estudiantes-api'

export function useEstudianteFicha(id: number | undefined) {
  return useQuery({
    queryKey: ['estudiantes', 'ficha', id],
    queryFn: () => getFichaEmergencia(id as number),
    enabled: id !== undefined,
  })
}
```

- [ ] **Step 4: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 5: Buscador rápido `StudentQuickSearch`

**Files:**
- Create: `src/features/dashboard/components/StudentQuickSearch.tsx`

Comportamiento: debounce 300ms; dispara query solo con ≥2 caracteres; dropdown con resultados (nombre, apellido, matrícula); click → `navigate('/estudiantes/${id}')`; "No se encontraron estudiantes" si vacío. Usa `PopoverAnchor` (no `PopoverTrigger`) para que el input no cierre el popover al hacer clic de nuevo mientras se escribe.

- [ ] **Step 1: Crear `src/features/dashboard/components/StudentQuickSearch.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SearchIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover'
import { useEstudianteSearch } from '@/features/estudiantes/hooks/use-estudiante-search'

export function StudentQuickSearch() {
  const navigate = useNavigate()
  const [filtro, setFiltro] = useState('')
  const [debouncedFiltro, setDebouncedFiltro] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedFiltro(filtro.trim()), 300)
    return () => clearTimeout(timeout)
  }, [filtro])

  const { data, isFetching, isError, refetch } = useEstudianteSearch(debouncedFiltro)
  const resultados = data?.content ?? []

  function handleSelect(estudianteId: number) {
    setOpen(false)
    setFiltro('')
    navigate(`/estudiantes/${estudianteId}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Buscar estudiante..."
            className="pl-9"
            autoComplete="off"
          />
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" side="bottom" className="w-full p-0">
        {debouncedFiltro.length < 2 ? (
          <p className="p-4 text-sm text-muted-foreground">
            Escribe al menos 2 caracteres para buscar
          </p>
        ) : isError ? (
          <div className="space-y-2 p-4">
            <p className="text-sm text-destructive">No se pudo completar la búsqueda</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : isFetching ? (
          <div className="space-y-2 p-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : resultados.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">
            No se encontraron estudiantes
          </p>
        ) : (
          <ul className="max-h-64 overflow-auto p-1">
            {resultados.map((est) => (
              <li key={est.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(est.id)}
                  className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-accent"
                >
                  <span className="text-sm font-medium">
                    {est.nombre} {est.apellido}
                  </span>
                  <span className="text-xs text-muted-foreground">{est.matricula}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 6: Tarjetas de información (KPI y alertas)

**Files:**
- Create: `src/features/dashboard/components/TotalEstudiantesKpi.tsx`
- Create: `src/features/dashboard/components/StockBajoCard.tsx`
- Create: `src/features/dashboard/components/VencimientoProximoCard.tsx`

Nota: `Badge` solo tiene variantes `default|secondary|destructive|outline|ghost|link` — no usar `variant="warning"`.

- [ ] **Step 1: Crear `src/features/dashboard/components/TotalEstudiantesKpi.tsx`**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useTotalEstudiantes } from '../hooks/use-dashboard-queries'

export function TotalEstudiantesKpi() {
  const { data, isLoading, isError, refetch } = useTotalEstudiantes()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Total de estudiantes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">No se pudo cargar</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <p className="text-3xl font-bold text-primary">{data?.totalElements ?? 0}</p>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Crear `src/features/dashboard/components/StockBajoCard.tsx`**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useStockBajo } from '../hooks/use-dashboard-queries'

export function StockBajoCard() {
  const { data, isLoading, isError, refetch } = useStockBajo()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock bajo</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">No se pudieron cargar las alertas</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Sin alertas de stock bajo</p>
        ) : (
          <ul className="space-y-3">
            {data?.map((insumo) => (
              <li key={insumo.insumoId} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{insumo.insumoNombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {insumo.stockActual} / mínimo {insumo.stockMinimo}
                  </p>
                </div>
                <Badge variant="destructive">{insumo.stockActual}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Crear `src/features/dashboard/components/VencimientoProximoCard.tsx`**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useVencimientoProximo } from '../hooks/use-dashboard-queries'

function formatFecha(iso: string) {
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('es-DO')
}

function diasParaVencer(iso: string) {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vence = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(vence.getTime())) return null
  return Math.ceil((vence.getTime() - hoy.getTime()) / 86400000)
}

export function VencimientoProximoCard() {
  const { data, isLoading, isError, refetch } = useVencimientoProximo()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vencimientos próximos (30 días)</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">No se pudieron cargar las alertas</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Sin vencimientos próximos</p>
        ) : (
          <ul className="space-y-3">
            {data?.map((lote) => {
              const dias = diasParaVencer(lote.fechaVencimiento)
              const texto = dias === 0 ? 'Vence hoy' : dias === 1 ? 'Vence mañana' : `${dias} días`
              return (
                <li key={lote.loteId} className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{lote.insumoNombre}</p>
                    <p className="text-xs text-muted-foreground">
                      Lote {lote.numeroLote} · {formatFecha(lote.fechaVencimiento)} ·{' '}
                      {lote.cantidadDisponible} u.
                    </p>
                  </div>
                  {dias !== null &&
                    (dias <= 10 ? (
                      <Badge variant="destructive">{texto}</Badge>
                    ) : (
                      <Badge variant="secondary">{texto}</Badge>
                    ))}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 7: Gráficos

**Files:**
- Create: `src/features/dashboard/components/GrupoSanguineoChart.tsx`
- Create: `src/features/dashboard/components/VisitasPorCarreraChart.tsx`

Gráficos CSS puros (sin librería). Donut vía `conic-gradient` para grupo sanguíneo; barras horizontales para visitas por carrera. Paleta = tokens del proyecto.

- [ ] **Step 1: Crear `src/features/dashboard/components/GrupoSanguineoChart.tsx`**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useDistribucionGrupoSanguineo } from '../hooks/use-dashboard-queries'

const CHART_COLORS = [
  '#0057A8',
  '#C9A227',
  '#16A34A',
  '#F59E0B',
  '#DC2626',
  '#6366F1',
  '#0EA5E9',
  '#8B5CF6',
]

export function GrupoSanguineoChart() {
  const { data, isLoading, isError, refetch } = useDistribucionGrupoSanguineo()

  const total = data?.reduce((acc, item) => acc + item.cantidad, 0) ?? 0
  let acumulado = 0
  const gradiente =
    data?.map((item, index) => {
      const inicio = (acumulado / Math.max(total, 1)) * 100
      acumulado += item.cantidad
      const fin = (acumulado / Math.max(total, 1)) * 100
      return `${CHART_COLORS[index % CHART_COLORS.length]} ${inicio}% ${fin}%`
    }) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribución grupo sanguíneo</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-6">
            <Skeleton className="size-32 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">No se pudo cargar el gráfico</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos de grupo sanguíneo</p>
        ) : (
          <div className="flex flex-wrap items-center gap-6">
            <div
              className="size-32 shrink-0 rounded-full"
              style={{ background: `conic-gradient(${gradiente.join(', ')})` }}
              role="img"
              aria-label="Distribución de grupos sanguíneos"
            />
            <ul className="min-w-40 flex-1 space-y-1.5 text-sm">
              {data?.map((item, index) => {
                const pct = total > 0 ? Math.round((item.cantidad / total) * 100) : 0
                return (
                  <li
                    key={item.grupoSanguineo}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      {item.grupoSanguineo}
                    </span>
                    <span className="text-muted-foreground">
                      {item.cantidad} ({pct}%)
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Crear `src/features/dashboard/components/VisitasPorCarreraChart.tsx`**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useVisitasPorCarrera } from '../hooks/use-dashboard-queries'

export function VisitasPorCarreraChart() {
  const { data, isLoading, isError, refetch } = useVisitasPorCarrera()

  const max = data?.reduce((acc, item) => Math.max(acc, item.cantidad), 0) ?? 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitas por carrera</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : isError ? (
          <div className="space-y-2">
            <p className="text-sm text-destructive">No se pudo cargar el gráfico</p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">Sin datos de visitas por carrera</p>
        ) : (
          <ul className="space-y-3">
            {data?.map((item) => (
              <li key={item.carrera}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{item.carrera}</span>
                  <span className="text-muted-foreground">{item.cantidad}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${max > 0 ? (item.cantidad / max) * 100 : 0}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 8: `DashboardPage` (layout raíz)

**Files:**
- Create: `src/features/dashboard/components/DashboardPage.tsx`

Layout responsive del spec: móvil columna invertida (buscador arriba), desktop fila con buscador a la derecha (320px). Buscador y KPI solo si el rol intersecta `['ADMIN','ENFERMERIA','CONSULTA']`.

- [ ] **Step 1: Crear `src/features/dashboard/components/DashboardPage.tsx`**

```tsx
import { PageHeader } from '@/components/shared/PageHeader'
import { useAuth } from '@/features/auth/hooks/useAuth'
import type { Role } from '@/types/role'
import { StudentQuickSearch } from './StudentQuickSearch'
import { TotalEstudiantesKpi } from './TotalEstudiantesKpi'
import { StockBajoCard } from './StockBajoCard'
import { VencimientoProximoCard } from './VencimientoProximoCard'
import { GrupoSanguineoChart } from './GrupoSanguineoChart'
import { VisitasPorCarreraChart } from './VisitasPorCarreraChart'

const ESTUDIANTES_ROLES: Role[] = ['ADMIN', 'ENFERMERIA', 'CONSULTA']

export function DashboardPage() {
  const { user } = useAuth()
  const roles = user?.roles ?? []
  const puedeVerEstudiantes = roles.some((r) => ESTUDIANTES_ROLES.includes(r as Role))

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />
      <div className="flex flex-col-reverse gap-6 lg:flex-row lg:items-start">
        <div className="flex-1 space-y-6">
          {puedeVerEstudiantes && <TotalEstudiantesKpi />}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <StockBajoCard />
            <VencimientoProximoCard />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <GrupoSanguineoChart />
            <VisitasPorCarreraChart />
          </div>
        </div>
        {puedeVerEstudiantes && (
          <div className="w-full lg:w-80 lg:shrink-0">
            <StudentQuickSearch />
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 9: Ficha de emergencia `EstudianteFichaPage`

**Files:**
- Create: `src/features/estudiantes/components/EstudianteFichaPage.tsx`

- [ ] **Step 1: Crear `src/features/estudiantes/components/EstudianteFichaPage.tsx`**

```tsx
import { Link, useParams } from 'react-router-dom'
import { ArrowLeftIcon } from 'lucide-react'

import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useEstudianteFicha } from '../hooks/use-estudiante-ficha'

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground uppercase">{label}</p>
      <p className="text-sm font-medium">{value || '—'}</p>
    </div>
  )
}

function ListaChips({ titulo, items }: { titulo: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground uppercase">{titulo}</p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Sin registro</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export function EstudianteFichaPage() {
  const { id } = useParams<{ id: string }>()
  const numericId = id ? Number(id) : undefined
  const { data: ficha, isLoading, isError, refetch } = useEstudianteFicha(numericId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ficha de emergencia" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    )
  }

  if (isError || !ficha) {
    return (
      <div className="space-y-6">
        <PageHeader title="Ficha de emergencia" />
        <Card>
          <CardContent>
            <div className="space-y-4 py-4 text-center">
              <p className="text-sm text-muted-foreground">
                No se pudo cargar la ficha del estudiante
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => refetch()}>
                  Reintentar
                </Button>
                <Button asChild>
                  <Link to="/dashboard">Volver al dashboard</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ficha de emergencia"
        action={
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              <ArrowLeftIcon /> Volver
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            {ficha.nombre} {ficha.apellido}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem label="Email" value={ficha.email} />
            <InfoItem label="Teléfono" value={ficha.telefono} />
            <InfoItem label="Carrera" value={ficha.carrera} />
            <InfoItem label="Seguro médico" value={ficha.seguroMedico} />
            <InfoItem label="Grupo sanguíneo" value={ficha.grupoSanguineo} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial clínico</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ListaChips titulo="Alergias" items={ficha.alergias} />
            <ListaChips titulo="Condiciones físicas" items={ficha.condicionesFisicas} />
            <ListaChips titulo="Enfermedades crónicas" items={ficha.enfermedadesCronicas} />
            <ListaChips titulo="Medicamentos habituales" items={ficha.medicamentosHabituales} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contacto y referencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem label="Médico de referencia" value={ficha.medicoReferencia} />
              <InfoItem label="Contacto principal" value={ficha.contactoPrincipal} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aptitud de donación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ficha.aptitudDonacion.apto ? (
                <Badge>Apto para donar</Badge>
              ) : (
                <Badge variant="destructive">No apto para donar</Badge>
              )}
              {ficha.aptitudDonacion.motivos.length > 0 && (
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {ficha.aptitudDonacion.motivos.map((motivo) => (
                    <li key={motivo}>{motivo}</li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 10: Rutas

**Files:**
- Modify: `src/app/routes.tsx`

Cambios:
1. `import { Navigate, Routes, Route }` (añadir `Navigate`).
2. Importar `DashboardPage` y `EstudianteFichaPage`.
3. Reemplazar `<Route path="/" element={<PlaceholderPage title="Dashboard" />} />` por redirect a `/dashboard` y la ruta `/dashboard` con `RoleGuard allow={['ADMIN','ENFERMERIA','ALMACEN','CONSULTA']}`.
4. Añadir `/estudiantes/:id` con `RoleGuard allow={['ADMIN','ENFERMERIA','CONSULTA']}`.

- [ ] **Step 1: Editar `src/app/routes.tsx`**

Import (línea 1):
```tsx
import { Navigate, Routes, Route } from "react-router-dom";
```

Añadir imports (con el resto de imports de features):
```tsx
import { DashboardPage } from "@/features/dashboard/components/DashboardPage";
import { EstudianteFichaPage } from "@/features/estudiantes/components/EstudianteFichaPage";
```

Reemplazar la línea 24:
```tsx
        <Route path="/" element={<PlaceholderPage title="Dashboard" />} />
```

por:
```tsx
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <RoleGuard allow={["ADMIN", "ENFERMERIA", "ALMACEN", "CONSULTA"]}>
              <DashboardPage />
            </RoleGuard>
          }
        />
```

Después del bloque de `/estudiantes` (placeholder, líneas 25-28), añadir:
```tsx
        <Route
          path="/estudiantes/:id"
          element={
            <RoleGuard allow={["ADMIN", "ENFERMERIA", "CONSULTA"]}>
              <EstudianteFichaPage />
            </RoleGuard>
          }
        />
```

- [ ] **Step 2: Verificar**

Run: `pnpm exec tsc -b && pnpm lint`
Expected: exit 0 sin errores.

---

### Task 11: Verificación final

- [ ] **Step 1: Build de producción**

Run: `pnpm build`
Expected: `tsc -b` y `vite build` exit 0.

- [ ] **Step 2: Lint completo**

Run: `pnpm lint`
Expected: exit 0 sin warnings.

- [ ] **Step 3: Revisión manual (humana)**

`pnpm dev` y validar con cada rol:
- ALMACEN: no ve buscador ni KPI de estudiantes; sí ve alertas y gráficos.
- Buscar estudiante real → navegar a su ficha → confirmar datos y aptitud de donación.
- Redimensionar: buscador arriba en móvil, derecha en desktop.
- Desconectar backend → cada tarjeta muestra su error con reintentar, sin romper el resto.
