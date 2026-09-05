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
7. Revisar el diff, resolver observaciones y esperar que los controles
   automáticos del último commit terminen correctamente.
8. Integrar mediante squash merge, con título Conventional Commit, y eliminar
   la rama terminada. Actualizar la copia local de `master` antes de continuar.

`master` es la única rama de integración de este flujo. No se hace push directo,
force-push ni eliminación de `master`. La existencia de una rama `develop`
antigua no obliga a usarla como destino intermedio.

Si una tarea depende de otra, comenzar desde `master` una vez integrado el PR
anterior. Si es necesario trabajar antes, abrir un PR en borrador con la
dependencia indicada y actualizar su base y diff antes de pedir revisión.

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
npm test
npm run build
```

GitHub Actions repetirá estas validaciones. Si alguna falla, el PR no está listo
para integrarse.

Las pruebas unitarias se escriben junto al módulo en archivos `*.test.ts`
(o `*.test.tsx` cuando corresponda), importando `describe`, `it` y `expect`
desde `vitest`. Se ejecutan en Node y admiten el alias `@/`. Usar datos
sintéticos y fechas explícitas; no requieren Supabase ni variables de entorno.
`npm run test:watch` permite repetirlas al editar. Node 24 es el entorno de CI.

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

Los PRs en borrador o con controles fallidos no se integran. En cambios de
comportamiento se incluyen pruebas de regresión; los cambios exclusivamente de
documentación no necesitan tests nuevos. Una corrección urgente sigue el mismo
flujo, con un alcance menor.

## Protección de la rama principal

Un administrador debe verificar en GitHub que `master` exija Pull Request y los
controles del workflow de CI (`Typecheck and build`, más los que se incorporen),
y que bloquee force-push y eliminación. Los nombres requeridos deben coincidir
con los checks publicados por GitHub Actions. Con más de un colaborador,
requerir además una aprobación ajena al autor.

Esta política escrita no activa la protección por sí sola. Su configuración
queda registrada como pendiente en `ROADMAP.md` hasta verificarla en GitHub.

## Versiones y recuperación

- Los commits y PRs identifican cada cambio; las versiones identifican entregas
  probadas. No se publica una versión por cada commit.
- Para una entrega, actualizar `package.json`, `package-lock.json` y
  `CHANGELOG.md` juntos en un PR de publicación. Usar `MAJOR.MINOR.PATCH`:
  parches para correcciones compatibles y versiones menores para nuevas
  capacidades. Mientras siga en `0.x`, documentar expresamente los cambios
  incompatibles e incrementar la versión menor.
- Después de integrar y comprobar el commit de entrega, crear una etiqueta
  anotada `vX.Y.Z` sobre ese commit y una GitHub Release con cambios,
  migraciones e instrucciones de actualización. No mover etiquetas publicadas.
- Si una entrega falla, volver al despliegue conocido como estable y abrir un
  PR que revierta el commit integrado con `git revert`. No reescribir el
  historial con `reset` o force-push. Verificar la reversión en CI y publicar
  un nuevo parche cuando corresponda.
- Revertir código no revierte Supabase. Cada PR con migraciones debe explicar
  el orden de aplicación, la compatibilidad con el código anterior y la
  recuperación. Corregir el esquema mediante una migración nueva; verificar
  backup y restauración antes de transformar datos existentes.

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
