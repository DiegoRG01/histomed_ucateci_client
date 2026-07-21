# Guía de integración Frontend ↔ Backend (HistoMed UCATECI)

Esta carpeta documenta, contra el **código real** del backend (no solo lo planificado), todo lo que el agente/equipo de frontend (React + Vite + TS + shadcn/ui + Tailwind + TanStack + React Router) necesita para consumir la API.

> El backend es un repo separado, **backend-only**. No hay vistas, no hay sesión de estudiante: **solo el personal (staff) autentica**. Los estudiantes son únicamente registros de datos.

## Índice

1. [01-autenticacion.md](./01-autenticacion.md) — Login, JWT, `/auth/me`, roles.
2. [02-modelo-dominio.md](./02-modelo-dominio.md) — Enums exactos, entidades, soft delete.
3. [03-endpoints-estudiantes.md](./03-endpoints-estudiantes.md) — Estudiantes, ficha médica, catálogos asociados.
4. [04-endpoints-inventario.md](./04-endpoints-inventario.md) — Insumos, medicamentos, lotes, movimientos.
5. [05-endpoints-requisiciones.md](./05-endpoints-requisiciones.md) — Órdenes de requisición.
6. [06-endpoints-visitas.md](./06-endpoints-visitas.md) — Visitas walk-in, administración de medicamentos, alergias.
7. [07-endpoints-reportes-y-alertas.md](./07-endpoints-reportes-y-alertas.md) — Dashboard/reportes.
8. [08-endpoints-extras.md](./08-endpoints-extras.md) — Auditoría, carné QR, donación dirigida.
9. [09-manejo-de-errores.md](./09-manejo-de-errores.md) — Forma de `ApiError`, códigos de estado.
10. [10-known-issues.md](./10-known-issues.md) — Divergencias entre lo planificado (`docs/planes/`) y lo realmente implementado. **Leer antes de asumir que algo existe.**

## Datos generales

- **Base URL (dev)**: `http://localhost:8080` (no hay `server.port` configurado → puerto 8080 por defecto de Spring Boot).
- **Prefijo de API**: todo vive bajo `/api/v1/...`.
- **CORS**: ya configurado en `SecurityConfig` para `http://localhost:5173` (Vite default) vía la propiedad `app.cors.allowed-origins` (`APP_CORS_ALLOWED_ORIGINS`, separado por comas si hay más de un origen). `allowCredentials=true`. Métodos permitidos: GET, POST, PUT, DELETE, PATCH, OPTIONS. Headers: `*`.
- **Autenticación**: JWT en header `Authorization: Bearer <token>`. Ver [01-autenticacion.md](./01-autenticacion.md).
- **Referencia interactiva**: Swagger UI en `/swagger-ui/index.html` (o `/swagger-ui.html`), OpenAPI JSON en `/v3/api-docs`. Ambos son públicos (no requieren JWT). Útil para explorar/probar en vivo, pero **esta guía documenta con más precisión** los casos especiales (query params vs body, transiciones de estado, etc.) que Swagger no siempre deja claros.

## Roles

4 roles de staff, mutuamente no excluyentes en la práctica (un usuario puede tener varios): `ADMIN`, `ENFERMERIA`, `ALMACEN`, `CONSULTA`. Internamente Spring Security los expone como authorities `ROLE_ADMIN`, `ROLE_ENFERMERIA`, etc.

Matriz de acceso agregada por módulo (ver cada archivo de endpoints para el detalle por operación):

