# Configuración de Supabase

geriatrIA utiliza un proyecto independiente de Supabase para cada residencia.
El código de la aplicación y las migraciones son idénticos en todas las instalaciones;
las credenciales, los datos y los usuarios permanecen aislados por construcción.

## Arquitectura y estado del esquema

El esquema completo de base de datos se encuentra versionado secuencialmente en
`supabase/migrations/`. Cubre todos los módulos funcionales del sistema:

1. **Admisión y consultas:** Tabla `consulta`, seguimiento de estados, agenda de visitas y protección de concurrencia.
2. **Residentes y estadías:** Tablas `residents`, `family_contacts` y `admissions` con índice único de ingreso activo y validaciones temporales.
3. **Contabilidad:** Tablas `monthly_charges` y `payments`, vista `monthly_charge_balances`, funciones de cobro y anulación con trazabilidad.
4. **Almacenamiento privado:** Buckets de Supabase Storage para comprobantes de pago (`payment-receipts`) y documentos de residentes (`resident-documents`).
5. **Roles, permisos y auditoría:** Esquema de control de acceso (`roles`, `permissions`, `role_permissions`, `user_roles`) vinculado a fichas de personal (`employees`) y registro transaccional de auditoría operativa (`operational_audit_log`).
6. **Turnos del personal:** Tabla `shifts` con grilla semanal e invariante contra superposiciones.
7. **Entrevistas de admisión:** Tabla `interviews` con valoración multidimensional, vinculación a consultas y dictámenes de aptitud.

## Variables de entorno

Para inicializar una instalación o entorno de desarrollo:

1. Copiar `.env.example` como `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Abrir la configuración de API del proyecto en Supabase Dashboard (`Project Settings > API`).
3. Completar las dos variables requeridas por el CRM:

```text
NEXT_PUBLIC_SUPABASE_URL="https://ID_DEL_PROYECTO.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sbp_..."
```

> **Importante:** El CRM opera exclusivamente con la clave publicable y la sesión del
> usuario autenticado. No utiliza ni requiere `SUPABASE_SERVICE_ROLE_KEY`. Todas las consultas
> y mutaciones están protegidas por Row-Level Security (RLS) y funciones RPC controladas.
> La clave `service_role` únicamente puede utilizarse de forma externa (por ejemplo, en
> la landing page pública para insertar nuevas consultas iniciales o en tareas de mantenimiento
> administrativo).

## Vinculación y CLI de Supabase

La CLI de Supabase está instalada como dependencia de desarrollo en el proyecto:

```bash
# Iniciar sesión en Supabase CLI
npx supabase login

# Vincular al proyecto remoto de la residencia
npx supabase link --project-ref ID_DEL_PROYECTO
```

El identificador de referencia (`project-ref`) se obtiene en la URL del Dashboard de Supabase.
Los archivos de configuración local creados por la CLI (`.supabase/`) están ignorados en Git.

### Despliegue de migraciones

Para aplicar migraciones pendientes sobre la base de datos de la residencia:

```bash
# Simulación previa para verificar sintaxis y dependencias
npx supabase db push --dry-run

# Aplicar las migraciones versionadas
npx supabase db push
```

No se deben modificar tablas ni políticas de seguridad manualmente mediante el Table Editor
o SQL Editor en producción; todos los cambios deben quedar respaldados en migraciones versionadas.

## Almacenamiento (Supabase Storage)

El sistema utiliza dos buckets privados creados y configurados mediante migraciones:

- `payment-receipts`: Comprobantes de pago (JPG, PNG, PDF; límite de 3 MiB).
- `resident-documents`: Documentación médica y administrativa de residentes (JPG, PNG, PDF; límite de 5 MiB).

Ambos buckets son estrictamente privados (`public = false`). El acceso a los archivos se
realiza mediante URLs firmadas de corta duración generadas en el servidor (`createSignedUrl`),
restringidas a usuarios con perfil de `administration` o `management`.

## Tipos TypeScript automáticos

El archivo `src/types/database.ts` describe el esquema estricto de la base de datos para TypeScript
(tablas, vistas, funciones y enumerados) sin exponer credenciales ni datos.

Para regenerarlo tras aplicar migraciones:

```bash
# Desde el proyecto remoto vinculado
npm run db:types

# O desde un contenedor Supabase local (si se usa Docker)
npm run db:types:local
```

El archivo generado no se edita a mano.

## Documentación relacionada

- [docs/permisos.md](permisos.md): Modelo de roles, perfiles y permisos por sección.
- [docs/cuentas-empleados.md](cuentas-empleados.md): Vinculación de cuentas Supabase Auth con fichas de personal.
- [docs/auditoria.md](auditoria.md): Registro transaccional de auditoría operativa.
- [docs/autenticacion.md](autenticacion.md): Mecanismos de autenticación y renovación de sesión.
- [docs/comprobantes-privados.md](comprobantes-privados.md): Especificación técnica del bucket de comprobantes de pago.
