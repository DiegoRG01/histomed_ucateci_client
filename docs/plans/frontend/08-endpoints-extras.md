# Extras: Auditoría, Carné QR, Donación dirigida

## Auditoría (E1) — `AuditoriaController` — `/api/v1/auditoria`

Solo lectura, **solo ADMIN** (403 para el resto).

| Método | Path | Params | Response |
|---|---|---|---|
| GET | `` | query `entidad?` (nombre simple de clase, ej. `"Estudiante"`), `usuario?`, `page`, `size`, `sort` | 200 `Page<RegistroAuditoriaResponse>` |

`RegistroAuditoriaResponse`: `{ id, entidad, entidadId, accion, usuario, detalleAntes, detalleDespues, fecha }` — `accion` es `CREAR|ACTUALIZAR|ELIMINAR`; `detalleAntes`/`detalleDespues` son strings JSON (JSONB en la BD), el frontend puede necesitar `JSON.parse` si quiere mostrarlos estructurados. Se auto-generan vía listeners de Hibernate para entidades sensibles (datos clínicos, visitas, administraciones, usuarios/roles) — no hay endpoint de escritura.

## Carné de emergencia con QR (E2) — `CarneController` — `/api/v1/estudiantes/{id}/carne`, `/api/v1/carne/{token}`, `/api/v1/estudiantes/{id}/carne-qr`

| Método | Path | Roles | Response |
|---|---|---|---|
| POST | `/api/v1/estudiantes/{estudianteId}/carne` | ENFERMERIA, ADMIN | 201 `{ "token": "uuid...", "url": "/api/v1/carne/<token>" }` |
| GET | `/api/v1/carne/{token}` | **público, sin auth** | 200 `CarneEmergenciaResponse` |
| GET | `/api/v1/estudiantes/{estudianteId}/carne-qr` | ENFERMERIA, ADMIN | `image/png` (bytes crudos, 400x400) |

- Generar/regenerar invalida el token anterior (nuevo UUID cada vez que se llama).
- `GET /api/v1/carne/{token}` está en la whitelist de `SecurityConfig` (`permitAll` para `GET /api/v1/carne/**`) — es la única lectura de datos clínicos accesible sin JWT, por diseño (para que el QR funcione sin login en una emergencia). Devuelve un subconjunto minimizado — **no** incluye cédula ni matrícula:
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "grupoSanguineo": "O_POS",
  "alergias": ["Penicilina (GRAVE)"],
  "condicionesFisicas": ["Marcapasos"],
  "enfermedadesCronicas": ["Diabetes"],
  "medicamentosHabituales": ["Metformina 500mg"],
  "medicoReferencia": "Dr. Carlos Gómez",
  "contactoPrincipal": "María Pérez (Madre) - 8093334455"
}
```
  Token inválido/inexistente → 404.
- **El QR codifica una URL del FRONTEND**, no de la API: `{carne.frontend-base-url}/carne/{token}` (propiedad backend `carne.frontend-base-url`, configurable por env). **El frontend debe implementar una ruta pública** (sin guard de auth) `/carne/:token` que, al cargar, llame a `GET /api/v1/carne/{token}` y muestre la ficha. Esta ruta debe ser accesible sin sesión iniciada (alguien escaneando el QR en una emergencia no tiene por qué estar logueado).

## Donación dirigida (E3) — `CampaniaDonacionController` — `/api/v1/campanias-donacion`

> ⚠️ Ninguno de estos endpoints tiene `@PreAuthorize` explícito en el controller — solo exigen `isAuthenticated()` (la regla global). Las restricciones de rol descritas en el plan (solo ADMIN aprueba/rechaza, etc.) **no están aplicadas a nivel de endpoint** en el código actual; cualquier usuario autenticado puede llamar cualquiera de estas operaciones hoy. Ver [10-known-issues.md](./10-known-issues.md).

| Método | Path | Body | Response |
|---|---|---|---|
| POST | `` | JSON `{ "estudianteObjetivoId": 10, "mensaje": "Se necesita sangre O+ urgente" }` | 200 `CampaniaDonacionResponse` |
| POST | `/{id}/aprobar` | — | 200 `CampaniaDonacionResponse` (dispara matching + emails) |
| POST | `/{id}/rechazar` | JSON `{ "motivo": "..." }` | 200 `CampaniaDonacionResponse` |
| POST | `/{id}/cerrar` | — | 200 `CampaniaDonacionResponse` |
| POST | `/{id}/cancelar` | — | 200 `CampaniaDonacionResponse` |
| GET | `` | query `estado?` (`SOLICITADA`\|`ABIERTA`\|`CERRADA`\|`CANCELADA`), `page`, `size`, `sort` | 200 `Page<CampaniaDonacionResponse>` |
| GET | `/{id}` | — | 200 `CampaniaDonacionResponse` |

`CampaniaDonacionResponse`:
```json
{
  "id": 1,
  "estudianteObjetivoId": 10,
  "estudianteObjetivoNombre": "Juan Pérez",
  "grupoSanguineo": "O_POS",
  "estado": "ABIERTA",
  "fechaSolicitud": "2026-07-19T10:00:00Z",
  "fechaAprobacion": "2026-07-19T10:05:00Z",
  "solicitadaPor": "enfermera1",
  "aprobadaPor": "admin",
  "mensaje": "Se necesita sangre O+ urgente",
  "motivoRechazo": null,
  "notificaciones": [
    { "id": 1, "estudianteId": 15, "estudianteNombre": "Ana Gómez", "email": "ana@ucateci.edu.do", "fechaEnvio": "2026-07-19T10:05:30Z", "exito": true }
  ]
}
```
Al aprobar, el backend busca estudiantes activos con el mismo `grupoSanguineo`, aptos para donar (reutiliza la lógica de `/aptitud-donacion`), con email no vacío, excluyendo al objetivo, y les envía notificación por correo — el resultado de cada envío queda en `notificaciones[]` (útil para mostrar tracking de a quién se le notificó y si falló el envío).
