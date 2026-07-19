# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a freshly scaffolded Vite + React 19 + TypeScript client (the standard `vite create` React-TS template, largely unmodified). There is no routing, state management, API layer, or component structure established yet — `src/App.tsx` is still template placeholder content. When adding real features, you are largely establishing conventions from scratch rather than following existing patterns.

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

## Reglas de colaboración

- Nunca realizar ni planificar un commit sin una orden explícita del usuario para hacerlo.
- Todos los planes deben guardarse en `docs/plans/` dentro del repositorio (un archivo Markdown por plan, nombrado de forma descriptiva) para poder ejecutarse posteriormente a su creación.
- Los planes deben organizarse de forma optimizada en tokens: concisos, enfocados en un único objetivo por archivo, evitando duplicar contexto ya presente en el código o en otros documentos, y sin contenido innecesario que aumente el consumo de contexto al leerlos en el futuro.
