# Changelog

Todos los cambios relevantes de este proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

### Agregado
- Navegación con `sidebar` y `topbar`.
- Helper de control de roles (`src/lib/roles.ts`).
- Icono de la app (`src/app/icon.tsx`).
- Repositorio publicado en GitHub (privado).

### Cambiado
- Ajustes de layout y estilos en dashboard, residentes, login y globals.css.

### Seguridad
- Se dejó de trackear `.env.local` en git (claves públicas de Supabase protegidas
  por RLS, no debían vivir en el repo) y se agregó `.env*.local` al `.gitignore`.

## [0.1.0] - 2026-07-27

### Agregado
- Demo funcional inicial: eMAR (registro electrónico de administración de
  medicación) con RLS por rol, pantalla de "tomas del turno" y dashboard
  del dueño. Ver `ESTADO-ACTUAL.md` para el detalle completo de qué hace
  la app en esta versión.
- `.gitignore` para ignorar `dev.log`.
