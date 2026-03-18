create table if not exists public.mock_server_settings (
  id integer primary key default 1,
  enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.mock_server_settings (id, enabled)
values (1, false)
on conflict (id) do nothing;

drop trigger if exists set_mock_server_settings_updated_at on public.mock_server_settings;

create or replace function public.set_mock_server_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_mock_server_settings_updated_at
before update on public.mock_server_settings
for each row
execute function public.set_mock_server_settings_updated_at();

alter table public.mock_server_settings enable row level security;

drop policy if exists "Public read mock server settings" on public.mock_server_settings;
create policy "Public read mock server settings"
on public.mock_server_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Public insert mock server settings" on public.mock_server_settings;
create policy "Public insert mock server settings"
on public.mock_server_settings
for insert
to anon, authenticated
with check (true);

drop policy if exists "Public update mock server settings" on public.mock_server_settings;
create policy "Public update mock server settings"
on public.mock_server_settings
for update
to anon, authenticated
using (true)
with check (true);
