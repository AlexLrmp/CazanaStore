# Cazana Store — Backend v0.1

Implementación **inicial y funcional sobre MongoDB**. Proyecto en **JavaScript**, Node.js 20+, Express 5 y Mongoose 8. Conserva sin cambios el HTML/CSS/JS de `AlexLrmp/CazanaStore` y la estructura `assets/productos`.

## Arquitectura

```text
CazanaStore/
├─ index.html, tienda.html, producto.html, ...   # frontend existente
├─ js/data.js                                   # catálogo demo para GitHub Pages
├─ assets/                                      # fotografías que ya organizaste
├─ backend/
│  ├─ src/server.js                             # arranque
│  ├─ src/app.js                                # rutas y servidor frontend seguro
│  ├─ src/models.js                             # MongoDB/Mongoose
│  ├─ src/security.js                           # sesiones y permisos
│  ├─ routes/{catalog,auth,staff,admin}.js      # endpoints
│  ├─ staff/{login,catalog}.html                # gestión REAL de productos
│  ├─ scripts/                                  # importación y utilidades
│  └─ .env.example                              # plantilla SIN secretos
└─ tools/validar_imagenes.py                    # validador multiformato actualizado
```

## Instalación y ejecución

Consulta `../EMPIEZA-AQUI-BACKEND.md`. Versión reducida desde PowerShell, partiendo de la raíz:

```powershell
Copy-Item backend\.env.example backend\.env
cd backend
npm install
# Edita backend/.env y configura MONGODB_URI
npm run indexes
npm run seed
npm run create-admin
npm run dev
```

Navega a `http://localhost:3000/` y `http://localhost:3000/staff/login`.

El servidor bloquea el acceso a `backend/`, `.env`, `docs/`, `tools/` y demás archivos privados; solo expone las páginas y los recursos del frontend, el portal del personal y la API. No uses Live Server si quieres ver la versión alimentada por MongoDB: accede al puerto 3000 del backend.

## API disponible (primera fase)

| Método | Ruta | Acceso | Uso |
|---|---|---|---|
| GET | `/api/health` | Público | Estado de la base |
| GET | `/api/products` | Público | Catálogo paginado, búsqueda y filtros |
| GET | `/api/products/:slug` | Público | Producto individual |
| GET | `/api/categories` | Público | Categorías con cantidad de productos |
| GET | `/api/settings` | Público | Configuración comercial pública |
| GET | `/api/whatsapp` | Público | Abre WhatsApp del número actual |
| POST | `/api/auth/register` | Público | Registrar cliente, consentimiento opcional |
| POST | `/api/auth/login` | Público | Inicio de sesión cliente |
| GET | `/api/auth/me` | Sesión | Datos del usuario autenticado |
| POST | `/api/auth/logout` | Sesión | Cerrar sesión |
| POST | `/api/staff/login` | Público | Entrar con código y contraseña de empleado |
| GET | `/api/staff/me` | Personal | Sesión de personal |
| POST | `/api/staff/logout` | Personal | Cerrar sesión |
| GET | `/api/admin/products` | Inventario/admin/propietario | Listado incluyendo inactivos |
| POST | `/api/admin/products` | Admin/propietario | Crear producto |
| PATCH | `/api/admin/products/:id` | Admin/propietario | Modificar datos |
| DELETE | `/api/admin/products/:id` | Admin/propietario | Desactivar sin borrar historial |
| POST | `/api/admin/products/:id/stock` | Inventario/admin/propietario | Ajustar existencias, registrar movimiento |
| GET | `/api/admin/settings` | Admin/propietario | Leer contacto comercial |
| PATCH | `/api/admin/settings` | Admin/propietario | Cambiar teléfono y nombre de WhatsApp |

**Todas las solicitudes POST/PATCH/DELETE requieren el encabezado `X-Cazana-Request: 1`**. Para requests con cuerpo, utiliza `Content-Type: application/json`; las cookies de sesión `HttpOnly` se envían automáticamente desde el mismo origen. El frontend del portal de empleados ya añade este encabezado.

### Ejemplo de producto

