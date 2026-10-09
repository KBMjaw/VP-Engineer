# Deployment — GitHub + Vercel

Code changes deploy through GitHub → Vercel. **Content changes (projects and
photos) do not need a deployment**: the admin panel writes straight to
Supabase and the public site reads from Supabase on every visit.

## GitHub

The repository is `KBMjaw/VP-Engineer`.

```bash
git clone https://github.com/KBMjaw/VP-Engineer.git
cd VP-Engineer
npm ci
cp .env.example .env.local   # fill in your Supabase URL + publishable key
npm run dev                  # http://localhost:5173
```

Typical change:

```bash
git checkout -b my-change
# …edit…
npm run typecheck && npm test && npm run build
git commit -am "Describe the change"
git push -u origin my-change   # open a pull request, merge to main
```

Never commit `.env`, `.env.local` or any key other than the public publishable/anon key.

## Vercel

The Vercel project is **`vp-engineers`** (`https://vp-engineers.vercel.app`).

1. Vercel → Project → **Settings → General**
   - Framework preset: **Vite** (also set in `vercel.json`)
   - Build command: `npm run build` · Output directory: `dist` · Install: `npm ci`
   - Node.js version: 20.x or newer
2. **Settings → Git**: connect `KBMjaw/VP-Engineer`, production branch `main`.
   Every push to `main` deploys production; other branches get preview URLs.
3. **Settings → Environment Variables** (Production **and** Preview):

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | the **publishable** (`sb_publishable_…`) or legacy anon key |
   | `VITE_SITE_URL` | `https://vp-engineers.vercel.app` (used in password-reset links) |
   | `VITE_MAX_UPLOAD_MB` | optional, default `20` |

   `VITE_` variables are compiled into the browser bundle — **only public values** belong there.
4. Redeploy after changing environment variables (Deployments → ⋯ → Redeploy).

`vercel.json` adds SPA routing (so `/admin` and `/admin/projects/…` work on refresh),
long-term caching for hashed assets, `no-cache` for `index.html`, and security headers.

### Without Supabase configured

The public site still works (portfolio shows its "being updated" state) and `/admin`
shows a "Setup required" message. Nothing breaks; projects simply can't be managed yet.

## Custom domain (optional)

Vercel → Project → **Settings → Domains** → add e.g. `vpengineer.in`, follow the DNS steps,
then update: Supabase **Site URL / Redirect URLs**, `VITE_SITE_URL`, and the canonical/OG URLs
in `index.html` and `src/config/site.ts`.
