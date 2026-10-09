# VP Engineer — Website & Admin Panel

Single-page website for **VP Engineer — Versatile In Profession** (Erode, Tamil Nadu),
with a secure, phone-friendly admin panel where the owner adds projects and photos that
appear on the website immediately, with no code changes or redeploys.

**Stack:** React 18 + Vite + TypeScript · Tailwind CSS · Supabase (Postgres, Auth, Storage) · Vercel

## How it works

```
Owner's phone ──▶ /admin (Supabase Auth: email + password)
                    │  photos resized → WebP in the browser
                    ├─▶ Supabase Storage  (private bucket "project-images")
                    └─▶ Supabase Postgres (projects, project_images)
                                     ▲  Row Level Security: visitors read published only;
Visitors ──▶ / (portfolio) ──────────┘  only users in admin_users can write
```

- Publishing is a flag (`is_published`). Visitors' browsers query Supabase on every visit
  (and again when they return to the tab), so publish/unpublish/edit is reflected immediately.
- Code changes go GitHub → Vercel automatically. Content never needs a deploy.

## Project structure

```
index.html                     HTML shell, SEO + Open Graph metadata
public/img/                    Logo, proprietor photo, 16:9 banner (original assets)
src/
  config/site.ts               Company details, categories, units — edit here
  lib/supabase.ts              Browser client (public key only)
  lib/projects.ts              Data access: public queries, admin CRUD, uploads, signed URLs
  lib/images.ts                Validation + client-side resize/WebP compression
  components/site/             Navbar, hero, about, services, contact, footer
  components/journey/          13-stage "From Ground to Home" scroll animation (SVG)
  components/portfolio/        Public portfolio + project details / gallery / lightbox
  admin/                       Admin panel (lazy-loaded): auth, dashboard, list, editor, photos
  pages/                       Home, 404
supabase/
  migrations/                  Schema, RLS policies, storage bucket + policies (version-controlled)
  config.toml                  Local development stack config
tests/e2e/                     Security (RLS/storage) + browser workflow tests
docs/                          Setup, deployment and testing guides
```

## Local development

```bash
npm ci
cp .env.example .env.local    # add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev                   # http://localhost:5173  ·  admin at /admin
```

Without Supabase variables the public site still runs (portfolio shows its empty state)
and `/admin` explains what's missing. For a fully local backend, see [docs/TESTING.md](docs/TESTING.md)
(`npx supabase start`).

| Script | |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Unit tests |
| `npm run test:security` / `npm run test:e2e` | Integration tests (local Supabase) |

## Setup guides

1. **Supabase** (database, storage, security policies, creating the admin): [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md)
2. **GitHub + Vercel** (environment variables, deploys, custom domain): [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
3. **Testing** (automated suites + manual checklist): [docs/TESTING.md](docs/TESTING.md)

## Editing content

- **Projects & photos:** sign in at `/admin`. Nothing in the code needs to change.
- **Company details** (phone, email, years, map link): `src/config/site.ts`.
- **Journey text:** `src/components/journey/Journey.tsx`; drawing: `src/components/journey/scene.js`.
- **Logo / photo / banner:** replace files in `public/img/` keeping the same names.
  (The current logo and portrait were cut from the supplied 16:9 banner; dedicated originals will be sharper.)

## Security notes

- The browser only ever has the **publishable/anon** key; every permission is enforced by
  Postgres RLS and Storage policies (see the migration). The service-role key is never used by the app.
- Public sign-ups are disabled; admins are added manually to `admin_users`.
- The storage bucket is private; images are delivered via signed URLs only for published projects.
- `.env*` files are git-ignored. Only `.env.example` (placeholders) is committed.
