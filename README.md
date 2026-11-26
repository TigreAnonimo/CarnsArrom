# Carns Arrom — Gestión Interna

Aplicación para el día a día de la carnicería: inventario de cámara, encargos de clientes y temperaturas de las 7 neveras. Los datos se guardan online (Supabase) y se ven igual en el ordenador y en el móvil.

Trabajadores: **Jesús, Jordi, Jony, Joel, Mónica, Chema y Sonia**.

---

## Cómo entrar

1. Abre la web (en local: `http://127.0.0.1:5173`, o la URL de Vercel).
2. Toca **tu nombre**.
3. Escribe tu **PIN** (4 a 8 números).
4. Pulsa **Entrar**.

PIN inicial de todos (cámbialo en cuanto puedas): **2026**.

Para salir: botón **Salir** arriba a la derecha.

Para cambiar tu PIN: botón **PIN** (junto a tu nombre) → PIN actual → PIN nuevo → repetir → **Guardar**.

---

## Quién ve qué

**Todos** pueden:

- Inventario (conteos, stock, agotados)
- Encargos (crear, cambiar estado, buscar)
- Neveras (registrar y ver historial)
- Cambiar su propio PIN

**Solo administradores** (ahora Jesús) ven **Base de datos**: historial completo, exportaciones, copias de seguridad y el equipo.

En **Base de datos → Equipo** el admin puede:

- Marcar **Hacer admin** / **Quitar admin**
- Cambiar el PIN de otra persona
- Añadir trabajadores

Tiene que quedar al menos un administrador.

---

## Inventario

- **Stock:** cantidad actual de cada producto.
- **Nuevo conteo:** fecha, producto, cantidad y observaciones. Queda a nombre de quien ha iniciado sesión. Si el producto ya existe, se actualiza el stock y se guarda el historial.
- **Agotados:** marcar sin stock y **Reactivar** cuando vuelva mercancía.
- **Historial:** todos los conteos anteriores, con fecha y trabajador.
- **Modificar** actualiza el stock. **Eliminar** (solo admin) quita el producto del stock; el historial se conserva.

---

## Encargos

El **número es por día de recogida**: cada fecha #1, #2, #3… Otro día vuelve a empezar en #1. Si se borra un encargo, ese número se reutiliza. El mismo número no se repite en el mismo día.

Al crear verás el **número de ese día**. También se apunta el **nombre y teléfono del cliente**, las cosas pedidas **una por línea** (producto + cantidad), día de recogida, quién lo registra, observaciones y estado inicial (Pendiente o Preparado). **Entregado** no borra el pedido: pasa a la pestaña Entregados.

Estados:

- **Pendiente**
- **Preparado**
- **Entregado**

Los de **hoy** salen primero y los **pendientes** arriba. Se puede buscar, filtrar por estado y por fecha.

**Actualizar** un encargo no lo borra: cambia ese mismo pedido. Solo desaparece con **Eliminar** y confirmar.

---

## Neveras

Se registran las 7 temperaturas, con trabajador, fecha y hora.

- Una sola revisión por día. Si ya existe, al guardar **se modifica**, no se duplica.
- Alerta si una nevera supera **5,0 °C**. Ejemplo: `7/7 OK` o `6/7 OK — 1 alerta`.
- Temperaturas válidas: entre −30 °C y 15 °C.
- El historial se ve en tarjetas o en tabla. Eliminar una revisión: solo admin.

---

## Base de datos (solo admin)

Pestañas: Equipo, Neveras, Inventario, Encargos, Actividad.

Filtros por mes, trabajador, fecha, producto o estado. Se puede exportar a **Excel** o **PDF** respetando los filtros.

**Copia de seguridad:** descarga un JSON con todos los datos. **Restaurar JSON** vuelve a cargar esa copia. Eso no sustituye el backup de Supabase, pero sirve para archivo interno.

---

## Arranque en un ordenador (desarrollo)

1. Proyecto en [Supabase](https://supabase.com).
2. SQL Editor: ejecutar `supabase/schema.sql`.
3. Si el login falla, ejecutar también `supabase/fix-login.sql`.
4. Si los números de encargo no empiezan en 1, ejecutar `supabase/fix-numeros-encargo.sql`.
5. Copiar `.env.example` a `.env`:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

6. Arrancar:

```bash
npm install
npm run dev
```

No subas al repositorio el archivo `.env` ni la clave `service_role` / `SECRET_KEY`. En el frontend solo va la clave **anon** o **publishable**.

---

## Publicar en Vercel

1. Sube el código a GitHub.
2. En Vercel: **Add New → Project** e importa el repositorio.
3. Framework: **Vite**.
4. Variables de entorno (las mismas que en `.env`):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **Deploy** y abre la URL. En el móvil se puede instalar como app (PWA) desde el navegador.

Los datos son los de Supabase: un encargo creado en el móvil aparece en el ordenador, y al actualizar no se borra.
