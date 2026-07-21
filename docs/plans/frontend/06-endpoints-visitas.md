# Visitas walk-in (M5)

`VisitaDispensarioController` — `/api/v1/visitas`. Todo el módulo (visita, administraciones, reacciones, extracciones) es de solo lectura para `CONSULTA` y CRUD para `ENFERMERIA`/`ADMIN`. `ALMACEN` no tiene acceso a nada de este módulo.

| Método | Path | Roles | Body/Params | Response |
|---|---|---|---|---|
| POST | `` | ENFERMERIA, ADMIN | JSON `VisitaRequest` | 201 `VisitaResponse` |
| GET | `` | ENFERMERIA, ADMIN, CONSULTA | query `estado?` (`EN_ESPERA`\|`EN_ATENCION`\|`ATENDIDO`\|`CANCELADO`), `page`, `size`, `sort` | 200 `Page<VisitaResponse>` |
| GET | `/{id}` | ENFERMERIA, ADMIN, CONSULTA | — | 200 `VisitaResponse` |
| POST | `/{id}/atender` | ENFERMERIA, ADMIN | — | 200 `VisitaResponse` |
| POST | `/{id}/finalizar` | ENFERMERIA, ADMIN | — | 200 `VisitaResponse` |
| POST | `/{id}/cancelar` | ENFERMERIA, ADMIN | — | 200 `VisitaResponse` |
| POST | `/{id}/administraciones` | ENFERMERIA, ADMIN | JSON `AdministracionMedicamentoRequest` | 201 `AdministracionMedicamentoResponse` |
| GET | `/{id}/administraciones` | ENFERMERIA, ADMIN, CONSULTA | `page`, `size`, `sort` | 200 `Page<AdministracionMedicamentoResponse>` |
| POST | `/{visitaId}/administraciones/{administracionId}/reacciones-adversas` | ENFERMERIA, ADMIN | JSON `ReaccionAdversaRequest` | 201 `ReaccionAdversaResponse` |
| GET | `/{id}/reacciones-adversas` | ENFERMERIA, ADMIN, CONSULTA | `page`, `size`, `sort` | 200 `Page<ReaccionAdversaResponse>` |
| POST | `/{id}/extracciones-hospitalarias` | ENFERMERIA, ADMIN | JSON `ExtraccionHospitalariaRequest` | 201 `ExtraccionHospitalariaResponse` |
| GET | `/{id}/extracciones-hospitalarias` | ENFERMERIA, ADMIN, CONSULTA | `page`, `size`, `sort` | 200 `Page<ExtraccionHospitalariaResponse>` |

> Nota: los 3 listados anidados (`administraciones`, `reacciones-adversas`, `extracciones-hospitalarias`) se implementan con `PageImpl` construido en memoria a partir de una lista completa — funcionalmente son `Page<T>` válidos para el cliente (misma forma JSON), pero no hay ordenamiento/paginación real a nivel de base de datos en estos tres.

## Crear visita

`VisitaRequest`:
```json
{ "estudianteId": 10, "motivoConsulta": "Dolor de cabeza" }
```
Se crea en estado `EN_ESPERA` con `fechaHora = now()`.

`VisitaResponse`:
```json
{
  "id": 22,
  "estudianteId": 10,
  "estudianteNombre": "Juan Pérez",
  "fechaHora": "2026-07-19T15:10:00Z",
  "motivoConsulta": "Dolor de cabeza",
  "estadoVisita": "EN_ESPERA",
  "atendidoPor": null,
  "temperatura": null,
  "presionArterial": null,
  "frecuenciaCardiaca": null,
  "observaciones": null
}
```

## Máquina de estados (`EstadoVisita`)

`EN_ESPERA → EN_ATENCION | CANCELADO` — `EN_ATENCION → ATENDIDO | CANCELADO`. `/atender` fija `atendidoPor` al usuario autenticado. Transición inválida → **409** `"Transición inválida: X → Y"`.

## Flujo de administración de medicamento con conflicto de alergia (el más delicado para la UX)

`AdministracionMedicamentoRequest`:
```json
{
  "medicamentoId": 1,
  "loteId": null,
  "dosis": "1 tableta",
  "confirmarPeseAAlergia": false,
  "motivoOverride": null
}
```
`loteId` es opcional — si se omite, se resuelve FEFO igual que en movimientos de inventario. Internamente esta llamada también genera un movimiento `SALIDA` de 1 unidad en inventario.

**Paso 1** — intento normal (`confirmarPeseAAlergia: false`):
- El backend revisa las `AlergiaEstudiante` activas del estudiante de la visita. Si alguna es `tipoAlergia=MEDICAMENTO` y coincide con el medicamento solicitado (por FK exacta o por compartir un `TipoMedicamento`), y `confirmarPeseAAlergia` no es `true` → responde **409**:
```json
{
  "timestamp": "2026-07-19T15:12:00Z",
  "status": 409,
  "error": "Conflict",
  "message": "El estudiante tiene alergia al medicamento 'Amoxicilina 500mg' (alergia: Penicilina). Use confirmarPeseAAlergia=true con motivo.",
  "path": "/api/v1/visitas/22/administraciones"
}
```

**Paso 2 (UI)** — mostrar un modal de confirmación con el `message` del 409, pedir el motivo, y reintentar:
```json
{
  "medicamentoId": 3,
  "dosis": "500mg",
  "confirmarPeseAAlergia": true,
  "motivoOverride": "Reacción previa fue leve, médico autoriza bajo supervisión"
}
```
- Si `confirmarPeseAAlergia=true` pero `motivoOverride` está vacío/ausente → **400** `"Si confirma pese a alergia, debe proporcionar un motivoOverride."`
- Si stock insuficiente en el lote seleccionado (o FEFO no encuentra lote con stock) → **409** (mismos mensajes que en [04-endpoints-inventario.md](./04-endpoints-inventario.md)).
- Éxito → 201 `AdministracionMedicamentoResponse` con `overrideAlergia: true` y `motivoOverride` persistido.

`AdministracionMedicamentoResponse`:
```json
{
  "id": 8,
  "visitaId": 22,
  "medicamentoId": 3,
  "medicamentoNombre": "Amoxicilina 500mg",
  "loteId": 2,
  "dosis": "500mg",
  "fechaHora": "2026-07-19T15:13:00Z",
  "usuario": "enfermera1",
  "overrideAlergia": true,
  "motivoOverride": "Reacción previa fue leve, médico autoriza bajo supervisión"
}
```

## Reacción adversa

`ReaccionAdversaRequest`: `{ "descripcion": "Erupción cutánea leve", "severidad": "LEVE" }` (`severidad` uno de `LEVE|MODERADA|GRAVE`).

## Extracción hospitalaria (referencia a hospital externo)

`ExtraccionHospitalariaRequest`: `{ "hospitalDestino": "Hospital Regional", "motivo": "Sospecha de fractura" }`.
