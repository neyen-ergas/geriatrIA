# Recuperación de acceso

Desde `/login`, **Olvidé mi contraseña** abre `/recuperar`. La persona escribe su
correo y Supabase envía el enlace. El mensaje de confirmación es el mismo exista
o no una cuenta para ese correo. No crea usuarios ni concede permisos.

## Configuración por residencia

En Supabase, **Authentication → URL Configuration**:

1. Configurar **Site URL** con el origen público de la instalación. Para esta
   instancia: `https://geriatria-demo.vercel.app`.
2. Agregar a **Redirect URLs** la dirección exacta
   `https://geriatria-demo.vercel.app/auth/recuperar`.
3. Mantener el enlace `{{ .ConfirmationURL }}` en la plantilla de recuperación.
   Una plantilla personalizada que descarte el destino solicitado debe adaptarse.
4. Verificar entrega de correo y los límites del proveedor configurado. Un 429
   no significa contraseña incorrecta ni garantiza que se haya enviado un correo.
   Si hay un bloqueo por cuota, esperar el plazo del proveedor o revisar SMTP.

No son variables nuevas de Vercel ni una migración de base. El formulario toma
el origen del sitio donde se abre. Para probar en otra instalación, autorizar
su callback exacto; no utilizar comodines amplios como solución a un error.

## Recorrido

1. Pedir el correo **desde geriatrIA**, en `/recuperar`.
2. Abrir el último enlace recibido en el mismo navegador y perfil que hizo el
   pedido. Evitar abrirlo en el navegador interno del correo o en otro dispositivo.
3. `/auth/recuperar` intercambia el código por una sesión mediante PKCE y cookies.
   Tiene un destino fijo: `/restablecer`. El código no se conserva en esa URL;
   la respuesta no se almacena en caché y no envía referrer.
4. La página y la acción comprueban la identidad con `auth.getUser()`. La persona
   confirma una contraseña de 12 a 128 caracteres; Supabase aplica además su
   política de contraseña. La cuenta utilizada se muestra antes de cambiarla.
5. Tras confirmar el cambio puede entrar al CRM; sus permisos vigentes siguen
   aplicándose. Una cuenta suspendida no recupera acceso por cambiar su contraseña.

Un enlace vencido, ya usado, sin verificador o abierto en otro navegador vuelve
a la pantalla de solicitud con un mensaje. Pedidos repetidos pueden invalidar
enlaces previos; se recomienda usar el último. La interfaz impide otro envío
durante 60 segundos después de cada intento, sin reemplazar el límite del servidor.

Los enlaces antiguos solicitados desde el panel de Supabase no son el flujo de
esta pantalla: solicitar uno nuevo desde la aplicación. No se modifica `auth.users`
por SQL ni se pide una clave administrativa. La contraseña nunca se devuelve en
el estado de la acción, no se registra y no se guarda en el repositorio.

La acción de contraseña exige identidad, pero no un permiso operativo del CRM:
cada persona puede recuperar su propia contraseña aunque aún no tenga un perfil
asignado. `updateUser` actúa sobre la sesión verificada, nunca sobre un ID recibido
del formulario. No se revocan manualmente otras sesiones desde esta pantalla.

## Verificación

- Tests de sesión ausente/inválida, validación, rechazo del proveedor y respuesta
  incierta sin reintento automático.
- Tests del callback sin código, con código inválido, destino fijo y cabeceras.
- Integración con el SDK real y HTTP simulado: verificador en cookies, intercambio
  por sesión, lectura desde otro pedido y rechazo sin las cookies de origen.
- El smoke HTTP de CI comprueba el enlace en login, el formulario público y que
  no se pueda abrir el cambio sin sesión.
- Aceptación manual después del despliegue: recibir un correo real, abrirlo,
  cambiar la contraseña, cerrar sesión e ingresar con la nueva. Esto lo completa
  el titular; las pruebas automatizadas no envían correos ni cambian cuentas reales.

Referencia: [recuperación de contraseñas de Supabase](https://supabase.com/docs/guides/auth/passwords).
