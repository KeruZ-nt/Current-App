# Current — AGENTS.md

## Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | `tsc -b && vite build` (must pass typecheck first) |
| `npm run lint` | `oxlint` (not ESLint) |
| `npm run preview` | `vite preview` |

No test framework is configured.

## TypeScript quirks

- `verbatimModuleSyntax` — use `import type` for type-only imports.
- `erasableSyntaxOnly` — no enums, no `namespace`, no experimental decorators.
- `noUnusedLocals` + `noUnusedParameters` are errors.
- `target: es2023`, JSX is `react-jsx` (no React import needed for JSX).

## Project structure

| Path | Purpose |
|------|---------|
| `src/lib/` | Supabase client, `sanitizeError()`, bulk-parser utility |
| `src/store/` | Zustand stores: auth, workspace, notifications |
| `src/types/` | Shared TS interfaces (Product, Transaction, Workspace, etc.) |
| `src/pages/` | Page components per route |
| `src/components/layout/` | Sidebar, Header, MainLayout, TopNavLayout, ProtectedRoute |
| `supabase/migrations/` | SQL scripts that must be run in Supabase Dashboard |

Two layouts: `MainLayout` (sidebar + header) and `TopNavLayout` (top nav only).

## Supabase

- Two `.env` vars required: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Auth + DB + RLS all on Supabase. **RLS is the ONLY data isolation mechanism** — there is no backend server. Every RLS policy in `supabase/migrations/` must be applied.
- `src/lib/supabase.ts` exports a single `supabase` client instance.
- `src/lib/errors.ts` exports `sanitizeError()` — always use this instead of raw `error.message` to avoid leaking DB internals to users.
- Real-time notifications via Supabase Realtime subscriptions (`notificationStore.ts`).
- **Never commit `.env` to git.** It's in `.gitignore` but was accidentally committed in the initial commit. Rotate the ANON_KEY if the repo is public.

## Protected route flow

`ProtectedRoute` guards three conditions in order (each redirects if unmet):
1. Authenticated (`user` non-null)
2. Profile complete (`profile.full_name` set)
3. Active workspace selected (`activeWorkspace` non-null)

The `workspaceStore.fetchWorkspaces(userId, background=true)` parameter avoids a loading spinner flash on token refresh.

## Routing

| Path | Component | Layout |
|------|-----------|--------|
| `/login`, `/register` | Public | None |
| `/welcome`, `/workspaces`, `/profile` | Protected | TopNavLayout |
| `/`, `/inventory`, `/sales`, `/purchases`, `/history`, `/suppliers`, `/team` | Protected | MainLayout |

## UI conventions

- **Language:** Spanish (UI text, `lang="es"`, page titles).
- **Styling:** Tailwind CSS v4 + PostCSS (`@tailwindcss/postcss`). Custom HSL CSS vars for theming in `src/index.css`.
- **Fonts:** Inter (body) + Space Grotesk (display/tech).
- **Icons:** `lucide-react`.
- **Charts:** `recharts`.
- **Class merging:** `clsx` + `tailwind-merge`.
- **Glassmorphism:** Utility classes `.glass`, `.glass-hover`, `.text-gradient`, `.bg-grid` in `index.css`.
- **Color theme:** Light mode only (no dark mode yet — see `ROADMAP.md`).

## Oxlint config (`.oxlintrc.json`)

Plugins: `react`, `typescript`, `oxc`. Key rules:
- `react/rules-of-hooks`: error
- `react/only-export-components`: warn (allows `allowConstantExport: true`)

## Design system skill

`.agent/skills/ui-ux-pro-max/` contains a Python-based design system tool. Run from repo root:
```bash
python3 .agent/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "Current"
```

## Deployment

- Optimized for Vercel (`vercel.json` with SPA rewrites + security headers: CSP, HSTS, X-Frame-Options).
- Preview builds with `npm run preview`.

## Seguridad

- **Stock race conditions:** Sales re-reads stock before updating and uses `.gte('stock', quantity)` to prevent overselling. For true atomicity, run `supabase/migrations/001_decrement_stock.sql` and use `supabase.rpc('decrement_stock', ...)`.
- **Password policy:** Minimum 8 characters with uppercase, lowercase, and number (enforced client-side; Supabase server-side policy is separate).
- **Account deletion:** Requires password re-authentication before proceeding.
- **Invite codes:** Generated with `crypto.randomUUID()` (not `Math.random()`).
- **All Supabase errors** are sanitized through `sanitizeError()` before reaching the user.
