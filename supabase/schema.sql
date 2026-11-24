-- Carns Arrom — esquema inicial
-- Pegar en el SQL Editor de Supabase (una vez).
-- PIN inicial de todos los trabajadores: 2026  (cámbialo después desde Equipo).

create extension if not exists pgcrypto;

create table if not exists public.trabajadores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  pin_hash text not null,
  es_admin boolean not null default false,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  cantidad text not null,
  estado text not null check (estado in ('En almacén', 'Agotado')),
  fecha date not null,
  persona text not null,
  obs text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventario (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid references public.productos(id) on delete set null,
  fecha date not null,
  producto text not null,
  cantidad text not null,
  persona text not null,
  obs text not null default '',
  estado text not null check (estado in ('En almacén', 'Agotado')),
  created_at timestamptz not null default now()
);

create sequence if not exists public.encargos_numero_seq start with 1 increment by 1;

create table if not exists public.encargos (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique default nextval('public.encargos_numero_seq'),
  producto text not null,
  cantidad text not null,
  persona text not null,
  dia date not null,
  obs text not null default '',
  estado text not null check (estado in ('Pendiente', 'Preparado', 'Entregado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.neveras (
  id uuid primary key default gen_random_uuid(),
  fecha date not null unique,
  persona text not null,
  temps numeric(4,1)[7] not null,
  hora time not null default current_time,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint neveras_temps_len check (array_length(temps, 1) = 7)
);

create table if not exists public.actividad (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  persona text not null,
  tipo text not null,
  descripcion text not null,
  entidad text,
  entidad_id text
);

alter table public.trabajadores enable row level security;
alter table public.productos enable row level security;
alter table public.inventario enable row level security;
alter table public.encargos enable row level security;
alter table public.neveras enable row level security;
alter table public.actividad enable row level security;

drop policy if exists trabajadores_select on public.trabajadores;
create policy trabajadores_select on public.trabajadores
  for select to anon, authenticated using (true);

drop policy if exists trabajadores_insert on public.trabajadores;
create policy trabajadores_insert on public.trabajadores
  for insert to anon, authenticated with check (true);

drop policy if exists trabajadores_update on public.trabajadores;
create policy trabajadores_update on public.trabajadores
  for update to anon, authenticated using (true) with check (true);

drop policy if exists trabajadores_delete on public.trabajadores;
create policy trabajadores_delete on public.trabajadores
  for delete to anon, authenticated using (true);

revoke all on public.trabajadores from anon, authenticated;
grant select (id, nombre, es_admin, activo, created_at) on public.trabajadores to anon, authenticated;
grant insert (nombre, pin_hash, es_admin, activo) on public.trabajadores to anon, authenticated;
grant update (nombre, es_admin, activo) on public.trabajadores to anon, authenticated;
grant delete on public.trabajadores to anon, authenticated;

drop policy if exists productos_all on public.productos;
create policy productos_all on public.productos
  for all to anon, authenticated using (true) with check (true);

drop policy if exists inventario_all on public.inventario;
create policy inventario_all on public.inventario
  for all to anon, authenticated using (true) with check (true);

drop policy if exists encargos_all on public.encargos;
create policy encargos_all on public.encargos
  for all to anon, authenticated using (true) with check (true);

drop policy if exists neveras_all on public.neveras;
create policy neveras_all on public.neveras
  for all to anon, authenticated using (true) with check (true);

drop policy if exists actividad_all on public.actividad;
create policy actividad_all on public.actividad
  for all to anon, authenticated using (true) with check (true);

create or replace function public.login_trabajador(p_nombre text, p_pin text)
returns table (id uuid, nombre text, es_admin boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select t.id, t.nombre, t.es_admin
  from public.trabajadores t
  where t.nombre = p_nombre
    and t.activo = true
    and t.pin_hash = crypt(p_pin, t.pin_hash);
end;
$$;

revoke all on function public.login_trabajador(text, text) from public;
grant execute on function public.login_trabajador(text, text) to anon, authenticated;

create or replace function public.set_trabajador_pin(p_id uuid, p_pin text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.trabajadores
  set pin_hash = crypt(p_pin, gen_salt('bf'))
  where id = p_id;
end;
$$;

revoke all on function public.set_trabajador_pin(uuid, text) from public;
grant execute on function public.set_trabajador_pin(uuid, text) to anon, authenticated;

insert into public.trabajadores (nombre, pin_hash, es_admin)
values
  ('Jesús', crypt('2026', gen_salt('bf')), true),
  ('Jordy', crypt('2026', gen_salt('bf')), false),
  ('Jony', crypt('2026', gen_salt('bf')), false),
  ('Joel', crypt('2026', gen_salt('bf')), false),
  ('Mónica', crypt('2026', gen_salt('bf')), false),
  ('Chema', crypt('2026', gen_salt('bf')), false),
  ('Sonia', crypt('2026', gen_salt('bf')), false)
on conflict (nombre) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'productos'
  ) then
    alter publication supabase_realtime add table public.productos;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'inventario'
  ) then
    alter publication supabase_realtime add table public.inventario;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'encargos'
  ) then
    alter publication supabase_realtime add table public.encargos;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'neveras'
  ) then
    alter publication supabase_realtime add table public.neveras;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'actividad'
  ) then
    alter publication supabase_realtime add table public.actividad;
  end if;
end $$;
