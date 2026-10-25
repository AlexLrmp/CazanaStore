# Cazana Store — Fase 3: Mi perfil y direcciones guardadas

## Objetivo

Completar la zona de clientes **sin modificar el diseño original** de Cazana y sin sustituir la base de datos ya conectada. Esta fase agrega un perfil editable, una libreta de direcciones personal y selección de dirección desde el checkout.

## Instalación en Windows (VS Code)

1. Crea un commit de respaldo si tienes cambios importantes sin subir.
2. Detén el servidor `npm.cmd run dev` presionando `Ctrl + C` en su terminal.
3. Extrae este ZIP **y copia su contenido manteniendo la estructura de carpetas**, dentro de la raíz actual de Cazana Store donde está `index.html`. No borres las carpetas ni los archivos que ya tengas.
4. Desde una terminal PowerShell ubicada en **la raíz del proyecto** ejecuta:

   ```powershell
   node .\APLICAR-FASE3.cjs
   ```

   El instalador valida los puntos de integración antes de cambiar archivos. Conserva una copia de los seis archivos anteriores en una carpeta temporal fuera del repositorio e imprime la ubicación. Si no reconoce el código actual, se detiene sin efectuar cambios.
5. Desde la raíz:

   ```powershell
   cd backend
   npm.cmd test
   npm.cmd run dev
   ```

6. Entra a `http://localhost:3000/cuenta.html` e inicia sesión con un cliente de prueba. En **Mi perfil**, edita nombre y teléfono. En **Direcciones**, crea y administra una dirección de prueba. Verifica los cambios en Compass → `cazana_store` → `users`.
7. En el checkout con sesión y productos en carrito aparecerá **Usar una dirección guardada**, donde la principal se completa automáticamente. El usuario puede editar los campos de envío de ese pedido sin cambiar la dirección guardada.

**No ejecutes `seed`, `create-admin` ni restaures MongoDB**: nada de eso se necesita. No copies ni publiques `backend/.env` ni `backend/node_modules`.

Cuando la instalación funcione, el archivo temporal `APLICAR-FASE3.cjs` puede eliminarse del proyecto. Se conservan los nuevos archivos `backend/routes/customer-profile.js`, `backend/src/customer-validation.js`, `backend/test/customer-profile.test.js`, `js/pages/customer-profile.js` y este documento.

## Rutas nuevas

| Verbo | Ruta | Comportamiento |
|---|---|---|
| GET | `/api/me/profile` | Leer nombre, correo (solo lectura), teléfono y consentimiento |
| PATCH | `/api/me/profile` | Actualizar nombre, teléfono y consentimiento |
| GET | `/api/me/addresses` | Listar direcciones del cliente autenticado |
| POST | `/api/me/addresses` | Crear dirección, máximo ocho |
| PATCH | `/api/me/addresses/:id` | Editar dirección propia o marcarla como principal |
| DELETE | `/api/me/addresses/:id` | Eliminar dirección propia |

Las rutas exigen sesión de cliente. Los POST/PATCH/DELETE necesitan cabecera `X-Cazana-Request: 1`; el frontend ya la añade. El backend valida los campos mediante Zod, y las direcciones se almacenan como subdocumentos del modelo `User`. No se devuelve hash de contraseña.

## Comportamiento e integridad

- Una dirección se marca como principal automáticamente al crear la primera. Al eliminar la principal, se asigna otra si existe.
- Se guarda nombre, teléfono, dirección, ciudad, departamento, referencia opcional y etiqueta.
- Editar una dirección guardada **no modifica** la dirección de pedidos existentes: cada pedido conserva su propio snapshot de envío.
- Los campos enviados al crear solicitudes de pedido se siguen validando y almacenando en el flujo actual de pedidos.
- El campo correo no puede editarse todavía; primero implementaremos comprobación del nuevo correo y confirmación de identidad.
- La selección de dirección guardada **no crea pedidos ni modifica stock**; solo rellena el formulario del checkout.
- GitHub Pages sigue siendo una vista estática: para probar rutas de MongoDB usa siempre `http://localhost:3000`.

## Prueba sugerida

1. Inicia sesión, edita tu perfil de prueba y actualiza la pestaña. ¿Se mantienen los nuevos valores?
2. Crea una dirección ficticia llamada `Casa`, y otra `Trabajo`. Cambia cuál es la predeterminada.
3. Recarga y comprueba en Compass la colección `users` y el campo `addresses` del usuario correspondiente.
4. Edita la referencia de `Trabajo`; elimina `Casa`. Verifica que solo queda una dirección y que esté marcada como principal.
5. Agrega un producto al carrito de prueba, visita `checkout.html` y verifica que se complete la dirección predeterminada; **no hace falta enviar un pedido** para probar esta integración.
6. Abre la intranet y comprueba que continúan visibles los módulos de inventario y pedidos.

## Pendiente para producción

- Verificación de correo, cambio seguro de email y recuperación de contraseña.
- Protección frente a modificaciones simultáneas de direcciones de una misma cuenta, controles contra abuso y pruebas de integración reales.
- Revisión de privacidad y retención de datos personales, copias de seguridad y control de acceso a registros.
- Gestión de envío y cobertura real; todavía no hay pago en línea.
