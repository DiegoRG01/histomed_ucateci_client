# 02 - Usuarios

## Contexto y objetivo

Gestión del personal del dispensario (`Usuario`) y su asignación de roles (`Rol` — ver `01-catalogos-base.md` si
resulta tener CRUD propio). Se mantiene en un documento separado de los catálogos porque toca autenticación
(sensible) y porque el backend actual solo expone una parte del CRUD.

**Prerrequisito:** `00-fundamentos-crud.md`. No depende de `01-catalogos-base.md` salvo para el selector de roles si
`Rol` termina teniendo endpoint propio (si no, los roles se listan como enum estático `RolNombre` en el frontend).

Referencia backend: `docs/02-modelo-dominio.md` (bloque Seguridad) y `docs/planes/plan-01-seguridad.md` del repo
`histomed_ucateci`.

## Estado backend

`UsuarioController` (confirmado en el repo, ver `histomed-core-src/UsuarioController.java` explorado en esta
sesión) hoy solo expone:
- `POST /api/v1/usuarios` (crear) — `@PreAuthorize("hasRole('ADMIN')")`
- `GET /api/v1/usuarios` (listar, **array plano, sin paginar**) — `hasRole('ADMIN')`
- `GET /api/v1/usuarios/{id}` — `hasRole('ADMIN')`

**No hay `PUT` (actualizar) ni `DELETE` (desactivar) todavía.** La UI de este módulo debe:
- Mostrar lista + alta, **no mostrar acciones de editar/eliminar** hasta que el backend las exponga.
- Dejar los botones/rutas de edición y baja como placeholder deshabilitado o simplemente omitidos, no simulados.

## Endpoints consumidos

| Método | Path | Request | Response | Roles |
|---|---|---|---|---|
| POST | `/api/v1/usuarios` | `UsuarioRequest` | `UsuarioResponse` (201) | ADMIN |
| GET | `/api/v1/usuarios` | — | `UsuarioResponse[]` (200, sin paginar) | ADMIN |
| GET | `/api/v1/usuarios/{id}` | — | `UsuarioResponse` (200) | ADMIN |

Confirmar campos exactos de `UsuarioRequest`/`UsuarioResponse` contra el backend al implementar (no se exploraron
sus DTOs en esta sesión, solo el controller). Se espera, según el modelo de dominio: `username`, `passwordHash`
(solo en request, como `password` plano que el backend hashea), `nombreCompleto`, `email`, `roles`.

## Modelo de datos frontend (types.ts)

`src/features/usuarios/types.ts`:

```ts
export type RolNombre = 'ADMIN' | 'ENFERMERIA' | 'ALMACEN' | 'CONSULTA'

export type Usuario = {
  id: number
  username: string
  nombreCompleto: string
  email: string
  roles: RolNombre[]
  activo: boolean
}

export type CreateUsuarioRequest = {
  username: string
  password: string
  nombreCompleto: string
  email: string
  roles: RolNombre[]
}
```

(Ajustar nombres de campo exactos al confirmar `UsuarioRequest`/`UsuarioResponse` reales.)

## Rutas frontend nuevas

- `/usuarios` (lista + alta) — `RoleGuard allow={['ADMIN']}`
- Sin `/usuarios/:id/editar` por ahora (backend no soporta update).

## Componentes a crear

`src/features/usuarios/components/`:
- `UsuarioListPage.tsx` — `PageHeader` + `DataTable` (sin columna de acciones de editar/eliminar, solo lectura por
  fila) + botón que abre `FormDialog` con `UsuarioForm.tsx` para alta.
- `UsuarioForm.tsx` — campos `username`, `password`, `nombreCompleto`, `email`, selector múltiple de `roles`
  (checkbox group sobre el enum `RolNombre`, no depende de `01-catalogos-base.md` a menos que `Rol` tenga endpoint).
  Validación Zod: password con mínimo de longitud, email válido, al menos un rol seleccionado.

## Hooks a crear

No usar `createCrudHooks` completo (expondría `useUpdate`/`useRemove` que no existen en backend). Usar
`createResourceApiFlatList` (ver `00-fundamentos-crud.md`) solo para `list`/`getById`/`create`:

```ts
// src/features/usuarios/hooks/useUsuarios.ts
const usuariosApi = createResourceApiFlatList<Usuario, CreateUsuarioRequest>('/usuarios')
export function useUsuarios() {
  return useQuery({ queryKey: ['usuarios', 'list'], queryFn: () => usuariosApi.list() })
}
export function useCreateUsuario() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: usuariosApi.create, onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }) })
}
```

## Casos especiales / reglas de negocio UI

- No ofrecer edición ni desactivación en la UI mientras el backend no lo soporte — evitar construir una feature
  fantasma. Cuando el backend agregue `PUT`/`DELETE`, migrar a `createCrudHooks` completo como los demás módulos.
- Mapear errores de `fieldErrors` (ej. `username` duplicado) con `mapApiErrorToForm`.
- El propio usuario logueado no debería poder autodesactivarse cuando exista `DELETE` — validar en su momento si el
  backend ya lo previene o si hay que ocultarlo en UI para el usuario actual.

## Dependencias y orden de implementación

1. `00-fundamentos-crud.md`.
2. Confirmar `UsuarioRequest`/`UsuarioResponse` reales antes de tipar `types.ts`.
3. Implementar lista + alta únicamente.

## Pendientes / preguntas abiertas

- Confirmar shape exacto de `UsuarioRequest`/`UsuarioResponse` (no explorados en detalle esta sesión).
- Revisar si/cuándo el backend añade `PUT`/`DELETE` a `UsuarioController` para expandir este doc.
- Confirmar si `Rol` es una entidad seleccionable dinámicamente o el enum `RolNombre` es fijo en el frontend (dato
  de `02-modelo-dominio.md`: `RolNombre` es un enum backend, no una tabla libre — probablemente fijo).
