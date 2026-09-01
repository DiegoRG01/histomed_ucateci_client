# 07 - Dashboard / reportes

## Contexto y objetivo

Vistas de solo lectura sobre datos ya gestionados por los módulos anteriores: las 10 consultas de negocio del
backend (visitas por carrera, medicamentos más administrados, motivos de consulta, seguimiento especial, etc.),
alertas de stock bajo/vencimiento próximo, y trazabilidad de lote. No hay formularios ni mutaciones en este módulo.

**Prerrequisito:** `00-fundamentos-crud.md`. Depende conceptualmente de que `03-inventario.md`, `04-estudiantes-
ficha-medica.md`, `05-requisiciones.md` y `06-visitas-walkin.md` tengan datos reales para reportar, pero el
frontend de este módulo puede construirse en paralelo apuntando a los mismos endpoints.

Referencia backend: `docs/03-roadmap.md` (M6) y `docs/planes/plan-06-dashboard-reportes.md` del repo
`histomed_ucateci`. Depende de M3, M4, M5 en el backend.

Si se construyen gráficos (no solo tablas/números), seguir la skill `dataviz` de este proyecto para paleta,
elección de tipo de gráfico y layout — no improvisar estilos de chart.

## Estado backend

`ReporteController` confirmado en el repo con múltiples DTOs de respuesta específicos por reporte (ver
`dto/*ReporteResponse.java` explorados en el listado del repo: `ConsumoPeriodoReporteResponse`,
`DistribucionGrupoSanguineoReporteResponse`, `MedicamentoAdministradoReporteResponse`,
`MotivoConsultaReporteResponse`, `OrdenesPorEstadoReporteResponse`, `SeguimientoEspecialReporteResponse`,
`TrazabilidadLoteReporteResponse`, `VisitasPorCarreraReporteResponse`, `VisitasPorPeriodoReporteResponse`) más
`StockBajoAlertaResponse` y `VencimientoProximoAlertaResponse`. No se exploraron los paths/roles exactos de
`ReporteController` en esta sesión — confirmar al implementar.

## Endpoints consumidos (a confirmar paths/params exactos)

| Reporte | DTO de respuesta | Filtros esperados |
|---|---|---|
| Visitas por carrera | `VisitasPorCarreraReporteResponse` | rango de fechas |
| Visitas por período | `VisitasPorPeriodoReporteResponse` | rango de fechas, agrupación (día/semana/mes) |
| Motivos de consulta | `MotivoConsultaReporteResponse` | rango de fechas |
| Medicamentos más administrados | `MedicamentoAdministradoReporteResponse` | rango de fechas |
| Consumo por período | `ConsumoPeriodoReporteResponse` | rango de fechas, insumo opcional |
| Distribución grupo sanguíneo | `DistribucionGrupoSanguineoReporteResponse` | — |
| Órdenes por estado | `OrdenesPorEstadoReporteResponse` | rango de fechas |
| Seguimiento especial | `SeguimientoEspecialReporteResponse` | — (estudiantes con condiciones/alergias relevantes) |
| Trazabilidad de lote | `TrazabilidadLoteReporteResponse` | `loteId` |
| Stock bajo (alerta) | `StockBajoAlertaResponse` | — |
| Vencimiento próximo (alerta) | `VencimientoProximoAlertaResponse` | días de anticipación |

Todos previsiblemente bajo `/api/v1/reportes/...` — confirmar paths exactos por reporte al implementar.

## Modelo de datos frontend (types.ts)

`src/features/reportes/types.ts` — un tipo TS por cada `*ReporteResponse`/`*AlertaResponse` del backend, definido
cuando se confirme el shape real de cada uno (no inventar campos por adelantado; a diferencia de otros módulos,
aquí cada respuesta es distinta y conviene tipar contra el DTO real, no contra una suposición).

## Rutas frontend nuevas

- `/dashboard` (resumen: alertas de stock bajo + vencimiento próximo + KPIs principales) — `RoleGuard
  allow={['ADMIN','ENFERMERIA','ALMACEN','CONSULTA']}` (todos los roles ven el dashboard, contenido puede variar
  por rol: p.ej. `ALMACEN` ve más inventario, `ENFERMERIA` ve más visitas).
- `/reportes/visitas`, `/reportes/inventario`, `/reportes/donacion` (agrupar los 10 reportes en 2-3 páginas por
  temática en vez de 10 rutas sueltas) — roles según temática (inventario → `ADMIN`,`ALMACEN`; visitas/clínico →
  `ADMIN`,`ENFERMERIA`,`CONSULTA`).
- `/reportes/lotes/:loteId/trazabilidad` — trazabilidad de un lote específico, enlazado desde
  `03-inventario.md` (detalle de lote).

## Componentes a crear

`src/features/reportes/components/`:
- `DashboardPage.tsx` — reemplaza el actual placeholder `<div>Dashboard placeholder</div>` en `src/app/routes.tsx`.
  Tarjetas de alerta (`StockBajoCard.tsx`, `VencimientoProximoCard.tsx`) + KPIs simples.
- Un componente de reporte por cada temática (`VisitasReportesPage.tsx`, `InventarioReportesPage.tsx`,
  `DonacionReportesPage.tsx`), cada uno con selector de rango de fechas compartido (`DateRangeFilter.tsx`,
  reusado entre reportes) y gráficos/tablas según el reporte.
- `TrazabilidadLotePage.tsx` — tabla de eventos (quién recibió qué del lote y cuándo).

## Métricas y filtros por reporte

- Filtro de rango de fechas es el más común — construir un único `DateRangeFilter.tsx` reusado, no uno por reporte.
- Reportes puramente tabulares (ej. seguimiento especial) usan `DataTable` igual que los CRUDs; reportes
  agregados/temporales (visitas por período, consumo por período) son candidatos a gráfico de líneas/barras según
  la skill `dataviz`.
- Distribución por grupo sanguíneo es candidato natural a gráfico de torta/barras (categorías fijas y pocas).

## Dependencias y orden de implementación

1. `00-fundamentos-crud.md`.
2. Confirmar paths reales de `ReporteController` contra el backend.
3. Implementar primero `DashboardPage` (alertas + KPIs, mayor valor para sustentación según
   `docs/03-roadmap.md` del repo backend: "M6 es el mayor diferenciador... debe priorizarse sobre los extras").
4. Luego los reportes agrupados por temática, en cualquier orden.

## Pendientes / preguntas abiertas

- Confirmar paths y query params exactos de cada endpoint de `ReporteController`.
- Confirmar shape real de cada DTO `*ReporteResponse`/`*AlertaResponse` antes de tipar `types.ts`.
- Decidir agrupación final de rutas (2 vs 3 páginas temáticas) según cómo queden de cargados los reportes reales.
