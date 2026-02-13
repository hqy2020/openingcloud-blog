# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the application code:
- `src/pages/`: Astro routes (public pages, `admin/`, and `api/` endpoints)
- `src/components/` + `src/react/`: Astro and React UI modules
- `src/lib/`: shared server/domain logic (`db`, `auth`, `timeline`, etc.)
- `src/data/{journal,tech,learning,life}/`: Markdown content collections
- `src/styles/`: global Tailwind/theme styles

Other key directories:
- `public/`: static assets served directly
- `migrations/`: D1 SQL migrations (`0001_*.sql`, `0002_*.sql`, ...)
- `scripts/`: content/database sync scripts
- `infra/image-store/`: optional self-hosted image API service

Do not edit generated output in `dist/` or cache folders like `.astro/`.

## Build, Test, and Development Commands
- `npm install`: install dependencies
- `npm run dev`: start local dev server (`http://localhost:4321`)
- `npm run build`: sync posts to D1, build Astro app, prepare Cloudflare assets
- `npm run preview`: preview built output locally
- `npm run sync`: sync Obsidian content

Database and optional infra:
- `wrangler d1 migrations apply <db-name> --remote`: apply schema changes
- `cd infra/image-store && npm run dev`: run local image-store service

## Coding Style & Naming Conventions
- Use TypeScript + ESM; project extends `astro/tsconfigs/strict`.
- Follow existing 2-space indentation and semicolon style.
- Use `@/` path alias for `src/*` imports.
- Name Astro/React components in `PascalCase` (`HeroSection.astro`, `HeroSection.tsx`).
- Name hooks in `useCamelCase` (`useReducedMotion.ts`).
- Name scripts in `kebab-case` (`sync-d1-posts.mjs`).

For content files, keep frontmatter aligned with `src/content.config.ts` (`title`, `date`, `category`, `tags`, optional `description`, `cover`, `draft`).

## Testing Guidelines
No formal test runner is configured yet. Before opening a PR:
- Run `npm run build` and fix any build/type/content errors.
- Run `npm run preview` and smoke-test key pages and admin flows.
- For DB changes, add a migration in `migrations/` and verify related API/page paths locally.

## Commit & Pull Request Guidelines
- Follow Conventional Commit prefixes used in history: `feat:`, `fix:`, `chore:`, `publish:`.
- Keep each commit focused on one logical change.
- Include a short PR description of what changed and why.
- Link the issue/task when applicable.
- Add screenshots for UI changes.
- Call out migration/environment updates (`wrangler.jsonc`, secrets, `.dev.vars` expectations).
