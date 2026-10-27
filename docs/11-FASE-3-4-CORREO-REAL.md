# Cazana Store — Fase 3.4: Correo empresarial real

## Estado inicial

El backend actual ya admite enviar enlaces reales a través de `https://api.resend.com/emails`. Esta mejora añade un diseño HTML acorde con Cazana, un campo de respuesta opcional y una prueba explícita de la integración, **sin modificar la lógica de los tokens, las sesiones, MongoDB ni el frontend**.

## Preparación del correo empresarial

**Para enviar desde una dirección de Cazana es indispensable controlar un dominio propio.** Ejemplos como `seguridad@tudominio.com` son ilustrativos y NO son cuentas creadas.

1. Si la empresa ya tiene un dominio, úsalo. Si no, registra uno con autorización del responsable de la empresa.
2. Para tener una bandeja real (`atencion@tudominio.com`) donde leer y responder mensajes, crea la cuenta de correo con un proveedor de buzones como Google Workspace, Microsoft 365 o Zoho Mail y configura sus MX en DNS. Resend **envía transaccionales**; recibir por webhook no equivale a tener una bandeja tradicional.
3. Registra una cuenta en https://resend.com (el responsable del negocio puede encargarse de altas, verificaciones y pagos).
4. En Resend > Domains > Add Domain añade el dominio adquirido, selecciona **Sending** y copia en el proveedor DNS los registros de verificación y autentificación que Resend muestre (SPF/DKIM; considera DMARC). No inventes registros ni reemplaces los MX de una bandeja que ya funciona. Espera el estado **Verified**.
5. En Resend > API Keys genera una clave con permisos de envío. Guarda la clave en **`backend/.env` privado**, NUNCA en un archivo HTML, en JavaScript del navegador o en GitHub.
6. Configura el `RESET_MAIL_FROM` con una dirección del dominio verificado. Asegúrate de crear buzón real para `RESET_MAIL_REPLY_TO` si quieres recibir respuestas.

## Variables en `backend/.env` (son EJEMPLOS, no cuentas activas)

```dotenv
NODE_ENV=development
RESET_DEV_LINKS=0
PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=re_CLAVE_PRIVADA_REAL
RESET_MAIL_FROM=Cazana Store <seguridad@tudominio.com>
RESET_MAIL_REPLY_TO=atencion@tudominio.com
```

- El destinatario será el correo real del cliente que solicita recuperar su acceso.
- Con `http://localhost:3000`, el enlace recibido en la bandeja solo abrirá la aplicación en **tu PC cuando el servidor esté encendido**. No funcionará desde otro dispositivo. Para clientes externos hace falta desplegar Express con **HTTPS y un dominio público**, poner `PUBLIC_SITE_URL=https://...` y mantener la API protegida.
- No uses `NODE_ENV=production` sin HTTPS y la configuración correcta del proxy. En producción desactiva `RESET_DEV_LINKS`.

## Instalación del único instalador temporal

Desde la carpeta de Cazana donde está `index.html`:

```powershell
node .\instalar-correo-real.cjs --check
node .\instalar-correo-real.cjs
npm.cmd --prefix backend test
npm.cmd --prefix backend run mail:test
```

La opción `--check` no modifica archivos. Se crea copia de seguridad en la carpeta temporal del sistema al aplicar.

## Probar envío real

Cuando Resend tenga el dominio en estado Verified y hayas configurado el `.env` privado:

```powershell
npm.cmd --prefix backend run mail:test -- --send tu-correo-personal@proveedor.com
```

Esa opción **sí envía un mensaje**. Revisa que llegue a la bandeja, y también Resend > Emails. Que la API acepte el envío no garantiza que haya llegado a bandeja principal; comprueba las métricas de entrega o rebote.

Después, con `RESET_DEV_LINKS=0`, reinicia Node.js e ingresa en `http://localhost:3000/cuenta.html`: prueba la función «¿Olvidaste tu contraseña?» con una cuenta de prueba existente y verifica que el enlace llegue por correo. Si falla la entrega, la respuesta del sitio seguirá siendo genérica por seguridad; revisa la consola del servidor y Resend > Emails.

## Recordatorios de seguridad

- No compartas capturas de `.env`, de la API key ni de enlaces de recuperación.
- No envíes enlaces de recuperación a personas que no te autorizaron a probar el sistema.
- En el proveedor de correo activa autenticación multifactor en la cuenta administrativa.
- Guarda el instalador fuera del repositorio o elimínalo tras las pruebas, pero conserva `backend/src/mail-template.js`, `backend/scripts/check-mail.js`, las pruebas y los cambios reales del backend.
