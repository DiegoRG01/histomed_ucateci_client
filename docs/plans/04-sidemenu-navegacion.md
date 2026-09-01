# 04 - Rediseño del sidemenu de navegación

## Contexto

El sidebar actual (`src/app/layout/AppLayout.tsx` + `src/app/layout/nav-config.ts`) es funcional pero mínimo: una
lista plana de 7 links sin agrupar, sin estado colapsado, sin variante mobile, y un pie de usuario con un botón de
logout suelto. A medida que se implementen los módulos planificados en `docs/cruds/` (Dashboard, Estudiantes,
Inventario, Requisiciones, Visitas, Donaciones, Reportes, Usuarios, Catálogos, Auditoría — 9+ secciones), una lista
plana dejará de ser escaneable. Este documento planifica un rediseño con una estructura que escala y un acabado
visual acorde a un sistema clínico institucional (paleta en `CLAUDE.md`: primario `#0057A8`, secundario `#C9A227`,
fondo/tipografía neutros).

**Incidente detectado a corregir de paso:** `nav-config.ts` apunta "Estudiantes" a `/` (la ruta raíz), pero
`docs/cruds/07-dashboard-reportes.md` reserva `/` para el futuro `DashboardPage`, y
`docs/cruds/04-estudiantes-ficha-medica.md` define la ruta de estudiantes como `/estudiantes`. Se corrige como
parte de este plan.

Alcance: rediseño completo — agrupación por secciones, estado activo con acento visual, menú de usuario con
dropdown, sidebar colapsable a modo ícono, y variante responsive (drawer) para mobile.

## Estructura de navegación (agrupada)

```
Principal
  Dashboard              /                    (todos los roles)
Clínico
  Estudiantes            /estudiantes         ADMIN, ENFERMERIA, CONSULTA
  Visitas                /visitas             ADMIN, ENFERMERIA, CONSULTA
  Donaciones             /donaciones          ADMIN, ENFERMERIA
Inventario
  Inventario             /inventario          ADMIN, ALMACEN
  Requisiciones          /requisiciones       ADMIN, ALMACEN, ENFERMERIA
Análisis
  Reportes               /reportes            ADMIN, ENFERMERIA, ALMACEN, CONSULTA
Administración
  Usuarios               /usuarios            ADMIN
  Catálogos              /catalogos           ADMIN, ALMACEN
  Auditoría              /auditoria           ADMIN
```

(Roles ajustados a lo confirmado en `docs/cruds/*.md`; el `RoleGuard` de cada ruta sigue siendo la autoridad real,
el nav-config solo decide qué es visible.) Una sección se oculta por completo si ningún ítem suyo es visible para
el rol del usuario actual.

## Diseño visual

- **Encabezado**: marca `HistoMed` en `text-primary font-bold` + subtítulo `Dispensario UCATECI` en
  `text-xs text-muted-foreground` (oculto cuando el sidebar está colapsado, mostrando solo un ícono/monograma).
- **Secciones**: etiqueta `text-xs font-medium uppercase tracking-wide text-muted-foreground`, con margen superior
  para separar grupos; oculta en modo colapsado.
- **Item activo**: fondo `bg-primary/10`, texto e ícono `text-primary`, barra de acento a la izquierda (`2px`,
  `bg-primary`) — reemplaza el `bg-accent` genérico actual por algo con más identidad de marca.
- **Item inactivo/hover**: `text-muted-foreground`, `hover:bg-accent hover:text-accent-foreground`, transición suave.
- **Colapsado**: ancho `w-64` ↔ `w-16` con transición CSS; en modo icono, cada item envuelto en `Tooltip` (shadcn)
  que muestra el label al hacer hover. Botón de colapsar/expandir al pie del nav (ícono chevron), estado persistido
  en `localStorage`.
- **Pie de usuario**: avatar circular con iniciales (derivadas de `username`, ya que `nombreCompleto` viene vacío
  por bug de backend conocido — ver `src/features/auth/types.ts`), nombre de usuario, badge de rol (shadcn `badge`),
  todo dentro de un `DropdownMenu` (shadcn, ya instalado) con la acción "Cerrar sesión" — reemplaza el botón suelto
  actual por un patrón más pulido y extensible (futuras opciones: "Mi perfil", "Cambiar contraseña").
- **Mobile (`< md`)**: el `aside` fijo se oculta; aparece una barra superior compacta con botón de menú (ícono
  `Menu` de lucide) que abre el mismo nav dentro de un `Sheet` (shadcn, lateral izquierdo). El sheet se cierra al
  navegar.
