# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Vite + React 19 + TypeScript client. Routing, auth infrastructure, and base UI components (shadcn/ui) are in place. The API base URL is configured via the `VITE_API_BASE_URL` environment variable (see `.env.example`).

## Commands

Package manager is pnpm (`packageManager: pnpm@10.33.0` in package.json) — use `pnpm`, not `npm`/`yarn`.

- `pnpm dev` — start the Vite dev server with HMR
- `pnpm build` — type-check via `tsc -b` then production build via `vite build`
- `pnpm lint` — run ESLint over the project
- `pnpm preview` — serve the production build locally

There is no test runner configured in this repository yet.

## Architecture notes

- TypeScript project is split via project references: `tsconfig.app.json` (src, browser/app code, includes `src/vite-env.d.ts` type) and `tsconfig.node.json` (Vite config itself). The root `tsconfig.json` only wires up references — don't add compiler options there.
- ESLint config (`eslint.config.js`) uses the flat config format with `typescript-eslint`, `eslint-plugin-react-hooks`, and `eslint-plugin-react-refresh` (Vite-mode). Type-aware linting is not enabled (see README for how to opt in with `recommendedTypeChecked`/`strictTypeChecked` if needed later).
- Vite plugin is `@vitejs/plugin-react` (Oxc-based), not the SWC variant.
- Static assets referenced via `/icons.svg#<id>` (in `public/`) are used as SVG sprite sheets (`<use href="/icons.svg#...">`), separate from imported assets in `src/assets/`.
- Tailwind CSS v4 is wired via `@tailwindcss/vite` in `vite.config.ts` (no `tailwind.config.js` — v4 is CSS-first). Theme tokens are declared in an `@theme` block at the top of `src/styles/globals.css`.

## Guía de estilos

Paleta de colores del proyecto, expuesta como tokens Tailwind (`@theme` en `src/styles/globals.css`) y utilizable directamente como clases (`bg-primary`, `text-foreground`, `border-border`, etc.):

| Token | Variable Tailwind | Valor |
|---|---|---|
| Primary | `--color-primary` | `#0057A8` |
| Secondary | `--color-secondary` | `#C9A227` |
| Background | `--color-background` | `#FFFFFF` |
| Foreground | `--color-foreground` | `#0F172A` |
| Muted | `--color-muted` | `#F8FAFC` |
| Border | `--color-border` | `#E5E7EB` |
| Success | `--color-success` | `#16A34A` |
| Warning | `--color-warning` | `#F59E0B` |
| Destructive | `--color-destructive` | `#DC2626` |

## Reglas de colaboración

- Nunca realizar ni planificar un commit sin una orden explícita del usuario para hacerlo.
- Todos los planes deben guardarse en `docs/plans/` dentro del repositorio (un archivo Markdown por plan, nombrado de forma descriptiva) para poder ejecutarse posteriormente a su creación.
- Los planes deben organizarse de forma optimizada en tokens: concisos, enfocados en un único objetivo por archivo, evitando duplicar contexto ya presente en el código o en otros documentos, y sin contenido innecesario que aumente el consumo de contexto al leerlos en el futuro.
