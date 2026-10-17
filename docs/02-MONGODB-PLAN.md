# Cazana Store · Plan de MongoDB y arquitectura backend

Esta es la especificación de la siguiente fase, no una integración ya desplegada. Se propone **Node.js + Express + MongoDB + Mongoose**, todo escrito en **JavaScript** (sin TypeScript/TSX).

## Principios del modelo
- Usar referencias entre documentos que crecen o se comparten: `users`, `products`, `orders`, `payments`, `shipments`, `inventoryMovements`.
- Usar campos embebidos acotados para galería de imágenes, atributos pequeños y direcciones dentro de un perfil.
- Tomar **snapshots** en pedidos: nombre, SKU, cantidad, precio unitario y dirección de envío en el momento de la compra; así no cambia el historial al editar productos o direcciones.
- Precios como **enteros de céntimos**, por ejemplo S/199.99 se almacena como `19999` y `currency: "PEN"`.
- No almacenar números de tarjeta ni CVV. El proveedor procesa pagos y el servidor verifica notificaciones/webhooks.
- Separar permisos del cliente, atención, inventario, contabilidad y CEO/admin.
- Configurar índices únicos sobre emails normalizados, SKU, slugs y códigos de orden.
- Guardar auditoría de acciones administrativas, devoluciones, estados e inventario.
- Utilizar transacciones para reserva/confirmación de stock y estados de pedido; MongoDB Atlas o réplica configurada.

## Colecciones recomendadas
| Colección | Contenido principal | Relaciones |
|---|---|---|
| `users` | email, hash Argon2id/bcrypt, nombre, rol, estado, contactos, direcciones | -> orders, reviews |
| `categories` | slug, nombre, parentId, orden, SEO | -> products |
| `brands` | fabricante, logo, estado | -> products |
| `products` | SKU, slug, descripción, precios, fotos, categorías, visibilidad | -> categories, brands |
| `productVariants` | opciones talla/color/capacidad, SKU único, precio/stock si aplica | -> products |
| `warehouses` | ubicaciones de inventario | -> stockBalances |
| `stockBalances` | unidades disponibles y reservadas por SKU/almacén | -> variants, warehouses |
| `inventoryMovements` | entradas, salidas, reservas, ajustes y motivo | -> variants, orders, users |
| `carts` | un carrito por cuenta, variantes y cantidades | -> users, variants |
| `wishlists` | favoritos por usuario | -> users, products |
| `orders` | cliente, snapshots, totales, estados, descuentos e impuestos | -> users, payments, shipments |
| `payments` | proveedor, ID remoto, importe, estado, idempotencia | -> orders |
| `refunds` | devoluciones financieras, motivos, estado | -> orders, payments |
| `shipments` | transportista, tracking, costo y eventos | -> orders |
| `reviews` | producto, usuario, pedido, puntuación, moderación | -> orders, products, users |
| `coupons` | código, tipo, descuento, vigencia, límites de uso | -> orders |
| `couponRedemptions` | uso por usuario/pedido (para límites seguros) | -> coupons, users, orders |
| `contactMessages` | consulta, estado, responsable, canal | -> users, supportConversations |
| `supportConversations` | hilo de atención, participantes, estado | -> users, contactMessages |
| `expenses` | gasto, categoría, importe, soporte y fecha | -> users |
| `auditLogs` | acciones críticas, origen, recurso afectado | -> users |
| `newsletterSubscribers` | correo, consentimiento, estado y baja | opcional -> users |
| `siteSettings` | configuración pública, avisos de entrega, enlaces y políticas aprobadas | singleton lógico |
| `promotions` | campañas vigentes, banners, ventanas de tiempo | -> products/coupons |

Las colecciones se pueden implementar en fases. `productVariants` y `warehouses` se reservan para crecer; si la tienda comienza con un SKU por producto, `stockBalances` puede simplificarse temporalmente.

