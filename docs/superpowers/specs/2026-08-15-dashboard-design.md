# Dashboard con búsqueda rápida de estudiantes — Design

## Contexto

`/` renderiza hoy un `PlaceholderPage`. El nav ya tiene una entrada "Dashboard" apuntando a `/`, y `docs/cruds/07-dashboard-reportes.md` documenta este módulo como prioridad (M6, "mayor diferenciador"). El usuario pidió un dashboard con dos secciones: un buscador rápido de estudiantes y una sección de información (KPIs/alertas/gráficos), con layout responsive (buscador arriba en móvil, a la derecha en desktop). Al no existir aún ninguna página de detalle de estudiante, seleccionar un resultado de búsqueda requiere crear `/estudiantes/:id` (ficha de emergencia) como parte de este trabajo.

## Alcance

**Incluye:**
- Ruta `/dashboard`, reemplaza el placeholder actual servido en `/` (`src/app/routes.tsx`).
- Ruta `/estudiantes/:id` — ficha de emergencia del estudiante, destino de la búsqueda.
- Buscador rápido de estudiantes con resultados navegables.
- Sección de información: KPI de total de estudiantes, alertas de stock bajo / vencimiento próximo, 2 gráficos (distribución grupo sanguíneo, visitas por carrera).

**Fuera de alcance (explícitamente):**
- Listado completo de estudiantes (`/estudiantes` sigue como `PlaceholderPage`).
- Variación de contenido del dashboard por rol (todos los roles ven el mismo contenido en v1, salvo el buscador que se oculta para ALMACEN).
- Resto de reportes (`/reportes/*`, `07-dashboard-reportes.md`) — quedan para una iteración futura.

## Endpoints backend usados

Todos bajo `/api/v1`, JWT `Authorization: Bearer <token>` (ya manejado por `src/lib/api-client.ts`).

| Uso | Endpoint | Roles | Notas |
|---|---|---|---|
| Búsqueda rápida | `GET /estudiantes?filtro=&size=8` | ENFERMERIA, ADMIN, CONSULTA | `filtro` matchea matrícula/nombre/apellido; mínimo 2 caracteres para disparar la query |
| Total estudiantes (KPI) | `GET /estudiantes?size=1` | ENFERMERIA, ADMIN, CONSULTA | usar `Page.totalElements`; no disponible para ALMACEN, ver nota de roles abajo |
| Ficha estudiante | `GET /estudiantes/{id}/ficha` | ENFERMERIA, ADMIN, CONSULTA | ver shape abajo |
| Stock bajo | `GET /reportes/stock-bajo` | cualquier autenticado | |
| Vencimiento próximo | `GET /reportes/vencimiento-proximo?dias=30` | cualquier autenticado | |
| Distribución grupo sanguíneo | `GET /reportes/distribucion-grupo-sanguineo` | cualquier autenticado | |
| Visitas por carrera | `GET /reportes/visitas-por-carrera` | cualquier autenticado | |

### Tipos de respuesta (`types.ts`)

```ts
// src/features/estudiantes/types.ts
interface AptitudDonacion { apto: boolean; motivos: string[] }
interface FichaEmergenciaResponse {
  estudianteId: number; nombre: string; apellido: string;
  grupoSanguineo: string; email: string; telefono: string;
  carrera: string; seguroMedico: string;
  alergias: string[]; condicionesFisicas: string[];
  enfermedadesCronicas: string[]; medicamentosHabituales: string[];
  medicoReferencia: string; contactoPrincipal: string;
  aptitudDonacion: AptitudDonacion;
}
interface EstudianteResponse {
  id: number; matricula: string; cedula: string; nombre: string; apellido: string;
  fechaNacimiento: string; sexo: string; grupoSanguineo: string; email: string;
  telefono: string; carreraId: number; carreraNombre: string;
  seguroMedicoId: number | null; seguroMedicoNombre: string | null;
}

// src/features/dashboard/types.ts
interface VisitasPorCarreraReporteResponse { carrera: string; cantidad: number }
interface DistribucionGrupoSanguineoReporteResponse { grupoSanguineo: string; cantidad: number }
interface StockBajoAlertaResponse { insumoId: number; insumoNombre: string; stockActual: number; stockMinimo: number }
interface VencimientoProximoAlertaResponse { loteId: number; numeroLote: string; insumoNombre: string; fechaVencimiento: string; cantidadDisponible: number }
```

`Page<T>` (respuesta de `/estudiantes`, Spring Data estándar): `content, totalElements, totalPages, number, size, first, last, numberOfElements, empty`.

> **Nota (2026-08-15):** las acciones de editar/desactivar sobre `/estudiantes/:id` (y el listado `/estudiantes`)
> se diseñan en `2026-08-15-estudiantes-crud-design.md` — este documento ya no es la fuente de verdad de ese
> comportamiento, solo del layout del dashboard y de que la ficha es el destino de la búsqueda rápida.

