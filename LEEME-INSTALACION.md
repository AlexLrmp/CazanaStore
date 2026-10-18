# Preparación para fotografías reales — Cazana Store

## Instalación rápida

1. Copia **todo** el contenido de este paquete a la carpeta actual de Cazana Store, junto al `index.html`.
2. Abre la terminal de VS Code en esa carpeta y ejecuta: `.\INSTALAR-FOTOS.cmd`. **No uses F5**.
3. Espera el mensaje `[OK]`. El instalador crea una carpeta hermana de respaldo y retira solo las ilustraciones viejas identificadas por su SHA.
4. Copia tus fotografías en `assets/banners/`, `assets/categorias/`, `assets/productos/<slug>/`.
5. Comprueba con `node tools/comprobar_fotos.cjs`.

El instalador no cambia nombres, precios, carrito ni estilos generales y mantiene `css/style.css` como **única** hoja CSS.
No hace `git push`.

Consulta `docs/05-GUIA-FOTOGRAFIAS-REALES.md` para las rutas y tamaños exactos.
