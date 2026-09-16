# Autenticación y Control de Acceso

geriatrIA utiliza Supabase Auth con correo y contraseña, integrado con un modelo de
control de acceso basado en roles (RBAC) vinculado a las fichas del personal de la residencia.

## Reglas fundamentales de seguridad

- **Sin registro público:** No existe registro público ni creación autónoma de usuarios. Las opciones de auto-registro están desactivadas (`enable_signup = false`).
- **Cuentas vinculadas a empleados:** Cada usuario autenticado corresponde a un empleado activo registrado en el sistema. Si el empleado es dado de baja, su acceso queda suspendido inmediatamente.
- **Validación criptográfica del JWT:** El servidor valida la autenticidad del token mediante `getClaims()` (`getUser()`), nunca mediante el valor no confiable de `getSession()`.
- **Sesiones en Node.js:** El middleware de renovación de sesión (`src/middleware.ts`) se ejecuta en el runtime de Node.js, garantizando compatibilidad con clientes de Supabase y soporte de WebSockets sin depender de Edge runtime.
- **Sin clave administrativa en el CRM:** El CRM no utiliza `SUPABASE_SERVICE_ROLE_KEY`. Todas las consultas y acciones se ejecutan bajo la identidad del usuario conectado, sujetas a las políticas RLS y funciones RPC autorizadas.

## Niveles de acceso y roles

El sistema define tres perfiles con alcance claramente delimitado:

| Rol               | Identificador    | Alcance                                                                                                                                                                                           |
| ----------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Administrador** | `administration` | Control total del sistema. Gestión de empleados, roles y accesos (`/accesos`), auditoría operativa completa (`/auditoria`), configuración y operaciones de gestión.                               |
| **Gestión**       | `management`     | Operación diaria de la residencia. Admisión de consultas, altas, ediciones y bajas de residentes, emisión de cuotas, registro y anulación de pagos, turnos del personal y carga de documentación. |
| **Solo lectura**  | `read_only`      | Consulta y seguimiento de información operativa (residentes, consultas, agenda, turnos, movimientos de cuenta y entrevistas) sin capacidad de crear ni modificar registros.                       |

El modelo de datos y las políticas RLS detalladas se encuentran especificados en [docs/permisos.md](permisos.md).

## Mecanismos de autorización en el código

### 1. Servidor y Server Actions (`src/lib/auth.ts`)

La función `requerirSesion` verifica la identidad y el nivel de permisos requerido antes de procesar una petición o acción del servidor:

```typescript
import { requerirSesion } from "@/lib/auth";

// Exclusivo para administradores
const sesion = await requerirSesion("administration");

// Permite Administrador y Gestión (escritura operativa)
const sesion = await requerirSesion("operational.write");

// Permite Administrador, Gestión y Solo lectura
const sesion = await requerirSesion("operational.read");
```

Si la sesión no es válida, redirige a `/login`. Si el rol no tiene el permiso suficiente, lanza una excepción que muestra la pantalla de acceso denegado (`/sin-permiso`).

### 2. Componentes de interfaz (`src/components/permisos.tsx`)

Para ocultar o condicionar botones y enlaces según el rol del usuario conectado:

- `<SoloAdmin>`: Muestra elementos solo al perfil Administrador (ej. enlaces a `/accesos`, `/auditoria` o alta de empleados).
- `<SoloGestion>`: Muestra acciones operativas a usuarios con capacidad de escritura (Administrador y Gestión).
- Hooks `useRol()`, `usePuedeAdministrar()`, `usePuedeGestionar()` para lógica condicional en componentes clientes.

## Administración de cuentas y accesos

La gestión de cuentas se realiza desde la interfaz de la aplicación en `/accesos` (exclusivo para Administradores):

1. **Creación del usuario:** El administrador crea el usuario en Supabase Auth (`Authentication > Users`) o mediante invitación por correo.
2. **Vinculación a la ficha:** Desde `/accesos` o `/empleados/[id]`, el administrador asocia la cuenta de Auth con la ficha de empleado correspondiente.
3. **Asignación de rol:** Se define el rol (`Administrador`, `Gestión` o `Solo lectura`).
4. **Suspensión de acceso:** Puede desvincularse o suspenderse el acceso en cualquier momento. El sistema impide que un administrador se despoje a sí mismo del último acceso administrativo de la residencia.

## Archivos clave de autenticación

- `src/middleware.ts`: Verificación y refresco de tokens en cada solicitud HTTP hacia rutas protegidas.
- `src/lib/supabase/middleware.ts`: Sincronización segura de cookies de sesión entre cliente y servidor.
- `src/lib/auth.ts`: Utilidades de validación de claims y control de permisos en servidor.
- `src/app/login/page.tsx` y `src/app/login/actions.ts`: Formulario de inicio de sesión seguro con protección contra fuerza bruta y redirección automática si ya existe sesión activa.
- `src/components/permisos.tsx`: Primitivas de renderizado condicional por rol en componentes React.

## Documentación relacionada

- [docs/permisos.md](permisos.md): Especificación detallada de RLS, tablas y RPC del modelo de roles.
- [docs/cuentas-empleados.md](cuentas-empleados.md): Flujo de vinculación de cuentas Supabase Auth con empleados.
- [docs/supabase-configuracion.md](supabase-configuracion.md): Variables de entorno y configuración de Supabase.
