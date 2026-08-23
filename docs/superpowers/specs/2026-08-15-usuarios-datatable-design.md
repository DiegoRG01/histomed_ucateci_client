# CRUD Usuarios — DataTable limpio y profesional — Design

## Contexto

El módulo Usuarios (`src/features/usuarios/`) ya tiene list + create implementados (`UsuarioListPage.tsx`, `UsuarioForm.tsx`, `useUsuarios.ts`), usando el `DataTable` compartido (`src/components/shared/DataTable.tsx`). El usuario pidió mejorar visualmente esa tabla para que se vea limpia y profesional, especificando un "datatable de shadcnui".

`docs/cruds/00-fundamentos-crud.md` documenta que `DataTable.tsx` fue construido a mano deliberadamente, **sin** `@tanstack/react-table`, para evitar una dependencia innecesaria en un proyecto estudiantil — con la nota explícita de reevaluar esa decisión si algún módulo lo necesitara. El usuario confirmó no querer adoptar esa dependencia ahora; el objetivo es un restyle visual sobre los primitivos shadcn `Table` ya usados por el componente, no una reescritura funcional.

## Alcance

**Incluye:**
- Restyle visual de `src/components/shared/DataTable.tsx` (componente compartido) — mejora look & feel sin cambiar su contrato de props.
- En `UsuarioListPage.tsx`: columna "Acciones" con botones editar/desactivar **deshabilitados** (placeholder visual para cuando el backend soporte `PUT`/`DELETE`), con tooltip explicativo.
- Revisión de variantes de `Badge` usadas para Roles y Estado en la tabla de usuarios.

**Fuera de alcance:**
- Adoptar `@tanstack/react-table` o cualquier dependencia nueva de tablas.
- Paginación (la lista de usuarios sigue siendo array plano sin paginar — backend no la soporta).
- Filtro de texto / búsqueda en la tabla de usuarios.
- Ordenamiento por columnas (click-to-sort).
- Cambios a `UsuarioForm.tsx` o a la lógica de `useUsuarios.ts`.
- Habilitar edición/desactivación real (bloqueado por el backend, ver `docs/cruds/02-usuarios.md`).

## Cambios en `DataTable.tsx` (compartido)

Como este componente es usado por 5 páginas (`usuarios`, `medicamentos`, `lotes`, `movimientos`, `tipo-medicamento`), el restyle se hace a nivel del componente compartido para beneficiar a todas por igual, preservando el contrato actual (`Column<T>`, `rowActions`, `isLoading`, `emptyMessage`).

- **Contenedor:** envolver en `rounded-lg border` con `overflow-x-auto` (scroll horizontal en mobile sin desbordar la página).
- **Header (`TableHead`):** `bg-muted/50`, `text-xs uppercase tracking-wide text-muted-foreground`.
- **Filas:** `hover:bg-muted/40 transition-colors`, borde inferior sutil (`border-border`).
- **Celdas:** padding consistente `px-4 py-3`, alineación vertical centrada.
- **Loading:** skeleton rows existentes, ajustar altura/spacing al nuevo padding.
- **Empty state:** ícono (`lucide-react`, ej. `InboxIcon`) + mensaje centrado en `text-muted-foreground`, en vez de solo texto plano.
- **Columna "Acciones"** (cuando `rowActions` está presente): alineada a la derecha, ancho fijo, `whitespace-nowrap`.

## Cambios en `UsuarioListPage.tsx`

- Nuevo subcomponente `UsuarioRowActions.tsx` (`src/features/usuarios/components/`): dos `Button variant="ghost" size="icon-xs"` (`PencilIcon`, `UserXIcon` de `lucide-react`), ambos con prop `disabled`, envueltos en `Tooltip`/`TooltipTrigger`/`TooltipContent` (`src/components/ui/tooltip.tsx`, ya instalado) mostrando "Disponible próximamente".
- `UsuarioListPage.tsx` pasa `rowActions={(row) => <UsuarioRowActions usuario={row} />}` a `DataTable`.
- Revisar `Badge` de columna **Estado**: `Activo` → variante que use `--color-success`, `Inactivo` → variante muted/gris. Columna **Roles**: `Badge variant="outline"` (o `secondary`) por cada rol, evitando colores improvisados fuera de los tokens del proyecto.
- Sin cambios de datos/lógica — sigue usando `useUsuarios()` / `useCreateUsuario()` tal cual.

## Verificación

- `pnpm build` (type-check + build) y `pnpm lint` sin errores.
- Manual: `pnpm dev` →
  - `/usuarios`: confirmar tabla restyled, columna Acciones con botones deshabilitados + tooltip, badges de Roles/Estado con colores correctos.
  - Revisar las otras 4 páginas que usan `DataTable` (medicamentos, lotes, movimientos, tipo-medicamento) para confirmar que el restyle no rompe su layout ni su `rowActions` existente (editar/eliminar reales).
  - Redimensionar ventana: tabla con scroll horizontal en mobile, sin overflow de página.
