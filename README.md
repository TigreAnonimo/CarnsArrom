# Carns Arrom — Gestión Interna

Aplicación de inventario, encargos, neveras y actividad para la carnicería.

## Arranque local

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En el SQL Editor, ejecuta `supabase/schema.sql`.
3. Copia `.env.example` a `.env` y rellena:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

4. Instala y arranca:

```bash
npm install
npm run dev
```

PIN inicial de todos los trabajadores: **2026**. Jesús es administrador. Cámbialo en Base de datos → Equipo.

No subas la `service_role` key. Solo la anon key, junto con las políticas RLS del SQL.

## Producción (Vercel)

- Framework: Vite
- Variables: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- Repositorio: no incluir `.env`
