# Entrevistas de Admisión

Este documento define el diseño funcional y técnico del módulo de **Entrevistas de Admisión**, correspondiente a la **Fase 12 del ROADMAP**.

---

## 1. El Circuito de Admisión

En una residencia geriátrica, el circuito de ingreso de una persona se compone de:

```text
consulta web/telefónica ──> visita presencial ──> entrevista interdisciplinaria ──> ingreso
     (Admisión)                (Admisión)                  (Entrevistas)           (Residentes)
```

1. **Consulta inicial**: La familia contacta a la residencia y se agenda una visita institucional.
2. **Entrevista de admisión**: Encuentro presencial o evaluación del postulante y su entorno familiar por parte del equipo interdisciplinario (dirección médica, psicología, trabajo social, enfermería y administración).
3. **Dictamen**: Se determina si la residencia cuenta con la infraestructura y capacidad de cuidados adecuada para las necesidades del postulante.
4. **Ingreso**: Si el dictamen es favorable (`apto` o `apto_con_observaciones`), se procede al alta formal en el módulo de Residentes.

---

## 2. Dimensiones de la Evaluación

La entrevista evalúa cuatro dimensiones fundamentales para el bienestar del adulto mayor:

### A. Autonomía y Movilidad (`mobility_assessment`)

- `autovalido`: Se desplaza y realiza actividades básicas sin asistencia.
- `semidependiente`: Requiere asistencia parcial o dispositivos de apoyo (bastón, andador).
- `dependiente_total`: Requiere asistencia permanente o silla de ruedas/cama.

### B. Estado Cognitivo y Psicosocial (`cognitive_assessment`)

- `lucido`: Orientado témporo-espacialmente, sin signos de deterioro cognitivo.
- `deterioro_leve`: Olvidos esporádicos o fallas atencionales leves.
- `deterioro_moderado`: Desorientación frecuente, requiere supervisión en la vida cotidiana.
- `demencia_avanzada`: Deterioro severo, demencia/Alzheimer avanzado o trastornos conductuales.

### C. Antecedentes Médicos y Cuidados Clínicos (`medical_notes`)

- Diagnósticos preexistentes, medicación crónica, necesidad de oxígeno, sonda o dietas especiales.

### D. Red Familiar y Aspecto Social (`social_notes`)

- Vínculo con acompañantes, dinámica familiar, motivo de solicitud de residencia y expectativas de la familia.

---

## 3. Estados y Dictamen de la Entrevista

### Estados de la Entrevista (`status`)

- `scheduled`: Entrevista programada con fecha asignada.
- `completed`: Entrevista realizada y evaluada.
- `cancelled`: Entrevista suspendida o no realizada.

### Dictamen de Aptitud (`conclusion`)

- `pendiente`: En evaluación o a la espera de informes médicos adicionales.
- `apto`: Apto para ingreso residencial estándar.
- `apto_con_observaciones`: Apto con requerimientos especiales especificados (ej: acompañamiento terapéutico, dieta adaptada).
- `no_apto`: Excede el perfil asistencial de la residencia (ej: cuadros psiquiátricos agudos que requieren internación monovalente). **Requiere motivo obligatorio (`rejection_reason`).**

---

## 4. Esquema de Base de Datos (`interviews`)

```sql
create table public.interviews (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid references public.consulta(id) on delete set null,
  candidate_name text not null check (length(trim(candidate_name)) > 0),
  candidate_dni text,
  candidate_birth_date date,
  companion_name text,
  companion_phone text,
  companion_relationship text,
  interview_date date not null,
  interviewer_employee_id uuid references public.employees(id),
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  mobility_assessment text check (mobility_assessment in ('autovalido', 'semidependiente', 'dependiente_total')),
  cognitive_assessment text check (cognitive_assessment in ('lucido', 'deterioro_leve', 'deterioro_moderado', 'demencia_avanzada')),
  medical_notes text,
  social_notes text,
  conclusion text not null default 'pendiente' check (conclusion in ('pendiente', 'apto', 'apto_con_observaciones', 'no_apto')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_by uuid references auth.users(id),
  constraint interviews_rejection_reason_check check (conclusion <> 'no_apto' or (rejection_reason is not null and length(trim(rejection_reason)) > 0))
);
```

---

## 5. Permisos y Seguridad (RLS)

- **Lectura y escritura:** Exclusivas para usuarios autenticados con permiso `administration` (rol `admin`), en concordancia con `src/lib/permisos.ts` y `src/lib/auth.test.ts`.
- Las mutaciones se realizan mediante Server Actions protegidas con `requerirSesion("administration")` y RPC transaccional `save_interview`.

## 6. Cambios de estado y edición concurrente

`transition_interview` permite completar o cancelar una entrevista programada.
Exige Administrador habilitado y la versión `updated_at` de la pantalla; bloquea
la fila y rechaza estados o versiones desactualizados. Conserva la evaluación,
actualiza autor/fecha y mantiene cerrada la escritura directa sobre la tabla.
`save_interview` también exige versión al editar, para que un formulario viejo
no revierta una acción rápida. El formulario conserva sus estados permitidos;
no se agregan restricciones clínicas ni se cambia el circuito de ingreso.

Los botones muestran éxito, falta de permiso, conflicto o error de conexión.
Ante resultado incierto, recargar antes de reintentar. No se reenvía automáticamente.
Los campos se reinician con los datos del servidor cuando cambia la versión,
evitando mezclar campos viejos con una versión nueva.

Aplicar `20260922000000_interview_transitions.sql` antes del despliegue. Las altas
anteriores siguen siendo compatibles; los clientes anteriores no pueden editar
sin versión, por lo que hay que recargar las pantallas después de desplegar.
La migración no modifica entrevistas existentes. Los tipos se generan en CI;
las pruebas SQL y de carreras usan exclusivamente datos ficticios.

Desde `20260924000000_creation_retries_labor.sql`, cada alta envía un
`request_id` estable mientras el formulario está abierto. Repetir el mismo
envío devuelve la misma entrevista sin duplicarla; reutilizar ese ID con datos
distintos se rechaza. Tras un alta confirmada, el formulario impide volver a
enviarla. La migración debe coordinarse con la nueva interfaz, pues los clientes
anteriores no envían ese identificador.

Desde `20260925000000_shifts_interviews_audit.sql`, las altas, evaluaciones,
dictámenes y transiciones conservan antes/después y autor en Auditoría. La
captura empieza con la migración; no reconstruye cambios anteriores.
