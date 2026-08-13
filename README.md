# geriatrIA

Sistema de gestión para residencias geriátricas. Cubre el recorrido completo de
una persona por la institución: desde la consulta que deja su familia en la web
hasta el registro de su estadía.

Lo usa el equipo de la residencia. Ni las familias ni los residentes acceden.

Stack: **Next.js 15** (App Router) · TypeScript · Tailwind CSS v4 · Supabase ·
componentes propios estilo shadcn/ui.

> **Este README describe el producto terminado.** Parte todavía no está
> construida. Lo que ya funciona y lo que falta está marcado en
> [Estado](#estado); el orden de trabajo, en [ROADMAP.md](ROADMAP.md).

---

## El recorrido

```text
consulta de una familia ──> visita presencial ──> ingreso ──> estadía ──> baja
     Admisión                   Admisión          Residentes  Contabilidad  Residentes
                                                                Turnos
```

Una familia deja sus datos en la web de la residencia. Eso abre una consulta en
**Admisión**. El equipo llama, y si la conversación avanza, agenda la visita
presencial. Si la visita termina en un ingreso, esa consulta se convierte en un
residente con su primera estadía en **Residentes**. Desde ahí el sistema
acompaña la estadía: cuotas y pagos en **Contabilidad**, turnos del personal en
**Turnos**, documentación e indicaciones médicas en la ficha del residente.

---

## Secciones

### Inicio

Panel del día. Responde una sola pregunta: qué hay pendiente ahora. Consultas
sin llamar, visitas agendadas para hoy y mañana, cuotas vencidas e ingresos
recientes. Cada número enlaza a la pantalla donde se resuelve.

### Admisión

La bandeja de consultas que llegan desde la web de la residencia.

- Consultas ordenadas de la más reciente a la más antigua, con contadores y
  filtro por estado.
- Cinco estados que siguen el circuito real: `nueva` → `contactada` →
  `visita agendada` → `ingresó`, y `descartada` desde cualquier punto.
- Agendado de la visita presencial: día y franja. **La familia no reserva el
  turno**, solo indica cuándo le queda cómodo que la llamen. Quien conoce la
  disponibilidad de la residencia es el equipo.
- Un solo turno por día y franja, garantizado por la base de datos: si dos
  personas agendan al mismo tiempo, una recibe "ese turno ya está ocupado".
- Reprogramación y cancelación, que liberan el turno pero conservan la historia.
- Agenda semanal en grilla, para ver los huecos libres antes de llamar.
- Notas internas del equipo, que la familia nunca ve.
- Una consulta nunca se elimina: se descarta.

### Residentes

La persona y sus estadías, separadas a propósito.

- Listado de residentes activos con los datos de su ingreso vigente.
- Alta del primer ingreso en un solo formulario: datos personales, un familiar
  responsable y las condiciones administrativas. Las tres cosas se guardan en
  una única transacción: o entra todo, o no entra nada.
- Edición del residente activo, su contacto y los datos del ingreso.
- Baja con fecha y motivo. No borra nada: el ingreso pasa al historial.
- Reingreso de alguien que ya estuvo, sin duplicar su ficha ni perder la
  historia anterior.
- Un solo ingreso activo por residente al mismo tiempo, garantizado por la base.
- El estado activo se deriva de la ausencia de fecha de baja; no es una columna
  que pueda contradecir a los datos.
- Documentos como imágenes en almacenamiento privado. Un documento faltante no
  impide el ingreso: queda pendiente.
- Indicaciones médicas, medicación con dosis y horarios, alergias, movilidad,
  cuidados especiales e inventario de pertenencias.

### Contabilidad

- Una cuota por mes y por estadía. Cada reingreso lleva su propia cuenta.
- El importe se congela al crear la cuota: cambiar la cuota vigente no altera
  los períodos ya emitidos.
- Varios pagos parciales sobre una misma cuota.
- Saldo, estado y vencimiento **calculados**, nunca guardados como un dato que
  pueda quedar desactualizado.
- Los errores se corrigen anulando, no borrando: todo movimiento queda trazable.
- Comprobantes opcionales, guardados como archivos privados.

### Empleados

Personal de la residencia, sus datos laborales y su cuenta de acceso. Es la
sección que trae el modelo de roles: cada persona ve solo lo que le corresponde.

### Turnos

Grilla semanal de turnos del personal, con asignación, reasignación y cobertura
de ausencias. Sin superposiciones para un mismo empleado.

### Entrevistas

Registro de las entrevistas de admisión.

---

## Cómo funciona

**Una instalación por residencia.** Cada residencia tiene su propio proyecto de
Supabase. El código y las migraciones son idénticos; los datos, los usuarios y
las credenciales quedan separados por construcción, no por un filtro que alguien
pueda olvidarse de aplicar.

**Las reglas viven en la base de datos.** Que no haya dos visitas en el mismo
turno, que un residente no tenga dos ingresos activos, que una baja no sea
anterior al ingreso, que no existan dos cuotas vigentes del mismo período: son
restricciones de Postgres, no validaciones de formulario. Dos personas
trabajando al mismo tiempo derrotan cualquier validación hecha desde la
aplicación.

**Lo que toca varias tablas se guarda en una transacción.** Un primer ingreso
escribe en tres tablas mediante una función de Postgres: se confirman las tres o
no se confirma ninguna. Nunca queda una ficha a medio crear.

**Nada se elimina.** Una consulta se descarta, un residente se da de baja, un
pago se anula. El historial es parte del producto.

**Los datos personales no salen del servidor.** Las tablas con datos de familias
y residentes tienen seguridad a nivel de fila y no son accesibles con la clave
pública del navegador. Los documentos van a almacenamiento privado. No se usan
datos reales en pruebas.

---

## Estado

**Funcionando**

- Acceso con correo y contraseña. Sin registro público: las cuentas las crea un
  administrador desde el panel de Supabase.
- **Admisión**: bandeja con contadores y filtro, seguimiento del llamado,
  agendado y reprogramación de la visita, cierre como ingreso o descarte, y
  notas internas.
- **Residentes**: listado de activos, alta del primer ingreso, edición, baja con
  historial y reingreso.

**Base lista, sin interfaz**

- **Contabilidad**: tablas de cuotas y pagos, vista de saldos, funciones de
  escritura controladas y tipos generados. Faltan las pantallas y el bucket de
  comprobantes.

**Pendiente**

- **Inicio**, **Empleados**, **Turnos** y **Entrevistas**.
- Modelo de roles. Hoy existe un solo perfil, el del dueño, y las políticas de
  la base solo distinguen si hay sesión o no.
- Agenda semanal de visitas, y la conversión de una consulta en residente.
- Documentación e información médica del residente.

El detalle, en orden de trabajo, está en [ROADMAP.md](ROADMAP.md).

---

## Cómo correrlo

```bash
npm install
cp .env.example .env.local   # completar con los valores de la instalación
npm run dev
```

Abrir <http://localhost:3000>. Sin las variables de entorno, la aplicación falla
al leer la base.

```bash
npm run build       # build de producción; compila y typecheckea todo
npm run typecheck   # solo tsc --noEmit
npm run db:types    # regenera los tipos TypeScript desde Supabase
```

Las variables salen de la configuración de API del proyecto en Supabase:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` saltea las políticas de seguridad de la base: nunca
lleva el prefijo `NEXT_PUBLIC_` ni se importa desde código que corra en el
navegador. `.env.local` está ignorado por Git.

Detalles de vinculación de la CLI y migraciones en
[docs/supabase-configuracion.md](docs/supabase-configuracion.md).

---

## Documentación

| Documento | Qué contiene |
| --- | --- |
| [SPECS.md](SPECS.md) | Especificación técnica completa: arquitectura, modelo de datos, seguridad. |
| [ROADMAP.md](ROADMAP.md) | Qué falta construir y en qué orden. |
| [CODESTYLE.md](CODESTYLE.md) | Cómo se escribe el código. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Cómo se integra un cambio. |
| [CHANGELOG.md](CHANGELOG.md) | Qué cambió en cada versión. |

Documentación funcional por módulo:

- [Modelo de consultas del módulo de admisión](docs/admision-consultas-modelo.md)
- [Modelo inicial del módulo de residentes](docs/residentes-modelo-inicial.md)
- [Modelo inicial del módulo de pagos](docs/pagos-modelo-inicial.md)
- [Autenticación](docs/autenticacion.md)
- [Configuración de Supabase](docs/supabase-configuracion.md)