| Módulo | ADMIN | ENFERMERIA | ALMACEN | CONSULTA |
|---|---|---|---|---|
| Usuarios (`/usuarios`) | CRUD | — | — | — |
| Estudiantes + ficha médica | CRUD | CRUD | **sin acceso** | solo lectura |
| Catálogo Carreras | escribe | lee | lee | lee |
| Inventario (insumos/medicamentos/lotes) | CRUD | lee | CRUD | lee |
| Movimientos de inventario | — (según tipo) | SALIDA | todos los tipos | — |
| Requisiciones — crear | crea | crea | crea | — |
| Requisiciones — aprobar/rechazar/recibir | sí | — | sí | — |
| Visitas + administración de medicamentos | CRUD | CRUD | **sin acceso** | solo lectura |
| Reportes/Alertas | lee | lee | lee | lee |
| Auditoría | **solo ADMIN** | — | — | — |
| Carné QR — generar | sí | sí | — | — |
| Carné QR — leer por token | público, sin rol | | | |
| Donación dirigida | ver [08](./08-endpoints-extras.md) | | | |

**Importante**: `ALMACEN` está completamente excluido de los módulos de estudiantes y visitas — un usuario de almacén nunca debería ver pantallas de datos de estudiantes.

## Paginación

Configuración global (`application.yml`): `spring.data.web.pageable.default-page-size=20`, `max-page-size=100`.

Endpoints que **sí** devuelven `Page<T>` de Spring (usan `Pageable`, params `page` [0-based], `size`, `sort=campo,asc|desc`): `GET /estudiantes`, `GET /ordenes-requisicion`, `GET /visitas`, `GET /visitas/{id}/administraciones`, `GET /visitas/{id}/reacciones-adversas`, `GET /visitas/{id}/extracciones-hospitalarias`, `GET /auditoria`, `GET /campanias-donacion`.

Forma del `Page<T>` (estándar Spring Data):
```json
{
  "content": [ /* array de items */ ],
  "totalElements": 42,
  "totalPages": 3,
  "number": 0,
  "size": 20,
  "first": true,
  "last": false,
  "numberOfElements": 20,
  "empty": false
}
```

Endpoints que devuelven **`List<T>` plano, sin paginar** (todos los resultados): catálogos (`/insumos`, `/medicamentos`, `/tipos-medicamento`, `/carreras`, `/contactos`), sub-recursos de estudiante (`/estudiantes/{id}/alergias`, `/condiciones`, `/contactos`, `/medicamentos`), lotes (`/insumos/{id}/lotes`), movimientos (`/movimientos/insumo/{id}`), usuarios (`/usuarios`), y **todos** los endpoints de `/reportes/*` y `/reportes/stock-bajo` / `/reportes/vencimiento-proximo`.

## Fechas

- **`Instant`** (timestamp con hora, zona UTC, serializado ISO-8601 con `Z`): `createdAt`, `updatedAt`, `fechaHora`, `fechaSolicitud`, `fechaRecepcion`, `fechaEnvio`, `fecha` (movimientos/auditoría). Ejemplo: `"2026-07-19T14:32:00.123456Z"`.
- **`LocalDate`** (solo fecha civil, sin hora): `fechaNacimiento`, `fechaVencimiento`, `fechaDiagnostico`. Ejemplo: `"2026-07-19"`.

## Convención de escritura de sub-recursos (¡atención!)

Muchos endpoints de asociación (alergias/condiciones/contactos/medicamentos habituales/médico de referencia de un estudiante, y el catálogo de contactos/carreras) **no reciben un JSON body**: reciben los datos como **query params** (`@RequestParam`). Esto es distinto a lo que sugerían los planes de diseño originales. Ver el detalle exacto de cada uno en [03-endpoints-estudiantes.md](./03-endpoints-estudiantes.md).

## Soft delete

Todas las entidades heredan de `Auditable`, que aplica `@SoftDelete` a nivel de Hibernate (columna `activo`). Un `DELETE` (donde existe) no borra físicamente el registro, solo lo desactiva — y Hibernate filtra automáticamente los registros inactivos de **todas** las consultas/listados/detalle. Para el frontend esto significa: un recurso "eliminado" simplemente deja de aparecer en cualquier `GET`, y volver a pedirlo por id da 404.

Actualmente el **único** endpoint `DELETE` implementado es `DELETE /api/v1/estudiantes/{id}` (solo ADMIN). No existen endpoints de eliminación para el resto de entidades.
