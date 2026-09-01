# 08 - Extras: auditoría, carné QR, donación dirigida

## Contexto y objetivo

Tres features transversales/finales del backend, agrupadas en un solo documento **no porque estén relacionadas
entre sí**, sino porque cada una es pequeña/standalone y de menor prioridad que los módulos M1-M6 — agruparlas
evita 3 archivos casi vacíos. Al implementar, tratar cada sección como independiente.

**Prerrequisito:** `00-fundamentos-crud.md`. E1 depende de M1 (saber quién hizo qué). E2 y E3 dependen de
`04-estudiantes-ficha-medica.md` (M2).

Referencia backend: `docs/02-modelo-dominio.md` (bloque Extras) y `docs/planes/plan-07-auditoria.md`,
`plan-08-carne-qr.md`, `plan-09-donacion-dirigida.md` del repo `histomed_ucateci`.

---

## E1 · Auditoría / bitácora

### Estado backend
`AuditoriaController` confirmado en el repo. Solo lectura, rol `ADMIN` únicamente (`RegistroAuditoria`: `entidad`,
`entidadId`, `accion` (`CREAR`/`ACTUALIZAR`/`ELIMINAR`), `usuario`, `detalleAntes`/`detalleDespues` en JSON). Se
puebla automáticamente en el backend vía event listeners — no hay alta manual desde UI.

### Endpoints consumidos (a confirmar)
| Método | Path esperado | Roles |
|---|---|---|
| GET | `/api/v1/auditoria?entidad=&entidadId=&page=&size=` | ADMIN |

### Modelo de datos frontend
```ts
export type AccionAuditoria = 'CREAR' | 'ACTUALIZAR' | 'ELIMINAR'
export type RegistroAuditoria = {
  id: number; entidad: string; entidadId: number; accion: AccionAuditoria
  usuario: string; detalleAntes: string | null; detalleDespues: string | null; createdAt: string
}
```

### Rutas / componentes
- `/auditoria` — `RoleGuard allow={['ADMIN']}`. `AuditoriaListPage.tsx`: `DataTable` paginado, filtros por
  `entidad`/`entidadId`, celda expandible para ver diff de `detalleAntes`/`detalleDespues` (JSON formateado).
- Solo `useList` vía `createResourceApi` (sin create/update/remove — es de solo lectura).

---

## E2 · Carné de emergencia con QR

### Estado backend
`CarneController` confirmado. Endpoint público `GET /api/v1/carne/{token}` (sin auth, ver `SecurityConfig` explorado
esta sesión: `permitAll()` explícito para `/api/v1/carne/**`) devuelve subset seguro de la ficha (nombre, tipo de
sangre, alergias, condiciones, medicamentos habituales, médico de referencia, contacto principal — sin
cédula/matrícula). El backend genera el PNG del QR; el QR codifica una URL del **frontend**, no de la API.

### Endpoints consumidos (a confirmar)
| Método | Path esperado | Auth | Notas |
|---|---|---|---|
| GET | `/api/v1/carne/{token}` | Público | Ficha de emergencia reducida |
| POST | `/api/v1/estudiantes/{id}/carne` o similar | ENFERMERIA, ADMIN | Generar/regenerar token |
| GET | `/api/v1/estudiantes/{id}/carne/qr` | ENFERMERIA, ADMIN | PNG del QR (o URL del PNG) |

### Modelo de datos frontend
```ts
export type CarneEmergencia = {
  nombre: string; grupoSanguineo: string; alergias: string[]; condiciones: string[]
  medicamentosHabituales: string[]; medicoReferencia: string | null; contactoPrincipal: string | null
}
```

### Rutas / componentes
- `/carne/:token` — **ruta pública**, fuera de `ProtectedRoute`/`AppLayout` (no requiere login). Página de solo
  lectura, diseño simple tipo "tarjeta de emergencia" para verse bien en un celular escaneando el QR.
- Dentro de `04-estudiantes-ficha-medica.md` → `EstudianteDetailPage.tsx`: botón "Generar/regenerar carné QR" que
  muestra el PNG devuelto por el backend y el link público.
- Sin CRUD estándar — solo `useGenerarCarne(estudianteId)` (mutation) y la página pública usa un `useQuery` ad-hoc
  sin autenticación (cuidado: debe usar una instancia de axios o llamada que **no** dependa del interceptor de auth
  para no romper si no hay sesión — confirmar que `apiClient` no exige token, solo lo adjunta si existe).

