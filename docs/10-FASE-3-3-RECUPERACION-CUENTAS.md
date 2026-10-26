# Cazana Store · Fase 3.3 — Recuperación de contraseñas

## Qué añade

- «¿Olvidaste tu contraseña?» en **Mi cuenta**.
- Token criptográficamente aleatorio de 32 bytes, de **un solo uso** y **15 minutos de vigencia**.
- MongoDB almacena únicamente el SHA-256 del token en `passwordresets`. MongoDB elimina documentos caducados con un índice TTL (el TTL no es inmediato; la verificación de fecha se hace en cada intento).
- Después de cambiar la contraseña se invalidan todas las sesiones del cliente.
- Solicitudes limitadas por IP, respuesta que no revela si una dirección está registrada, y requisitos de contraseña como en el registro.
- Envío real de correos mediante la API de Resend; sin dependencias adicionales.

## Instalación (desde la raíz del proyecto en PowerShell)

1. Guarda tus cambios y considera un commit previo de respaldo.
2. Copia `instalar-fase-3-3.cjs` **junto a `index.html`**, sin introducir carpetas `backend` duplicadas.
3. Ejecuta `node .\instalar-fase-3-3.cjs --check`.
4. Si pasa la comprobación, ejecuta `node .\instalar-fase-3-3.cjs`.
5. El instalador crea respaldos en la carpeta temporal de Windows antes de modificar archivos.
6. En el archivo privado `backend/.env`, activa `RESET_DEV_LINKS=1` únicamente para probar localmente. No subas `backend/.env` ni muestres enlaces de recuperación activos en capturas.
7. Reinicia desde la raíz: `npm.cmd --prefix backend test`, luego `npm.cmd --prefix backend run indexes`, y finalmente `cd backend` + `npm.cmd run dev`.
8. En `http://localhost:3000/cuenta.html`, cierra la sesión del cliente para ver «¿Olvidaste tu contraseña?». Introduce el correo de una cuenta de prueba. El servidor imprimirá un enlace **solo en tu terminal de desarrollo**. Ábrelo en el navegador, introduce la nueva contraseña y verifica que la anterior ya no funciona.
9. Comprueba la colección `passwordresets` en Compass si deseas ver tokens hasheados. También puedes comprobar que las sesiones anteriores dejaron de funcionar.
10. Tras las pruebas, elimina `RESET_DEV_LINKS=1` (o cámbialo por `0`) y borra el instalador de la raíz. Conserva los archivos reales del backend, CSS, cuenta y documentación.

## Correo real / producción

Para activar el envío real, registra un dominio de envío propio y verifícalo con Resend. Añade solamente a `backend/.env` o a los secretos del servidor:

```
NODE_ENV=production
PUBLIC_SITE_URL=https://tu-dominio-oficial.com
RESET_DEV_LINKS=0
RESEND_API_KEY=tu_clave_privada
RESET_MAIL_FROM=Cazana Store <seguridad@tu-dominio-oficial.com>
```

**No actives `NODE_ENV=production` en tu computadora sin HTTPS configurado.** El enlace real debe apuntar al dominio donde esté alojado el backend de Express; GitHub Pages por sí solo no ejecuta la API. Evita enviar correos a clientes reales hasta configurar dominio, políticas, consentimiento e infraestructura de producción.

## Ruta de endpoints

- `POST /api/auth/forgot-password` `{email}`: siempre da una respuesta genérica cuando el envío está configurado.
- `POST /api/auth/reset-password` `{token,password}`: cambia contraseña y cierra sesiones tras verificar token válido.

## Seguridad y límites

- No cambia la autenticación del personal ni el login existente.
- No envía contraseñas por correo ni permite visualizar hashes como contraseñas.
- No migra ni elimina datos de usuarios, pedidos, favoritos o direcciones.
- En modo desarrollo el enlace impreso en terminal también es secreto; trátalo como una contraseña temporal.
- Pruebas incluidas: token criptográfico, SHA-256, formato de enlace, caducidad y modo de desarrollo.
- Pendiente para despliegue: dominio HTTPS, correo verificado, pruebas contra proveedor real, gestor de secretos y revisión externa de seguridad.
