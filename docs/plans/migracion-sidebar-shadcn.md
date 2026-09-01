# Migración del menú/sidebar al componente Sidebar de shadcn/ui

## Contexto

La navegación actual (`src/app/layout/`) es una implementación 100% custom de sidebar (colapso, drawer móvil, tooltips, persistencia en `localStorage`) que reimplementa a mano comportamiento que el componente oficial `Sidebar` de shadcn/ui ya resuelve de forma estandarizada. Además, `nav-config.ts` referencia módulos sin ruta real (Visitas, Donaciones, Requisiciones, Reportes, Auditoría) y un ítem "Inventario" plano que apunta a `/inventario`, una ruta que no existe (las rutas reales son `/inventario/medicamentos`, `/lotes`, `/movimientos`).

Objetivo: adoptar el componente `Sidebar` de shadcn (colapsable a iconos en desktop + off-canvas en móvil, con persistencia nativa vía cookie), preservando el filtrado de menú por rol ya existente, convirtiendo "Inventario" en un submenú expandible con sus 3 rutas reales, y creando rutas placeholder para los módulos aún sin feature, de modo que todo ítem del menú navegue a algo.

## Decisiones tomadas

1. **Comportamiento**: `collapsible="icon"` en desktop + Sheet off-canvas en móvil (comportamiento por defecto del componente).
2. **Roles**: se mantiene el filtrado por rol (`roles: Role[]` por ítem), usando `useAuth()`.
3. **Alcance**: migrar + reorganizar. Se crean rutas placeholder para todos los módulos sin página real.
4. **Inventario**: pasa a ser un grupo colapsable (`SidebarMenuSub`) con 3 hijos (Medicamentos, Lotes, Movimientos).
5. **Persistencia de colapso**: se adopta el mecanismo nativo de `SidebarProvider` (cookie); se elimina `useSidebarCollapsed.ts`.
6. **RoleGuard en placeholders**: no se aplica (igual que Dashboard/Estudiantes hoy) — el filtrado de menú ya oculta el enlace; se añadirá guard cuando cada módulo tenga feature real.

## 1. Instalación de componentes shadcn

```bash
npx shadcn@latest add sidebar separator collapsible
```

- `sidebar` trae: `src/components/ui/sidebar.tsx` y el hook `src/hooks/use-mobile.ts` (no existe aún, se crea).
- `separator` y `collapsible` son dependencias del patrón de submenú anidado (`Collapsible` para el grupo Inventario, `Separator` para el header).
- Revisar el diff generado en `components.json` y `globals.css` antes de aceptar — no debe alterar `style: new-york` / `baseColor: neutral`.

## 2. Variables CSS del sidebar (`src/styles/globals.css`)

El bloque `@theme` actual (líneas 3-36) no tiene variables `--sidebar-*`. El CLI probablemente las inyecte como `--sidebar-*` sueltas; **normalizarlas al patrón `--color-*` ya usado en el archivo** (para que Tailwind v4 genere `bg-sidebar`, `text-sidebar-foreground`, etc.), añadiéndolas dentro del `@theme` existente:

```css
--color-sidebar: #ffffff;
--color-sidebar-foreground: #0f172a;
--color-sidebar-primary: #0057a8;
--color-sidebar-primary-foreground: #ffffff;
--color-sidebar-accent: #eef4fb;
--color-sidebar-accent-foreground: #0057a8;
--color-sidebar-border: #e5e7eb;
--color-sidebar-ring: #0057a8;
```

No introducir modo oscuro (no hay `ThemeProvider` activo pese a tener `next-themes` instalado).

## 3. Rediseño de `nav-config.ts`

Añadir soporte a ítems anidados sin romper el filtrado por rol existente:

```ts
export type NavChildItem = { label: string; path: string; roles: Role[] }
export type NavItem = {
  label: string
  path?: string          // opcional cuando el item tiene children
  icon: LucideIcon
  roles: Role[]
  children?: NavChildItem[]
}
export type NavSection = { label: string; items: NavItem[] }
```

Cambios sobre el `navSections` actual:
- Reemplazar el ítem plano `{ label: 'Inventario', path: '/inventario', ... }` por un ítem con `children`: Medicamentos (`/inventario/medicamentos`), Lotes (`/inventario/lotes`), Movimientos (`/inventario/movimientos`), cada uno con `roles: ['ADMIN', 'ALMACEN']`.
- El resto de secciones/ítems (Dashboard, Estudiantes, Visitas, Donaciones, Requisiciones, Reportes, Usuarios, Catálogos, Auditoría) se mantienen igual.

Regla de filtrado (a implementar en `NavMain.tsx`): un ítem padre con `children` es visible si al menos un hijo pasa el filtro de rol; un ítem hoja sigue el criterio actual; una sección se oculta si queda sin ítems visibles.

## 4. Archivos: eliminar / reescribir / crear

