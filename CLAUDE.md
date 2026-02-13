# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Astro dev server at localhost:4321
npm run build        # D1 post sync → Astro build → .assetsignore for Wrangler
npm run preview      # Preview built output locally
npm run sync         # Obsidian content sync to src/data/

# Database migrations (production)
wrangler d1 migrations apply openingcloud_blog_prod --remote

# Deploy (auto via GitHub Actions on push to main, or manual)
wrangler deploy
```

No test runner is configured. Validate changes with `npm run build` + `npm run preview`.

## Architecture

**Astro 5 SSR on Cloudflare Workers** with React islands for interactive components. Data lives in Cloudflare D1 (SQLite). Optional self-hosted image service in `infra/image-store/` (Fastify + PostgreSQL + Redis).

### Rendering Model

- **Static pages**: Article pages, category listings — Astro renders Markdown from content collections at build time
- **SSR pages**: All `/admin/*` and `/api/admin/*` routes — server-rendered on Cloudflare Workers, access D1 via `locals.runtime.env.BLOG_DB`
- **React islands**: Interactive sections (hero 3D scene, masonry grids, charts) hydrated client-side via `client:load` / `client:idle` / `client:visible`

### Content Pipeline (Dual-Source)

Articles come from two sources merged at build:
1. **Local Markdown** in `src/data/{journal,tech,learning,life}/` — committed to git
2. **D1 database** — `scripts/sync-d1-posts.mjs` runs during `npm run build`, pulls published posts (`draft=0`) from D1 and writes `.d1.md` files into `src/data/{category}/`

Both feed into Astro's content collections defined in `src/content.config.ts` (4 collections, identical Zod schema).

### Key Directories

- `src/pages/` — Astro routes: public pages + `admin/` (SSR) + `api/admin/` (API endpoints)
- `src/react/` — React components organized by concern: `sections/`, `ui/`, `motion/`, `cards/`, `three/`, `hooks/`, `layout/`
- `src/lib/` — Server-side logic: `auth.ts` (JWT/jose), `db.ts`, `diary.ts`, `timeline.ts`, `travel.ts`, `social.ts`, `highlights.ts`
- `src/styles/global.css` — Design system using Tailwind v4 `@theme` block with 5 color palettes (primary/sage/amber/mauve/ink), each with 50-900 scales
- `migrations/` — D1 SQL migrations (0001-0004): posts, diary_entries, timeline_nodes, travel_places, social_friends, highlight_stages/items
- `references/github/` — Shallow-cloned reference repos (gitignored), managed by `scripts/clone-reference-repos.sh`

### Authentication

JWT (HS256) via `jose`. Admin pages check cookie `oc_admin_token` server-side. Secrets `ADMIN_PASSWORD` and `ADMIN_JWT_SECRET` set via `wrangler secret` (prod) or `.dev.vars` (local).

### D1 Access Pattern

All API routes follow:
```typescript
export const POST: APIRoute = async ({ locals, request }) => {
  const db = locals.runtime.env.BLOG_DB;
  // D1 queries via db.prepare().bind().run()/all()/first()
};
```

## Style Conventions

- TypeScript strict mode, ESM, 2-space indent, semicolons
- Import alias: `@/` → `src/`
- Astro/React components: `PascalCase`; hooks: `useCamelCase`; scripts: `kebab-case`
- Commit prefixes: `feat:`, `fix:`, `chore:`, `publish:`
- Content frontmatter must match schema in `src/content.config.ts`: `title`, `date`, `category` (journal|tech|learning|life), `tags`; optional: `description`, `cover`, `draft`

## Design System — "Mist & Ink" (霞墨)

Five color families defined in `src/styles/global.css`:
- **primary** (Azure #4F6AE5) — brand, CTA, links
- **sage** (#6B917B) — tech category
- **amber** (#B8945E) — efficiency category
- **mauve** (#9684A8) — life category
- **ink** — neutral text/borders (light: #EAECF2 base, dark: #0B0E18 base)

Title font: LXGW WenKai. Code font: JetBrains Mono.

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `ADMIN_PASSWORD` | `wrangler secret` / `.dev.vars` | Admin login |
| `ADMIN_JWT_SECRET` | `wrangler secret` / `.dev.vars` | JWT signing |
| `IMAGE_STORE_API_KEY` | `wrangler secret` / `.dev.vars` | Image service auth |
| `IMAGE_STORE_URL` | `wrangler.jsonc` vars | Image service internal URL |
| `IMAGE_STORE_PUBLIC_URL` | `wrangler.jsonc` vars | Image service public URL |
| `CF_ACCOUNT_ID` / `CF_API_TOKEN` / `D1_DATABASE_ID` | CI env / shell | D1 sync during build |