## Relaciones clave
```
User --< Order --< Payment
                  |--< Shipment
                  |--< Refund
Order --< orderItems[] (snapshots embebidos)
User --1 Cart --< cartItems[]
User --1 Wishlist --< productIds[]
Category --< Product --< ProductVariant
ProductVariant --< StockBalance -- Warehouse
ProductVariant --< InventoryMovement
Product --< Review >-- User
Coupon --< CouponRedemption >-- Order
User --< ContactMessage >-- SupportConversation
User (staff) --< AuditLog
```

## Índices iniciales
- `users.email` único (`lowercase + trim`).
- `products.slug`, `productVariants.sku`, `categories.slug` únicos.
- `orders.orderNumber` único y `{ userId: 1, createdAt: -1 }` para historial.
- `reviews: { productId: 1, status: 1, createdAt: -1 }`.
- `stockBalances: { variantId: 1, warehouseId: 1 }` único.
- `payments: { provider: 1, providerPaymentId: 1 }` único si existe ID.
- `inventoryMovements: { variantId: 1, createdAt: -1 }`.
- `auditLogs: { createdAt: -1 }` y `{ actorId: 1, createdAt: -1 }`.

## Interfaces/endpoint planeados
| Pantalla | Método/API planeada | Rol |
|---|---|---|
| Home / tienda | `GET /api/products`, `GET /api/categories`, `GET /api/promotions` | público |
| Ficha | `GET /api/products/:slug`, `GET /api/products/:slug/reviews` | público |
| Registro/login | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout` | público |
| Perfil | `GET/PATCH /api/me`, `GET/POST/DELETE /api/me/addresses` | cliente |
| Favoritos | `GET/PUT /api/me/wishlist` | cliente |
| Carrito | `GET/PUT /api/cart` | cliente o visitante anónimo temporal |
| Descuento | `POST /api/checkout/quote` valida cupón y recalcula en servidor | cliente |
| Checkout | `POST /api/orders` + proceso de pago en pasarela y webhook verificado | cliente |
| Pedidos | `GET /api/orders/mine` | cliente |
| Admin resumen | `GET /api/admin/summary?period=month` | admin/CEO/contabilidad |
| Admin pedidos | `GET /api/admin/orders` | admin/atención |
| Admin stock | `GET /api/admin/inventory`, `POST /api/admin/stock-movements` | admin/inventario |
| Contabilidad | `GET /api/admin/reports/finance` | CEO/contabilidad |
| Soporte | `GET /api/admin/support/conversations` | admin/atención |
| Newsletter | `POST /api/newsletter/subscriptions` | público |
| Contacto | `POST /api/contact` | público |

## Seguridad indispensable
1. Hash de contraseñas realizado en el servidor con Argon2id o bcrypt; nunca SHA simple/Base64.
2. Sesiones en cookies `HttpOnly`, `Secure` y `SameSite` según diseño; protección CSRF para operaciones sensibles.
3. Roles y permisos verificados en cada endpoint y para cada objeto (evitar acceso a pedidos ajenos).
4. Validaciones del servidor, límites de peticiones, HTTPS, CSP, sanitización de datos y registros de auditoría.
5. Importes y descuentos recalculados desde MongoDB; no confiar en totales del navegador.
6. Procesar pagos con SDK/API del proveedor y webhooks autenticados, claves en variables de entorno.
7. Estados de pedidos e inventario coordinados de manera transaccional. Idempotencia en operaciones críticas.
8. Backups, migraciones de esquemas, monitoreo y pruebas automatizadas.

## Ruta de implementación recomendada
1. Crear backend Express y conexión MongoDB Atlas/local, modelos y seed de categorías/productos.
2. Conectar catálogo público (sustituir `js/data.js`).
3. Usuarios, sesiones, roles y favoritos.
4. Direcciones, carrito persistente, cálculo de compra e inventario.
5. Pedidos + envíos + pasarela en sandbox.
6. Admin seguro y paneles con agregaciones MongoDB.
7. Reportes CSV y PDF reales, soporte y automatizaciones.
