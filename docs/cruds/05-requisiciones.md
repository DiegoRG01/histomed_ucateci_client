# 05 - Requisiciones

## Contexto y objetivo

Órdenes de requisición de insumos/medicamentos al almacén: `OrdenRequisicion` (cabecera con workflow de estados) +
`DetalleOrdenRequisicion` (líneas de pedido). No es un CRUD plano — el valor de la UI está en el workflow de
aprobación, no solo en alta/edición.

**Prerrequisito:** `00-fundamentos-crud.md` + `03-inventario.md` (las líneas de detalle referencian `Insumo`, y al
recibir una orden se genera un `MovimientoInventario` de entrada).

Referencia backend: `docs/02-modelo-dominio.md` (bloque Requisiciones) y `docs/planes/plan-04-requisiciones.md` del
repo `histomed_ucateci`. Módulo M4, depende de M3.

## Estado backend

`OrdenRequisicionController` confirmado en el repo (no explorado en detalle esta sesión). Workflow documentado:
`PENDIENTE → APROBADA/RECHAZADA → RECIBIDA`. Al pasar a `RECIBIDA`, el backend genera automáticamente los
`MovimientoInventario` de tipo `ENTRADA` por cada detalle — la UI no debe intentar crear esos movimientos
manualmente, solo disparar la transición de estado.

Confirmar al implementar: endpoints separados para transición de estado (ej. `PATCH /{id}/aprobar`) vs. un único
`PUT` genérico que acepta cambio de `estado` en el body — afecta directamente el diseño de los hooks.

## Endpoints consumidos (a confirmar)

| Método | Path esperado | Roles esperados | Notas |
|---|---|---|---|
| POST | `/api/v1/ordenes-requisicion` | ALMACEN, ADMIN | Crear orden con detalle (líneas) |
| GET | `/api/v1/ordenes-requisicion?estado=&page=&size=` | ALMACEN, ADMIN | Listado paginado, filtrable por estado |
| GET | `/api/v1/ordenes-requisicion/{id}` | ALMACEN, ADMIN | Detalle con líneas |
| PATCH/PUT | `/api/v1/ordenes-requisicion/{id}/aprobar` | ADMIN | Transición → APROBADA |
| PATCH/PUT | `/api/v1/ordenes-requisicion/{id}/rechazar` | ADMIN | Transición → RECHAZADA |
| PATCH/PUT | `/api/v1/ordenes-requisicion/{id}/recibir` | ALMACEN, ADMIN | Transición → RECIBIDA, genera movimientos |

## Modelo de datos frontend (types.ts)

`src/features/requisiciones/types.ts`:

```ts
export type EstadoOrden = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'RECIBIDA'

export type DetalleOrdenRequisicion = {
  id: number; insumoId: number; insumoNombre: string; cantidadPedida: number; cantidadRecibida: number | null
}

export type OrdenRequisicion = {
  id: number; estado: EstadoOrden
  solicitadoPorId: number; solicitadoPorNombre: string
  aprobadoPorId: number | null; aprobadoPorNombre: string | null
  fechaSolicitud: string; fechaRecepcion: string | null
  detalles: DetalleOrdenRequisicion[]
}

export type CreateOrdenRequisicionRequest = {
  detalles: { insumoId: number; cantidadPedida: number }[]
}
```

## Rutas frontend nuevas

- `/requisiciones` (lista paginada, filtro por estado) — `RoleGuard allow={['ADMIN','ALMACEN']}`
- `/requisiciones/nueva` — `RoleGuard allow={['ADMIN','ALMACEN']}`
- `/requisiciones/:id` (detalle + acciones de workflow según estado y rol) — `RoleGuard allow={['ADMIN','ALMACEN']}`

## Componentes a crear

`src/features/requisiciones/components/`:
- `OrdenRequisicionListPage.tsx` — `DataTable` con badge de estado (shadcn `badge`, color por `EstadoOrden`), filtro
  por estado (shadcn `select`).
- `OrdenRequisicionForm.tsx` — alta con líneas dinámicas (agregar/quitar filas de `insumoId` + `cantidadPedida`);
  no reusa `FormDialog` simple, es un formulario de página completa por su tamaño.
- `OrdenRequisicionDetailPage.tsx` — cabecera + tabla de líneas + botones de acción condicionados: "Aprobar"/
  "Rechazar" (visible solo si `estado=PENDIENTE` y rol `ADMIN`), "Recibir" (visible solo si `estado=APROBADA` y rol
  `ADMIN`/`ALMACEN`), cada botón con `ConfirmDeleteDialog`-style de confirmación (reusar el mismo componente de
  alert-dialog, no uno nuevo, solo con texto distinto a "eliminar").

## Hooks a crear

- `createCrudHooks` parcial: `useList`, `useGetById`, `useCreate` vía `createResourceApi<OrdenRequisicion,
  CreateOrdenRequisicionRequest>('/ordenes-requisicion')`. **No** `useUpdate`/`useRemove` genéricos — las
  transiciones de estado son acciones de negocio, no un PUT de edición libre.
- Custom: `useAprobarOrden(id)`, `useRechazarOrden(id)`, `useRecibirOrden(id)` — cada uno un `useMutation` propio
  que invalida `['ordenes-requisicion']` y `['ordenes-requisicion', id]` al completar.

## Casos especiales / reglas de negocio UI

- Los botones de transición de estado se muestran/ocultan según `estado` actual + rol del usuario — no confiar
  solo en que el backend rechace la transición inválida (mejor UX si el botón ni aparece).
- Al "Recibir", advertir en el diálogo de confirmación que esto generará movimientos de inventario automáticamente
  (transparencia para el usuario, aunque la lógica viva en el backend).
- No hay borrado lógico de órdenes vía UI (no tiene sentido de negocio "desactivar" una orden histórica) — omitir
  `ConfirmDeleteDialog` de eliminación aquí, solo se usa para confirmar transiciones.

## Dependencias y orden de implementación

1. `00-fundamentos-crud.md`.
2. `03-inventario.md` (selector de `Insumo` en las líneas).
3. Confirmar contra backend real si las transiciones son endpoints separados o un único PUT con `estado` en el
   body — esto determina el diseño final de los hooks custom.

## Pendientes / preguntas abiertas

- Confirmar paths y forma exacta de los endpoints de transición de estado (aprobar/rechazar/recibir).
- Confirmar si `cantidadRecibida` se captura por línea al recibir (recepción parcial) o es automático = `cantidadPedida`.
