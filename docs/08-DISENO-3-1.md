# Cazana Store — Fase 3.1: refinamiento visual

## Alcance

Actualización visual para la versión de Cazana Store **con la Fase 3 de perfil y direcciones ya instalada**.

- Normaliza dimensiones y alineación de íconos del encabezado.
- Sustituye el ícono de carrito del encabezado por un SVG uniforme, en tienda e intranet.
- Reemplaza los emojis de entrega y escudo en la ficha de producto por SVG y modifica el texto para no insinuar que existe una pasarela de pago habilitada.
- Mejora las tarjetas de direcciones, botones de acciones y formulario, manteniendo los atributos `data-address-action` que utiliza el JavaScript.
- Refina superficies de cuenta, checkout, carrito y acciones privadas sin rehacer la maqueta original.
- Respeta tamaños pequeños, el foco de teclado y la preferencia de movimiento reducido.

### Instalación (PowerShell, raíz del proyecto)

Extraer los archivos manteniendo las rutas `tools/` y `docs/` junto a `index.html`.

1. Guardar los cambios locales actuales o hacer un commit de respaldo.
2. Comprobar antes de instalar:

   ```powershell
   node .\tools\aplicar-diseno-3-1.cjs --check
   ```

3. Aplicar:

   ```powershell
   node .\tools\aplicar-diseno-3-1.cjs
   ```

4. Refrescar en el navegador usando **Ctrl + Shift + R**. Si Node se reinicia por cambios, espera a que la terminal confirme la conexión. No es necesario volver a cargar datos ni instalar paquetes npm.

### Comprobaciones recomendadas

- `http://localhost:3000/cuenta.html#addresses`: icono SVG, tarjetas, botones Editar / Eliminar / Hacer principal y formulario.
- `http://localhost:3000/cuenta.html#profile`: guardar perfil.
- `http://localhost:3000/producto.html`: iconos de entrega y seguridad, favorito y carrito.
- `http://localhost:3000/checkout.html`: dirección predeterminada, formulario y envío de solicitud.
- `http://localhost:3000/staff`: encabezado y navegación sin alterar el catálogo.
- Móvil, tableta y escritorio; verificar a 390, 768 y 1440 px.

### Seguridad y compatibilidad

- El instalador **no se conecta a MongoDB** y no abre el archivo `.env`.
- No modifica rutas, claves, modelos, tablas/colecciones, reservas ni lógica de autenticación.
- Se ejecuta de forma **idempotente**: volver a ejecutarlo no duplica las reglas.
- Verifica la sintaxis del JavaScript antes de escribir y crea una copia de los archivos modificados en una carpeta temporal de Windows, informando su ruta.
- Si las funciones de la Fase 3 cambiaron significativamente en tu máquina, el instalador interrumpe la operación antes de modificar archivos. En ese caso, comparte **solo el mensaje de error** (sin contraseñas ni `.env`).
- Se mantiene un único CSS público: `css/style.css`; el CSS privado sigue cargando después y conserva su funcionalidad.
- No publicar cambios en GitHub hasta comprobarlos localmente.

### Limpieza

Una vez verificado, puedes dejar el instalador en `tools/` como referencia de la fase o eliminarlo. Los cambios siguen guardados en `css/style.css`, `js/main.js`, `js/pages/customer-profile.js` y el HTML de las páginas que usan el encabezado común.
