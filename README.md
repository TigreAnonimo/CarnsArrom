# Carns Arrom — Gestión Interna

Aplicación de gestión para la carnicería: inventario de cámara, encargos de clientes y revisión diaria de las 7 neveras.

## Cómo arrancar

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en el navegador.

## Módulos

- **Inventario**: nuevo conteo, stock activo y marcado como agotado.
- **Encargos**: activos, entregados, nuevo pedido y cambio de estado.
- **Neveras**: registro de las 7 temperaturas y historial (tarjetas o tabla).
- **Base de datos**: consulta completa por mes, inventario y encargos con búsqueda.

Los datos de ejemplo se cargan al primer uso y se guardan en el navegador (`localStorage`).
