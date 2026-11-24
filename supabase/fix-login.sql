-- Pegar en el SQL Editor de Supabase y pulsar Run.
-- Corrige el login (crypt está en el esquema extensions).

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

grant execute on function public.set_trabajador_pin(uuid, text) to anon, authenticated;

update public.trabajadores
set pin_hash = crypt('2026', gen_salt('bf'));
