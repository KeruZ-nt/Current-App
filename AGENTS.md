# Current — AGENTS.md

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | `oxlint` (not ESLint) |
| `npm run preview` | `vite preview` |

No test framework. No codegen.

## TypeScript quirks

- `verbatimModuleSyntax` — use `import type` for type-only imports.
- `erasableSyntaxOnly` — no enums, no `namespace`, no parameter properties.
- `noUnusedLocals` + `noUnusedParameters` are errors.
- `target: es2023`, JSX is `react-jsx` (no `import React` needed).
- `moduleResolution: "bundler"`, `noEmit: true`.

## Project structure

| Path | Purpose |
|------|---------|
| `src/lib/` | Supabase client, `sanitizeError()`, bulk-parser |
| `src/store/` | Zustand stores: auth, workspace, notification, toast |
| `src/types/` | Shared TS interfaces |
| `src/pages/` | Route page components |
| `src/components/layout/` | Sidebar, Header, MainLayout, TopNavLayout, ProtectedRoute |
| `src/components/ui/` | Reusable Toast, ConfirmModal components |
| `supabase/migrations/` | SQL scripts to run in Supabase Dashboard |

Two layouts: `MainLayout` (sidebar + header) and `TopNavLayout` (top nav only).

## Routing

| Path | Component | Layout |
|------|-----------|--------|
| `/login`, `/register` | Public | None |
| `/welcome`, `/workspaces`, `/profile` | Protected | TopNavLayout |
| `/`, `/inventory`, `/sales`, `/purchases`, `/history`, `/suppliers`, `/team`, `/notifications` | Protected | MainLayout |

## Supabase

- Env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (in `.env` — still present locally but in `.gitignore`).
- **RLS is the ONLY data isolation mechanism** — no backend server. Every RLS policy in `supabase/migrations/` must be applied.
- `src/lib/supabase.ts` exports a single `supabase` client.
- `src/lib/errors.ts` exports `sanitizeError()` — always use instead of raw `error.message`.
- Real-time notifications via Supabase Realtime subscriptions (`notificationStore.ts`).

## ProtectedRoute

Guards three conditions in order (each redirects if unmet):
1. Authenticated (`user` non-null)
2. Profile complete (`profile.full_name` set)
3. Active workspace selected (`activeWorkspace` non-null)

`workspaceStore.fetchWorkspaces(userId, background=true)` avoids spinner flash on token refresh.

## UI conventions

- **Language:** Spanish (UI text, `lang="es"`, page titles).
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss` + `@import "tailwindcss"` in `index.css`. Custom HSL CSS vars for theming.
  - **Gotcha:** `tailwind.config.js` is a stale v3 artifact — TA v4 uses `@theme` in CSS instead. Edit `src/index.css` for theme changes, not `tailwind.config.js`.
- **Fonts:** Inter (body) + Space Grotesk (display/tech).
- **Icons:** `lucide-react`. **Charts:** `recharts`.
- **Class merging:** `clsx` + `tailwind-merge`.
- **Glassmorphism:** `.glass`, `.glass-hover`, `.text-gradient`, `.bg-grid` in `index.css`.
- **Light mode only** — no dark mode.

## Safety-critical (stock)

- Sales re-reads stock before update and uses `.gte('stock', quantity)`.
- For true atomicity, run `001_decrement_stock.sql` in Supabase Dashboard and call `supabase.rpc('decrement_stock', ...)`.

## Oxlint (`.oxlintrc.json`)

Plugins: `react`, `typescript`, `oxc`. Notable: `react/rules-of-hooks` = error, `react/only-export-components` = warn (with `allowConstantExport`).

## Design system skill

```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "Current"
```

## Deployment

- Vercel-optimized (`vercel.json`): SPA rewrites + CSP/HSTS/X-Frame-Options/Permissions-Policy headers.
- Preview: `npm run preview`.
