# 01 - Catálogos base

## Contexto y objetivo

Catálogos planos de referencia usados por otros módulos: `Rol`, `Carrera`, `SeguroMedico`, `TipoMedicamento`. Se
agrupan en un solo documento porque comparten la misma forma (entidad casi de un solo campo relevante, sin
sub-recursos, sin workflow de estados) y el mismo patrón de UI (lista simple + formulario de 1-2 campos). Separarlos
en 4 archivos duplicaría la misma estructura sin aportar claridad.

**Prerrequisito:** `00-fundamentos-crud.md` completo (factories de API/hooks, `DataTable`, `FormDialog`,
`ConfirmDeleteDialog`, `AppLayout`, `RoleGuard`).

Referencia backend: `docs/02-modelo-dominio.md` (bloques Seguridad, Estudiantes, Inventario) y
`docs/planes/plan-01-seguridad.md` / `plan-03-inventario.md` / `plan-02-estudiantes-ficha-medica.md` del repo
`histomed_ucateci`.

## Estado backend

- `Rol`: no tiene controller propio confirmado — probablemente solo lectura/seed (`RolNombre` fijo:
  `ADMIN`, `ENFERMERIA`, `ALMACEN`, `CONSULTA`). **No planificar creación/edición de roles en UI** hasta confirmar
  que existe un endpoint; si no existe, esta parte del doc se reduce a "no aplica".
  Todavía sin implementar en backend hoy (M2/M3 no construidos).
- `TipoMedicamento`: controller propio (`TipoMedicamentoController`, `TipoMedicamentoRequest/Response`) — CRUD
  completo esperado (crear/actualizar/listar/obtener/eliminar), sin confirmar aún si pagina.
- `Carrera`, `SeguroMedico`: entidades de dominio documentadas (bloque M2) pero **sin controller propio visto en el
  repo actual** — puede que se gestionen solo como catálogo embebido dentro del alta de `Estudiante`, o que tengan
  su propio CRUD ADMIN. Confirmar contra el backend real al construir M2; si no hay controller dedicado, omitir
  este catálogo de este doc y moverlo como selector estático dentro de `04-estudiantes-ficha-medica.md`.

## Endpoints consumidos (a confirmar contra backend real antes de implementar)

| Entidad | Método | Path | Roles esperados |
|---|---|---|---|
| TipoMedicamento | GET/POST/PUT/DELETE | `/api/v1/tipos-medicamento` (confirmar path exacto) | ADMIN, ALMACEN |
| Carrera | GET/POST/PUT/DELETE | `/api/v1/carreras` (confirmar si existe) | ADMIN |
| SeguroMedico | GET/POST/PUT/DELETE | `/api/v1/seguros-medicos` (confirmar si existe) | ADMIN |

## Modelo de datos frontend (types.ts)

Cada catálogo en `src/features/catalogos/types.ts` (un solo archivo compartido, dado lo simple de cada tipo):

```ts
export type TipoMedicamento = { id: number; nombre: string; activo: boolean }
export type CreateTipoMedicamentoRequest = { nombre: string }
export type Carrera = { id: number; nombre: string; codigo: string; activo: boolean }
export type CreateCarreraRequest = { nombre: string; codigo: string }
export type SeguroMedico = { id: number; nombre: string; cobertura: string; activo: boolean }
export type CreateSeguroMedicoRequest = { nombre: string; cobertura: string }
```

## Rutas frontend nuevas

- `/catalogos/tipos-medicamento` — rol `ADMIN`, `ALMACEN` (`RoleGuard`)
- `/catalogos/carreras` — rol `ADMIN`
- `/catalogos/seguros-medicos` — rol `ADMIN`

Todas bajo `AppLayout`.

## Componentes a crear

Por catálogo (`src/features/catalogos/components/`):
- `TipoMedicamentoListPage.tsx`, `CarreraListPage.tsx`, `SeguroMedicoListPage.tsx` — cada uno usa `PageHeader` +
  `DataTable` + `FormDialog` (crear/editar) + `ConfirmDeleteDialog`. Como son casi idénticos, considerar un único
  `CatalogoCrudPage.tsx` genérico parametrizado por `{ title, columns, hooks, formFields }` reusado 3 veces en vez
  de 3 archivos casi iguales — decidir al implementar según cuánto diverjan los formularios reales.

## Hooks a crear

Todos vía `createCrudHooks` + `createResourceApi` (sin custom logic):
```ts
// src/features/catalogos/hooks/useTiposMedicamento.ts
const tiposMedicamentoApi = createResourceApi<TipoMedicamento, CreateTipoMedicamentoRequest>('/tipos-medicamento')
export const { useList: useTiposMedicamento, useCreate: useCreateTipoMedicamento, ... } =
  createCrudHooks('tipos-medicamento', tiposMedicamentoApi)
```
Igual para `carreras` y `seguros-medicos`.

## Casos especiales / reglas de negocio UI

- Borrado = desactivar (`activo=false`); listas filtran implícitamente por activos (lo hace el backend).
- Si `Rol` resulta no tener CRUD propio, no crear ruta ni componente — dejarlo fuera de este módulo.
- `TipoMedicamento` se referencia luego desde `03-inventario.md` (selector en el formulario de `Medicamento`).

## Dependencias y orden de implementación

1. `00-fundamentos-crud.md`.
2. Confirmar contra el backend real (una vez M3/M2 estén implementados) cuáles de estos 3 catálogos tienen
   controller propio antes de escribir código.
3. Implementar en orden: `TipoMedicamento` (confirmado que existe) → `Carrera`/`SeguroMedico` (solo si se confirma
   endpoint dedicado).

## Pendientes / preguntas abiertas

- Confirmar existencia y paths reales de los endpoints de `Carrera` y `SeguroMedico` cuando M2 se implemente en el
  backend — hoy solo están documentados como entidades de dominio, no como controllers.
- Confirmar si `Rol` es gestionable desde UI o es fijo/seed-only.
