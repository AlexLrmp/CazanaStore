# Cazana Store — Fase 2: clientes y pedidos

## Objetivo

Conectar las cuentas de clientes y las solicitudes de pedido al backend Node.js + Express + MongoDB que ya está instalado, conservando la identidad visual y el menú del panel de Cazana.

### Funcionalidades incluidas

- `cuenta.html`: registro, inicio de sesión, cierre de sesión, perfil básico e historial de solicitudes del **cliente autenticado**.
- `checkout.html`: formulario de dirección y **solicitud de pedido**, sin tarjeta, pasarela ni cobro.
- `backend/routes/orders.js`: consulta y creación de pedidos del cliente autenticado, además de cancelación cuando el pedido está pendiente.
- `backend/routes/admin-orders.js`: consulta de pedidos y actualización de estados por personal autorizado desde el Admin original (`/staff#orders`).
- `backend/src/order-service.js`: toma los precios desde MongoDB y registra en una transacción el pedido y la reserva de existencias; si la operación falla, no debe quedar una reserva parcial.
- `backend/src/models.js`: añade colección `Order`. Los pedidos preservan el precio y nombre de cada artículo al crearse.
- `css/style.css`: mantiene un único CSS; el instalador añade las reglas nuevas al final sin duplicarlas en una segunda ejecución.

## Instalación en Windows

**Antes:** realiza un commit de respaldo local si has añadido cambios. No compartas ni copies tu `.env` fuera de tu equipo.

1. Detén `npm.cmd run dev` con `Ctrl + C`.
2. Extrae el ZIP y copia sus carpetas y archivos **dentro de la carpeta actual del proyecto**, donde está `index.html`. Combina las carpetas, y reemplaza únicamente los archivos coincidentes del paquete. No borres los demás archivos de `backend/`, `assets/`, `css/` o `js/`.
3. Ejecuta, desde la **raíz del proyecto**:

   ```powershell
   .\APLICAR-FASE-2.cmd
   ```

   O alternativamente `node tools/instalar_fase2.cjs` desde cualquier terminal. Este paso actualiza **el único** `css/style.css`.
4. En la terminal PowerShell:

   ```powershell
   cd backend
   npm.cmd install
   npm.cmd run indexes
   npm.cmd test
   npm.cmd run dev
   ```

5. Abre `http://localhost:3000/cuenta.html` e inicia sesión con **una cuenta de cliente de pruebas** (distinta de tu cuenta de empleado).
6. Añade un producto al carrito y abre `http://localhost:3000/checkout.html` para registrar una **solicitud de prueba**.
7. Revisa el pedido en `cuenta.html`. Ingresa con tu código de personal a `http://localhost:3000/staff#orders` y actualiza su estado.
8. Comprueba un caso de cancelación pendiente y la restitución de stock; prueba también una cantidad mayor que el stock y verifica que se rechace.

**No ejecutes `npm.cmd run seed` ni `npm.cmd run create-admin` de nuevo** para instalar esta fase. La colección de pedidos se crea al registrar la primera solicitud.

## Flujo de estados

`pending → confirmed → preparing → shipped → delivered`

Es posible cancelar un pedido desde `pending`, `confirmed` o `preparing` mediante un administrador. Un cliente solo puede cancelar durante `pending`. Un pedido `shipped` o `delivered` no puede cancelarse desde el flujo automático y deberá manejarse después en devoluciones. Si hay cancelación, el stock reservado se devuelve en una transacción.

## API (autenticada con cookie httpOnly)

| Ruta | Uso | Permiso |
| --- | --- | --- |
| `POST /api/auth/register` | Registro | Público, con límite de intentos |
| `POST /api/auth/login` | Acceso | Público, con límite de intentos |
| `GET /api/auth/me` | Sesión actual | Autenticado |
| `POST /api/auth/logout` | Salir | Autenticado |
| `GET /api/orders` | Pedidos propios | Cliente |
| `POST /api/orders` | Solicitud con precios del servidor | Cliente |
| `GET /api/orders/:id` | Detalle propio | Cliente |
| `POST /api/orders/:id/cancel` | Cancelación pendiente | Cliente propietario |
| `GET /api/admin/orders` | Últimos 30 pedidos | Owner, admin o inventario |
| `PATCH /api/admin/orders/:id/status` | Actualizar estado | Owner, admin o inventario |

Todos los POST/PATCH requieren la cabecera `X-Cazana-Request: 1`, con control de origen. No se deben enviar contraseñas ni tokens a `localStorage`.

### Estado actual y limitaciones

Esta es una **fase de desarrollo**, todavía no apta para vender al público. No dispone de:

- Pasarela ni verificación de pago, confirmación de entrega, impuestos, cálculo de envío o facturación electrónica.
- Recuperación de contraseñas, verificación de correo o correos transaccionales.
- Notificaciones por WhatsApp, chatbot, integración CRM, políticas de devoluciones ni guardado de direcciones favoritas.
- Vencimiento automático de solicitudes pendientes; en producción debe añadirse expiración/confirmación de reservas.
- Auditoría completa de seguridad de despliegue, monitoreo ni copias de seguridad automatizadas.

Los registros de pedidos y datos personales se almacenan en MongoDB. Para probar, utiliza cuentas y direcciones de **ensayo**, no información privada de clientes reales. Antes de publicar es necesario completar consentimiento y aviso de privacidad, configuración HTTPS, recuperación de acceso y controles operativos.

### Despliegue y GitHub

GitHub Pages continúa sirviendo la demo estática porque no ejecuta Node.js. El flujo real solo estará disponible desde el backend (`localhost:3000`), hasta desplegarlo bajo el mismo dominio o una arquitectura segura compatible con sesiones.

`backend/.env` y `backend/node_modules/` no deben subirse. Confirma que `.gitignore` los excluye antes de cualquier push.
