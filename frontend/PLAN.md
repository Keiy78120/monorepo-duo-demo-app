# Plan

## Access + Decisions
- GitHub: confirm repo `keiy78120/mini-app`; provide PAT (repo scope) or collaborator access.
- VPS/Supabase: URL, access method (SSH/panel/credentials), permission to create new DB + user, storage bucket access/creation.
- Telegram: BOT_TOKEN, bot username, BotFather Mini App settings; confirm review moderation policy.
- Better Auth: choose provider (email/password default or magic link); admin email + initial password.
- Vercel: account/team, env management approach, custom domain yes/no.
- Confirm Node 20+ available locally and in CI.

## Repo + Bootstrap
- Create repo and initialize Next.js App Router with TS and Tailwind v4.
- Pin versions: Next 16.1.4, React 19.2.3, Tailwind 4.1.18, TS 5.9.3.
- Install deps: Zustand 5.0.10, Motion 12.29.0, Supabase JS 2.91.1, Better Auth 1.4.17.
- Commit single package manager lockfile.

## Structure + Conventions
- Create app routes: `(webapp)` and `admin` segments, API routes.
- Add folders: `lib/`, `components/`, `lib/supabase`, `lib/auth`, `lib/telegram`, `lib/store`.
- Add `env.ts` with Zod validation; use in server/client.
- Ensure scripts: `dev`, `build`, `start`, `lint`, `typecheck`, `test`.

## Styling + UI System
- Install shadcn/ui and required components.
- Define Tailwind theme: dark default, glassmorphism, gradients, large radii.
- Create base layout + fixed bottom nav with frosted glass.
- Establish typography + spacing scales.

## Supabase (VPS)
- Create new DB (no impact to existing).
- Create DB user/role with least privilege.
- Apply schema: `products`, `reviews`, `settings`, optional `orders`.
- Create storage bucket for product images.
- Set RLS policies for admin vs user access.
- Apply Better Auth schema/migrations.

## Auth + Security
- Configure Better Auth with chosen provider.
- Set cookies httpOnly; secure in prod.
- Add `roles`/`profiles` table if needed; require `role=admin`.
- Protect `/admin` routes with middleware + role checks.
- Keep secrets server-only.

## Telegram Gate (User App)
- Client gate: check `window.Telegram?.WebApp`, show “Open in Telegram” fallback.
- Server gate: verify `initData` for user API routes.
- Ensure user app routes don’t render data when gate fails.

## User Features
- Catalog: product cards, category filters, product detail sheet.
- Cart: Zustand + localStorage persistence, qty controls, total, empty state.
- Reviews: list + submit form, rating + text, status handling.
- Info: dynamic content from `settings`.

## Admin Features
- Login page with Better Auth.
- Dashboard overview.
- Products CRUD + image upload.
- Settings editor for info content.
- Reviews moderation (publish/pending).

## API + Data Layer
- Implement `lib/supabase/client.ts` and server helpers.
- API routes: `telegram/verify`, `products`, `reviews`.
- Enforce auth + role for write endpoints.
- Seed minimal data for local testing.

## Quality + CI
- ESLint config for Next + TS strict.
- Typecheck script.
- Basic test placeholder if needed.
- GitHub Actions: install, lint, typecheck.

## Deployment (Vercel)
- Prepare `.env.example` with all variables.
- Set Vercel envs for preview/prod.
- `vercel login`, `vercel link`, `vercel env add`, `vercel deploy --prod`.
- Verify Telegram mini app URL in BotFather.

## Final Validation
- Local: `pnpm dev`, `pnpm lint`, `pnpm typecheck`.
- Telegram-only gate behavior in browser vs Telegram.
- Admin login + RBAC.
- CRUD + storage upload.
- Mobile UX: bottom nav, tap targets, performance.
