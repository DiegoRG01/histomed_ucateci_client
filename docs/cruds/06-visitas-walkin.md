# 06 - Visitas walk-in

## Contexto y objetivo

Atención sin cita en el dispensario: `VisitaDispensario` (cola de estados), `AdministracionMedicamento` (con
validación de alergias), `ReaccionAdversa`, `ExtraccionHospitalaria`. Como `05-requisiciones.md`, el valor central
es el workflow (cola de espera → atención → cierre), no un CRUD plano.

**Prerrequisito:** `00-fundamentos-crud.md` + `04-estudiantes-ficha-medica.md` (la visita referencia un
`Estudiante` y sus alergias) + `03-inventario.md` (medicamentos/lotes administrados).

Referencia backend: `docs/02-modelo-dominio.md` (bloque Visitas walk-in) y `docs/planes/plan-05-visitas-walkin.md`
del repo `histomed_ucateci`. Módulo M5, depende de M2 + M3.

## Estado backend

`VisitaDispensarioController` confirmado en el repo (existencia verificada, no explorado en detalle esta sesión).
Estados de visita: `EN_ESPERA → EN_ATENCION → ATENDIDO` o `CANCELADO`. Regla de negocio crítica documentada: antes
de registrar una `AdministracionMedicamento`, el backend valida contra `AlergiaEstudiante` (tipo `MEDICAMENTO`) del
estudiante; si hay coincidencia, **bloquea/alerta con `BusinessException`** (409/422, según `ApiError`) — la UI debe
capturar ese error específico y mostrarlo de forma prominente (no como un error genérico de formulario), ya que es
una alerta de seguridad clínica.

## Endpoints consumidos (a confirmar)

| Método | Path esperado | Roles esperados | Notas |
|---|---|---|---|
| POST | `/api/v1/visitas` | ENFERMERIA, ADMIN | Crear visita (entra en `EN_ESPERA`) |
| GET | `/api/v1/visitas?estado=&page=&size=` | ENFERMERIA, ADMIN, CONSULTA | Cola de visitas, filtrable por estado |
| GET | `/api/v1/visitas/{id}` | ENFERMERIA, ADMIN, CONSULTA | Detalle |
| PATCH/PUT | `/api/v1/visitas/{id}/estado` | ENFERMERIA, ADMIN | Transición de estado (cola) |
| POST | `/api/v1/visitas/{id}/administraciones` | ENFERMERIA, ADMIN | Registrar `AdministracionMedicamento` (con validación de alergias) |
| POST | `/api/v1/visitas/{id}/reacciones-adversas` | ENFERMERIA, ADMIN | Registrar `ReaccionAdversa` |
| POST | `/api/v1/visitas/{id}/extracciones` | ENFERMERIA, ADMIN | Registrar `ExtraccionHospitalaria` (derivación) |

## Modelo de datos frontend (types.ts)

`src/features/visitas/types.ts`:

```ts
export type EstadoVisita = 'EN_ESPERA' | 'EN_ATENCION' | 'ATENDIDO' | 'CANCELADO'

export type VisitaDispensario = {
  id: number; estudianteId: number; estudianteNombre: string
  fechaHora: string; motivoConsulta: string; estadoVisita: EstadoVisita
  atendidoPorId: number | null; observaciones: string | null
}
export type CreateVisitaRequest = { estudianteId: number; motivoConsulta: string }

export type AdministracionMedicamento = {
  id: number; visitaId: number; medicamentoId: number; loteId: number; dosis: string; fechaHora: string
}
export type CreateAdministracionMedicamentoRequest = Omit<AdministracionMedicamento, 'id' | 'fechaHora'>

export type ReaccionAdversa = { id: number; descripcion: string; severidad: 'LEVE'|'MODERADA'|'GRAVE'; fechaHora: string }
export type ExtraccionHospitalaria = { id: number; hospitalDestino: string; motivo: string; fechaHora: string }
```

## Rutas frontend nuevas

