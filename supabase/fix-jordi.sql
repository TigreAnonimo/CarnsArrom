-- Renombrar Jordy → Jordi en login y registros.
-- Pegar en el SQL Editor de Supabase y pulsar Run.

update public.trabajadores
set nombre = 'Jordi'
where nombre = 'Jordy';

update public.encargos set persona = 'Jordi' where persona = 'Jordy';
update public.inventario set persona = 'Jordi' where persona = 'Jordy';
update public.productos set persona = 'Jordi' where persona = 'Jordy';
update public.neveras set persona = 'Jordi' where persona = 'Jordy';
update public.actividad set persona = 'Jordi' where persona = 'Jordy';
