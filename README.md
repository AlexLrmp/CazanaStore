# Cazana Store v4 — frontend premium y panel de muestra

Versión visual reconstruida en **HTML + CSS + JavaScript**, basada en el brief de marca, el proyecto Figma (`CazanaStore-v1`) y la arquitectura modular de ShopWare.

## Cómo abrirla
1. Descomprime `CazanaStore-v4.zip`.
2. Abre la carpeta `CazanaStore-v4`.
3. Ejecuta **`index.html`** con tu navegador.
4. También puedes abrir `tienda.html`, `producto.html?id=t1`, `cuenta.html`, `carrito.html`, `checkout.html` y `admin.html`.

**Recomendado (VS Code):** abre la carpeta con Visual Studio Code, instala Live Server y selecciona **Open with Live Server** en `index.html`. También puedes usar Python (desde la carpeta):

```bash
python -m http.server 5500
```

Luego abre `http://localhost:5500`.

## Novedades respecto a v3
- Inicio y cabecera pulidos; una sola búsqueda global.
- Catálogo profesional con sidebar, chips, filtros de precio/categoría/disponibilidad, y ordenamiento.
- Ficha con galería de tres imágenes, miniaturas, selector de cantidad, favoritos, comentarios de prueba y productos relacionados.
- Carrito con cupón **DEMO10** (solo para probar descuentos) y vista previa de checkout.
- Mi cuenta con navegación por pedidos, favoritos, perfil y direcciones; favoritos visibles desde el header.
- Contacto y Nosotros con diseño propio en lugar de párrafos de trabajo pendiente.
- Admin navegable con resumen, estadísticas, pedidos, inventario, contabilidad y bandeja de atención; exporta archivos CSV **de muestra**.
- Avisos breves y naturales para funciones aún no habilitadas.

## Estado real — importante
Esta entrega es **solo frontend**. No está conectada a MongoDB ni a una API. No crea cuentas de clientes, no cobra dinero, no guarda pedidos reales y no ofrece acceso seguro de administrador.

Los valores de ventas, inventario, reseñas, promociones, clientes y estados del panel son **ficticios**, para evaluar la composición y los futuros reportes.

El carrito, los favoritos, el cupón DEMO10 y los comentarios escritos desde la ficha se guardan localmente en el navegador para pruebas. No deben considerarse parte de un sistema de ventas seguro. El checkout no procesa tarjetas ni pagos.

## Estructura
```
CazanaStore-v4/
├── index.html                 Inicio
├── tienda.html                Catálogo y filtros
├── producto.html              Ficha enriquecida
├── carrito.html               Carrito y cupón demo
├── checkout.html              Vista de checkout (sin cobros)
├── cuenta.html                Mi cuenta + favoritos
├── admin.html                 Dashboard de ejemplo
├── contacto.html              Formulario visual
├── nosotros.html              Presentación editorial
├── css/
│   ├── style.css              Base heredada de v3
│   └── v4.css                 Refinamientos y páginas nuevas
├── js/
│   ├── data.js                Datos ficticios para la fase visual
│   ├── main.js                Catálogo, filtros, carrito, favoritos
│   ├── pages/
│   │   ├── account.js         Vistas de cuenta
│   │   ├── admin.js           Panel y CSV de muestra
│   │   ├── contact.js         Mensaje informativo
│   │   └── checkout.js        Resumen de compra de prueba
│   └── services/
│       └── api.js             Contrato sugerido (sin conectar)
├── assets/                    Imágenes ilustrativas locales
└── docs/
    ├── 01-REVISION-V4.md      Estado frente al brief/Figma
    └── 02-MONGODB-PLAN.md     Colecciones, relaciones y APIs
```

## Próxima fase: MongoDB
Revisar `docs/02-MONGODB-PLAN.md` para construir la API con Node.js + Express y MongoDB + Mongoose en JavaScript. No se requiere TypeScript, React, TSX ni un framework adicional para la interfaz.

Las páginas públicas necesitarán después datos de productos, inventario y promociones de la API. El panel administrativo requerirá inicio de sesión seguro, roles y agregaciones de MongoDB. El frontend **nunca** debe decidir el precio definitivo ni marcar pedidos como pagados.

## Fuente del diseño
- Brief adjunto de Cazana Store.
- https://github.com/AlexLrmp/CazanaStore-v1 (Figma exportado a React; solo referencia de diseño).
- https://github.com/AlexLrmp/CazanaStore-Prototipo- (prototipo HTML/CSS previo).
- https://github.com/AlexLrmp/ShopWare (organización de JavaScript y funcionalidades demo).

*No se modificó ni se subió nada a GitHub en esta entrega.*
