-- Teléfono del cliente en encargos.

alter table public.encargos
  add column if not exists telefono text not null default '';