- Uso del secundario (`#C9A227`) reservado y discreto: un pequeño acento en el monograma del encabezado, no en la
  navegación (evitar ruido visual — la paleta de marca se usa con moderación, como indica la guía de estilos).

## Componentes a crear/modificar

Todo bajo `src/app/layout/`:

| Archivo | Cambio |
|---|---|
| `nav-config.ts` | Restructurar de `NavItem[]` plano a `NavSection[]` (`{ label: string; items: NavItem[] }[]`). Agregar Dashboard, Donaciones, Auditoría. Corregir path de Estudiantes a `/estudiantes`. |
| `SidebarNav.tsx` (nuevo) | Renderiza las secciones + items filtrados por rol; recibe `collapsed: boolean` y `onNavigate?: () => void` (para cerrar el sheet en mobile). Componente puro, compartido entre desktop y mobile. |
| `SidebarUserMenu.tsx` (nuevo) | Avatar + username + badge de rol + `DropdownMenu` con logout. Recibe `collapsed: boolean` (en colapsado muestra solo el avatar con dropdown). |
| `Sidebar.tsx` (nuevo) | Variante desktop: `aside` fijo, header con logo, `SidebarNav`, botón colapsar, `SidebarUserMenu` al pie. Maneja el estado/persistencia de colapsado (hook `useSidebarCollapsed`). |
| `MobileSidebarTrigger.tsx` (nuevo) | Barra superior mobile-only (`md:hidden`) con botón hamburguesa que abre un `Sheet` conteniendo `SidebarNav` + `SidebarUserMenu`. |
| `useSidebarCollapsed.ts` (nuevo, hook) | Estado boolean + `localStorage` (`key: "sidebar:collapsed"`), API `{ collapsed, toggle }`. |
| `AppLayout.tsx` | Se simplifica a composición: `<Sidebar />` (desktop) + `<MobileSidebarTrigger />` (mobile) + `<main><Outlet/></main>`. Ya no contiene JSX de nav inline. |

## Dependencias nuevas de shadcn/ui

No están instalados hoy (`sheet`, `tooltip`, `avatar` ausentes de `src/components/ui`):

```
npx shadcn add sheet tooltip avatar
```

(`badge`, `dropdown-menu`, `button` ya existen y se reutilizan tal cual.)

## Roles y guards

Sin cambios de comportamiento en `RoleGuard`/`ProtectedRoute` (`src/app/routes/`) — el nav-config solo determina
visibilidad de enlaces, la autorización real sigue en cada `<Route>` de `src/app/routes.tsx` vía `RoleGuard`. Se
actualiza `routes.tsx` únicamente para mover la ruta de Estudiantes de `/` a `/estudiantes` (consistente con
`docs/cruds/04-estudiantes-ficha-medica.md`); el placeholder de Dashboard permanece en `/` hasta que se implemente
`docs/cruds/07-dashboard-reportes.md`.

## Dependencias y orden de implementación

1. `nav-config.ts` (nueva estructura agrupada) + corrección del path de Estudiantes.
2. Instalar `sheet`, `tooltip`, `avatar` de shadcn.
3. `useSidebarCollapsed.ts` → `SidebarNav.tsx` → `SidebarUserMenu.tsx` → `Sidebar.tsx` → `MobileSidebarTrigger.tsx`.
4. Simplificar `AppLayout.tsx` para componer las piezas anteriores.
5. Ajustar `routes.tsx` (mover ruta de Estudiantes).

## Verificación

1. `pnpm dev` y revisar visualmente: secciones agrupadas, acento en item activo, colapsar/expandir con persistencia
   en `localStorage`, variante `Sheet` en `< 768px`, tooltips en modo colapsado, dropdown de usuario funcional.
2. Verificar filtrado por rol con el único catálogo implementado hoy (`TipoMedicamentoListPage` en
   `/catalogos/tipos-medicamento`): la sección "Administración" solo debe verse si el rol del usuario tiene acceso
   a al menos uno de sus items.
3. `pnpm build` para confirmar que el type-check (`tsc -b`) pasa con los nuevos componentes/tipos.

## Pendientes / preguntas abiertas

- Confirmar iniciales/avatar cuando `nombreCompleto` deje de venir vacío (ajustar `SidebarUserMenu` para preferir
  nombre completo sobre `username` una vez el backend lo corrija).
- Evaluar si conviene un breadcrumb en el `main` (fuera de alcance de este documento) una vez existan rutas
  anidadas (ej. `/estudiantes/:id`).
