# Autenticación

geriatrIA utiliza Supabase Auth con correo y contraseña. En esta primera etapa
solo existe el perfil operativo del dueño o administrador de la residencia.

## Reglas iniciales

- No hay formulario público de registro.
- Las cuentas se crean manualmente por un administrador del proyecto Supabase.
- Todas las secciones de gestión requieren una identidad verificada.
- Una persona autenticada que visita `/login` vuelve a la aplicación.
- El cierre de sesión elimina la sesión y redirige al login.
- No se toman decisiones de autorización con `getSession()`; el servidor utiliza
  `getClaims()` para validar el JWT.

## Configuración local

`supabase/config.toml` contiene:

```toml
[auth]
enable_signup = false

[auth.email]
enable_signup = false
```

Esto configura futuras instancias locales, pero no modifica automáticamente el
proyecto alojado en Supabase.

## Configuración del proyecto remoto

Después de aprobar y mergear este módulo:

1. Abrir el proyecto `geriatrIA` en Supabase Dashboard.
2. Ir a la configuración de Authentication.
3. Desactivar **Allow new users to sign up**.
4. Confirmar que los inicios de sesión anónimos estén desactivados.
5. En Authentication > Users, crear manualmente la cuenta del dueño.
6. Utilizar un correo controlado por el dueño y una contraseña única y segura.

La contraseña nunca se guarda en el repositorio, la documentación ni las
variables de entorno de la aplicación.

## Archivos principales

- `src/middleware.ts`: ejecuta la renovación de sesión en las rutas relevantes.
- `src/lib/supabase/middleware.ts`: sincroniza cookies y cabeceras privadas.
- `src/app/login/page.tsx`: formulario de acceso, sin opción de registro.
- `src/app/login/actions.ts`: inicio y cierre de sesión en el servidor.
- `src/app/(app)/layout.tsx`: protege todas las pantallas administrativas.

## Alcance pendiente

Este módulo solo comprueba que existe una identidad autenticada. Los permisos
por rol se diseñarán cuando aparezcan empleados con distintos niveles de acceso.
Las tablas de residentes tendrán RLS antes de almacenar información real.
