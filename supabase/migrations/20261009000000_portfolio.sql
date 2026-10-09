-- =============================================================================
-- VP Engineer — portfolio schema, row-level security and storage
--
-- Tables
--   admin_users     explicit allow-list of administrators (by auth user id)
--   projects        portfolio projects (draft / published)
--   project_images  photo metadata; files live in Storage bucket "project-images"
--
-- Security model
--   * Being signed in is NOT enough: every write checks public.is_admin().
--   * Anonymous visitors can read only published projects and their images.
--   * admin_users has no write policies — rows are added from the SQL editor
--     (service role) only. See docs/SUPABASE_SETUP.md.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------------
create table public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Users allowed to manage the portfolio. Insert rows manually via the SQL editor.';

alter table public.admin_users enable row level security;

-- Signed-in users may see only their own row (used by the admin UI to check access).
create policy "admin_users: read own row"
  on public.admin_users for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Authorization helper. SECURITY DEFINER so it can read admin_users regardless
-- of the caller's RLS; search_path pinned to avoid hijacking.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users au where au.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- projects
-- ---------------------------------------------------------------------------
create table public.projects (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(btrim(title)) between 1 and 160),
  category         text not null check (category in
                     ('residential', 'commercial', 'industrial', 'structural', 'renovation')),
  site_type        text check (site_type is null or char_length(site_type) <= 120),
  description      text check (description is null or char_length(description) <= 5000),
  location         text check (location is null or char_length(location) <= 160),
  address          text check (address is null or char_length(address) <= 400),
  maps_url         text check (maps_url is null or maps_url ~* '^https://[^\s]+$'),
  site_area        numeric(14, 2) check (site_area is null or site_area > 0),
  built_up_area    numeric(14, 2) check (built_up_area is null or built_up_area > 0),
  area_unit        text not null default 'sq_ft' check (area_unit in
                     ('sq_ft', 'sq_m', 'acres', 'cents', 'grounds', 'hectares')),
  client_reference text check (client_reference is null or char_length(client_reference) <= 160),
  start_date       date,
  completion_date  date,
  project_status   text not null default 'planning'
                     check (project_status in ('planning', 'in_progress', 'completed')),
  is_published     boolean not null default false,
  published_at     timestamptz,
  cover_image_id   uuid,
  sort_order       integer not null default 0,
  created_by       uuid references auth.users (id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint projects_dates_ok check (
    start_date is null or completion_date is null or completion_date >= start_date
  )
);

create index projects_public_idx on public.projects (is_published, category, sort_order, created_at desc);
create index projects_updated_idx on public.projects (updated_at desc);

alter table public.projects enable row level security;

create policy "projects: public reads published, admins read all"
  on public.projects for select
  to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy "projects: admins insert"
  on public.projects for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "projects: admins update"
  on public.projects for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "projects: admins delete"
  on public.projects for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- project_images
-- ---------------------------------------------------------------------------
create table public.project_images (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  storage_path text not null unique check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(webp|jpg|jpeg|png)$'),
  phase        text not null default 'during' check (phase in ('before', 'during', 'after')),
  caption      text check (caption is null or char_length(caption) <= 300),
  taken_on     date,
  sort_order   integer not null default 0,
  width        integer check (width is null or width > 0),
  height       integer check (height is null or height > 0),
  size_bytes   integer check (size_bytes is null or size_bytes > 0),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  -- the folder must be the owning project's id
  constraint project_images_path_matches_project check (split_part(storage_path, '/', 1) = project_id::text)
);

create index project_images_project_idx on public.project_images (project_id, phase, sort_order);

alter table public.project_images enable row level security;

create policy "project_images: public reads images of published projects"
  on public.project_images for select
  to anon, authenticated
  using (
    (select public.is_admin())
    or exists (
      select 1 from public.projects p
      where p.id = project_images.project_id and p.is_published
    )
  );

create policy "project_images: admins insert"
  on public.project_images for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "project_images: admins update"
  on public.project_images for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "project_images: admins delete"
  on public.project_images for delete
  to authenticated
  using ((select public.is_admin()));

-- Cover image must exist and belong to the same project.
alter table public.projects
  add constraint projects_cover_fk foreign key (cover_image_id)
  references public.project_images (id) on delete set null;

create index projects_cover_idx on public.projects (cover_image_id);

create or replace function public.check_cover_belongs_to_project()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cover_image_id is not null and not exists (
    select 1 from public.project_images pi
    where pi.id = new.cover_image_id and pi.project_id = new.id
  ) then
    raise exception 'Cover image must belong to this project';
  end if;
  return new;
end;
$$;

create trigger projects_cover_check
  before insert or update of cover_image_id on public.projects
  for each row execute function public.check_cover_belongs_to_project();

-- ---------------------------------------------------------------------------
-- Timestamps & publish bookkeeping
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

create trigger project_images_touch before update on public.project_images
  for each row execute function public.touch_updated_at();

create or replace function public.set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_published and (tg_op = 'INSERT' or not old.is_published) then
    new.published_at := now();
  elsif not new.is_published then
    new.published_at := null;
  end if;
  return new;
end;
$$;

create trigger projects_published_at before insert or update of is_published on public.projects
  for each row execute function public.set_published_at();

-- Image edits should bump the parent project's updated_at (keeps "recent" lists honest).
create or replace function public.touch_parent_project()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.projects set updated_at = now()
  where id = coalesce(new.project_id, old.project_id);
  return null;
end;
$$;

create trigger project_images_touch_parent
  after insert or update or delete on public.project_images
  for each row execute function public.touch_parent_project();

-- ---------------------------------------------------------------------------
-- Storage: private bucket, images served to the public via signed URLs only
-- when the owning project is published.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-images',
  'project-images',
  false,
  10485760, -- 10 MB per (already compressed) file
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "project-images: read published or admin"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'project-images'
    and (
      (select public.is_admin())
      or exists (
        select 1
        from public.project_images pi
        join public.projects p on p.id = pi.project_id
        where pi.storage_path = storage.objects.name
          and p.is_published
      )
    )
  );

create policy "project-images: admins upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-images' and (select public.is_admin()));

create policy "project-images: admins update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'project-images' and (select public.is_admin()))
  with check (bucket_id = 'project-images' and (select public.is_admin()));

create policy "project-images: admins delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'project-images' and (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Maintenance helper: storage files with no matching project_images row
-- (e.g. an upload that succeeded but whose save failed). Admin-only.
-- ---------------------------------------------------------------------------
create or replace function public.orphaned_project_images()
returns table (name text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select o.name, o.created_at
  from storage.objects o
  where o.bucket_id = 'project-images'
    and public.is_admin()
    and not exists (select 1 from public.project_images pi where pi.storage_path = o.name)
  order by o.created_at;
$$;

revoke all on function public.orphaned_project_images() from public, anon;
grant execute on function public.orphaned_project_images() to authenticated;
