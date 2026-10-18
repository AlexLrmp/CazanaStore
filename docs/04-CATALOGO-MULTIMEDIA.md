# Catálogo multimedia Cazana Store

## Objetivo

Separar la *presentación* (HTML/CSS/JS) de los *datos* (productos, categorías y fotos). El frontend actual lee `window.CazanaData` desde `js/data.js` y las galerías desde `product.gallery`. No es necesario crear un HTML por producto.

## Organización estable de imágenes

```text
assets/
  banners/
    hero-hogar.webp
    hero-tecnologia.webp
    hero-cocina.webp
  categorias/
    hogar.webp
    tecnologia.webp
  productos/
    cafetera-espresso/
      principal.webp
      detalle.webp
      ambiente.webp
    aspiradora-robot/
      principal.webp
      detalle.webp
      ambiente.webp
    ... (12 carpetas, una por artículo demo)
    manifest.json
```

## Catálogo demo

Cada producto mantiene su `id`, `slug`, `name`, `price`, `image`, `fallback`, `gallery`, `details` y `reviews` en `js/data.js`. Son imágenes representativas, no fotografías verificadas de un modelo comercial.

## Diseño del backend pendiente

**Node.js + Express + MongoDB**. API prevista:

- `GET /api/products` listar productos activos con paginación.
- `GET /api/products/:slug` ficha, galería y stock.
- `POST /api/admin/products` crear producto, *solo personal autorizado*.
- `PATCH /api/admin/products/:id` modificar campos y stock según permisos.
- `POST /api/admin/products/:id/images` subir una o varias imágenes con validación de contenido y límites de tamaño.
- `PATCH /api/admin/products/:id/images/order` ordenar miniaturas.
- `DELETE /api/admin/products/:id/images/:imageId` desvincular imagen de un producto, evitando borrar recursos compartidos.

Ejemplo conceptual de documento MongoDB:

```json
{
  "sku": "CZ-HOG-001",
  "slug": "cafetera-espresso-premium",
  "name": "Cafetera Espresso Premium",
  "category": "hogar",
  "priceCents": 29990,
  "stock": {"quantity": 12},
  "images": [
    {"url": "https://cdn-ejemplo.invalid/cazana/cafetera/01.webp", "alt": "Cafetera en vista frontal", "order": 0, "primary": true},
    {"url": "https://cdn-ejemplo.invalid/cazana/cafetera/02.webp", "alt": "Detalle de controles", "order": 1, "primary": false}
  ],
  "active": true
}
```

Las URL son *ejemplos*, no destinos reales.

**Seguridad:** las cuentas de empleados y roles se verifican en el servidor. Los códigos no se usan como contraseñas. El Admin de demostración no debe recibir permisos efectivos hasta activar el backend autenticado. Nunca guardar claves ni cargar archivos con credenciales en el frontend.

## Reglas de imágenes reales

- Productos: fotografía verdadera del artículo ofrecido, evitando imágenes que representen otro modelo.
- Mantener original con derechos/permiso correspondiente y variantes comprimidas (`WebP`/`AVIF`) de 400, 800 y 1200 px.
- Dimensiones preferidas: producto cuadrado, 1000×1000 o superior; banner panorámico de 1600×800 o superior.
- Validar formato y tamaño en el servidor; no confiar en la extensión ni el nombre del archivo.
- Las variantes usan nombres/IDs únicos; no sobrescribir URLs de imágenes ya cacheadas.
- Guardar en MongoDB rutas y metadatos, no binarios de gran tamaño; almacenar binarios en servicio especializado.
