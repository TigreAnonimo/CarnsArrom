-- Números de encargo POR DÍA de recogida: cada día #1, #2, #3…
-- Si se borra un encargo, ese número se reutiliza. Otro día vuelve a empezar en 1.
-- Pegar en el SQL Editor de Supabase y pulsar Run.

alter table public.encargos alter column numero drop default;

alter table public.encargos drop constraint if exists encargos_numero_key;

update public.encargos
set numero = numero + 1000000;

update public.encargos e
set numero = r.n
from (
  select id, row_number() over (partition by dia order by created_at, id) as n
  from public.encargos
) r
where e.id = r.id;

alter table public.encargos drop constraint if exists encargos_dia_numero_key;
alter table public.encargos
  add constraint encargos_dia_numero_key unique (dia, numero);

create or replace function public.siguiente_numero_encargo(p_dia date, p_except uuid default null)
returns integer
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select s.n
      from generate_series(
        1,
        greatest(
          coalesce(
            (
              select max(e.numero)
              from public.encargos e
              where e.dia = p_dia
                and (p_except is null or e.id <> p_except)
            ),
            0
          ),
          0
        ) + 1
      ) as s(n)
      where not exists (
        select 1
        from public.encargos e
        where e.dia = p_dia
          and e.numero = s.n
          and (p_except is null or e.id <> p_except)
      )
      order by s.n
      limit 1
    ),
    1
  );
$$;

create or replace function public.encargos_asignar_numero()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.numero := public.siguiente_numero_encargo(new.dia);
  elsif tg_op = 'UPDATE' and new.dia is distinct from old.dia then
    new.numero := public.siguiente_numero_encargo(new.dia, new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists encargos_asignar_numero on public.encargos;
create trigger encargos_asignar_numero
  before insert or update of dia on public.encargos
  for each row
  execute function public.encargos_asignar_numero();

grant execute on function public.siguiente_numero_encargo(date, uuid) to anon, authenticated;
