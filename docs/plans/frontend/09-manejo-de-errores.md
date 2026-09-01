# Manejo de errores

Todo error HTTP (excepto 403, que Spring Security puede devolver sin body en algunos casos según el punto exacto de rechazo) sigue la forma `ApiError`:

```ts
type ApiError = {
  timestamp: string;       // Instant ISO-8601
  status: number;          // código HTTP numérico
  error: string;           // reason phrase, ej. "Not Found", "Conflict"
  message: string;         // mensaje legible
  path: string;             // URI de la request
  fieldErrors?: {           // solo presente en errores de validación (400 de @Valid)
    field: string;
    message: string;
    rejectedValue: unknown;
  }[];
};
```
`fieldErrors` se omite del JSON (no aparece como `null`) cuando no aplica — usa `@JsonInclude(NON_NULL)`.

## Tabla de mapeo excepción → status

| Situación | Status | `error` | Notas |
|---|---|---|---|
| Validación de `@Valid` falla (campo requerido, formato, etc.) | 400 | `"Validación fallida"` | `message` fijo: `"Uno o más campos tienen errores de validación"`; el detalle real va en `fieldErrors[]` |
| `InvalidDataAccessApiUsageException` (ej. enum inválido en query param) | 400 | reason phrase | |
| Sin token / token inválido o expirado en endpoint protegido | 401 | `"Unauthorized"` | Body emitido por `JwtAuthEntryPoint`, `message: "No autenticado. Se requiere token JWT válido."` |
| Credenciales de login incorrectas | 401 | — | Spring Security estándar |
| Rol insuficiente (`@PreAuthorize` deniega) | 403 | — | Puede no traer body `ApiError` (depende de la config default de Spring Security) — tratar 403 genéricamente en el interceptor igualmente |
| Recurso no encontrado (`ResourceNotFoundException`) | 404 | `"Not Found"` | `message` describe qué no se encontró, ej. `"Estudiante con id 999 no encontrado"` |
| Regla de negocio violada (`BusinessException`) | **409** (default) o el status explícito que pase el código | reason phrase del status resuelto | Incluye: transición de estado inválida, conflicto de alergia sin confirmar, stock insuficiente, conflicto de concurrencia optimista, motivo de rechazo faltante en algunos flujos |
| Constraint de BD (`DataIntegrityViolationException`, ej. matrícula/username duplicado) | — | — | **No tiene handler explícito en `GlobalExceptionHandler`** — cae al handler genérico `Exception` → 500 con mensaje oculto. Ver known issues: duplicados no dan un 409 claro. |
| Cualquier excepción no mapeada | 500 | `"Internal Server Error"` | `message` siempre `"Error interno del servidor"` (el mensaje real nunca se filtra al cliente) |

## Recomendación para el frontend

- Interceptor global (axios/fetch wrapper) que capture cualquier respuesta no-2xx, parsee el body como `ApiError` (si existe) y:
  - 401 → limpiar sesión y redirigir a login.
  - 403 → toast "no tienes permiso" (no reintentar).
  - 400 con `fieldErrors` → mapear cada `field` a un error de formulario (React Hook Form / similar).
  - 409 → mostrar `message` tal cual al usuario (suele ser accionable: "ya existe...", "transición inválida...", "confirme pese a alergia...", "stock insuficiente...") — en el caso específico del conflicto de alergia (visitas), interceptarlo aparte para abrir el modal de override en vez de un toast genérico.
  - 404 → tratar como "no encontrado" (útil también porque soft-delete hace que recursos "eliminados" den 404).
  - 500 → toast genérico de error, el `message` no da información útil para diagnosticar.
