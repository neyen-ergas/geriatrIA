# Changelog

Todos los cambios relevantes de este proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

### Quitado (reinicio del proyecto)
- Se eliminó todo lo relacionado con Supabase: proyecto/base de datos remota,
  migraciones (`supabase/migrations`), cliente y middleware de conexión
  (`src/lib/supabase/`), y los scripts de test que dependían de él.
- Se sacó el login y el control de acceso por rol (`src/app/login`,
  `src/middleware.ts`, `src/lib/roles.ts`, `src/components/logout-button.tsx`).
- Se borraron todas las pantallas funcionales generadas hasta el momento
  (dashboard, residentes, turno) para arrancar de cero.

### Agregado
- Autenticación del dueño con Supabase Auth, sesiones SSR, protección de las
  pantallas administrativas y cierre de sesión.
- Configuración inicial de Supabase con cliente para navegador y servidor, CLI
  local, variables de entorno de ejemplo y guía de instalación.
- Documentación del alcance, las reglas y el modelo de datos inicial del módulo
  de residentes.
- Sidebar reducida a seis secciones fijas, cada una como lienzo en blanco:
  Inicio, Residentes, Empleados, Turnos, Contabilidad, Entrevistas.
  Todas accesibles sin login.

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
