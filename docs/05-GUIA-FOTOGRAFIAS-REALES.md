# Cazana Store — Guía para colocar fotografías reales

## 1. Aplicar la corrección

1. Guarda todos los archivos de VS Code. No subas todavía el catálogo ilustrado anterior a GitHub.
2. Extrae el ZIP **dentro de la carpeta raíz de CazanaStore** (donde está `index.html`). Permite combinar carpetas `assets`, `js`, `tools` y `docs`. No borres las carpetas originales.
3. Abre la terminal PowerShell de VS Code y ejecuta `.\INSTALAR-FOTOS.cmd`. No uses F5.
4. El instalador conserva respaldos **fuera del repositorio**, en una carpeta hermana de tu CazanaStore.
5. Abre `index.html`, `tienda.html` y `producto.html?id=h1` usando **Live Server**, no es necesario que uses directamente `file:///`.
6. Para comprobar el estado de las fotos: `node tools/comprobar_fotos.cjs`.

Si aún no subiste ninguna fotografía, verás el marcador neutro **FOTOGRAFÍA PENDIENTE**. Es intencional: evita ilustraciones falsas o fotos de otro producto.

## 2. Cómo reemplazar fotos (sin editar el código)

- **Banners**: guarda 3 imágenes horizontales en `assets/banners/` con nombres `hero-hogar`, `hero-cocina`, `hero-tecnologia` y extensión **.webp, .jpg, .jpeg, .png o .avif**.
- **Categorías**: guarda `hogar` y `tecnologia` dentro de `assets/categorias/`.
- **Productos**: guarda `principal`, `detalle`, `ambiente` en cada carpeta indicada abajo. Si solo tienes una foto, basta `principal.jpg`: el sitio mostrará esa imagen sin inventar miniaturas adicionales.
- Respeta minúsculas y guiones en los nombres. **No dejes varias extensiones del mismo nombre** (por ejemplo, `principal.webp` y `principal.jpg`): se utilizará primero WebP.
- Puedes usar fotografías originales, del proveedor o con permiso de uso. Evita fotos ajenas que representen modelos distintos.

## 3. Dimensiones recomendadas

| Ubicación | Resolución | Relación | Contenido recomendado |
|---|---:|---|---|
| Carrusel | 1920 × 900 | 2,13:1 | Composición horizontal, espacio oscuro a la izquierda para el texto. **No deformes** la foto; recorta si es necesario. |
| Categorías | 1600 × 1100 | 1,45:1 | Ambiente del área, sin textos incrustados |
| Producto principal | 1200 × 1200 | 1:1 | Producto completo, centrado, fondo limpio |
| Detalle / ambiente | 1200 × 1200 | 1:1 | Otra vista real del **mismo modelo**, detalles o contexto |

## 4. Directorios para los 12 productos

| Carpeta en `assets/productos/` | Qué fotografía buscar |
|---|---|
| `cafetera-espresso/` | Cafetera Espresso Premium 1200W |
| `sabanas-egipcias/` | Set de Sábanas Egipcias 1000 Hilos |
| `juego-ollas-inox/` | Juego de Ollas Inox 12 Piezas |
| `audifonos-inalambricos/` | Auriculares Noise Cancelling Pro X |
| `smartwatch-serie-7/` | Smartwatch Serie 7 Ultra AMOLED |
| `lampara-piso-led/` | Lámpara de Piso LED Regulable |
| `aspiradora-robot/` | Aspiradora Robot Smart WiFi |
| `tablet-2k/` | Tablet 10.4" 2K 256GB + Lápiz |
| `licuadora-alta-potencia/` | Licuadora de Alta Potencia 1500W |
| `laptop-ultradelgada/` | Laptop Ultradelgada 14" Core i7 |
| `parlante-bluetooth/` | Parlante Bluetooth 360° Waterproof |
| `camara-seguridad-wifi/` | Cámara de Seguridad WiFi 4K |

En cada carpeta coloca, por ejemplo:

```text
assets/productos/cafetera-espresso/
  principal.jpg      # obligatorio para mostrar el producto real
  detalle.jpg        # opcional: ángulo o acabado
  ambiente.jpg       # opcional: mismo producto en uso
```

### ¿Qué debe buscarse para cada producto?

- **Cafetera:** máquina de espresso compacta (no solo una taza de café).
- **Sábanas:** un juego de cama o paquete reconocible.
- **Ollas:** juego de ollas inoxidables, preferentemente todas las piezas.
- **Audífonos:** auriculares over-ear con cancelación de ruido.
- **Smartwatch:** reloj inteligente con pantalla visible.
- **Lámpara:** lámpara de pie regulable, no sofá o lámpara de mesa.
- **Aspiradora:** robot aspirador circular, no aspiradora manual.
- **Tablet:** tableta y lápiz digital cuando corresponda.
- **Licuadora:** licuadora eléctrica completa, no juego de ollas.
- **Laptop:** computadora portátil de 14 pulgadas.
- **Parlante:** altavoz Bluetooth portátil, no audífonos.
- **Cámara:** cámara de seguridad Wi-Fi, no una laptop.

## 5. Galerías, fallback y futuro Admin

- Las miniaturas se construyen **solo con fotografías disponibles**. Si faltan las tres, aparece un marcador neutro y los botones anterior/siguiente se ocultan.
- Un detector de archivos prueba **WebP → JPG → JPEG → PNG → AVIF** tras fallar la ruta declarada. Esto es un mecanismo transitorio para la demo; en MongoDB cada imagen tendrá URL real y no necesitaremos tantear extensiones.
- El instalador **retira únicamente** las imágenes anteriores cuyos hash SHA-256 corresponden exactamente a las ilustraciones del paquete. Nunca elimina una fotografía tuya con contenido diferente.
- Cuando el empleado tenga el panel Admin real, subirá/reordenará imágenes desde un formulario: **API valida y guarda los archivos**, y MongoDB conserva sus URL. Esa parte aún no está implementada; requiere backend, autenticación y almacenamiento.

## 6. Publicar después de revisar

```powershell
git status
git add -A
git commit -m "Preparar Cazana para fotografias reales y galerias dinamicas"
git push
```

**Nota:** las imágenes faltantes se verán como pendientes en GitHub Pages hasta que subas las fotografías, así que incorpora al menos las fotos principales antes de publicar si quieres que el sitio se vea terminado.
