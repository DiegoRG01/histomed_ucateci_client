# CRUD completo de Estudiante (core) — Design

## Contexto

El dashboard con búsqueda rápida (`docs/superpowers/specs/2026-08-15-dashboard-design.md`, plan ejecutado en
`docs/plans/05-dashboard-busqueda-rapida.md`) ya implementó `/dashboard` y `/estudiantes/:id` como una ficha de
emergencia **de solo lectura** (`EstudianteFichaPage.tsx`). El backend (`EstudianteController`) sí soporta
`PUT /estudiantes/{id}` (ENFERMERIA, ADMIN) y `DELETE /estudiantes/{id}` (ADMIN, desactivar) desde el inicio — el
frontend simplemente no los usa todavía. Este spec cierra ese hueco: CRUD completo del recurso `Estudiante` (sin
sub-recursos de ficha médica, que quedan para una iteración futura, ver `docs/cruds/04-estudiantes-ficha-medica.md`).

## Alcance

**Incluye:**
- `/estudiantes` — listado paginado real (reemplaza el `PlaceholderPage` actual), con búsqueda server-side y
  columna de Acciones (editar, desactivar).
- Formulario de creación/edición de `Estudiante`.
- Acciones (editar, desactivar) añadidas a la ficha ya existente `EstudianteFichaPage.tsx`.

**Fuera de alcance:**
- Los 6 sub-recursos de ficha médica (contactos, alergias, condiciones físicas, enfermedades crónicas,
  medicamentos habituales, médico de referencia) — siguen sin CRUD propio.
- Cambios a `StudentQuickSearch.tsx` / `DashboardPage.tsx` (ya implementados, no se tocan).
- Paginación/filtro avanzado más allá de lo que ya expone el backend (`filtro` de texto libre).

## Endpoints backend

| Uso | Endpoint | Roles |
|---|---|---|
| Listar/buscar | `GET /api/v1/estudiantes?filtro=&page=&size=` | ENFERMERIA, ADMIN, CONSULTA |
| Crear | `POST /api/v1/estudiantes` | ENFERMERIA, ADMIN |
| Editar | `PUT /api/v1/estudiantes/{id}` | ENFERMERIA, ADMIN |
| Desactivar | `DELETE /api/v1/estudiantes/{id}` | ADMIN |
| Carreras (select) | `GET /api/v1/catalogos/carreras` | cualquier autenticado, lista plana |
| Seguros médicos (select) | `GET /api/v1/seguros-medicos` | cualquier autenticado, lista plana |

### `EstudianteRequest` (body de POST/PUT)

```ts
export type CreateEstudianteRequest = {
  matricula: string      // required
  cedula: string          // required
  nombre: string           // required
  apellido: string          // required
  fechaNacimiento: string    // required, ISO date (LocalDate)
  sexo: 'M' | 'F' | 'OTRO'    // required
  grupoSanguineo: 'O_POS' | 'O_NEG' | 'A_POS' | 'A_NEG' | 'B_POS' | 'B_NEG' | 'AB_POS' | 'AB_NEG' // required
  email: string                // required, formato email
  telefono?: string             // opcional
  carreraId: number              // required
  seguroMedicoId?: number         // opcional
}
```

Validación zod (calcada de las anotaciones backend, sin reglas extra no confirmadas): `.min(1)` en
matricula/cedula/nombre/apellido/email, `.email()` en email, `fechaNacimiento`/`sexo`/`grupoSanguineo`/`carreraId`
requeridos. `telefono`/`seguroMedicoId` opcionales.

`EstudianteResponse` y `FichaEmergenciaResponse` ya están tipados en `src/features/estudiantes/types.ts` — no se
tocan.

## Estructura de archivos

```
src/features/estudiantes/
  api/estudiantes-api.ts        # ya existe (search, ficha) — AÑADIR: createResourceApi para CRUD
  hooks/
    use-estudiante-search.ts    # ya existe, no se toca
    use-estudiante-ficha.ts     # ya existe, no se toca
    use-estudiantes.ts          # NUEVO: createCrudHooks('estudiantes', ...) → useList/useCreate/useUpdate/useRemove
  components/
    EstudianteFichaPage.tsx     # ya existe — MODIFICAR: añadir acciones editar/desactivar en el header
    EstudianteListPage.tsx      # NUEVO
    EstudianteForm.tsx          # NUEVO
  types.ts                      # ya existe — AÑADIR: CreateEstudianteRequest

src/features/catalogos/
  hooks/
    useCarreras.ts               # NUEVO: createResourceApiFlatList<Carrera, CreateCarreraRequest>('/catalogos/carreras')
    useSegurosMedicos.ts          # NUEVO: createResourceApiFlatList<SeguroMedico, CreateSeguroMedicoRequest>('/seguros-medicos')
  # types.ts ya tiene Carrera/SeguroMedico — reusar tal cual (nota: campo `activo` del tipo frontend
  # no existe en la respuesta real del backend; no renderizarlo en los selects de este form)
```

