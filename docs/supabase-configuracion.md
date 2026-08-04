# Configuración de Supabase

geriatrIA utiliza un proyecto independiente de Supabase para cada residencia.
El código y las migraciones son los mismos en todas las instalaciones; las
credenciales y los datos permanecen separados.

## Estado actual

El repositorio contiene el cliente de JavaScript, el soporte SSR para Next.js y
la CLI de Supabase. Todavía no existen tablas, migraciones ni pantallas que
consulten datos.

## Variables de entorno

1. Copiar `.env.example` como `.env.local`.
2. Abrir la configuración de API del proyecto en Supabase.
3. Completar estas variables con los valores de esa instalación:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

`.env.local` está ignorado por Git. La clave `service_role`, la contraseña de la
base y los tokens personales de la CLI no deben guardarse en el repositorio ni
utilizarse en código que se ejecute en el navegador.

## CLI y proyecto remoto

La CLI está instalada como dependencia de desarrollo. Por eso se ejecuta con
`npx`:

```bash
npx supabase login
npx supabase link --project-ref ID_DEL_PROYECTO
```

El identificador aparece en la URL del panel de Supabase. La vinculación queda
en archivos locales ignorados por Git y debe realizarse para cada instalación.

Antes de crear o aplicar una migración se debe comprobar cuál es el proyecto
vinculado. No se cambiará el esquema directamente desde Table Editor o SQL
Editor una vez iniciado el flujo de migraciones.

## Clientes de la aplicación

- `src/lib/supabase/client.ts`: cliente para componentes del navegador.
- `src/lib/supabase/server.ts`: cliente nuevo para cada ejecución del servidor.

Ambos utilizan únicamente la URL y la clave publicable. Poder incluir esta clave
en el navegador no convierte los datos en públicos: antes de almacenar datos
reales, las tablas tendrán autenticación, RLS y políticas de acceso.

## Desarrollo local

`supabase/config.toml` describe la futura instancia local. Para ejecutarla será
necesario instalar Docker. No es un requisito para usar la interfaz actual ni
para completar esta configuración inicial.

Cuando comience el trabajo de base de datos, el flujo será:

1. Crear una migración versionada.
2. Aplicarla y probarla en Supabase local.
3. Revisar el SQL y las políticas RLS.
4. Ejecutar un ensayo con `npx supabase db push --dry-run`.
5. Aplicarla al proyecto remoto solamente después de aprobar el Pull Request.
