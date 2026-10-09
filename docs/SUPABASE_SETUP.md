# Supabase setup (production)

The website reads projects from Supabase; the admin panel writes to it. All
security is enforced **in the database** (Row Level Security + Storage
policies), so the public key in the browser can do nothing an anonymous
visitor shouldn't.

## 1. Create the project

1. Go to <https://supabase.com/dashboard> → **New project**.
   - Name: `vp-engineers` · Region: **South Asia (Mumbai) `ap-south-1`** (closest to Erode).
   - Save the database password in a password manager. It is never needed by the website.
   - Free plan: an account can have only **2 active free projects**. Pause or delete an unused one first if needed.
2. Wait until the project is ready.

## 2. Apply the schema, security policies and storage bucket

Choose **one** method.

**A. SQL editor (no tools needed)**
Dashboard → **SQL Editor** → New query → paste the entire contents of
[`supabase/migrations/20261009000000_portfolio.sql`](../supabase/migrations/20261009000000_portfolio.sql) → **Run**.

**B. Supabase CLI**
```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push
```

This creates:

| Object | Purpose |
| --- | --- |
| `admin_users` | Allow-list of administrator user IDs. **No write policies** — rows can only be added from the SQL editor. |
| `projects` | Portfolio projects; `is_published` controls visibility. |
| `project_images` | Photo metadata (phase *before / during / after*, caption, date, order, size). Files live in Storage. |
| `is_admin()` | `SECURITY DEFINER` helper used by every write policy. |
| Bucket `project-images` | **Private** bucket, 10 MB per file, `image/webp`, `image/jpeg`, `image/png` only. |
| `orphaned_project_images()` | Admin-only report of stored files that have no database row. |

### What the policies allow

| Who | projects / project_images | Storage files |
| --- | --- | --- |
| Anonymous visitor | Read **published** projects and their images only | Get a signed URL for files of **published** projects only |
| Signed-in user who is **not** in `admin_users` | Same as anonymous | Same as anonymous |
| Admin (in `admin_users`) | Read, create, update, publish, delete everything | Upload, replace, delete, read |

Being logged in does **not** grant anything; only a row in `admin_users` does.
Photos are served through short-lived signed URLs, so a draft's photos can't be
fetched even if someone guesses a file path.

## 3. Lock down sign-ups

Dashboard → **Authentication → Sign In / Providers**:

- **Email** provider: enabled (needed for email + password login).
- **Allow new users to sign up: OFF.** Admins are created by you, not by visitors.
- Optional: enable *Leaked password protection* (Pro plan) and set the minimum password length to 10+.

Dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://vp-engineers.vercel.app` (or your custom domain).
- **Redirect URLs**: add `https://vp-engineers.vercel.app/admin/reset-password`
  (and `http://localhost:5173/admin/reset-password` for local development).

## 4. Create the administrator

1. Dashboard → **Authentication → Users → Add user → Create new user**.
   - Email: the owner's email (e.g. `vpengineerserd@gmail.com`).
   - Password: a strong password (12+ characters). Tick **Auto Confirm User**.
2. Dashboard → **SQL Editor**, run (replace the email):
   ```sql
   insert into public.admin_users (user_id, email)
   select id, email from auth.users
   where email = 'vpengineerserd@gmail.com';
   ```
3. Check:
   ```sql
   select au.email, au.created_at from public.admin_users au;
   ```

To **remove** an admin: `delete from public.admin_users where email = '…';`
(their login keeps working but they lose all access to the admin panel).

The owner can change the password later via **Forgot password?** on `/admin/login`
(the reset email goes to the admin's address).

## 5. Get the public keys for the website

Dashboard → **Project Settings → API Keys**:

- **Project URL** → `VITE_SUPABASE_URL`
- **Publishable key** (`sb_publishable_…`) — or the legacy **anon** key → `VITE_SUPABASE_ANON_KEY`

> Never use the **secret / service_role** key or the database password in the
> website or in any `VITE_` variable. They bypass all security.

Set these in Vercel (see [DEPLOYMENT.md](DEPLOYMENT.md)) and in `.env.local` for local development.

## 6. Verify

- Run Dashboard → **Advisors → Security Advisor**; there should be no RLS warnings for these tables.
- Open the site's `/admin`, sign in, create a draft project with a photo, and confirm it does **not**
  appear on the public site until you press **Publish**.

## Maintenance

- **Orphaned files** (an upload that succeeded but whose save failed, e.g. phone lost signal):
  ```sql
  select * from public.orphaned_project_images(); -- run while signed in as admin, or in SQL editor as postgres
  ```
  Delete them in Dashboard → Storage → `project-images`.
- **Backups:** Supabase takes daily backups on paid plans. On the free plan, export periodically
  (Dashboard → Database → Backups, or `npx supabase db dump`).
- **Free-plan pausing:** free projects pause after a week with no activity; the public portfolio
  then shows its error state with a retry button. Restore from the dashboard, or use a paid plan for a business site.
