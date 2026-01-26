# CLOUDFLARE.md - Plan de migration (plan only, zero action)

Contexte
- Objectif: migration complete vers Cloudflare (frontend + backend), free tier, securite max.
- Contrainte: zero downtime. Nouveau repo possible: demo-app-cloudflare-app.
- Charge cible: <2000 users, <100 simultanes.
 - Decision: tout doit etre gere par Cloudflare (frontend, backend, DB, storage, auth, CI/CD).

1) Recommande sans casser l'app actuelle (zero downtime)
- Creer un nouveau repo `demo-app-cloudflare-app` et une nouvelle stack Cloudflare en parallele.
- Garder le projet actuel (Vercel + VPS) en production pendant toute la phase de migration.
- Utiliser un domaine/projet Pages distinct (ex: demo-app-cloudflare-app.pages.dev) pour staging/prod parallele.
- Mettre en place un mode dual-write (ancien backend + nouveau backend) pour eviter toute perte pendant la transition.
- Cutover progressif:
  - tests internes sur le nouveau domaine
  - bascule du Telegram Mini App URL vers Cloudflare
  - monitoring 48-72h
  - rollback instantane vers l'ancien domaine si besoin

2) Recommande pour ce projet (architecture Cloudflare free tier)
- Frontend: Cloudflare Pages (avec Git integration, build auto sur push).
- Backend API: Cloudflare Workers / Pages Functions (meme runtime Workers).
- DB: Cloudflare D1 (SQLite) pour produits, reviews, settings, orders, users/admin. (100% Cloudflare, pas de Supabase)
- Media: Cloudflare R2 pour images + videos.
- Cache: usage minimal KV si besoin (rate limit, small flags), sinon eviter.
- Admin access: Cloudflare Access en gate principal, app-level auth en fallback.

Note Next.js:
- OpenNext Cloudflare supporte Next 15 (toutes versions mineures/patch) et la derniere mineure de Next 14. Next 16 n'est pas listé comme supporte.
- Recommande: downgrader Next a 15.x (ou 14.x) pour compatibilite OpenNext, OU passer le frontend en SSG/CSR avec APIs sur Workers si tu veux garder Next 16.

Decision pour ce projet (tout Cloudflare)
- Choix valide pour ce projet: Next 16 en SSG/CSR (pas de SSR Workers) + APIs Workers.
- Note: OpenNext supporte Next 15/14, donc SSR Workers non recommande avec Next 16.

Impact concret (SSG/CSR + Workers API)
- Pages publiques (client/mini-app): catalogue, panier, avis, info = rendu client (CSR) avec data via /api (Workers).
- Admin: pages admin en CSR (login + CRUD) avec data via /api (Workers).
- Next App Router reste utilisable pour routing/layout, mais pas de SSR runtime en prod.
- Toutes les routes API doivent migrer vers Workers/Pages Functions (pas de Node server runtime).
- Auth admin: Access gate en amont + fallback auth interne (session en D1).
- Telegram gate: verif initData cote Worker pour endpoints user.

Checklist changements code (high level)
- Routes API: migrer `app/api/**` vers Workers/Pages Functions (pas d'API Next en runtime Node).
- DB: remplacer le client Supabase par un client D1 (queries SQL directes).
- Storage: remplacer upload Supabase Storage par upload R2 (presigned URL).
- Env: deplacer tous secrets vers `wrangler.toml` / Cloudflare env (NO secrets client).
- Auth: remplacer Better Auth par auth maison D1 + Access gate (fallback).
- Front: adapter les fetch client pour pointer vers endpoints Workers.

3) Upload images/videos (obligatoire)
- Stockage R2 pour images + videos (free tier 10 GB, 1M Class A ops, 10M Class B ops / mois).
- Pour videos: uploader direct vers R2 avec URL pre-signee (client -> R2) afin d'eviter limites de body Workers (100 MB sur Free) et CPU 10ms.
- L'API Workers ne recoit que les metadata et la validation.

4) Admin auth avec fallback
- Gate principal: Cloudflare Access (Zero Trust) sur /admin (gratuit pour <50 users).
- Fallback in-app: login admin classique (email/password ou magic link) stocke en D1.
- Fallback d'urgence: admin allowlist + secret fallback route + rotation de secret.
- Objectif: si Access est mal configure ou indisponible, l'admin peut encore se connecter via le fallback (limite IP ou allowlist).

