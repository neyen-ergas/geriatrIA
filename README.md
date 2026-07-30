# geriatrIA

Sistema de gestión para residencias geriátricas.

Stack: **Next.js 15** (App Router) · TypeScript · Tailwind CSS v4 · componentes
estilo shadcn/ui.

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
```

---

## Estado actual

Proyecto reiniciado desde cero. Por ahora solo existe la navegación (sidebar)
con seis secciones, cada una como lienzo en blanco a desarrollar:

- Inicio
- Residentes
- Empleados
- Turnos
- Contabilidad
- Entrevistas

No hay backend ni base de datos conectada todavía.
