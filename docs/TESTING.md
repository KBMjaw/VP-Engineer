# Testing

## Automated

| Command | What it checks | Needs |
| --- | --- | --- |
| `npm run typecheck` | TypeScript, strict mode | — |
| `npm test` | Unit tests: image sizing/validation, form validation, cover/order logic | — |
| `npm run build` | Production build | — |
| `npm run test:security` | 36 database + storage security checks (RLS, bucket rules) | local Supabase |
| `npm run test:e2e` | 35 browser checks of the full owner workflow | local Supabase + dev server |

### Running the integration tests locally

They run against a **local** Supabase in Docker. Never against production — the security
script refuses non-local URLs.

```bash
# 1. Start local Supabase (applies supabase/migrations automatically)
npx supabase start
npx supabase status -o env        # note API_URL and PUBLISHABLE_KEY / ANON_KEY

# 2. Create two test users: one admin, one ordinary user
SR=<SERVICE_ROLE_KEY from status — local only>
for u in admin@vp.test:AdminPass-2026 visitor@vp.test:VisitorPass-2026; do
  curl -s -X POST http://127.0.0.1:54321/auth/v1/admin/users \
    -H "apikey: $SR" -H "Authorization: Bearer $SR" -H "Content-Type: application/json" \
    -d "{\"email\":\"${u%%:*}\",\"password\":\"${u##*:}\",\"email_confirm\":true}"
done
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c \
  "insert into admin_users (user_id, email) select id, email from auth.users where email='admin@vp.test';"

# 3. Point the app at local Supabase
printf "VITE_SUPABASE_URL=http://127.0.0.1:54321\nVITE_SUPABASE_ANON_KEY=<PUBLISHABLE_KEY>\n" > .env.local

# 4. Run
SUPABASE_ANON_KEY=<PUBLISHABLE_KEY> npm run test:security
npm run dev &                     # in another terminal
npx playwright install chromium   # first time only
npm run test:e2e
```

The browser test uses the photos in `tests/e2e/fixtures/` — synthetic images labelled
"TEST PHOTO", never real company data — and deletes the project it creates.

## Manual checklist (production, after setup)

Public site
- [ ] Home page loads; banner shows fully on desktop and phone; no sideways scrolling.
- [ ] Menu links scroll to Home, About, Services, Our Projects, Contact; phone menu opens and closes.
- [ ] Construction journey plays through all 13 stages when scrolling (desktop and phone).
- [ ] WhatsApp, Call and Email buttons open the right app; the quick-enquiry form opens WhatsApp with the message.
- [ ] Footer shows "Developed by Cube Corpsol" linking to https://cubecorpsol.com (opens in a new tab).

Admin (on the owner's phone)
- [ ] `/admin` redirects to the login page; a wrong password shows a clear error.
- [ ] A signed-in user who is not in `admin_users` sees "Access denied".
- [ ] Owner signs in; dashboard shows totals.
- [ ] Create a project as a draft; it does **not** appear on the public site.
- [ ] Add several photos at once into Before, During and After; progress shows; captions/dates save.
- [ ] Set a cover photo; reorder photos; replace a photo; delete a photo.
- [ ] Preview shows the project as visitors will see it, with a draft warning.
- [ ] Publish → refresh the public site → the project card appears with its cover. Opening it shows the gallery grouped Before / During / After.
- [ ] Unpublish → refresh → the card is gone.
- [ ] Delete the project → its photos disappear from Supabase Storage.
- [ ] Sign out returns to the login page.

Security (Supabase dashboard)
- [ ] Security Advisor shows no RLS warnings.
- [ ] Authentication → "Allow new users to sign up" is **off**.
- [ ] Only the owner's account is listed in `admin_users`.
