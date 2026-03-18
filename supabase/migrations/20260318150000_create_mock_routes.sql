create table if not exists public.mock_routes (
  id text primary key,
  name text not null,
  enabled boolean not null default true,
  method text not null,
  path_pattern text not null,
  status integer not null default 200,
  delay_ms integer not null default 0,
  response_headers jsonb not null default '{}'::jsonb,
  response_body text not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mock_routes_created_at_idx
  on public.mock_routes (created_at desc);

create index if not exists mock_routes_method_idx
  on public.mock_routes (method);

create index if not exists mock_routes_path_pattern_idx
  on public.mock_routes (path_pattern);

drop trigger if exists set_mock_routes_updated_at on public.mock_routes;

create or replace function public.set_mock_routes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_mock_routes_updated_at
before update on public.mock_routes
for each row
execute function public.set_mock_routes_updated_at();

alter table public.mock_routes enable row level security;

drop policy if exists "Public read mock routes" on public.mock_routes;
create policy "Public read mock routes"
on public.mock_routes
for select
to anon, authenticated
using (true);

drop policy if exists "Public insert mock routes" on public.mock_routes;
create policy "Public insert mock routes"
on public.mock_routes
for insert
to anon, authenticated
with check (true);

drop policy if exists "Public update mock routes" on public.mock_routes;
create policy "Public update mock routes"
on public.mock_routes
for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Public delete mock routes" on public.mock_routes;
create policy "Public delete mock routes"
on public.mock_routes
for delete
to anon, authenticated
using (true);
