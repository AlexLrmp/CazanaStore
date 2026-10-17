# Cazana Store v4 — Revisión frente al brief y Figma

## Fuentes contrastadas
- Brief del cliente: `Cazana_Store_Brief.docx` (aportado en esta conversación).
- Diseño Figma: repo `AlexLrmp/CazanaStore-v1`, especialmente `src/pages/HomePage.tsx`, `src/components/Header.tsx`, `src/components/Footer.tsx`, `src/pages/CatalogPage.tsx`, `src/pages/ProductPage.tsx`, `src/pages/AccountPage.tsx`, `src/pages/AdminPage.tsx`, `src/data/products.ts`.
- Referencia de arquitectura JavaScript: repo `AlexLrmp/ShopWare`, módulos `utils`, `catalog`, `cart`, `auth`, `main`.
- Capturas enviadas por el usuario para home, catálogo y ficha de producto.

## Qué está implementado
| Requisito | Estado en v4 | Observaciones |
|---|---|---|
| Home: hero + valores + categorías | Visual | Referencia Figma; responsive |
| Más vendidos, novedades, ofertas | Demo | Datos de muestra, no inventario ni ofertas reales |
| Catálogo con filtros de categoría/precio/disponibilidad | Demo interactiva | Sidebar, chips, orden, buscador global |
| Ficha: galería, miniaturas, precio, cantidad | Demo interactiva | Miniaturas son recortes ilustrativos; reemplazar con fotos reales |
| Carrito y descuento | Demo interactiva | localStorage; cupón `DEMO10` sin validez comercial |
| Favoritos | Demo interactiva | Se guardan en el navegador; visibles en Mi cuenta |
| Reseñas | Demo interactiva | Comentarios de ejemplo y pruebas locales, no opiniones verificadas |
| Checkout | Vista previa sin cobros | No recoge ni transmite tarjetas, no genera pedido |
| Mi cuenta: pedidos/perfil/direcciones/favoritos | Navegable en modo visual | Sin autenticación; solo favoritos locales |
| Contacto | Vista y validación de formulario | Sin envío real; mensaje informa que canal no está activo |
| Nosotros | Redacción editorial | Historia oficial pendiente de aprobación |
| Admin: resumen, estadísticas, pedidos, inventario, contabilidad, atención | Demo interactiva | Datos completamente ficticios, sin contraseña local |
| Reportes | CSV de muestra | NO exporta reportes contables reales; PDF pendiente |
| Newsletter | Demo visual | No almacena emails |
| Soporte flotante | Demo informativa | No se presenta como un asesor real disponible |
| Pago seguro, tracking, WhatsApp y políticas | Pendiente de integración | Los beneficios publicitarios no se deben afirmar sin verificar |
| MongoDB, API, autenticación, roles | Diseño documentado | Aún NO conectado |

## Decisiones de diseño v4
1. Una sola búsqueda global en la cabecera; filtros del catálogo en sidebar y chips.
2. Reutilización del mismo sistema visual y el mismo archivo CSS base en todas las páginas, con `css/v4.css` para refinamientos.
3. La navegación entre HTML usa rutas relativas; el demo puede ejecutarse con Live Server o un servidor estático.
4. Favoritos y carrito usan almacenamiento local **solo en este prototipo**. En producción deberán vincularse con cuentas autenticadas y el backend.
5. Todo lo que afecte dinero, autorizaciones, descuentos, stock o pedidos será validado por el servidor en etapas posteriores.
6. Los dashboards son una **vista previa explícita**, no un panel administrativo seguro. No hay contraseña fija ni datos sensibles reales.

## Diferencias pendientes con Figma
- Figma original incluye widgets y composiciones de checkout/área de usuario más completos: en v4 esos flujos siguen siendo visuales.
- La identidad definitiva requiere logo vectorial aprobado y fotografías originales de productos; las imágenes actuales son ejemplos y algunos detalles son recortes de respaldo.
- Faltan fotografías multivista auténticas, reseñas de compras verificadas, soporte en línea, términos/privacidad, transportistas reales, envío internacional, gestión fiscal, devoluciones reales y pasarela de pagos.
- Exportación PDF y roles de acceso aún pendientes.

## Riesgos que no se deben trasladar de Figma/ShopWare
- Contraseña administrativa fija en el código (`src/pages/AdminPage.tsx` del diseño): eliminada del demo v4; no implementarla en producción.
- Pago simulado que parezca una compra real: v4 no acepta pagos ni finaliza pedidos.
- Las reseñas, recuentos, stocks y estadísticas del diseño son ficticios: identificarlos y sustituirlos después por registros reales.
- El frontend no debe ser fuente de verdad sobre precios, cupones, inventario, estados de pedidos ni permisos.
