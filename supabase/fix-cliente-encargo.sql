-- Nombre del cliente en encargos.
-- Pegar en el SQL Editor de Supabase y pulsar Run.

alter table public.encargos
add column if not exists cliente text not null default '';