### Casos especiales
- Privacidad: el subset expuesto públicamente NO incluye cédula/matrícula — no agregar esos campos a
  `CarneEmergencia` aunque estén disponibles en otros DTOs.
- Confirmar si el backend implementa rate limiting (mencionado en `02-modelo-dominio.md`) — no es responsabilidad
  del frontend, pero afecta el manejo de errores 429 si aplica.

---

## E3 · Jornada de donación dirigida

### Estado backend
`CampaniaDonacionController` confirmado. Workflow: `SOLICITADA` (ENFERMERIA solicita) → `ABIERTA` (ADMIN aprueba,
dispara búsqueda de donantes aptos del mismo grupo sanguíneo + envío de correo asíncrono + registro de
`NotificacionCampania`) → `CERRADA`/`CANCELADA`.

### Endpoints consumidos (a confirmar)
| Método | Path esperado | Roles |
|---|---|---|
| POST | `/api/v1/campanias-donacion` | ENFERMERIA, ADMIN | Solicitar (crea en `SOLICITADA`) |
| GET | `/api/v1/campanias-donacion?estado=&page=&size=` | ENFERMERIA, ADMIN | Listado |
| GET | `/api/v1/campanias-donacion/{id}` | ENFERMERIA, ADMIN | Detalle + notificaciones enviadas |
| PATCH/PUT | `/api/v1/campanias-donacion/{id}/aprobar` | ADMIN | → ABIERTA, dispara notificaciones |
| PATCH/PUT | `/api/v1/campanias-donacion/{id}/rechazar` | ADMIN | Requiere `motivoRechazo` |
| PATCH/PUT | `/api/v1/campanias-donacion/{id}/cerrar` | ADMIN | → CERRADA |

### Modelo de datos frontend
```ts
export type EstadoCampania = 'SOLICITADA' | 'ABIERTA' | 'CERRADA' | 'CANCELADA'

export type CampaniaDonacion = {
  id: number; estudianteObjetivoId: number; estudianteObjetivoNombre: string
  grupoSanguineo: string; estado: EstadoCampania
  fechaSolicitud: string; fechaAprobacion: string | null
  solicitadaPorId: number; aprobadaPorId: number | null
  mensaje: string; motivoRechazo: string | null
}
export type NotificacionCampania = { id: number; estudianteId: number; email: string; fechaEnvio: string; exito: boolean }
export type CreateCampaniaDonacionRequest = { estudianteObjetivoId: number; mensaje: string }
```

### Rutas / componentes
- `/donaciones` (lista + solicitar) — `RoleGuard allow={['ADMIN','ENFERMERIA']}`
- `/donaciones/:id` (detalle + acciones de workflow + tabla de `NotificacionCampania` con estado de envío por
  destinatario) — mismo patrón que `05-requisiciones.md` (mutations custom por transición, no `useUpdate` genérico).

### Casos especiales
- Igual que en requisiciones: mostrar/ocultar botones de transición según `estado` + rol.
- Al "Aprobar", advertir en el diálogo de confirmación que esto dispara envío de correos reales a estudiantes
  (acción con efecto externo visible, no solo un cambio de estado interno).
- Tabla de `NotificacionCampania` es de solo lectura (bitácora de envíos), sin CRUD.

---

## Dependencias y orden de implementación (las 3 features)

1. `00-fundamentos-crud.md` (todas).
2. E1 depende solo de M1 (seguridad) — puede implementarse en cuanto exista `AuditoriaController` real, en
   paralelo a otros módulos.
3. E2 y E3 dependen de `04-estudiantes-ficha-medica.md`.
4. Prioridad relativa: si el tiempo aprieta, estas 3 features son las últimas del roadmap (ver
   `docs/03-roadmap.md` del repo backend: "M6 debe priorizarse sobre los extras").

## Pendientes / preguntas abiertas

- Confirmar paths exactos de los tres controllers (`AuditoriaController`, `CarneController`,
  `CampaniaDonacionController`) — solo se confirmó su existencia en el listado del repo, no sus endpoints internos.
- Confirmar si `apiClient` (interceptor de auth) puede usarse tal cual para la ruta pública de carné, o si conviene
  una instancia axios separada sin interceptor para esa única llamada pública.