**Eliminar:**
- `src/app/layout/Sidebar.tsx`
- `src/app/layout/SidebarNav.tsx`
- `src/app/layout/MobileSidebarTrigger.tsx`
- `src/app/layout/useSidebarCollapsed.ts`

**Reescribir:**
- `src/app/layout/AppLayout.tsx` — envolver en `SidebarProvider`, usar `AppSidebar` + `SidebarInset`, header con `SidebarTrigger` (unificado desktop/mobile, ya no `MobileSidebarTrigger`).
- `src/app/layout/SidebarUserMenu.tsx` — adaptar a `SidebarFooter`/`SidebarMenuButton`, leer estado colapsado vía `useSidebar()` en vez de props.

**Crear:**
- `src/app/layout/AppSidebar.tsx` — orquestador: `Sidebar` (`collapsible="icon"`) con `SidebarHeader` (branding "HistoMed"), `SidebarContent` (`<NavMain/>`), `SidebarFooter` (`<SidebarUserMenu/>`), `SidebarRail`.
- `src/app/layout/NavMain.tsx` — reemplaza `SidebarNav.tsx`: filtra `navSections` por rol (vía `useAuth()`), renderiza `SidebarGroup`/`SidebarMenu`; ítems con `children` se renderizan como `Collapsible` + `SidebarMenuSub` (abierto por defecto si la ruta activa es uno de sus hijos); ítems planos usan `SidebarMenuButton asChild` con `NavLink`.
- `src/components/PlaceholderPage.tsx` — componente simple `{ title }` reutilizado por todas las rutas sin feature real todavía.

## 5. Rutas placeholder (`src/app/routes.tsx`)

Sustituir los dos `<div>...placeholder</div>` inline por `<PlaceholderPage title="..."/>` y agregar los módulos faltantes, sin `RoleGuard`:

| Path | Título |
|---|---|
| `/` | Dashboard (existente, solo cambia el render) |
| `/estudiantes` | Estudiantes (existente, solo cambia el render) |
| `/visitas` | Visitas (nueva) |
| `/donaciones` | Donaciones (nueva) |
| `/requisiciones` | Requisiciones (nueva) |
| `/reportes` | Reportes (nueva) |
| `/auditoria` | Auditoría (nueva) |

Las rutas reales existentes (`/catalogos/tipos-medicamento`, `/usuarios`, `/inventario/*`) no cambian.

## 6. Orden de ejecución

1. Instalar componentes shadcn (`sidebar`, `separator`, `collapsible`) y revisar diff.
2. Normalizar variables `--color-sidebar-*` en `globals.css`.
3. Actualizar `nav-config.ts` con el nuevo esquema (`children`, `path` opcional).
4. Crear `src/components/PlaceholderPage.tsx`.
5. Actualizar `routes.tsx` (placeholders inline → `PlaceholderPage`, agregar 5 rutas nuevas).
6. Crear `AppSidebar.tsx` y `NavMain.tsx`.
7. Reescribir `SidebarUserMenu.tsx`.
8. Reescribir `AppLayout.tsx`.
9. Eliminar los 4 archivos obsoletos (§4).
10. `grep -rn "useSidebarCollapsed\|MobileSidebarTrigger\|from './Sidebar'\|from './SidebarNav'" src/` para confirmar que no quedan referencias rotas.
11. `pnpm build` (typecheck + build) y `pnpm lint`.

## 7. Verificación

- `pnpm build` sin errores de TypeScript; `pnpm lint` limpio.
- `pnpm dev` y navegación manual (o skill `run`):
  - Colapso desktop vía `SidebarTrigger`: sidebar se reduce a iconos, tooltips aparecen al hover, submenú Inventario colapsa correctamente.
  - Persistencia: recargar tras colapsar → estado se mantiene (cookie, no localStorage).
  - Mobile (viewport <768px): sidebar se comporta como Sheet off-canvas; al navegar se cierra el drawer.
  - Filtrado por rol: loguear con distintos roles y confirmar que solo aparecen ítems/secciones permitidos (ej. "Inventario" solo para ADMIN/ALMACEN).
  - Submenú Inventario: expande/colapsa, navega a sus 3 rutas, marca el hijo activo, se auto-expande al recargar en una de sus rutas.
  - Rutas placeholder: `/visitas`, `/donaciones`, `/requisiciones`, `/reportes`, `/auditoria` renderizan sin error.
  - Rutas reales sin regresión: `/catalogos/tipos-medicamento`, `/usuarios`, `/inventario/medicamentos`, `/lotes`, `/movimientos` siguen funcionando con sus `RoleGuard`.
  - Logout desde el menú de usuario en `SidebarFooter` sigue funcionando.

### Archivos críticos
- `src/app/layout/nav-config.ts`
- `src/app/layout/AppSidebar.tsx` (nuevo)
- `src/app/layout/NavMain.tsx` (nuevo)
- `src/app/layout/AppLayout.tsx`
- `src/app/routes.tsx`
- `src/styles/globals.css`
- `src/components/ui/sidebar.tsx` (instalado vía CLI)
</content>
