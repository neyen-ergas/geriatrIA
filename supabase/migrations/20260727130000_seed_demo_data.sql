-- Seed de datos demo (idempotente-ish: pensado para una base limpia).
-- Crea 2 organizaciones (A = demo principal, B = solo para el test de aislamiento),
-- usuarios demo directamente en auth.users (sin rate limit de signup),
-- residentes, vademécum, prescripciones y las tomas de HOY con estados variados.
--
-- Usuarios demo (password: Demo1234!):
--   owner@aromos.demo      → owner       (Org A · Los Aromos)
--   enfermera@aromos.demo  → enfermeria  (Org A)
--   cuidador@aromos.demo   → cuidador    (Org A)
--   owner@sanmartin.demo   → owner       (Org B · solo aislamiento)

do $$
declare
  v_org_a uuid; v_org_b uuid;
  v_sede_a uuid; v_sede_b uuid;
  v_owner uuid; v_enf uuid; v_cuid uuid; v_owner_b uuid;
  v_ts8 timestamptz;  v_ts12 timestamptz; v_ts16 timestamptz;
  v_ts20 timestamptz; v_ts22 timestamptz;
begin
  v_ts8  := (current_date::timestamp + time '08:00') at time zone 'America/Argentina/Buenos_Aires';
  v_ts12 := (current_date::timestamp + time '12:00') at time zone 'America/Argentina/Buenos_Aires';
  v_ts16 := (current_date::timestamp + time '16:00') at time zone 'America/Argentina/Buenos_Aires';
  v_ts20 := (current_date::timestamp + time '20:00') at time zone 'America/Argentina/Buenos_Aires';
  v_ts22 := (current_date::timestamp + time '22:00') at time zone 'America/Argentina/Buenos_Aires';

  -- ── Organizaciones y sedes ───────────────────────────────
  insert into organizacion (nombre, cuit) values ('Residencia Los Aromos', '30-71234567-9')
    returning id into v_org_a;
  insert into organizacion (nombre, cuit) values ('Residencia San Martín', '30-70987654-3')
    returning id into v_org_b;

  insert into sede (organizacion_id, nombre, direccion)
    values (v_org_a, 'Sede Central', 'Av. Rivadavia 1234, Morón, Buenos Aires')
    returning id into v_sede_a;
  insert into sede (organizacion_id, nombre, direccion)
    values (v_org_b, 'Sede Centro', 'Calle 50 nro 500, La Plata, Buenos Aires')
    returning id into v_sede_b;

  -- ── Usuarios (auth.users + identities) ───────────────────
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'owner@aromos.demo',
      extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"nombre":"Beatriz Sosa"}',
      now(), now(), '', '', '', '')
    returning id into v_owner;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'enfermera@aromos.demo',
      extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"nombre":"María López"}',
      now(), now(), '', '', '', '')
    returning id into v_enf;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'cuidador@aromos.demo',
      extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"nombre":"Jorge Díaz"}',
      now(), now(), '', '', '', '')
    returning id into v_cuid;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new)
    values ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'owner@sanmartin.demo',
      extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', '{"nombre":"Rubén Ortiz"}',
      now(), now(), '', '', '', '')
    returning id into v_owner_b;

  insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values
    (v_owner::text,   v_owner,   jsonb_build_object('sub', v_owner::text,   'email', 'owner@aromos.demo',     'email_verified', true), 'email', now(), now(), now()),
    (v_enf::text,     v_enf,     jsonb_build_object('sub', v_enf::text,     'email', 'enfermera@aromos.demo',  'email_verified', true), 'email', now(), now(), now()),
    (v_cuid::text,    v_cuid,    jsonb_build_object('sub', v_cuid::text,    'email', 'cuidador@aromos.demo',   'email_verified', true), 'email', now(), now(), now()),
    (v_owner_b::text, v_owner_b, jsonb_build_object('sub', v_owner_b::text, 'email', 'owner@sanmartin.demo',   'email_verified', true), 'email', now(), now(), now());

  -- ── Perfiles y roles ─────────────────────────────────────
  insert into usuario_perfil (id, organizacion_id, nombre, email) values
    (v_owner,   v_org_a, 'Beatriz Sosa', 'owner@aromos.demo'),
    (v_enf,     v_org_a, 'María López',  'enfermera@aromos.demo'),
    (v_cuid,    v_org_a, 'Jorge Díaz',   'cuidador@aromos.demo'),
    (v_owner_b, v_org_b, 'Rubén Ortiz',  'owner@sanmartin.demo');

  insert into usuario_rol (usuario_id, organizacion_id, rol, sede_id) values
    (v_owner,   v_org_a, 'owner',      v_sede_a),
    (v_enf,     v_org_a, 'enfermeria', v_sede_a),
    (v_cuid,    v_org_a, 'cuidador',   v_sede_a),
    (v_owner_b, v_org_b, 'owner',      v_sede_b);

  -- ── Habitaciones Org A (10 camas; 8 ocupadas, 2 libres) ──
  insert into habitacion (organizacion_id, sede_id, numero, capacidad) values
    (v_org_a, v_sede_a, '101', 2),
    (v_org_a, v_sede_a, '102', 1),
    (v_org_a, v_sede_a, '103', 1),
    (v_org_a, v_sede_a, '104', 1),
    (v_org_a, v_sede_a, '105', 1),
    (v_org_a, v_sede_a, '106', 1),
    (v_org_a, v_sede_a, '107', 1),
    (v_org_a, v_sede_a, '108', 1),
    (v_org_a, v_sede_a, '109', 1);
  insert into habitacion (organizacion_id, sede_id, numero, capacidad) values
    (v_org_b, v_sede_b, '201', 2);

  -- ── Residentes Org A (8) ─────────────────────────────────
  insert into residente (organizacion_id, sede_id, habitacion_id, nombre, apellido, dni, fecha_nacimiento, sexo)
  select v_org_a, v_sede_a, h.id, x.nombre, x.apellido, x.dni, x.fnac::date, x.sexo
  from (values
    ('Rosa',        'Giménez',   '4.512.334',  '1938-03-11', 'F', '101'),
    ('Héctor',      'Fernández', '5.221.980',  '1941-07-22', 'M', '101'),
    ('Norma',       'Benítez',   '6.019.442',  '1943-12-02', 'F', '102'),
    ('Alberto',     'Quiroga',   '4.880.117',  '1936-05-19', 'M', '103'),
    ('Elsa',        'Romero',    '5.740.663',  '1940-09-30', 'F', '104'),
    ('Juan Carlos', 'Ferreyra',  '6.332.201',  '1945-01-08', 'M', '105'),
    ('Dora',        'Ledesma',   '4.990.556',  '1939-11-14', 'F', '106'),
    ('Raúl',        'Sosa',      '5.108.774',  '1942-02-27', 'M', '107')
  ) as x(nombre, apellido, dni, fnac, sexo, hab)
  join habitacion h on h.sede_id = v_sede_a and h.numero = x.hab;

  -- ── Residentes Org B (2, para aislamiento) ───────────────
  insert into residente (organizacion_id, sede_id, habitacion_id, nombre, apellido, sexo)
  select v_org_b, v_sede_b, h.id, x.nombre, x.apellido, x.sexo
  from (values ('Mario','Pereyra','M'), ('Lucía','Vega','F')) as x(nombre, apellido, sexo)
  join habitacion h on h.sede_id = v_sede_b and h.numero = '201';

  -- ── Contactos (cliente ≠ residente: responsable de pago) ─
  insert into contacto_residente (organizacion_id, residente_id, nombre, relacion, telefono, es_responsable_pago)
  select v_org_a, r.id, x.contacto, x.relacion, x.tel, x.pago
  from (values
    ('Giménez',   'Silvia Giménez',   'Hija',    '11-4455-6677', true),
    ('Fernández', 'Marcelo Fernández','Hijo',    '11-5566-7788', true),
    ('Benítez',   'Ana Benítez',      'Sobrina', '11-6677-8899', true),
    ('Quiroga',   'Laura Quiroga',    'Hija',    '11-7788-9900', true)
  ) as x(apellido, contacto, relacion, tel, pago)
  join residente r on r.sede_id = v_sede_a and r.apellido = x.apellido;

  -- ── Vademécum Org A ──────────────────────────────────────
  insert into medicamento (organizacion_id, nombre, droga, presentacion) values
    (v_org_a, 'Enalapril 10 mg',      'enalapril',     'Comprimido'),
    (v_org_a, 'Metformina 850 mg',    'metformina',    'Comprimido'),
    (v_org_a, 'Losartán 50 mg',       'losartan',      'Comprimido'),
    (v_org_a, 'Amlodipina 5 mg',      'amlodipina',    'Comprimido'),
    (v_org_a, 'Atorvastatina 20 mg',  'atorvastatina', 'Comprimido'),
    (v_org_a, 'Levotiroxina 100 mcg', 'levotiroxina',  'Comprimido'),
    (v_org_a, 'Omeprazol 20 mg',      'omeprazol',     'Cápsula'),
    (v_org_a, 'Paracetamol 500 mg',   'paracetamol',   'Comprimido');
  insert into medicamento (organizacion_id, nombre, droga, presentacion) values
    (v_org_b, 'Enalapril 10 mg', 'enalapril', 'Comprimido');

  -- ── Prescripciones Org A ─────────────────────────────────
  insert into prescripcion (organizacion_id, residente_id, medicamento_id, dosis, horarios, indicaciones)
  select v_org_a, r.id, m.id, x.dosis, x.horarios::time[], x.indic
  from (values
    ('Giménez',   'enalapril',     '1 comprimido', '{08:00,20:00}', 'Control de tensión arterial'),
    ('Giménez',   'levotiroxina',  '1 comprimido', '{08:00}',       'En ayunas'),
    ('Fernández', 'metformina',    '1 comprimido', '{08:00,20:00}', 'Con las comidas'),
    ('Fernández', 'atorvastatina', '1 comprimido', '{22:00}',       'A la noche'),
    ('Benítez',   'losartan',      '1 comprimido', '{08:00}',       'Control de tensión'),
    ('Benítez',   'amlodipina',    '1 comprimido', '{08:00}',       null),
    ('Quiroga',   'omeprazol',     '1 cápsula',    '{08:00}',       'En ayunas'),
    ('Quiroga',   'paracetamol',   '1 comprimido', '{08:00,16:00}', 'Dolor articular'),
    ('Romero',    'levotiroxina',  '1 comprimido', '{08:00}',       'En ayunas'),
    ('Romero',    'enalapril',     '1 comprimido', '{20:00}',       null),
    ('Ferreyra',  'metformina',    '1 comprimido', '{12:00,20:00}', 'Con las comidas'),
    ('Ledesma',   'losartan',      '1 comprimido', '{08:00}',       'Control de tensión'),
    ('Ledesma',   'atorvastatina', '1 comprimido', '{22:00}',       'A la noche'),
    ('Sosa',      'amlodipina',    '1 comprimido', '{08:00}',       'Control de tensión')
  ) as x(apellido, droga, dosis, horarios, indic)
  join residente r on r.sede_id = v_sede_a and r.apellido = x.apellido
  join medicamento m on m.organizacion_id = v_org_a and m.droga = x.droga;

  -- ── Prescripción Org B ───────────────────────────────────
  insert into prescripcion (organizacion_id, residente_id, medicamento_id, dosis, horarios, indicaciones)
  select v_org_b, r.id, m.id, '1 comprimido', '{08:00}'::time[], 'Control de tensión'
  from residente r
  join medicamento m on m.organizacion_id = v_org_b and m.droga = 'enalapril'
  where r.sede_id = v_sede_b and r.apellido = 'Pereyra';

  -- ── Generar las tomas de HOY (idempotente) ───────────────
  perform generar_tomas_del_dia(v_sede_a, current_date);
  perform generar_tomas_del_dia(v_sede_b, current_date);

  -- ── Curar estados para que la demo se vea "viva" ─────────
  -- Administradas (registradas a tiempo por el cuidador).
  update administracion_medicamento a
  set estado = 'administrada', registrada_por = v_cuid, registrada_en = a.programada_para + interval '9 minutes'
  from prescripcion p, residente r, medicamento m
  where a.prescripcion_id = p.id and p.residente_id = r.id and p.medicamento_id = m.id
    and a.organizacion_id = v_org_a and a.programada_para = v_ts8
    and ((r.apellido = 'Giménez' and m.droga = 'enalapril')
      or (r.apellido = 'Fernández' and m.droga = 'metformina')
      or (r.apellido = 'Quiroga' and m.droga = 'omeprazol'));

  -- Rechazada (con motivo).
  update administracion_medicamento a
  set estado = 'rechazada', motivo = 'Paciente rechazó la medicación', registrada_por = v_cuid,
      registrada_en = a.programada_para + interval '15 minutes'
  from prescripcion p, residente r, medicamento m
  where a.prescripcion_id = p.id and p.residente_id = r.id and p.medicamento_id = m.id
    and a.organizacion_id = v_org_a and a.programada_para = v_ts8
    and r.apellido = 'Benítez' and m.droga = 'losartan';

  -- Omitida (venció la ventana sin registro; lo marcaría el job de las vencidas).
  update administracion_medicamento a
  set estado = 'omitida'
  from prescripcion p, residente r, medicamento m
  where a.prescripcion_id = p.id and p.residente_id = r.id and p.medicamento_id = m.id
    and a.organizacion_id = v_org_a and a.programada_para = v_ts8
    and r.apellido = 'Romero' and m.droga = 'levotiroxina';

  -- Historia de días previos (para el % de cumplimiento de 7 días del dashboard).
  insert into administracion_medicamento (organizacion_id, prescripcion_id, residente_id, programada_para, estado, registrada_por, registrada_en)
  select v_org_a, p.id, p.residente_id,
         ((current_date - d) ::timestamp + h) at time zone 'America/Argentina/Buenos_Aires',
         case when (abs(hashtext(p.id::text || d::text)) % 12 = 0)
              then 'omitida'::estado_administracion
              else 'administrada'::estado_administracion end,
         v_cuid,
         ((current_date - d)::timestamp + h) at time zone 'America/Argentina/Buenos_Aires' + interval '10 minutes'
  from prescripcion p
  cross join generate_series(1, 6) as d
  cross join lateral unnest(p.horarios) as h
  where p.organizacion_id = v_org_a
  on conflict (prescripcion_id, programada_para) do nothing;

end $$;