Reutiliza: `createResourceApi`/`createCrudHooks` (`src/lib/api-factory.ts`, `src/lib/crud-hooks-factory.ts`),
`DataTable`/`PaginationBar`/`FormDialog`/`ConfirmDeleteDialog`/`PageHeader` (`src/components/shared/`), patrón de
`MedicamentoListPage.tsx` (`src/features/inventario/components/`) como referencia directa de list+form+rowActions
con `createCrudHooks` completo.

## `EstudianteListPage.tsx`

- `PageHeader title="Estudiantes"` + botón "Nuevo" (abre `FormDialog` en modo creación).
- Input de búsqueda con debounce (~300ms) ligado al parámetro `filtro` de `useEstudiantes({ filtro, page, size })`
  (server-side, igual patrón que `StudentQuickSearch` pero con paginación visible).
- `DataTable` con columnas: Matrícula, Cédula, Nombre completo, Carrera, Grupo sanguíneo, Seguro médico (o "—" si
  null).
- `rowActions`: botón editar (`PencilIcon`, visible si rol ADMIN/ENFERMERIA) abre `FormDialog` en modo edición
  precargado con la fila; botón desactivar (`ConfirmDeleteDialog`, visible solo si rol ADMIN) llama
  `useRemoveEstudiante`.
- `PaginationBar` conectada a `data.number`/`data.totalPages`.
- Soporta query param `?editar={id}`: al montar, si está presente y el estudiante existe en la página actual (o se
  busca puntualmente por id si no), abre el `FormDialog` en modo edición automáticamente — usado por el botón
  "Editar" de `EstudianteFichaPage.tsx`.
- `RoleGuard allow={['ADMIN','ENFERMERIA','CONSULTA']}` a nivel de ruta; dentro de la página, CONSULTA ve la tabla
  sin columna de Acciones (o con acciones ocultas) al no tener permiso de escritura.

## `EstudianteForm.tsx`

- `react-hook-form` + zod resolver (mismo patrón que `UsuarioForm.tsx`/formularios de `inventario`).
- Campos: Input (matrícula, cédula, nombre, apellido, email, teléfono), date picker o `Input type="date"` (fecha
  nacimiento), `Select` (sexo, grupo sanguíneo, carrera, seguro médico).
- Reusa `mapApiErrorToForm` (`src/lib/form-errors.ts`) para errores del backend (ej. matrícula/cédula duplicada).

## `EstudianteFichaPage.tsx` — cambios

- Header: junto al botón "Volver" ya existente, añadir:
  - "Editar" (`PencilIcon`, ADMIN/ENFERMERIA) → `navigate('/estudiantes?editar=' + id)`.
  - "Desactivar" (ADMIN) → `ConfirmDeleteDialog` inline; al confirmar, `useRemoveEstudiante(id)` y luego
    `navigate('/dashboard')`.
- Sin cambios en el resto del contenido (datos, historial clínico, aptitud de donación).

## Relación con specs previos

- Este spec es la fuente de verdad de `/estudiantes` (listado) y de las acciones en `/estudiantes/:id`. El spec del
  dashboard (`2026-08-15-dashboard-design.md`) mantiene su descripción de `/estudiantes/:id` como destino de la
  búsqueda rápida, pero ya no es dueño de su comportamiento de acciones — eso vive aquí.

## Verificación

- `pnpm build` + `pnpm lint`.
- Manual: `pnpm dev` →
  - `/estudiantes`: buscar, paginar, crear un estudiante, editarlo, desactivarlo (como ADMIN).
  - Como ENFERMERIA: puede crear/editar, no ve botón desactivar.
  - Como CONSULTA: ve la tabla, sin acciones de escritura.
  - Desde `/dashboard`, buscar un estudiante → en su ficha, click "Editar" → confirma que abre `/estudiantes` con
    el diálogo de edición ya cargado para ese estudiante.
  - Desde la ficha, "Desactivar" (ADMIN) → confirma redirect a `/dashboard` y que el estudiante ya no aparece en
    `/estudiantes` (o aparece marcado inactivo, según lo que devuelva el backend tras desactivar).