## Roles y visibilidad

- `/dashboard`: `RoleGuard allow={['ADMIN','ENFERMERIA','ALMACEN','CONSULTA']}` — visible a todos.
- `/estudiantes/:id`: `RoleGuard allow={['ADMIN','ENFERMERIA','CONSULTA']}` — ALMACEN no puede acceder al recurso estudiantes en backend.
- Dentro de `DashboardPage`, `StudentQuickSearch` se omite del render si `user.roles` (de `useAuth()`) no intersecta con `['ADMIN','ENFERMERIA','CONSULTA']`. Igual criterio para el KPI de total de estudiantes (usa el mismo endpoint `/estudiantes`).
- El resto de tarjetas (alertas, gráficos de reportes) son visibles para todos los roles — el backend solo exige `isAuthenticated()`.

## Estructura de archivos

```
src/features/dashboard/
  api/dashboard-api.ts          # funciones fetch: getStockBajo, getVencimientoProximo, getDistribucionGrupoSanguineo, getVisitasPorCarrera, getTotalEstudiantes
  hooks/use-dashboard-queries.ts  # React Query hooks sobre dashboard-api
  components/
    DashboardPage.tsx           # layout raíz (grid responsive)
    StudentQuickSearch.tsx      # combobox de búsqueda
    TotalEstudiantesKpi.tsx
    StockBajoCard.tsx
    VencimientoProximoCard.tsx
    GrupoSanguineoChart.tsx
    VisitasPorCarreraChart.tsx
  types.ts

src/features/estudiantes/
  api/estudiantes-api.ts        # searchEstudiantes(filtro), getFichaEmergencia(id)
  hooks/use-estudiante-ficha.ts
  hooks/use-estudiante-search.ts
  components/EstudianteFichaPage.tsx
  types.ts
```

Reutiliza: `src/lib/api-client.ts` (cliente HTTP + manejo de 401), `Card`/`Skeleton`/`Badge` de `src/components/ui/`, `PageHeader` de `src/components/shared/`, `cn()` de `src/lib/utils.ts`, `useAuth()` de `src/features/auth/hooks/useAuth.ts`. Para el combobox de búsqueda: primitivas Radix `popover`/`command` (cubiertas por el paquete `radix-ui` ya instalado, sin nueva dependencia) envueltas al estilo shadcn.

## Layout responsive

`DashboardPage.tsx`:

```tsx
<div className="flex flex-col-reverse gap-6 lg:flex-row lg:items-start">
  <div className="flex-1 space-y-6">
    {/* KPI row → alertas → gráficos */}
  </div>
  <div className="w-full lg:w-80 lg:shrink-0">
    <StudentQuickSearch />
  </div>
</div>
```

- Móvil (`< lg`): columna invertida → buscador visualmente arriba.
- Desktop (`≥ lg`): fila → buscador fijo a la derecha (320px), info ocupa el resto.

Dentro de la sección de info: fila de KPI(s) → alertas (`StockBajoCard`, `VencimientoProximoCard` en grid 2 columnas en desktop) → gráficos (`GrupoSanguineoChart`, `VisitasPorCarreraChart`), siguiendo la skill `dataviz` para paleta y tipo de gráfico (pie/bar para grupo sanguíneo — categorías fijas y pocas; bar para visitas por carrera).

## Búsqueda: comportamiento

- `Input` con debounce ~300ms; dispara `GET /estudiantes?filtro=&size=8` solo con ≥2 caracteres.
- Resultados en dropdown (nombre, apellido, matrícula) bajo el input.
- Click/Enter en un resultado → `navigate(`/estudiantes/${id}`)`.
- Sin resultados → mensaje "No se encontraron estudiantes".

## Manejo de errores y estados de carga

- Cada tarjeta/gráfico consulta de forma independiente (React Query) — loading con `Skeleton`, error inline con mensaje + botón reintentar, sin bloquear el resto del dashboard.
- 401 ya delegado a `api-client.ts` existente (redirect a login) — no requiere lógica adicional.
- `/estudiantes/:id` con 404 → vista de error simple con link de regreso a `/dashboard`.

## Verificación

- `pnpm build` (type-check + build) y `pnpm lint` sin errores.
- Manual: `pnpm dev`, iniciar sesión con cada rol (ADMIN/ENFERMERIA/ALMACEN/CONSULTA) y confirmar:
  - ALMACEN no ve el buscador ni el KPI de estudiantes; sí ve alertas/gráficos.
  - Buscar un estudiante real, navegar a su ficha, confirmar datos y aptitud de donación.
  - Redimensionar ventana: buscador arriba en móvil, a la derecha en desktop.
  - Provocar un error (p. ej. desconectar backend) y confirmar que cada tarjeta muestra su propio estado de error sin romper el resto.
