# 03 - Inventario

## Contexto y objetivo

Módulo de inventario unificado: `Insumo` (catálogo base), `Medicamento` (subtipo de `Insumo`), `LoteInventario`
(lotes con fecha de vencimiento y cantidad), `MovimientoInventario` (entradas/salidas/ajustes/mermas). Se agrupan
en un solo documento porque forman un único flujo de negocio (dar de alta un insumo → registrar lotes → mover
stock), no CRUDs independientes.

**Prerrequisito:** `00-fundamentos-crud.md`. Referencia `01-catalogos-base.md` para el selector de
`TipoMedicamento` en el formulario de `Medicamento`.

Referencia backend: `docs/02-modelo-dominio.md` (bloque Inventario) y `docs/planes/plan-03-inventario.md` del repo
`histomed_ucateci`. Módulo M3, se construye antes que M2 (Estudiantes) porque la ficha médica referencia
`Medicamento` por FK real.

## Estado backend

Controllers confirmados en el repo: `InsumoController`, `MedicamentoController`, `TipoMedicamentoController`
(cubierto en `01-catalogos-base.md`), `LoteInventarioController`, `MovimientoInventarioController`. Se asume CRUD
completo estándar (crear/actualizar/obtener/buscar paginado/eliminar) siguiendo el mismo patrón confirmado en
`EstudianteController` (ver `00-fundamentos-crud.md`), pero **confirmar roles `@PreAuthorize` exactos por
endpoint al implementar** — no se exploraron esos controllers en detalle esta sesión, solo se confirmó su
existencia.

`Insumo`/`Medicamento` usan herencia JPA (`JOINED`, según `02-modelo-dominio.md`) — en la práctica esto no debería
afectar los DTOs REST (siguen siendo `MedicamentoRequest`/`MedicamentoResponse` planos), pero vale confirmarlo.

## Endpoints consumidos (confirmar paths/roles exactos al implementar)

| Entidad | Método | Path | Notas |
|---|---|---|---|
| Insumo | GET/POST/PUT/DELETE | `/api/v1/insumos` | Catálogo genérico (incluye insumos no-medicamento) |
| Medicamento | GET/POST/PUT/DELETE | `/api/v1/medicamentos` | Subtipo de Insumo, incluye `tiposMedicamento` (M2M) |
| LoteInventario | GET/POST/PUT/DELETE | `/api/v1/lotes-inventario` | FK a `insumo`, `numeroLote`, `fechaVencimiento`, `cantidadDisponible` |
| MovimientoInventario | GET/POST | `/api/v1/movimientos-inventario` | Probablemente solo alta + listado (es una bitácora de movimientos, no se edita/borra un movimiento histórico) |

## Modelo de datos frontend (types.ts)

`src/features/inventario/types.ts`:

```ts
export type TipoInsumo = 'MEDICAMENTO' | 'INSUMO'
export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'MERMA'

export type Insumo = {
  id: number; nombre: string; tipo: TipoInsumo; unidadMedida: string; stockMinimo: number; activo: boolean
}

export type Medicamento = Insumo & {
  controlado: boolean
  concentracion: string
  viaAdministracion: string
  tiposMedicamentoIds: number[]
}
export type CreateMedicamentoRequest = Omit<Medicamento, 'id' | 'activo'>

export type LoteInventario = {
  id: number; insumoId: number; insumoNombre: string; numeroLote: string
  fechaVencimiento: string; cantidadDisponible: number; activo: boolean
}
export type CreateLoteInventarioRequest = Omit<LoteInventario, 'id' | 'insumoNombre' | 'activo'>

export type MovimientoInventario = {
  id: number; insumoId: number; loteId: number | null; tipo: TipoMovimiento
  cantidad: number; fecha: string; motivo: string; usuarioId: number
}
export type CreateMovimientoInventarioRequest = Omit<MovimientoInventario, 'id'>
```

## Rutas frontend nuevas

- `/inventario/medicamentos` — `RoleGuard allow={['ADMIN','ALMACEN']}`
- `/inventario/lotes` — `RoleGuard allow={['ADMIN','ALMACEN']}`
- `/inventario/movimientos` — `RoleGuard allow={['ADMIN','ALMACEN']}` (registrar + ver historial)

`Insumo` genérico (no-medicamento) puede vivir en la misma pantalla que `Medicamento` con un selector de `tipo`, o
como pestaña separada — decidir al implementar según cuántos insumos no-medicamento existan en la práctica.

## Componentes a crear

`src/features/inventario/components/`:
- `MedicamentoListPage.tsx` + `MedicamentoForm.tsx` (incluye multi-select de `TipoMedicamento`, reutilizando la
  lista de `01-catalogos-base.md` vía `useTiposMedicamento()`).
- `LoteInventarioListPage.tsx` + `LoteForm.tsx` (selector de insumo, date picker para `fechaVencimiento` —
  requiere componente de fecha; shadcn no trae uno por defecto, evaluar `input type="date"` simple antes de añadir
  un date-picker complejo).
- `MovimientoInventarioListPage.tsx` + `MovimientoForm.tsx` (registrar entrada/salida/ajuste/merma; solo lectura +
  alta, sin editar/eliminar).
- Todos reusan `DataTable`, `FormDialog`, `PageHeader`; `ConfirmDeleteDialog` solo aplica a Medicamento/Lote/Insumo,
  no a Movimiento (bitácora inmutable).

## Hooks a crear

`createCrudHooks` completo para `medicamentos`, `lotes-inventario`, `insumos`. Para `movimientos-inventario`, solo
`useList` + `useCreate` (sin update/remove, ver nota de bitácora inmutable arriba).

## Casos especiales / reglas de negocio UI

- Alertas de stock bajo (`stockMinimo` vs suma de `cantidadDisponible` de lotes activos) y vencimiento próximo se
  muestran como parte del dashboard (`07-dashboard-reportes.md`), no como CRUD aquí — este doc solo cubre alta/edición
  de catálogo y registro de movimientos.
- Al registrar un `MovimientoInventario` de tipo `SALIDA`/`AJUSTE`/`MERMA`, validar en UI que `cantidad` no exceda
  `cantidadDisponible` del lote seleccionado antes de enviar (el backend seguramente valida también, pero UX se
  beneficia de feedback inmediato).
- Borrado = desactivar, salvo `MovimientoInventario` que no se borra ni edita.

## Dependencias y orden de implementación

1. `00-fundamentos-crud.md`.
2. `01-catalogos-base.md` (para `TipoMedicamento`).
3. Orden interno: `Medicamento`/`Insumo` → `LoteInventario` (depende de insumo existente) → `MovimientoInventario`
   (depende de insumo y opcionalmente lote).

## Pendientes / preguntas abiertas

- Confirmar roles `@PreAuthorize` exactos por endpoint (se asumió `ADMIN`+`ALMACEN`, no verificado en código).
- Confirmar si `MovimientoInventario` pagina o es lista plana.
- Decidir si `Insumo` no-medicamento necesita pantalla propia o comparte la de `Medicamento` con selector de tipo.
