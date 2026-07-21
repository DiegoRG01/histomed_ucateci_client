# Estructura de carpetas — HistoMed UCATECI (frontend)

## Contexto
El proyecto es actualmente el scaffold sin modificar de Vite + React 19 + TS. Se va a convertir en el frontend de HistoMed UCATECI usando React + TypeScript, shadcn/ui y Tailwind CSS. Antes de instalar dependencias o escribir features, se necesita definir la estructura de carpetas que va a soportar el crecimiento del proyecto por módulos clínicos (pacientes, citas, historias clínicas, etc.), que se irán añadiendo progresivamente.

Decisiones ya tomadas con el usuario:
- Organización por **feature/dominio**, no por capa técnica global.
- Routing: **React Router** (react-router-dom, aún no instalado).
- Datos remotos/estado: **TanStack Query** para estado de servidor + estado ligero de cliente (Context/Zustand, a definir al implementar).
- Por ahora solo se crea la estructura **base** (auth + dashboard como features de ejemplo/arranque); los módulos clínicos reales (pacientes, citas, historias clínicas...) se añadirán como carpetas nuevas dentro de `features/` cuando se implementen — no se crean placeholders vacíos para ellos ahora.

Este plan es solo de **estructura de carpetas** (no instala shadcn/Tailwind/React Router/TanStack Query todavía; eso queda para un plan de implementación posterior, guardado también en `docs/plans/` según la convención ya establecida en `CLAUDE.md`).

## Estructura propuesta

```
src/
  app/                      # Bootstrap de la aplicación
    App.tsx                 # Composición raíz (providers + router outlet)
    routes.tsx              # Definición de rutas de React Router
    providers/               # Composición de providers globales (QueryClientProvider, etc.)

  features/                 # Un subdirectorio por dominio/módulo de negocio
    auth/
      components/
      hooks/
      api/                  # Llamadas HTTP / integración con TanStack Query para este feature
      types.ts
    dashboard/
      components/
      hooks/
      api/

  components/
    ui/                     # Componentes generados por shadcn/ui (no editar a mano el estilo base)
    layout/                 # Layouts compartidos (AppShell, Sidebar, Header, etc.)
    common/                 # Componentes compartidos propios del proyecto (no shadcn, no layout)

  hooks/                    # Hooks genéricos reutilizables entre features (no específicos de un dominio)

  lib/
    utils.ts                # cn() y helpers requeridos por shadcn/ui
    api-client.ts           # Cliente HTTP base (fetch/axios) compartido

  types/                    # Tipos TS compartidos globalmente (no específicos de un feature)

  styles/
    globals.css             # Entry de Tailwind (reemplaza a index.css)

  assets/                   # Ya existe: imágenes, íconos importados

public/                     # Ya existe: assets estáticos servidos tal cual (incluye icons.svg)

docs/
  plans/                    # Ya establecido en CLAUDE.md: planes guardados para ejecución posterior
```

Archivos de configuración en la raíz que se sumarán en el plan de implementación (no en este): `components.json` (shadcn), `tailwind.config.ts` / configuración de Tailwind v4 vía Vite, y actualización de `tsconfig.app.json`/`vite.config.ts` para el alias `@/*` que shadcn/ui requiere por convención.

## Justificación de decisiones clave
- **`features/*/api`** en vez de una carpeta `services/` global: mantiene la lógica de fetching de TanStack Query junto al dominio que la usa, coherente con la organización por feature elegida.
- **`components/ui` separado de `components/common`**: es la convención de shadcn/ui (los archivos que genera su CLI viven en `components/ui`); mezclarlos con componentes propios dificulta futuras actualizaciones vía CLI.
- **`hooks/` global vs `features/*/hooks`**: un hook sube a `src/hooks/` solo cuando lo usa más de un feature; el resto vive dentro de su feature.
- No se crean carpetas para módulos clínicos específicos (pacientes, citas, historias clínicas) todavía, siguiendo la preferencia del usuario de no anticipar dominios no confirmados.

## Pasos de ejecución
1. Guardar este plan en `docs/plans/01-estructura-carpetas-frontend.md` dentro del repo, siguiendo la convención ya establecida en `CLAUDE.md`.
2. Crear los directorios listados arriba dentro de `src/` (los vacíos con un `.gitkeep` si es necesario para que git los trackee).
3. Mover `src/index.css` → `src/styles/globals.css` y actualizar el import en `src/main.tsx`.
4. Mover el contenido actual de `src/App.tsx` a `src/app/App.tsx` (o dejarlo como placeholder temporal) y actualizar el import en `src/main.tsx`.
5. No tocar `public/` ni `src/assets/` (ya siguen la convención correcta).

## Verificación
- Tras crear las carpetas y mover los archivos, correr `pnpm dev` y confirmar que la app sigue arrancando sin errores de import.
- Correr `pnpm build` para confirmar que `tsc -b` no reporta rutas rotas tras el movimiento de `index.css`/`App.tsx`.