- `/visitas` (cola de espera, tabla filtrable por `EstadoVisita`) — `RoleGuard allow={['ADMIN','ENFERMERIA','CONSULTA']}`
- `/visitas/nueva` (buscar estudiante por matrícula/nombre + motivo) — `RoleGuard allow={['ADMIN','ENFERMERIA']}`
- `/visitas/:id` (detalle: datos de la visita + administración de medicamentos + reacciones + extracción, todo en
  una sola página con secciones) — `RoleGuard allow={['ADMIN','ENFERMERIA','CONSULTA']}` (lectura), acciones de
  registro solo `ADMIN`/`ENFERMERIA`.

## Componentes a crear

`src/features/visitas/components/`:
- `VisitaColaPage.tsx` — `DataTable` con badge de `EstadoVisita`, refresco frecuente (considerar
  `refetchInterval` corto en el `useQuery` de la cola, ya que es una vista tipo "sala de espera en vivo").
- `VisitaForm.tsx` — buscador de estudiante (reusa `useEstudiantes` de `04-estudiantes-ficha-medica.md` con
  `filtro`) + campo de motivo.
- `VisitaDetailPage.tsx` — cabecera (datos estudiante + estado) + botones de transición de estado + secciones:
  `AdministracionMedicamentoForm.tsx`, `ReaccionAdversaForm.tsx`, `ExtraccionHospitalariaForm.tsx`.
- `AlergiaBloqueoAlert.tsx` — componente específico para mostrar el error de `BusinessException` por alergia
  detectada al intentar registrar una administración (no es un `mapApiErrorToForm` genérico, es una alerta
  destacada tipo shadcn `alert`/toast persistente, no un simple mensaje bajo el campo).

## Hooks a crear

- `createCrudHooks` parcial para `visitas`: `useList`, `useGetById`, `useCreate` (sin `useUpdate` genérico —
  la edición es solo transición de estado).
- `useCambiarEstadoVisita(id)` — mutation custom para la cola de estados.
- `useRegistrarAdministracion(visitaId)`, `useRegistrarReaccionAdversa(visitaId)`,
  `useRegistrarExtraccion(visitaId)` — mutations custom, cada una invalidando `['visitas', visitaId]`.
- `useRegistrarAdministracion` debe distinguir el error de negocio (alergia) del resto: verificar `error.status`
  (409/422 según `ApiError`) y `error.message` para decidir si renderizar `AlergiaBloqueoAlert` vs. error genérico.

## Casos especiales / reglas de negocio UI

- **Alerta de alergias es la regla más importante de este módulo** — no debe poder omitirse ni silenciarse
  accidentalmente; el flujo de UI debe forzar que el usuario vea el bloqueo antes de reintentar.
- Cola de espera (`EN_ESPERA`) se beneficia de polling o revalidación frecuente — evaluar `refetchInterval` en el
  `useQuery` de lista en vez de WebSockets (fuera de alcance para un proyecto de este tamaño).
- No hay "eliminar" visita — solo transición a `CANCELADO`. No usar `ConfirmDeleteDialog` de desactivación aquí,
  usar el mismo flujo de transición de estado que para `ATENDIDO`.
- `ReaccionAdversa` y `ExtraccionHospitalaria` son opcionales por visita (no toda visita las tiene) — mostrarlas
  como acciones "agregar" dentro del detalle, no como paso obligatorio del flujo.

## Dependencias y orden de implementación

1. `00-fundamentos-crud.md`.
2. `04-estudiantes-ficha-medica.md` (buscador de estudiante, alergias).
3. `03-inventario.md` (selector de medicamento/lote al administrar).
4. Orden interno: `VisitaDispensario` (cola + alta) → `AdministracionMedicamento` (con validación de alergias) →
   `ReaccionAdversa`/`ExtraccionHospitalaria` (secundarios, cualquier orden).

## Pendientes / preguntas abiertas

- Confirmar paths reales de los endpoints de sub-registro (administraciones, reacciones, extracciones) — se
  asumió anidados bajo `/visitas/{id}/...`, no confirmado contra el backend.
- Confirmar el código de estado HTTP exacto que devuelve el backend para el bloqueo por alergia (409 vs 422) para
  poder distinguirlo correctamente en el frontend.
