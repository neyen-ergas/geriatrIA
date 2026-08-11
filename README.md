# geriatrIA

Sistema de gestión para residencias geriátricas.

Stack: **Next.js 15** (App Router) · TypeScript · Tailwind CSS v4 · Supabase ·
componentes estilo shadcn/ui.

---

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrir http://localhost:3000.

Otros scripts:

```bash
npm run build      # build de producción (compila y typecheckea todo)
npm run typecheck  # solo tsc --noEmit
npm run db:types   # regenera los tipos TypeScript desde Supabase
```

---

## Estado actual

El acceso requiere iniciar sesión. Las cuentas se crean a mano desde el panel de
Supabase; todavía no hay modelo de roles.

Secciones:

- **Inicio** — a desarrollar.
- **Admisión** — funcionando. Consultas que llegan desde la web de la
  residencia: bandeja con filtro por estado, agendado de la visita presencial y
  notas internas.
- **Residentes** — listado de residentes activos, alta y edición del registro
  inicial, baja con conservación del historial y reingreso sin duplicar la
  ficha personal; incluye validaciones en TypeScript.
- **Contabilidad** — esquema inicial de cuotas y pagos listo en Supabase;
  interfaz a desarrollar.
- **Empleados**, **Turnos**, **Entrevistas** — a desarrollar.

Para levantar el proyecto hay que completar `.env.local` a partir de
`.env.example`. Sin esas variables, Admisión falla al leer la base.

## Documentación funcional

- [Modelo inicial del módulo de residentes](docs/residentes-modelo-inicial.md)
- [Modelo inicial del módulo de pagos](docs/pagos-modelo-inicial.md)
- [Modelo de consultas del módulo de admisión](docs/admision-consultas-modelo.md)
- [Configuración de Supabase](docs/supabase-configuracion.md)
- [Autenticación](docs/autenticacion.md)
