# Requisiciones (M4)

`OrdenRequisicionController` — `/api/v1/ordenes-requisicion`

| Método | Path | Roles | Body/Params | Response |
|---|---|---|---|---|
| POST | `` | ENFERMERIA, ALMACEN, ADMIN | JSON `OrdenRequisicionRequest` | 201 `OrdenRequisicionResponse` |
| GET | `` | cualquier autenticado | query `estado?` (`PENDIENTE`\|`APROBADA`\|`RECHAZADA`\|`RECIBIDA`), `page`, `size`, `sort` | 200 `Page<OrdenRequisicionResponse>` |
| GET | `/{id}` | cualquier autenticado | — | 200 `OrdenRequisicionResponse` |
| POST | `/{id}/aprobar` | ALMACEN, ADMIN | — | 200 `OrdenRequisicionResponse` |
| POST | `/{id}/rechazar` | ALMACEN, ADMIN | JSON `{ "motivo": "..." }` | 200 `OrdenRequisicionResponse` |
| POST | `/{id}/recibir` | ALMACEN, ADMIN | **sin body** | 200 `OrdenRequisicionResponse` |

## Máquina de estados (`EstadoOrden`)

`PENDIENTE → APROBADA | RECHAZADA` — `APROBADA → RECIBIDA`. Cualquier otra transición → **409** `"Transición inválida: X → Y"`.

## Crear orden

`OrdenRequisicionRequest`:
```json
{
  "detalles": [
    { "insumoId": 4, "cantidadPedida": 50 },
    { "insumoId": 7, "cantidadPedida": 10 }
  ]
}
```
`detalles` no puede estar vacío (`@NotEmpty`) → 400 si lo está. `cantidadPedida` mínimo 1. `solicitadoPor` y `fechaSolicitud` los fija el backend desde el usuario autenticado, estado inicial `PENDIENTE`.

Response 201 (`OrdenRequisicionResponse`):
```json
{
  "id": 3,
  "estado": "PENDIENTE",
  "solicitadoPor": "enfermera1",
  "aprobadoPor": null,
  "fechaSolicitud": "2026-07-19T15:00:00Z",
  "fechaRecepcion": null,
  "motivoRechazo": null,
  "detalles": [
    { "id": 5, "insumoId": 4, "insumoNombre": "Gasas estériles", "cantidadPedida": 50, "cantidadRecibida": 0 },
    { "id": 6, "insumoId": 7, "insumoNombre": "Jeringa 5ml", "cantidadPedida": 10, "cantidadRecibida": 0 }
  ]
}
```

## Rechazar

```json
{ "motivo": "Stock actual suficiente, no se requiere reposición" }
```
`motivo` en blanco → 400 (validación manual en el controller, no `ApiError` estándar de bean validation — es un `ResponseEntity.badRequest().build()` **sin body**). Transición inválida (orden no está en `PENDIENTE`) → 409.

## Recibir — ⚠️ divergencia importante respecto al plan original

El endpoint `POST /{id}/recibir` **no recibe body**. El plan original describía una recepción parcial con lotes/cantidades por línea (`RecepcionRequest`), pero la implementación real:
- No crea ningún `LoteInventario` nuevo.
- No registra movimientos de `ENTRADA` en inventario.
- Simplemente marca cada `DetalleOrdenRequisicion` con `cantidadRecibida = cantidadPedida` (si `cantidadRecibida` era 0) y cambia el estado a `RECIBIDA`.

Es decir: **recibir una orden no actualiza el stock real del inventario**. Si el frontend necesita que el stock refleje la recepción, debe registrar manualmente un movimiento `ENTRADA` con `POST /api/v1/movimientos` (creando antes un lote con `POST /insumos/{id}/lotes` si no existe uno adecuado) tras marcar la orden como recibida. Ver [10-known-issues.md](./10-known-issues.md).