```json
{
  "sku": "CZ-HOG-013",
  "slug": "cafetera-modelo-nuevo",
  "name": "Cafetera Modelo Nuevo",
  "category": "hogar",
  "subcategory": "Cocina",
  "description": "Cafetera para uso doméstico",
  "priceCents": 29990,
  "stockQty": 3,
  "image": "assets/productos/cafetera-modelo-nuevo/principal.jpg",
  "gallery": ["assets/productos/cafetera-modelo-nuevo/principal.jpg"],
  "isNew": true,
  "isOffer": false,
  "isBestseller": false,
  "active": true
}
```

El panel actual acepta **rutas de imágenes ya copiadas a `assets/`**. Subir fotos desde el navegador y guardarlas en un proveedor de archivos se implementará en la fase posterior; no se permitirá publicar archivos arbitrarios en el servidor.

### Productos reales en el frontend existente

Cuando se abre la tienda **desde `http://localhost:3000`**, el backend entrega una versión generada de `/js/data.js` a partir de MongoDB. `js/main.js` puede seguir mostrando las tarjetas y filtros existentes sin cambios. La importación conserva `legacyId` (`h1`, `t1`, etc.) para no romper carrito ni favoritos previos.

Cuando se abre la versión en **GitHub Pages**, el backend no participa: se lee `js/data.js` estático y los cambios de MongoDB no aparecen. Más adelante implementaremos una conexión frontend/API compatible con el dominio definitivo.

### Inventario y fotos del demo

`npm run seed` lee el `js/data.js` local que tú controlas y crea hasta los 12 productos actuales con `priceCents` y `stockQty:10` **solo de ejemplo**. No sobrescribe los productos existentes al ejecutarlo de nuevo. No representa stock comercial verificado ni habilita cobros.

Antes de ofrecer ventas, confirma precios, disponibilidad, identidad de los artículos y cumplimiento legal. Las reseñas demo del frontend aún no son reseñas verificadas; eso se migrará más adelante.

## Seguridad incluida (etapa inicial)

- Contraseñas con hash bcrypt (coste 12), sin claves en GitHub.
- Sesiones con tokens criptográficos, guardados como hash en MongoDB y enviados en cookie `HttpOnly`, `SameSite=Lax` y `Secure` en producción.
- Inicio de sesión limitado por IP y separación entre clientes y empleados.
- Validación estricta de entradas y protección de operaciones de escritura mediante origen y cabecera de solicitud.
- Autorización en endpoints, no solo en menús.
- Desactivación lógica de productos, ajustes de stock atómicos por documento y trazabilidad básica.
- Helmet y archivos sensibles fuera del directorio servido públicamente.

**Pendiente para producción:** TLS/dominio, comprobaciones de infraestructura y entrega real, rate limiting compartido si hay múltiples instancias, backups y restauración, auditoría exhaustiva, confirmación de emails, recuperación segura, revocación/rotación de sesiones, permisos por entidad, transacciones de stock con órdenes (MongoDB replica set), pruebas integrales, pagos y cumplimiento de protección de datos.

## Plan de siguientes fases

1. Conectar `cuenta.html` con usuarios registrados y gestionar sesiones, recuperación de contraseña por email y direcciones.
2. Integrar el panel Admin actual (mantener su diseño) y permitir **subir fotografías reales** a almacenamiento dedicado. El panel nuevo `/staff` es una primera interfaz operativa, no el reemplazo visual definitivo.
3. Carrito persistente, pedidos, inventario transaccional y pagos en entorno sandbox.
4. Chat interno persistente + asistente de preguntas frecuentes y cesión a un asesor; bandeja de conversaciones en la intranet.
5. WhatsApp Business Platform con números, plantillas aprobadas y webhooks (no basta usar la app WhatsApp Business); CRM, campañas consentidas y notificaciones.

No inventamos una integración de WhatsApp Cloud API: **el enlace directo sí funciona con el número actual**, pero leer/enviar mensajes desde el sistema requerirá credenciales y autorización de Meta.

## Pruebas

```powershell
npm run check   # sintaxis JS
npm test        # pruebas unitarias de formato y contratos
npm run fix-images # vista previa de corrección de rutas de imagen
```

El ZIP no trae `node_modules` ni `package-lock.json` porque deben generarse con `npm install` en tu equipo. Antes de desplegar, conserva el `package-lock.json` que npm produzca para instalar versiones reproducibles.
