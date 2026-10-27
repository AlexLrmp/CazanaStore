/* CAZANA-FASE-3-2 */
(() => {
  'use strict';

  const products = Array.isArray(window.CazanaData) ? window.CazanaData : [];
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const money = n => 'S/ ' + Number(n || 0).toFixed(2);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, ch => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[ch]));
  const K = { cart:'cazana_cart', wishlist:'cazana_wishlist', reviews:'cazana_reviews' };
  const getStore = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
  const setStore = (k, val) => { try { localStorage.setItem(k, JSON.stringify(val)); } catch { /* Vista local sin almacenamiento persistente */ } };
  let cart = getStore(K.cart, []);
  let wishlist = getStore(K.wishlist, []);
  let renderCartPage = () => {};

  const heartSvg = () => `
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>
    </svg>`;

  const toast = msg => {
    const el = $('#toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2200);
  };

  const saveCart = () => { setStore(K.cart, cart); refreshCounts(); return window.CazanaShopping?.setCart(cart); };
  const saveWishlist = () => { setStore(K.wishlist, wishlist); refreshCounts(); updateWishButtons(); return window.CazanaShopping?.setFavorites(wishlist); };
  const addToCart = (id, qty = 1) => {
    const line = cart.find(x => x.id === id);
    if (line) line.qty = Math.min(20,line.qty+qty); else cart.push({ id, qty:Math.min(20,qty) });
    const pending=saveCart();
    toast('Producto añadido a tu carrito.');
    return pending;
  };
  const toggleWishlist = id => {
    wishlist = wishlist.includes(id) ? wishlist.filter(x => x !== id) : [...wishlist, id];
    saveWishlist();
    toast(wishlist.includes(id) ? 'Agregado a favoritos.' : 'Eliminado de favoritos.');
  };

  const productIndex = new Map(products.map(p => [p.id, p]));
  const productById = id => productIndex.get(id);
  const avgRating = p => p.rating || 4.8;
  let reviewCache = getStore(K.reviews, {});
  const reviewCount = p => {
    const customLen = (reviewCache[p.id] || []).length;
    return Number(p.reviewCount || 0) + customLen;
  };
  const getAllReviews = p => {
    const persisted = (reviewCache[p.id] || []).map(x => ({ ...x, persisted: true }));
    return [...(p.reviews || []), ...persisted];
  };
  const stars = n => `<span class="stars">${'★'.repeat(Math.round(n))}</span>`;

  function currentImage(p) {
    return Array.isArray(p.gallery) && p.gallery.length ? p.gallery[0] : p.image;
  }

  function card(p) {
    const badge = p.isOffer ? `<span class="tag">-${Math.round((1 - p.price / p.originalPrice) * 100)}%</span>` : (p.isNew ? '<span class="tag new">NUEVO</span>' : '');
    const old = p.originalPrice ? `<span class="old-price">${money(p.originalPrice)}</span>` : '';
    const fav = wishlist.includes(p.id);
    return `
      <article class="product-card">
        <div class="product-img-wrap">
          ${badge}
          <a href="producto.html?id=${encodeURIComponent(p.id)}"><img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"></a>
          <button class="heart-button ${fav ? 'selected' : ''}" type="button" data-wish="${esc(p.id)}" aria-label="${fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}">${heartSvg()}</button>
          <button class="card-add" type="button" data-add="${esc(p.id)}">Agregar</button>
        </div>
        <div class="product-body">
          <p class="product-category">${esc(p.subcategory)}</p>
          <h3 class="product-name"><a href="producto.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3>
          <div>${stars(avgRating(p))}<span class="review-count">(${reviewCount(p)}) <small class="demo-mini">de muestra</small></span></div>
          <div class="price-line"><span class="current-price">${money(p.price)}</span>${old}</div>
        </div>
      </article>`;
  }

  function populate(sel, list) {
    const root = $(sel);
    if (!root) return;
    root.innerHTML = list.map(card).join('');
  }

  function refreshCounts() {
    const total = cart.reduce((sum, x) => sum + x.qty, 0);
    const cartCount = $('#cart-count');
    const wishCount = $('#wishlist-count');
    if (cartCount) { cartCount.hidden = !total; cartCount.textContent = String(total); }
    if (wishCount) { wishCount.hidden = !wishlist.length; wishCount.textContent = String(wishlist.length); }
  }

  function updateWishButtons() {
    $$('[data-wish]').forEach(btn => {
      const active = wishlist.includes(btn.dataset.wish);
      btn.classList.toggle('selected', active);
      btn.setAttribute('aria-label', active ? 'Quitar de favoritos' : 'Agregar a favoritos');
    });
  }

  function activateMenuAndSupport() {
    const menu = $('#menu-button');
    const nav = $('#nav-bar');
    menu?.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      menu.setAttribute('aria-expanded', String(open));
    });
    const support = $('#support-panel');
    const fab = $('#support-toggle');
    const close = $('#support-close');
    const setOpen = v => { support?.classList.toggle('open', v); fab?.setAttribute('aria-expanded', String(v)); };
    fab?.addEventListener('click', () => setOpen(!support.classList.contains('open')));
    close?.addEventListener('click', () => setOpen(false));
    document.querySelector('[data-wishlist-open]')?.addEventListener('click', () => {
      location.href = 'cuenta.html#favoritos';
    });
  }

  function bindGlobalForms() {
    $$('[data-search-form]').forEach(form => {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const q = form.elements.q.value.trim();
        if (q) location.href = 'tienda.html?q=' + encodeURIComponent(q);
      });
    });
    $$('[data-newsletter]').forEach(form => {
      form.addEventListener('submit', e => {
        e.preventDefault();
        toast('La suscripción estará disponible próximamente.');
        form.reset();
      });
    });
  }

  function syncNavActive() {
    const page = location.pathname.split('/').pop() || 'index.html';
    $$('.nav-list a').forEach(a => {
      const href = a.getAttribute('href') || '';
      const isActive = (page === 'tienda.html' && href.startsWith('tienda.html') && location.search.includes('category=tecnologia') && href.includes('category=tecnologia'))
        || (page === 'tienda.html' && href.startsWith('tienda.html') && location.search.includes('category=hogar') && href.includes('category=hogar'))
        || (page === 'nosotros.html' && href === 'nosotros.html')
        || (page === 'contacto.html' && href === 'contacto.html');
      if (isActive) a.classList.add('active');
    });
  }

  function showShop() {
    const root = $('#shop-products');
    const form = $('#shop-filters');
    if (!root || !form) return;

    const params = new URLSearchParams(location.search);
    const title = $('#shop-title');
    const intro = $('#shop-intro');
    const count = $('#shop-count');
    const sort = $('#shop-sort');

    const setRadio = (name, val) => {
      const target = Array.from(form.querySelectorAll(`input[name="${name}"]`)).find(input => input.value === val);
      if (target) target.checked = true;
    };

    if (params.get('category')) setRadio('category', params.get('category')); else setRadio('category', '');
    if (params.get('price')) setRadio('price', params.get('price')); else setRadio('price', '');
    form.elements.offers.checked = params.get('offers') === '1';
    form.elements.new.checked = params.get('new') === '1';
    form.elements.available.checked = true;
    sort.value = params.get('sort') || 'relevance';

    const q = (params.get('q') || '').trim().toLowerCase();
    const pageTitles = {
      hogar: ['Hogar', 'Explora artículos para sala, cocina, dormitorio y más.'],
      tecnologia: ['Tecnología', 'Una selección de gadgets y accesorios con estética premium.'],
      offers: ['Ofertas', 'Oportunidades seleccionadas para ti.'],
      new: ['Nuevos ingresos', 'Lo más reciente del catálogo visual de Cazana Store.'],
      all: ['Tienda Cazana', 'Encuentra detalles para tu hogar y tecnología para cada día.']
    };

    function getRadioValue(name) {
      return form.querySelector(`input[name="${name}"]:checked`)?.value || '';
    }

    function applyChip(type) {
      if (type === 'all') { setRadio('category', ''); form.elements.offers.checked = false; form.elements.new.checked = false; }
      if (type === 'hogar' || type === 'tecnologia') setRadio('category', type);
      if (type === 'offers') form.elements.offers.checked = true;
      if (type === 'new') form.elements.new.checked = true;
      render();
    }

    $$('#chipbar .chip').forEach(btn => btn.addEventListener('click', () => applyChip(btn.dataset.chip)));
    form.addEventListener('input', render);
    form.addEventListener('reset', () => setTimeout(() => { form.elements.available.checked = true; sort.value = 'relevance'; render(); }, 0));
    sort.addEventListener('change', render);

    function render() {
      const category = getRadioValue('category');
      const price = getRadioValue('price');
      const onlyOffers = form.elements.offers.checked;
      const onlyNew = form.elements.new.checked;
      const onlyAvailable = form.elements.available.checked;
      const sortBy = sort.value;

      let filtered = products.filter(p => {
        const hayQ = !q || `${p.name} ${p.category} ${p.subcategory} ${p.description}`.toLowerCase().includes(q);
        const hayCat = !category || p.category === category;
        const hayOffers = !onlyOffers || p.isOffer;
        const hayNew = !onlyNew || p.isNew;
        const hayAvail = !onlyAvailable || p.stock !== false;
        let hayPrice = true;
        if (price === '0-100') hayPrice = p.price <= 100;
        else if (price === '100-200') hayPrice = p.price > 100 && p.price <= 200;
        else if (price === '200-400') hayPrice = p.price > 200 && p.price <= 400;
        else if (price === '400-plus') hayPrice = p.price > 400;
        return hayQ && hayCat && hayOffers && hayNew && hayAvail && hayPrice;
      });

      if (sortBy === 'price-asc') filtered.sort((a, b) => a.price - b.price);
      else if (sortBy === 'price-desc') filtered.sort((a, b) => b.price - a.price);
      else if (sortBy === 'popular') filtered.sort((a, b) => reviewCount(b) - reviewCount(a));
      else if (sortBy === 'rating') filtered.sort((a, b) => avgRating(b) - avgRating(a));

      root.innerHTML = filtered.length ? filtered.map(card).join('') : '<div class="empty-state"><h3>Sin resultados</h3><p>Prueba ajustando los filtros o vuelve al catálogo completo.</p></div>';
      count.textContent = `${filtered.length} producto${filtered.length === 1 ? '' : 's'} encontrados`;

      let key = 'all';
      if (onlyOffers) key = 'offers';
      else if (onlyNew) key = 'new';
      else if (category) key = category;
      if (q) {
        title.textContent = `Resultados para “${params.get('q')}”`;
        intro.textContent = `${filtered.length} coincidencias dentro del catálogo visual.`;
      } else {
        title.textContent = pageTitles[key][0];
        intro.textContent = pageTitles[key][1];
      }

      $$('#chipbar .chip').forEach(chip => chip.classList.toggle('is-active', chip.dataset.chip === key || (key === 'all' && chip.dataset.chip === 'all')));
      updateWishButtons();
    }
    render();
  }

  function relatedProducts(current) {
    return products.filter(p => p.id !== current.id && (p.category === current.category || p.subcategory === current.subcategory)).slice(0, 4);
  }

  function renderReviews(product) {
    const list = getAllReviews(product);
    const summary = list.length ? (list.reduce((sum, x) => sum + (x.rating || 0), 0) / list.length).toFixed(1) : (product.rating || 4.8).toFixed(1);
    return `
      <section class="product-extra-section">
        <div class="section-head"><div><p class="eyebrow">Experiencias de muestra</p><h2 class="section-title">Reseñas y comentarios</h2><p class="reviews-disclaimer">Opiniones ilustrativas para explorar el diseño de la tienda.</p></div><div class="review-summary-badge">${summary} / 5 · ${list.length} opiniones</div></div>
        <div class="product-review-layout">
          <div class="reviews-grid compact">${list.map(r => `
            <article class="review-card small">
              <div class="review-card-stars">${stars(r.rating || 5)} <span>Opinión de muestra</span></div>
              <blockquote>“${esc(r.text)}”</blockquote>
              <div class="review-user"><div class="review-avatar">${esc((r.name || 'C').charAt(0))}</div><div><b>${esc(r.name || 'Cliente')}</b><span>${esc(r.city || 'Visitante')}</span></div></div>
            </article>`).join('')}</div>
          <form id="review-form" class="review-form card-surface">
            <div class="review-form-intro"><span class="review-form-icon">✎</span><div><p class="eyebrow">TU EXPERIENCIA</p><h3>Comparte tu opinión</h3><p>Nos ayuda a seguir mejorando.</p></div></div>
            <label class="text-field"><span>Nombre</span><input name="name" required placeholder="Tu nombre"></label>
            <label class="text-field"><span>Ciudad</span><input name="city" required placeholder="Ciudad, país"></label>
            <div class="rating-field"><span class="rating-label">Calificación</span>
              <div class="star-picker" role="radiogroup" aria-label="Calificación de la reseña">
                ${[1,2,3,4,5].map(n => `<label class="rating-star is-on" aria-label="${n} ${n===1?'estrella':'estrellas'}"><input type="radio" name="rating" value="${n}" ${n===5?'checked':''} aria-label="${n} ${n===1?'estrella':'estrellas'}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 2 3.1 6.4 7.1 1-5.1 4.9 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5.1-4.9 7.1-1L12 2Z"/></svg></label>`).join('')}
              </div>
              <span class="rating-feedback" aria-live="polite">5 de 5 estrellas</span>
            </div>
            <label class="text-field"><span>Comentario</span><textarea name="text" required placeholder="Cuéntanos tu experiencia"></textarea></label>
            <button class="btn btn-charcoal" type="submit">Publicar reseña</button>
            <small>Esta opinión de prueba se guarda únicamente en tu navegador.</small>
          </form>
        </div>
      </section>`;
  }

  function showProduct() {
    const root = $('#product-detail');
    if (!root) return;
    const id = new URLSearchParams(location.search).get('id') || products[0]?.id;
    const product = productById(id);
    if (!product) {
      root.innerHTML = '<div class="empty-state"><h3>Producto no encontrado</h3><p><a href="tienda.html">Volver a la tienda</a></p></div>';
      return;
    }

    const save = product.originalPrice ? product.originalPrice - product.price : 0;
    const requestedGallery = product.gallery?.length ? product.gallery : [product.image];
    let gallery = [];
    const related = relatedProducts(product);

    root.innerHTML = `
      <article class="product-detail-page">
        <div class="product-breadcrumbs"><a href="index.html">Inicio</a><span>›</span><a href="tienda.html?category=${encodeURIComponent(product.category)}">${esc(product.category)}</a><span>›</span><strong>${esc(product.name)}</strong></div>
        <div class="product-top">
          <div class="product-gallery card-surface">
            <div class="gallery-stage-wrap">
              ${product.isOffer ? `<span class="tag stage-tag">-${Math.round((1 - product.price / product.originalPrice) * 100)}% OFF</span>` : ''}
              <img id="product-main-image" class="gallery-stage" src="${window.CazanaMedia.placeholder}" alt="Fotografía pendiente de ${esc(product.name)}">
              <button class="gallery-nav gallery-prev" type="button" data-gallery-nav="-1" aria-label="Imagen anterior"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m14 18-6-6 6-6"/></svg></button>
              <button class="gallery-nav gallery-next" type="button" data-gallery-nav="1" aria-label="Imagen siguiente"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m10 18 6-6-6-6"/></svg></button>
            </div>
            <div class="gallery-thumbs"><p class="gallery-photo-note">Buscando fotografías disponibles…</p></div>
          </div>
          <div class="product-summary">
            <p class="eyebrow">${esc(product.subcategory)}</p>
            <h1>${esc(product.name)}</h1>
            <div class="product-rating-line">${stars(avgRating(product))}<strong>${avgRating(product).toFixed(1)}</strong><span>(${reviewCount(product)} valoraciones de muestra)</span></div>
            <div class="product-price-line"><span class="product-main-price">${money(product.price)}</span>${product.originalPrice ? `<span class="product-old-price">${money(product.originalPrice)}</span><span class="product-save">Ahorras ${money(save)}</span>` : ''}</div>
            <p class="stock-line ${product.stock !== false ? 'ok' : ''}">${product.stock !== false ? '● Disponibilidad por confirmar' : '● No disponible'}</p>
            <p class="product-description">${esc(product.description)}</p>
            <ul class="feature-list">${(product.details || []).map(item => `<li>${esc(item)}</li>`).join('')}</ul>
            <div class="purchase-row">
              <div class="qty-box" data-qty-box><button type="button" data-qty="-1">−</button><span id="qty-value">1</span><button type="button" data-qty="1">+</button></div>
            </div>
            <div class="cta-row">
              <button class="btn btn-green grow" type="button" data-buy-now="${esc(product.id)}">Comprar Ahora</button>
              <button class="btn btn-outline grow" type="button" data-add-qty="${esc(product.id)}">Agregar al Carrito</button>
              <button class="icon-circle ${wishlist.includes(product.id) ? 'selected' : ''}" type="button" data-wish="${esc(product.id)}" aria-label="Favorito">${heartSvg()}</button>
            </div>
            <!-- CAZANA-DISENO-3-1:CONFIANZA -->
            <div class="trust-box" aria-label="Información de entrega y solicitud">
              <div class="trust-item"><span class="trust-icon"><svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M14 9h4l4 4v4h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg></span><div><strong>Entrega coordinada</strong><small>Consulta cobertura y plazos según tu destino.</small></div></div>
              <div class="trust-item"><span class="trust-icon"><svg aria-hidden="true" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg></span><div><strong>Solicitud con información clara</strong><small>Confirmaremos disponibilidad, entrega y pago antes de continuar.</small></div></div>
            </div>
          </div>
        </div>
        <section class="product-extra-section card-surface">
          <div class="section-head"><div><p class="eyebrow">Acerca del producto</p><h2 class="section-title">Descripción</h2></div></div>
          <div class="product-copy-grid">
            <div><p>${esc(product.description)}</p><p>Cada artículo de nuestra selección busca acompañar tus espacios y actividades con comodidad y funcionalidad.</p></div>
            <div><p><strong>Características destacadas</strong></p><ul class="description-list">${(product.details||[]).map(item=>`<li>${esc(item)}</li>`).join('')}</ul><div class="compact-notice">Especificaciones referenciales · Verifica los detalles al comprar.</div></div>
          </div>
        </section>
        ${renderReviews(product)}
        <section class="product-extra-section">
          <div class="section-head"><div><p class="eyebrow">Te puede interesar</p><h2 class="section-title">Productos relacionados</h2></div><a class="section-more" href="tienda.html?category=${encodeURIComponent(product.category)}">Ver más</a></div>
          <div class="product-grid">${related.map(card).join('')}</div>
        </section>
      </article>`;

    let current = 0;
    const stage = $('#product-main-image', root);
    const thumbsRoot = $('.gallery-thumbs', root);
    const navButtons = $$('[data-gallery-nav]', root);
    const syncGallery = index => {
      if (!gallery.length) return;
      current = (index + gallery.length) % gallery.length;
      stage.src = gallery[current];
      $$('.gallery-thumb', thumbsRoot).forEach((btn, i) => btn.classList.toggle('is-active', i === current));
    };
    thumbsRoot.addEventListener('click', e => {
      const button = e.target.closest('[data-thumb]');
      if (button) syncGallery(Number(button.dataset.thumb));
    });
    navButtons.forEach(btn => btn.addEventListener('click', () => syncGallery(current + Number(btn.dataset.galleryNav))));
    navButtons.forEach(btn => { btn.hidden = true; });

    Promise.all(requestedGallery.map(path => window.CazanaMedia.resolve(path)))
      .then(results => {
        if (!root.contains(stage)) return;
        gallery = [...new Set(results.filter(result => result.found).map(result => result.src))];
        current = 0;
        if (!gallery.length) {
          stage.src = window.CazanaMedia.placeholder;
          thumbsRoot.innerHTML = '<p class="gallery-photo-note">Las fotografías reales de este producto se añadirán próximamente.</p>';
        } else {
          stage.src = gallery[0];
          stage.alt = product.name;
          thumbsRoot.innerHTML = gallery.map((src, i) => `
            <button type="button" class="gallery-thumb ${i === 0 ? 'is-active' : ''}" data-thumb="${i}" aria-label="Ver fotografía ${i + 1}">
              <img src="${esc(src)}" alt="${esc(product.name)} - vista ${i + 1}" loading="lazy">
            </button>`).join('');
        }
        navButtons.forEach(btn => { btn.hidden = gallery.length < 2; });
      });

    let qty = 1;
    const qtyValue = $('#qty-value', root);
    $$('[data-qty]', root).forEach(btn => btn.addEventListener('click', () => {
      qty = Math.max(1, Math.min(20, qty + Number(btn.dataset.qty)));
      qtyValue.textContent = String(qty);
    }));
    $('[data-buy-now]', root)?.addEventListener('click', async () => { await addToCart(product.id, qty); location.href = 'carrito.html'; });
    $('[data-add-qty]', root)?.addEventListener('click', () => addToCart(product.id, qty));
    $('#review-form', root)?.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const name = String(fd.get('name') || '').trim().slice(0,70);
      const city = String(fd.get('city') || '').trim().slice(0,70);
      const text = String(fd.get('text') || '').trim().slice(0,1200);
      const rating = Number(fd.get('rating'));
      if (!name || !city || text.length < 5 || !Number.isInteger(rating) || rating < 1 || rating > 5) return toast('Revisa los datos de tu reseña.');
      reviewCache[product.id] = reviewCache[product.id] || [];
      reviewCache[product.id].push({ name, city, rating, text });
      setStore(K.reviews, reviewCache);
      toast('Tu opinión se guardó en este navegador.');
      showProduct();
      refreshCounts();
    });
    updateWishButtons();
  }

  function showCart() {
    const root = $('#cart-items');
    if (!root) return;
    const subtotal = $('#subtotal');
    const totalPreview = $('#total-preview');
    const discountValue = $('#discount-value');
    const couponForm = $('#coupon-form');
    let couponActive = false; // Los cupones aún no son válidos en el backend.
    couponForm?.addEventListener('submit', e => { e.preventDefault();
      const code = (couponForm.elements.coupon.value || '').trim().toUpperCase();
      couponActive = false;
      setStore('cazana_demo_coupon', couponActive ? 'DEMO10' : '');
      const status = $('#coupon-status');
      if (status) status.textContent = 'Los descuentos se habilitarán cuando estén disponibles en Cazana.';
      render();
    });
    function render() {
      if (!cart.length) {
        root.innerHTML = '<div class="empty-state"><h3>Tu carrito está vacío</h3><p><a href="tienda.html">Explorar productos →</a></p></div>';
        subtotal.textContent = money(0);
        if (totalPreview) totalPreview.textContent = money(0);
        if (discountValue) discountValue.textContent = money(0);
        return;
      }
      root.innerHTML = cart.map(line => {
        const p = productById(line.id);
        if (!p) return '';
        return `<div class="cart-row"><img src="${esc(currentImage(p))}" alt="${esc(p.name)}"><div><b>${esc(p.name)}</b><p>${money(p.price)} × ${line.qty}</p><div class="qty-box compact"><button type="button" data-cart-change="-1" data-id="${esc(p.id)}">−</button><span>${line.qty}</span><button type="button" data-cart-change="1" data-id="${esc(p.id)}">+</button></div></div><strong>${money(p.price * line.qty)}</strong></div>`;
      }).join('');
      const total = cart.reduce((sum, line) => sum + (productById(line.id)?.price || 0) * line.qty, 0);
      subtotal.textContent = money(total);
      const discount = couponActive ? Number((total * .1).toFixed(2)) : 0;
      if (discountValue) discountValue.textContent = discount ? `− ${money(discount)}` : money(0);
      if (totalPreview) totalPreview.textContent = money(total - discount);
      $$('[data-cart-change]', root).forEach(btn => btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const line = cart.find(x => x.id === id);
        if (!line) return;
        line.qty += Number(btn.dataset.cartChange);
        cart = cart.filter(x => x.qty > 0);
        saveCart();
        render();
      }));
    }
    renderCartPage=render;
    render();
  }

  function homepage() {
    populate('#bestsellers', products.filter(p => p.isBestseller).slice(0, 4));
    populate('#new-arrivals', products.filter(p => p.isNew).slice(0, 4));
    populate('#all-preview', products.slice(0, 8));
  }

  document.addEventListener('click', e => {
    const addBtn = e.target.closest('[data-add]');
    const wishBtn = e.target.closest('[data-wish]');
    if (addBtn) { e.preventDefault(); addToCart(addBtn.dataset.add); }
    if (wishBtn) { e.preventDefault(); toggleWishlist(wishBtn.dataset.wish); }
  });

  document.addEventListener('cazana:shopping-change', event => {
    cart=event.detail.cart;wishlist=event.detail.favorites;
    refreshCounts();updateWishButtons();renderCartPage();
  });
  document.addEventListener('cazana:sync-error',event=>toast(event.detail.message));
  document.addEventListener('DOMContentLoaded', async () => {
    await window.CazanaShopping?.initialize();
    cart=getStore(K.cart,[]);wishlist=getStore(K.wishlist,[]);
    refreshCounts();
    updateWishButtons();
    if ($('#current-year')) $('#current-year').textContent = new Date().getFullYear();
    activateMenuAndSupport();
    // CAZANA-FASE-3-6: cargar el chat solo cuando hay backend, sin alterar la demo de GitHub Pages.
    if (document.getElementById('support-panel') && !location.hostname.endsWith('.github.io')) {
      const script=document.createElement('script');script.src='/js/services/chat.js';script.async=true;document.head.append(script);
    }
    bindGlobalForms();
    syncNavActive();
    homepage();
    showShop();
    showProduct();
    showCart();
  });
})();
