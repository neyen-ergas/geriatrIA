# Configuración de Supabase

geriatrIA utiliza un proyecto independiente de Supabase para cada residencia.
El código y las migraciones son los mismos en todas las instalaciones; las
credenciales y los datos permanecen separados.

## Estado actual

El esquema completo está versionado en `supabase/migrations`. Aplicar las
migraciones por instalación antes del código que las necesita. La inicialización
de roles y su orden de despliegue están en [permisos.md](permisos.md).

## Variables de entorno

1. Copiar `.env.example` como `.env.local`.
2. Abrir la configuración de API del proyecto en Supabase.
3. Completar estas variables con los valores de esa instalación:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

`.env.local` está ignorado por Git. La contraseña de la base y los tokens
personales de la CLI no deben guardarse en el repositorio.

El CRM solo utiliza la URL y la clave publicable junto a la sesión. No requiere
una clave administrativa. Las credenciales de la landing externa se gestionan
por separado.

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

Ambos utilizan la URL y la clave publicable. Poder incluir esta clave
en el navegador no convierte los datos en públicos: las tablas expuestas deben
tener RLS y políticas de acceso por perfil.

## Tipos TypeScript

`src/types/database.ts` se genera automáticamente a partir del esquema `public`
del proyecto vinculado. Describe las filas y los datos permitidos para insertar
o actualizar, pero no contiene registros ni credenciales.

Después de aplicar una migración se debe regenerar con:

```bash
npm run db:types
```

El archivo generado no se edita manualmente. Si cambia una tabla, primero se
crea y aplica su migración y después se vuelve a ejecutar el comando.

## Desarrollo local

El desarrollo de interfaz y los tests unitarios no requieren Docker. En este
flujo, las pruebas SQL, concurrencia y generación de tipos corren en GitHub CI.

Cuando comience el trabajo de base de datos, el flujo será:

1. Crear una migración versionada.
2. Aplicarla y probarla en Supabase local.
3. Revisar el SQL y las políticas RLS.
4. Ejecutar un ensayo con `npx supabase db push --dry-run`.
5. Aplicarla al proyecto remoto solamente después de aprobar el Pull Request.
