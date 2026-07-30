# geriatrIA — Estado actual (demo)

**Fecha:** 27/07/2026
**URL en vivo:** https://geriatria-demo.vercel.app
**Repo local:** `S:\DEV\geriatrIA`

Este documento resume, en criollo, qué hace la app hoy. Es un **demo funcional**
para mostrarle al dueño del geriátrico piloto — no es la Fase 1 completa del
plan (esa son 16 semanas; esto se armó en una sesión para tener algo concreto
que mostrar). Corre contra una base de datos Supabase real, no hay datos
inventados en pantalla ni mocks: lo que se ve es lo que hay en la base.

---

## Qué se puede hacer hoy

### 1. Login
Entrás con email y contraseña. Hay usuarios de prueba para los tres roles
principales (dueño, enfermería, cuidador) — el botón de login trae accesos
rápidos para no tener que tipear.

### 2. "Tomas de mi turno" — la pantalla central
Es la que reemplaza la planilla de papel. Muestra las tomas de medicación de
**hoy**, agrupadas por horario y por residente, con el estado bien visible de
un vistazo:

- 🟢 a tiempo / administrada
- 🟡 atrasada
- 🔴 vencida
- ⚪ omitida
- 🟠 rechazada

Registrar una toma son **3 toques**: tocar la toma → confirmar "Administrada",
o elegir "Rechazó" y un motivo de una lista corta (no hay que escribir nada).
Una vez registrada, el cuidador **no puede editarla ni borrarla** — si hay que
corregir algo, lo hace enfermería con una anotación aparte, nunca reescribiendo
el historial.

### 3. Residentes
Alta, listado y edición de residentes: nombre, habitación asignada, datos
básicos. Esto lo ve y lo usa el dueño/administración, no el personal de piso.

### 4. Dashboard del dueño
Tres números, una sola pantalla:
- Camas ocupadas / libres
- % de tomas cumplidas en los últimos 7 días
- Tomas omitidas hoy

---

## Los datos de la demo

Hay un geriátrico de prueba ("Residencia Los Aromos") con 8 residentes,
un vademécum de 8 medicamentos reales (enalapril, metformina, losartán, etc.),
prescripciones con horarios, y las tomas de **hoy** ya cargadas con estados
variados — para que al entrar se vea una jornada real en curso, no una pantalla
vacía.

Credenciales (todas con contraseña `Demo1234!`):

| Usuario | Rol | Qué ve |
|---|---|---|
| `owner@aromos.demo` | Dueño | Todo: turno, residentes, dashboard |
| `enfermera@aromos.demo` | Enfermería | Turno + puede corregir con anotación |
| `cuidador@aromos.demo` | Cuidador | Solo turno, solo registra |

---

## Lo importante que no se ve pero está

- **Cada geriátrico está aislado del resto** en la base de datos (multi-tenant):
  aunque en el futuro haya 50 clientes en el mismo sistema, ninguno puede ver
  datos de otro. Esto está probado con un test automático, no es solo una
  promesa.
- **Nadie puede editar o borrar un registro de medicación ya hecho**, ni
  siquiera manipulando la base directamente — la regla vive en la base de
  datos, no solo en la pantalla. Esto importa para inspecciones y para
  historia clínica.
- **Queda registro de quién hizo cada cosa y cuándo**, automáticamente (auditoría),
  sin que nadie tenga que acordarse de anotarlo.

---

## Qué falta para que esto sea el producto real (Fase 1 completa)

Comparado con el plan original, esta demo **no incluye todavía**:

- Uso desde el celular como app instalada (PWA) y que funcione con mala señal
  dentro del edificio (cola de escritura offline).
- Generación automática de las tomas de cada día (hoy se cargan a mano al
  sembrar datos; falta el job programado).
- Alertas automáticas de toma vencida.
- Historial de un residente exportable a PDF para inspección.
- Signos vitales, cuidados (higiene, movilización), y todo lo de facturación —
  eso ya estaba planeado para después de la Fase 1.
- Alta de usuarios por invitación (hoy se crean a mano).

Nada de esto es sorpresa: es exactamente lo que dice el plan que viene después
de tener la base funcionando. La idea de esta demo es validar que el flujo
central — cargar residentes y registrar medicación sin papel — funciona y se
entiende, antes de invertir las semanas que faltan.
