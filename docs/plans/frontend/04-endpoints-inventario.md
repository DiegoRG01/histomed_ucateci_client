# Inventario (M3)

El stock **no** es un campo directo de `Insumo`: es la suma de `cantidadDisponible` de sus `LoteInventario` activos. Usa `GET /insumos/{id}/stock` para el valor agregado.

## `InsumoController` — `/api/v1/insumos`

| Método | Path | Roles | Params/Body | Response |
|---|---|---|---|---|
| POST | `` | ALMACEN, ADMIN | JSON `InsumoRequest` | 201 `InsumoResponse` |
| GET | `` | cualquier autenticado | query `tipo?` (`MEDICAMENTO`\|`INSUMO`) | 200 `List<InsumoResponse>` |
| GET | `/{id}` | cualquier autenticado | — | 200 `InsumoResponse` |
| GET | `/{id}/stock` | cualquier autenticado | — | 200 `StockResponse` |

`InsumoRequest`:
```json
{ "nombre": "Gasas estériles", "tipo": "INSUMO", "unidadMedida": "unidad", "stockMinimo": 20 }
```
`InsumoResponse`:
```json
{ "id": 4, "nombre": "Gasas estériles", "tipo": "INSUMO", "unidadMedida": "unidad", "stockMinimo": 20 }
```
`StockResponse`:
```json
{ "insumoId": 4, "nombre": "Gasas estériles", "stockActual": 15, "stockMinimo": 20, "bajoMinimo": true }
```

## `MedicamentoController` — `/api/v1/medicamentos`

| Método | Path | Roles | Body | Response |
|---|---|---|---|---|
| POST | `` | ALMACEN, ADMIN | JSON `MedicamentoRequest` | 201 `MedicamentoResponse` |
| GET | `` | cualquier autenticado | — | 200 `List<MedicamentoResponse>` |
| GET | `/{id}` | cualquier autenticado | — | 200 `MedicamentoResponse` |

`MedicamentoRequest`:
```json
{
  "nombre": "Paracetamol 500mg",
  "unidadMedida": "tableta",
  "stockMinimo": 50,
  "controlado": false,
  "concentracion": "500mg",
  "viaAdministracion": "Oral",
  "tiposMedicamentoIds": [1, 4]
}
```
`MedicamentoResponse` añade `id`, `tipo: "MEDICAMENTO"`, y `tiposMedicamento: string[]` (nombres, no ids).

## `TipoMedicamentoController` — `/api/v1/tipos-medicamento`

| Método | Path | Roles | Body |
|---|---|---|---|
| POST | `` | ALMACEN, ADMIN | JSON `{ "nombre": "Analgesico" }` |
| GET | `` | cualquier autenticado | — devuelve `List<{id, nombre}>` |

## `LoteInventarioController` — `/api/v1/insumos/{insumoId}/lotes`

| Método | Path | Roles | Body | Response |
|---|---|---|---|---|
| POST | `` | ALMACEN, ADMIN | JSON `LoteInventarioRequest` (el `insumoId` del path sobrescribe el del body) | 201 `LoteInventarioResponse` |
| GET | `` | cualquier autenticado | — | 200 `List<LoteInventarioResponse>` |

`LoteInventarioRequest`:
```json
{ "numeroLote": "L-2026-001", "fechaVencimiento": "2027-03-01", "cantidadDisponible": 100 }
```
`LoteInventarioResponse`: `{ id, insumoId, insumoNombre, numeroLote, fechaVencimiento, cantidadDisponible }`.

## `MovimientoInventarioController` — `/api/v1/movimientos`

| Método | Path | Roles | Body | Response |
|---|---|---|---|---|
| POST | `` | SALIDA: ENFERMERIA/ALMACEN/ADMIN · ENTRADA/AJUSTE/MERMA: ALMACEN/ADMIN (⚠️ no hay `@PreAuthorize` en el controller, solo `isAuthenticated()` global — la restricción por tipo de rol descrita en el plan **no está implementada a nivel de endpoint**; cualquier autenticado puede registrar cualquier tipo de movimiento hoy) | JSON `MovimientoInventarioRequest` | 201 `MovimientoInventarioResponse` |
| GET | `/insumo/{insumoId}` | cualquier autenticado | — | 200 `List<MovimientoInventarioResponse>` |

`MovimientoInventarioRequest`:
```json
{ "insumoId": 4, "loteId": null, "tipo": "SALIDA", "cantidad": 5, "motivo": "Uso en consulta" }
```
- `loteId` es opcional para `SALIDA`: si se omite, el backend selecciona automáticamente el lote **FEFO** (First-Expired-First-Out, el de vencimiento más próximo con stock suficiente). Si ningún lote tiene stock suficiente → **409** `"No hay lotes disponibles con stock suficiente para el insumo"`.
- `ENTRADA` suma al lote; `AJUSTE`/`MERMA` restan. Si el resultado da stock negativo → **409**.
- Conflicto de actualización concurrente (optimistic locking) → **409** `"Conflicto de concurrencia al actualizar stock. Intente nuevamente."` — el frontend debería reintentar o refrescar y pedir confirmación.

`MovimientoInventarioResponse`: `{ id, insumoId, insumoNombre, loteId, numeroLote, tipo, cantidad, fecha, motivo, usuarioNombre }`.
