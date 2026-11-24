-- Numeración de encargos desde 1, automática (1, 2, 3...).
-- Pegar en el SQL Editor de Supabase y pulsar Run.

-- Evita choques de número único al renumerar
update public.encargos
set numero = numero + 100000;

update public.encargos e
set numero = o.n
from (
  select id, row_number() over (order by created_at, id) as n
  from public.encargos
) o
where e.id = o.id;

-- Si no hay encargos, el siguiente será 1. Si hay 3, el siguiente será 4.
select setval(
  'public.encargos_numero_seq',
  greatest(coalesce((select max(numero) from public.encargos), 0), 1),
  coalesce((select max(numero) from public.encargos), 0) > 0
);
