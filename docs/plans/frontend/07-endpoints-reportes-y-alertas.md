# Reportes y alertas (M6)

Todo bajo `ReporteController` — `/api/v1/reportes` (no existe un `AlertaController` separado; las "alertas" del plan original viven como dos endpoints más dentro de este mismo controller). Todos son `GET`, de solo lectura, accesibles a **cualquier rol autenticado**, y devuelven `List<T>` **sin paginar**.

| Endpoint | Query params | Response (array de) |
|---|---|---|
| `GET /reportes/visitas-por-carrera` | — | `{ carrera, cantidad }` |
| `GET /reportes/motivos-consulta` | — | `{ motivo, cantidad }` |
| `GET /reportes/visitas-por-periodo` | `desde` (Instant ISO), `hasta` (Instant ISO) — **requeridos** | `{ fecha, cantidad }` |
| `GET /reportes/medicamentos-mas-administrados` | `topN` (int, default 10) | `{ medicamentoId, medicamentoNombre, cantidad }` |
| `GET /reportes/consumo-por-periodo` | `desde`, `hasta` (Instant, requeridos) | `{ insumoId, insumoNombre, cantidad }` |
| `GET /reportes/ordenes-por-estado` | — | `{ estado, cantidad }` |
| `GET /reportes/trazabilidad-lote/{loteId}` | — | `{ administracionId, estudianteNombre, visitaId, fechaHora, dosis }` |
| `GET /reportes/seguimiento-especial` | — | `{ estudianteId, nombre, apellido, motivo }` |
| `GET /reportes/distribucion-grupo-sanguineo` | — | `{ grupoSanguineo, cantidad }` |
| `GET /reportes/stock-bajo` | — | `{ insumoId, insumoNombre, stockActual, stockMinimo }` |
| `GET /reportes/vencimiento-proximo` | `dias` (int, default 30) | `{ loteId, numeroLote, insumoNombre, fechaVencimiento, cantidadDisponible }` |

Ejemplo de llamada con rango de fechas: `GET /api/v1/reportes/visitas-por-periodo?desde=2026-07-01T00:00:00Z&hasta=2026-07-19T23:59:59Z` — el formato de `desde`/`hasta` es `Instant` (ISO-8601 con hora y `Z`), **no** basta con `2026-07-01`.

Todos son ideales para poblar tarjetas/gráficas de un dashboard y para las dos "alertas" (`stock-bajo`, `vencimiento-proximo`) que el plan original agrupaba bajo un path `/api/v1/alertas/*` que **no existe** — están bajo `/api/v1/reportes/*` como cualquier otro reporte.
