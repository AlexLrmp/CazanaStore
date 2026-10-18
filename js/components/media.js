/**
 * Cazana Store · Gestor temporal de fotografías (sin servidor ni dependencias).
 * Permite colocar principal.jpg, principal.png, principal.webp o principal.avif
 * sin cambiar las rutas que guardamos en el catálogo.
 * Cuando no hay imagen muestra un marcador neutro, nunca otro producto.
 * En producción la API del Admin devolverá la URL real ya validada.
 */
(() => {
  'use strict';
  const EMPTY = 'assets/placeholders/foto-pendiente.svg';
  const EXTENSIONS = ['webp', 'jpg', 'jpeg', 'png', 'avif'];
  const requests = new Map();
  const isWebPath = p => /^https?:\/\//i.test(p) || /^(?:blob:|data:)/i.test(p);

  function variants(path) {
    const value = String(path || '').trim();
    if (!value || value === EMPTY) return [];
    if (isWebPath(value)) return [value];
    const match = value.match(/^(.*)\.(webp|jpe?g|png|avif)(\?[^#]*)?(#.*)?$/i);
    if (!match) return [value];
    const stem = match[1];
    const suffix = (match[3] || '') + (match[4] || '');
    const candidates = [value, ...EXTENSIONS.map(ext => `${stem}.${ext}${suffix}`)];
    return [...new Set(candidates)];
  }

  function canLoad(path) {
    return new Promise(resolve => {
      const probe = new Image();
      probe.onload = () => resolve(true);
      probe.onerror = () => resolve(false);
      probe.src = path;
    });
  }

  async function resolve(path) {
    const key = String(path || '');
    if (!requests.has(key)) {
      requests.set(key, (async () => {
        for (const candidate of variants(key)) {
          if (await canLoad(candidate)) return { found: true, src: candidate };
        }
        return { found: false, src: EMPTY };
      })());
    }
    return requests.get(key);
  }

  // Los <img> renderizados dinámicamente por JS también están cubiertos.
  document.addEventListener('error', async event => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    const current = img.getAttribute('src');
    if (!current || current === EMPTY || img.dataset.photoPending === 'true') return;
    const original = img.dataset.photoOriginal || current;
    img.dataset.photoOriginal = original;
    const result = await resolve(original);
    if (!img.isConnected || img.dataset.photoOriginal !== original) return;
    if (!result.found) {
      img.dataset.photoPending = 'true';
      img.closest('.hero-slide')?.classList.add('is-photo-missing');
      img.src = EMPTY;
    } else if (img.getAttribute('src') !== result.src) {
      img.src = result.src;
    }
  }, true);

  // Etiquetas discretas para los slides cuya fotografía todavía no se ha añadido.
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.hero-slide').forEach((slide, i) => {
      slide.dataset.photoLabel = ['Imagen de hogar pendiente', 'Imagen de cocina pendiente', 'Imagen de tecnología pendiente'][i] || 'Imagen pendiente';
    });
  });

  window.CazanaMedia = Object.freeze({ resolve, placeholder: EMPTY });
})();
