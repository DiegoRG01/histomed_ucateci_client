# Autenticación

Solo el personal (staff) autentica. Los estudiantes no tienen cuenta ni login.

## `POST /api/v1/auth/login` — público

Request (`LoginRequest`):
```json
{
  "username": "admin",
  "password": "admin"
}
```
Ambos campos `@NotBlank` (400 si faltan). Credenciales de admin semilla en dev por defecto: **`admin` / `admin`** (configurables vía `APP_ADMIN_USERNAME` / `APP_ADMIN_PASSWORD`).

Response 200 (`JwtAuthResponse`):
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "tokenType": "Bearer",
  "username": "admin",
  "nombreCompleto": ""
}
```
> ⚠️ **Bug conocido**: `nombreCompleto` siempre viene como cadena vacía `""`, tanto en login como en `/me` — nunca se popula desde el campo real de `Usuario` (`AuthServiceImpl.login/me` lo hardcodean). Ver [10-known-issues.md](./10-known-issues.md). No usar este campo para mostrar el nombre del usuario logueado; usar `GET /api/v1/usuarios/{id}` si se necesita, o decodificar el JWT solo para el username.

Credenciales inválidas → **401** con el `ApiError` estándar (ver [09-manejo-de-errores.md](./09-manejo-de-errores.md)).

## `GET /api/v1/auth/me` — requiere JWT

A pesar de estar bajo `/auth`, **no** está en la lista `permitAll` de `SecurityConfig` — requiere `Authorization: Bearer <token>` válido igual que cualquier otro endpoint protegido.

Response 200:
```json
{
  "token": null,
  "tokenType": "Bearer",
  "username": "admin",
  "nombreCompleto": ""
}
```
`token` siempre es `null` en esta respuesta (no reenvía el token).

## Cómo enviar el token

```
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

## Vencimiento

`app.jwt.expiration-ms` (default 3600000 = 1h). No hay endpoint de refresh — al expirar, el frontend debe forzar login de nuevo (401 → redirigir a login).

## Claims del JWT (informativo)

El token incluye `sub` = username, `roles` = string separado por comas de las authorities (`"ROLE_ADMIN,ROLE_ENFERMERIA"`), `iat`, `exp`. El frontend no necesita decodificarlo para funcionar (el backend valida todo), pero puede decodificarlo client-side (sin verificar firma) si quiere derivar el rol para mostrar/ocultar UI antes de que llegue la respuesta de `/me`.

## Errores de autenticación/autorización

- **401** — sin token, token inválido/expirado, o credenciales de login incorrectas. Body `ApiError` con `message: "No autenticado. Se requiere token JWT válido."` cuando falta/token inválido en un endpoint protegido (emitido por `JwtAuthEntryPoint`).
- **403** — token válido pero el rol del usuario no tiene permiso para el endpoint (`@PreAuthorize` deniega).

## Creación de usuarios de staff

**No existe registro público.** Los usuarios de staff los crea un ADMIN vía `POST /api/v1/usuarios` (ver `UsuarioRequest`/`UsuarioResponse` en [03](./03-endpoints-estudiantes.md) si aplica, o directamente):

```json
// Request
{
  "username": "enfermera1",
  "password": "claveSegura123",
  "nombreCompleto": "María Pérez",
  "email": "mperez@ucateci.edu.do",
  "roles": ["ENFERMERIA"]
}
```
`roles` es un `Set<String>` de nombres de `RolNombre` (`ADMIN`, `ENFERMERIA`, `ALMACEN`, `CONSULTA`). Username duplicado → 409.

Response 201 (`UsuarioResponse`):
```json
{
  "id": 5,
  "username": "enfermera1",
  "nombreCompleto": "María Pérez",
  "email": "mperez@ucateci.edu.do",
  "roles": ["ENFERMERIA"]
}
```
`GET /api/v1/usuarios` y `GET /api/v1/usuarios/{id}` — todos exigen `hasRole('ADMIN')`.
