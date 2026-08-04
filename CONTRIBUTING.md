# Cómo contribuir a geriatrIA

Este proyecto avanza mediante cambios pequeños, revisables y documentados. La
rama principal debe conservarse estable.

## Flujo de trabajo

1. Partir de una copia actualizada de `master`.
2. Crear una rama para una sola tarea.
3. Implementar y documentar únicamente el alcance acordado.
4. Ejecutar las validaciones locales correspondientes.
5. Crear commits claros y subir la rama.
6. Abrir un Pull Request hacia `master`.
7. Revisar el diff y esperar que los controles automáticos terminen.
8. Integrar el PR y eliminar la rama terminada.

Los cambios realizados con asistencia automatizada pueden usar el prefijo
`agent/`. Para trabajo manual se recomiendan estos nombres:

- `feat/descripcion`: funcionalidad nueva.
- `fix/descripcion`: corrección de un error.
- `docs/descripcion`: documentación.
- `chore/descripcion`: herramientas o mantenimiento.
- `refactor/descripcion`: reorganización sin cambiar el comportamiento.

## Commits

Cada commit debe representar un cambio coherente y usar un mensaje breve:

```text
feat: agrega el alta de residentes
fix: impide registrar un DNI duplicado
docs: explica el modelo de ingresos
chore: configura la integración continua
```

Se deben evitar mensajes imprecisos como `cambios`, `arreglos` o `avance`.

## Validaciones

Antes de abrir o actualizar un Pull Request se ejecutan, según corresponda:

```bash
npm run typecheck
npm run build
```

GitHub Actions repetirá estas validaciones. Si alguna falla, el PR no está listo
para integrarse.

## Pull Requests

Cada PR debe:

- resolver una sola tarea;
- explicar qué cambia y por qué;
- indicar cómo se verificó;
- incluir capturas cuando modifica una pantalla;
- mencionar expresamente cualquier cambio en Supabase;
- actualizar la documentación y el changelog cuando corresponda;
- no contener credenciales, datos reales de residentes ni cambios accidentales.

Mientras el proyecto tenga un solo desarrollador, el PR funciona también como
una instancia de autorrevisión. Antes de integrarlo hay que leer el diff completo.

## Supabase

- Los cambios de estructura se guardan como migraciones versionadas.
- No se modifica directamente la estructura del proyecto remoto una vez que el
  flujo de migraciones está activo.
- Una migración ya aplicada no se reescribe; se crea otra que realice el cambio.
- Las tablas expuestas deben incluir Row Level Security y sus políticas.
- `.env.local`, claves privadas y credenciales nunca se agregan a Git.
- Las pruebas iniciales utilizan datos ficticios.

## Definición de terminado

Una tarea está terminada cuando cumple el alcance acordado, sus validaciones
pasan, el diff fue revisado, la documentación necesaria está actualizada y el PR
puede integrarse sin depender de cambios ocultos o manuales.
