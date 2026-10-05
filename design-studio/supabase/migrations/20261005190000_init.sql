-- Design Studio initial schema START

-- Private schema for helpers that must not be exposed through the Data API
create schema if not exists private;

-- Enums START
create type public.project_status as enum ('active', 'paused', 'closed');
create type public.project_phase as enum ('sitemap', 'design', 'staging');
create type public.page_type as enum ('static', 'cms', 'landing', 'utility');
create type public.page_status as enum ('draft', 'review', 'approved');
create type public.section_kind as enum ('static', 'cms', 'component');
create type public.history_field as enum ('title', 'subtitle', 'items', 'buttons');
create type public.author_role as enum ('admin', 'client');
-- Enums END

-- Helpers START
-- Keeps updated_at current on every row update
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Admin check reads app_metadata (not user editable), set only from the dashboard or service role
create or replace function private.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
-- Helpers END

-- Tables START
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  company text not null check (char_length(company) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  status public.project_status not null default 'active',
  phase public.project_phase not null default 'sitemap',
  locked boolean not null default false,
  figma_url text check (char_length(figma_url) <= 2000),
  staging_url text check (char_length(staging_url) <= 2000),
  language text not null default 'en' check (char_length(language) between 2 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  token text not null unique check (char_length(token) >= 12),
  show_why boolean not null default false,
  opens integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  slug text not null check (char_length(slug) <= 200),
  type public.page_type not null default 'static',
  status public.page_status not null default 'draft',
  goal text check (char_length(goal) <= 2000),
  approved_by text check (char_length(approved_by) <= 120),
  approved_at timestamptz,
  position numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sections (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  kind public.section_kind not null default 'static',
  title text check (char_length(title) <= 1000),
  subtitle text check (char_length(subtitle) <= 3000),
  items text[] not null default '{}',
  buttons text[] not null default '{}',
  why text check (char_length(why) <= 2000),
  position numeric not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.section_history (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.sections (id) on delete cascade,
  field public.history_field not null,
  item_index integer,
  old_value text,
  new_value text,
  author_name text not null check (char_length(author_name) between 1 and 120),
  author_role public.author_role not null,
  seen boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  page_id uuid not null references public.pages (id) on delete cascade,
  section_id uuid references public.sections (id) on delete cascade,
  parent_id uuid references public.comments (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 120),
  author_role public.author_role not null,
  body text not null check (char_length(body) between 1 and 5000),
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Tables END

-- Indexes START
create index projects_client_id_idx on public.projects (client_id);
create index projects_status_idx on public.projects (status);
create index project_links_project_id_idx on public.project_links (project_id);
-- Only one active link per project, "Create new link" deactivates the old one
create unique index project_links_one_active_idx on public.project_links (project_id) where active;
create index pages_project_position_idx on public.pages (project_id, position);
create index sections_page_position_idx on public.sections (page_id, position);
create index section_history_section_id_idx on public.section_history (section_id);
create index section_history_unseen_idx on public.section_history (section_id) where not seen;
create index comments_project_id_idx on public.comments (project_id);
create index comments_page_id_idx on public.comments (page_id);
create index comments_section_id_idx on public.comments (section_id);
create index comments_parent_id_idx on public.comments (parent_id);
-- Indexes END

-- updated_at triggers START
create trigger set_updated_at before update on public.clients
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.projects
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.project_links
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.pages
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.sections
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.section_history
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.comments
  for each row execute function private.set_updated_at();
create trigger set_updated_at before update on public.templates
  for each row execute function private.set_updated_at();
-- updated_at triggers END

-- RLS START
-- Admin (app_metadata.role = 'admin') has full access. Anon has no table access at all:
-- client link visitors reach data only through server code that validates the token.
do $$
declare
  t text;
begin
  foreach t in array array[
    'clients', 'projects', 'project_links', 'pages', 'sections',
    'section_history', 'comments', 'templates'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format(
      'create policy "Admin full access" on public.%I for all to authenticated
         using ((select private.is_admin())) with check ((select private.is_admin()))',
      t
    );
  end loop;
end;
$$;
-- RLS END

-- Realtime START
alter publication supabase_realtime add table
  public.comments, public.sections, public.pages, public.section_history;
-- Realtime END

-- Design Studio initial schema END
