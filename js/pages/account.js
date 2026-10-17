/* Vista de cuenta: navegación visual hasta que exista identidad autenticada en el backend. */
(() => {
  'use strict';
  const root = document.getElementById('account-panel');
  if (!root) return;
  const products = window.CazanaData || [];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  function empty(title,text,icon='▣',action='') {
    return `<div class="account-empty"><div class="account-empty-icon">${icon}</div><h2>${title}</h2><p>${text}</p>${action}</div>`;
  }
  function render(id) {
    document.querySelectorAll('[data-account-tab]').forEach(btn=>btn.classList.toggle('is-current',btn.dataset.accountTab===id));
    const headings={orders:'Mis pedidos',favorites:'Mis favoritos',profile:'Mi perfil',addresses:'Mis direcciones'};
    let content='';
    if(id==='favorites'){
      let favorites=[];try{favorites=JSON.parse(localStorage.getItem('cazana_wishlist')||'[]')}catch{}
      const found=products.filter(p=>favorites.includes(p.id));
      if(found.length){
        content=`<div class="account-favs">${found.map(p=>`<article><img src="${esc(p.image)}" alt="${esc(p.name)}"><div><span class="eyebrow">${esc(p.subcategory)}</span><h3>${esc(p.name)}</h3><strong>S/ ${p.price.toFixed(2)}</strong><a href="producto.html?id=${encodeURIComponent(p.id)}" class="admin-text-link">Ver producto ↗</a></div></article>`).join('')}</div>`;
      }else content=empty('Aún no guardaste favoritos','Descubre productos y selecciona el corazón para volver a ellos fácilmente.','♡','<a href="tienda.html" class="btn btn-green">Explorar productos</a>');
    } else if(id==='orders')content=empty('Tus pedidos aparecerán aquí','Podrás consultar sus detalles, el estado de envío y el historial de compras.','▣','<a href="tienda.html" class="btn btn-green">Explorar productos</a>');
    else if(id==='profile')content=empty('Tu perfil, en un solo lugar','Los datos personales estarán disponibles cuando habilitemos el inicio de sesión.','♙');
    else content=empty('Organiza tus direcciones','Guarda tus direcciones de entrega para comprar más fácilmente.','⌖');
    root.innerHTML=`<div class="account-panel-heading"><h2>${headings[id]||'Mi cuenta'}</h2><p>${id==='favorites'?'Productos guardados en este navegador':'Una experiencia diseñada para que tengas todo bajo control.'}</p></div>${content}`;
  }
  document.querySelectorAll('[data-account-tab]').forEach(btn=>btn.addEventListener('click',()=>render(btn.dataset.accountTab)));
  const selected=location.hash==='#favoritos'?'favorites':'orders';
  render(selected);
})();
