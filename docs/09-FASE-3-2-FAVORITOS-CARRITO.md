# Cazana Store · Fase 3.2 — Carrito y favoritos en MongoDB

## Alcance

El diseño de Cazana no cambia. Se añaden operaciones de carrito y favoritos para cada cliente autenticado mediante cookie httpOnly. El visitante continúa utilizando `localStorage`. Al iniciar sesión por primera vez, se combinan los artículos del navegador con los del servidor y se eliminan duplicados (en coincidencias se usa la cantidad mayor, hasta 20). Los pedidos se siguen cobrando **fuera** de la web: se registran como solicitudes y sus importes los valida el servidor.

La API no acepta `customerId`, precio, SKU, importe ni inventario del navegador: resuelve los identificadores y datos de productos contra MongoDB y comprueba que siguen publicados. Cada usuario tiene un único documento de compras; los cambios llevan un contador `revision` para evitar sobrescrituras silenciosas desde otra pestaña. En caso de conflicto, actualiza la página. La sincronización usa el evento `focus`/`visibilitychange`, no conexiones permanentes.

## Antes de instalar

1. Guarda los cambios de VS Code y confirma un commit de respaldo.
2. Detén el servidor con Ctrl+C.
3. Copia el contenido del ZIP (`tools/` y `docs/`) en la raíz del proyecto, **sin borrar carpetas existentes**.
4. NO copies ni compartas `backend/.env`. El instalador no lo necesita ni lo modifica.

Desde la raíz donde está `index.html`:

```powershell
node .\tools\aplicar-fase-3-2.cjs --check
node .\tools\aplicar-fase-3-2.cjs
cd backend
npm.cmd test
npm.cmd run indexes
npm.cmd run dev
```

El instalador comprueba los puntos de inserción antes de escribir. Si encuentra una versión local incompatible se detiene sin modificar nada. Las copias anteriores se guardan en una carpeta temporal fuera del repositorio. Se puede comprobar de nuevo con `--check` para ver qué archivos detecta.

## Rutas nuevas (solo clientes autenticados)

- `GET /api/me/shopping` -> `{revision, cart:[{id,qty,stockQty,priceCents,available}], favorites:[id]}`.
- `PUT /api/me/shopping/cart` -> `{revision, items:[{id,qty}]}`.
- `PUT /api/me/shopping/favorites` -> `{revision, ids:[id]}`.
- `POST /api/me/shopping/merge` -> `{cart:[{id,qty}],favorites:[id]}`. Solo el navegador de un cliente recién autenticado necesita combinar los datos de invitado.

Los POST y PUT requieren cabecera de protección `X-Cazana-Request: 1`, la sesión por cookie y un origen válido (política actual del proyecto). Un cliente no puede elegir el usuario a modificar ni ejecutar operaciones administrativas desde estas rutas.

## Pruebas visuales sin crear pedidos

1. Con el servidor iniciado, entra a `http://localhost:3000` e inicia sesión en Mi cuenta.
2. En Tienda, añade un producto a favoritos y otro al carrito. Vuelve a Mi cuenta > Favoritos y comprueba el producto. En Carrito comprueba cantidad y subtotal.
3. Actualiza el navegador: las selecciones deben permanecer.
4. Abre una pestaña privada y entra con la misma cuenta. Deben verse los mismos favoritos y productos al abrir la tienda. Tras modificar algo en una pestaña, vuelve a enfocar la otra para refrescar.
5. Cierra sesión y comprueba que no quedan a la vista los favoritos privados de la cuenta anterior. Como visitante puedes seguir usando favoritos y carrito sin iniciar sesión.
6. En MongoDB Compass, actualiza `cazana_store`. Aparecerá la colección `customershoppings` cuando se haya autenticado un cliente con el servidor actualizado. Abre el documento: `customerId` identifica la cuenta; `cart` lista IDs de productos y cantidades; `favorites` contiene referencias a productos; `revision` aumenta con cada cambio.
7. Si tienes artículos como visitante, inicia sesión. Se combinarán **una sola vez** con los artículos de la cuenta.

## Qué no se modifica

- El diseño premium `css/style.css`, ficha del producto, direcciones, perfil, checkout, intranet y archivos multimedia.
- Clientes, contraseñas, pedidos ya realizados y existencias de MongoDB.
- Flujo de pagos: Cazana continúa sin cobrar en línea.

## Limitaciones conocidas

- El servidor debe estar en ejecución (`localhost:3000`). GitHub Pages sigue mostrando únicamente la versión estática: no es un hosting para la API privada.
- El catálogo puede cambiar mientras un cliente tiene su carrito guardado: el servidor valida precio y stock nuevamente al registrar el pedido. Un producto desactivado puede dejar de aparecer en el carrito.
- El cliente usa una instantánea local de su estado mientras sincroniza. Si se pierde internet, los cambios pueden quedar pendientes de reenvío en el mismo navegador. La interfaz avisa si no puede sincronizar.
- En cambios simultáneos entre varias pestañas se prioriza evitar la pérdida silenciosa: un conflicto 409 requiere refrescar y repetir la operación.
- Los cupones de demostración no generan descuentos reales. Las promociones verificadas desde backend se implementarán en una fase posterior.

## Seguridad y Git

No subas a GitHub: `backend/.env`, `backend/node_modules`, respaldos, credenciales de Atlas o datos de clientes. Después de comprobar la funcionalidad ejecuta `git status`, revisa los cambios y haz el commit desde la raíz. El script de instalación y sus archivos fuente se pueden eliminar del directorio `tools/fase-3-2/` después de la instalación; lo que permanezca en `backend/src`, `backend/routes`, `backend/test` y `js/services` es código de producción/pruebas que sí debes conservar.