5) Plan de migration recommande (phases)
Phase A - Preparation (parallele)
- Creer repo demo-app-cloudflare-app.
- Choisir compat Next.js (OpenNext + Next 15/14) ou SSG/CSR.
- Definir schema D1 (equivalent Postgres) et migration data.
- Definir buckets R2 (images, videos) et naming.

Phase B - Mise en place Cloudflare
- Creer Pages project lie a GitHub (build auto sur push main).
- Creer Workers/Pages Functions pour API.
- Creer D1 et R2 (binds Workers).
- Configurer secrets env (Telegram, admin, etc.).

Phase C - Migration data
- Export DB actuelle -> transform -> import D1.
- Migrer media vers R2 (script copy + verif hash/size).
- Mettre a jour les URL media dans la DB.

Phase D - Dual write (zero downtime)
- Pendant un temps, ecriture vers ancien backend + nouveau backend.
- Verifier par comparaison (logs, tests, spot checks).

Phase E - Cutover
- Bascule URL Telegram Mini App vers Pages domain.
- Monitoring 48-72h.
- Garder ancien backend en standby pour rollback.

Phase F - Stabilisation
- Apres 2-4 semaines stables, decommission ancien backend.

6) Limites free tier a respecter (resume)
- Workers Free: 100k req/jour, CPU 10ms/req, body max 100 MB.
- D1 Free: 5M rows read/jour, 100k rows write/jour, 5 GB stockage.
- R2 Free: 10 GB stockage, 1M Class A ops, 10M Class B ops / mois.
- Pages Free: 500 builds/mois.
- Access Free: recommande pour equipes <50 users.

7) Telegram bot
- Nouveau bot OK. Une fois la stack Cloudflare prete, on change le Mini App URL vers le domain Pages.

8) CI/CD (auto deploy)
- Git integration Pages: push sur main -> deploy automatique (comme Vercel).
- Previews automatiques sur PRs si besoin.

9) Securite (free tier, max)
- WAF + DDoS de base inclus.
- Access gate sur /admin + MFA.
- Rate limit Workers sur endpoints critiques.
- Turnstile sur formulaires sensibles (login, avis).
- Secrets stockes uniquement en env Workers.

10) Automatisation CLI (minimum d'actions manuelles)
- Utiliser Wrangler CLI pour tout provisionner et deployer (Pages, Workers, D1, R2).
- Auth CLI recommande via API token (pas de login interactif), pour qu'un agent IA puisse tout executer.
- Option: creer un token principal une seule fois dans le dashboard, puis utiliser l'API Cloudflare pour generer des tokens derives limites (rotation facile).
- Utiliser GitHub integration Pages: un simple push sur main declenche deploy automatique.
- Objectif: 1 seule action manuelle initiale (creer token), ensuite tout est scriptable via CLI.

11) Prerequis / acces (mode CLI first)
- Mode prefere: `wrangler login` (auth navigateur) puis tout en CLI.
- Fallback si login non possible: API Token Cloudflare avec droits restreints (Pages, Workers, D1, R2, Access).
- Acces GitHub pour relier le repo a Cloudflare Pages (OAuth) ou via token GitHub.
- Variables requises a fournir a l'agent: Cloudflare account id, zone id (si domaine), token ou session Wrangler, repo GitHub cible.

Annexes - References (sources)
- Workers limits (free): https://developers.cloudflare.com/workers/platform/limits/
- D1 limits (free): https://developers.cloudflare.com/d1/platform/pricing/
- R2 free tier quotas: https://developers.cloudflare.com/r2/pricing/
- Pages limits (free builds): https://developers.cloudflare.com/pages/platform/limits/
- Pages Git integration + pages.dev updates: https://developers.cloudflare.com/pages/configuration/preview-deployments/
- Pages custom domains + pages.dev: https://developers.cloudflare.com/pages/configuration/custom-domains/
- Access free plan (<50 users): https://www.cloudflare.com/zero-trust/products/access/
- OpenNext supported Next.js versions: https://opennext.js.org/cloudflare
