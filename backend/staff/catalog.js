/* Cazana Admin. Interfaz original conectada a la API privada. Sin datos comerciales inventados. */
'use strict';
(() => {
  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const root=$('#admin-panel');
  if(!root)return;
  const escapeHTML=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const money=cents=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(Number(cents||0)/100);
  const safePhoto=value=>/^assets\/[a-zA-Z0-9._/-]+$/.test(String(value||''))&&!String(value).includes('..')?`/${value}`:'';
  let products=[],orderRecords=[],user=null,tab='overview',editId=null,stockId=null,settings=null,filter='';
  const orderStates={pending:'Por confirmar',confirmed:'Confirmado',preparing:'Preparando',shipped:'Enviado',delivered:'Entregado',cancelled:'Cancelado'};
  const orderNext={pending:['confirmed','cancelled'],confirmed:['preparing','cancelled'],preparing:['shipped','cancelled'],shipped:['delivered'],delivered:[],cancelled:[]};
  let flash='';let flashError=false;
  const canManage=()=>['owner','admin'].includes(user?.role);
  async function api(url,{method='GET',body}={}){
    const res=await fetch(url,{method,credentials:'same-origin',headers:{Accept:'application/json','X-Cazana-Request':'1',...(body===undefined?{}:{'Content-Type':'application/json'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
    let data={};if(res.status!==204){try{data=await res.json();}catch{throw new Error('El servidor no devolvió una respuesta válida.');}}
    if(!res.ok)throw Object.assign(new Error(data.error||'No se pudo completar la operación.'),{status:res.status});
    return data;
  }
  function message(text,error=false){flash=text;flashError=error;const el=$('#admin-feedback');if(el){el.hidden=!text;el.textContent=text;el.classList.toggle('error',error);}else if(text)render();}
  const counts=()=>({total:products.length,published:products.filter(p=>p.active).length,low:products.filter(p=>p.active&&p.stockQty<=5),stock:products.reduce((n,p)=>n+(p.active?p.stockQty:0),0)});
  const caption=(name,subtitle,label='DATOS REALES · MONGODB')=>`<div class="dash-section-header"><div><p class="eyebrow">${escapeHTML(label)}</p><h2>${escapeHTML(name)}</h2><p>${escapeHTML(subtitle)}</p></div><span class="admin-inline-tag">${escapeHTML(label.includes('PENDIENTE')?'Próxima fase':'Catálogo real')}</span></div>`;
  const notice=(title,text)=>`<div class="compact-notice admin-phase-note"><strong>${escapeHTML(title)}</strong><p>${escapeHTML(text)}</p></div>`;
  const table=(heads,rows,empty='No hay registros.')=>`<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${heads.map(h=>`<th scope="col">${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${rows||`<tr><td colspan="${heads.length}">${escapeHTML(empty)}</td></tr>`}</tbody></table></div>`;
  const stockStatus=p=>!p.active?'<span class="order-status pending">Desactivado</span>':p.stockQty===0?'<span class="order-status critical">Agotado</span>':p.stockQty<=5?'<span class="order-status critical">Stock bajo</span>':'<span class="order-status delivered">Disponible</span>';
  const titleLink=(text,target)=>`<button type="button" class="admin-text-link" data-navigate-tab="${target}">${escapeHTML(text)} →</button>`;
  function overview(){
    const c=counts(),low=c.low.slice().sort((a,b)=>a.stockQty-b.stockQty).slice(0,6);
    return `${caption('Resumen general','Indicadores reales de los productos almacenados en MongoDB.')}
      <div class="kpi-grid">
        <article class="kpi-card"><span>Productos registrados</span><strong>${c.total}</strong><small>Incluye artículos desactivados</small><div class="kpi-icon">▣</div></article>
        <article class="kpi-card"><span>Productos publicados</span><strong>${c.published}</strong><small>Visibles en el catálogo</small><div class="kpi-icon">↗</div></article>
        <article class="kpi-card"><span>Unidades disponibles</span><strong>${c.stock}</strong><small>En productos activos</small><div class="kpi-icon">▥</div></article>
        <article class="kpi-card"><span>Productos con stock bajo</span><strong>${c.low.length}</strong><small>Con cinco unidades o menos</small><div class="kpi-icon">!</div></article>
      </div>
      <div class="admin-dual-grid"><section class="dash-card"><div class="dash-card-head"><h3>Inventario por categoría</h3><span>Existencias reales</span></div>${categoryRows()}</section>
      <section class="dash-card"><div class="dash-card-head"><h3>Resumen operativo</h3></div>
      <div class="activity-item"><span class="activity-dot emerald"></span><div><strong>${c.published} productos publicados</strong><small>Gestionados desde la intranet</small></div></div>
      <div class="activity-item"><span class="activity-dot gold"></span><div><strong>${c.stock} unidades disponibles</strong><small>Sumatoria de los productos activos</small></div></div>
      <div class="activity-item"><span class="activity-dot rust"></span><div><strong>${c.low.length} alertas de inventario</strong><small>Con cinco unidades o menos</small></div></div>
      ${titleLink('Administrar inventario','inventory')}</section></div>
      <div class="admin-dual-grid"><section class="dash-card"><div class="dash-card-head"><h3>Operaciones comerciales</h3><span>Implementación por etapas</span></div>
       ${notice('Solicitudes registradas',`${orderRecords.length} solicitudes recientes guardadas en MongoDB. La facturación y los cobros llegarán en otra fase.`)}</section>
       <section class="dash-card"><div class="dash-card-head"><h3>Productos por reponer</h3>${titleLink('Ver todos','inventory')}</div>
       <div class="lowstock-list">${low.length?low.map(p=>`<div class="stock-item"><span class="stock-avatar">${escapeHTML(p.name[0]||'C')}</span><span class="stock-item-name">${escapeHTML(p.name)}</span><strong>${p.stockQty} uds</strong></div>`).join(''):'<p class="muted-copy">Sin alertas de existencias.</p>'}</div></section></div>`;
  }
  function categoryRows(){
    const groups=new Map();for(const p of products.filter(x=>x.active)){const key=p.category||'Otros';const g=groups.get(key)||{count:0,stock:0};g.count++;g.stock+=p.stockQty;groups.set(key,g);}
    if(!groups.size)return '<p class="muted-copy">Aún no hay productos activos.</p>';
    const max=Math.max(1,...Array.from(groups.values(),x=>x.stock));
    return `<div class="trend-list">${Array.from(groups.entries()).map(([name,x])=>`<div class="trend-item"><span>${escapeHTML(name)}</span><div class="trend-track"><span style="width:${Math.max(0,Math.min(100,Math.round(x.stock/max*100)))}%"></span></div><strong>${x.stock} uds.</strong></div>`).join('')}</div>`;
  }
  function analytics(){const c=counts();return `${caption('Estadísticas','Indicadores reales del catálogo; las estadísticas de ventas llegarán con los pedidos.')}
  <div class="kpi-grid"><article class="kpi-card"><span>Productos registrados</span><strong>${c.total}</strong><small>Base de datos</small></article><article class="kpi-card"><span>Catálogo publicado</span><strong>${c.published}</strong><small>Productos activos</small></article><article class="kpi-card"><span>Stock disponible</span><strong>${c.stock}</strong><small>Unidades activas</small></article><article class="kpi-card"><span>Alertas</span><strong>${c.low.length}</strong><small>Stock bajo o agotado</small></article></div>
  <div class="admin-dual-grid"><section class="dash-card"><h3>Existencias por categoría</h3>${categoryRows()}</section>
  <section class="dash-card"><h3>Estado del inventario</h3><div class="trend-list"><div class="trend-item"><strong class="grow-text">Disponibles</strong><b>${products.filter(p=>p.active&&p.stockQty>5).length}</b></div><div class="trend-item"><strong class="grow-text">Stock bajo</strong><b>${products.filter(p=>p.active&&p.stockQty>0&&p.stockQty<=5).length}</b></div><div class="trend-item"><strong class="grow-text">Agotados</strong><b>${products.filter(p=>p.active&&p.stockQty===0).length}</b></div><div class="trend-item"><strong class="grow-text">Desactivados</strong><b>${products.filter(p=>!p.active).length}</b></div></div></section></div>
  ${notice('Analítica comercial pendiente','Los pedidos ya están registrados en MongoDB; el análisis de ventas y la facturación se habilitarán después de integrar pagos y conciliación.')}`;}
  function pending(title,subtitle,details){return `${caption(title,subtitle,'MÓDULO PENDIENTE')}
  <section class="dash-card pending-module"><span class="pending-module-icon" aria-hidden="true">✧</span><h3>${escapeHTML(title)} — Próximamente</h3><p>${escapeHTML(details)}</p>
  <div class="compact-notice">Esta sección conserva su espacio dentro del panel original. Se activará cuando exista una API y una colección de MongoDB para sus datos reales.</div></section>`;}
  function orders(){
   const statusTag=o=>`<span class="order-status ${o.status==='cancelled'?'critical':o.status==='delivered'?'delivered':'processing'}">${escapeHTML(orderStates[o.status]||o.status)}</span>`;
   const lines=orderRecords.map(o=>`<tr><td class="order-id">${escapeHTML(o.id.slice(-8).toUpperCase())}<small class="staff-order-date">${new Date(o.createdAt).toLocaleDateString('es-PE')}</small></td><td>${escapeHTML(o.customerName)}<small class="staff-order-date">${escapeHTML(o.customerEmail)}</small></td><td>${o.items.map(i=>`${escapeHTML(i.name)} ×${i.quantity}`).join('<br>')}</td><td>${money(o.totalCents)}<small class="staff-order-date">Sin cobro en línea</small></td><td>${statusTag(o)}</td><td><div class="staff-actions">${(orderNext[o.status]||[]).map(state=>`<button type="button" data-order-status="${state}" data-order-id="${escapeHTML(o.id)}" ${state==='cancelled'?'class="danger"':''}>${state==='cancelled'?'Cancelar':state==='confirmed'?'Confirmar':state==='preparing'?'Preparar':state==='shipped'?'Enviar':'Entregado'}</button>`).join('')}</div></td></tr>`).join('');
   return `${caption('Pedidos','Solicitudes de clientes registradas en MongoDB. No se cobra en línea.')}<div class="admin-toolbar"><div><strong>${orderRecords.length} pedidos recientes</strong><small>Actualización de estado y existencias desde el servidor</small></div><button class="btn btn-outline" id="refresh-orders" type="button">Actualizar lista</button></div>
   <section class="dash-card"><div class="dash-card-head"><h3>Gestión de pedidos</h3><span>Últimos 30 pedidos</span></div>${table(['Pedido','Cliente','Artículos','Importe','Estado','Cambiar estado'],lines,'Todavía no hay pedidos registrados.')}</section>
   <p class="staff-hint">Los cambios se guardan en MongoDB. Los pedidos cancelados restituyen el stock reservado; un pedido enviado ya no se puede cancelar desde este panel.</p>`;
  }
  async function refreshOrders(){const r=await api('/api/admin/orders');orderRecords=r.items||[];render();}

  const accounting=()=>pending('Contabilidad','Ingresos y egresos de la empresa.','Los ingresos, gastos, devoluciones y reportes contables requieren registros comerciales reales, no estimaciones de demostración.');
  const support=()=>pending('Atención al cliente','Conversaciones y asesoría comercial.','La bandeja recibirá conversaciones del chat web. Después integraremos respuestas frecuentes del chatbot y transferencia a un empleado, además de WhatsApp Business.');
  const testimonials=()=>pending('Testimonios de clientes','Moderación y publicación de experiencias.','Las reseñas de muestra del navegador todavía no están almacenadas en MongoDB. Aquí administraremos testimonios reales autorizados y su publicación cuando se implemente el módulo.');
  function productRows(){const q=filter.toLowerCase();return products.filter(p=>`${p.name} ${p.sku} ${p.category} ${p.subcategory}`.toLowerCase().includes(q)).map(p=>`<tr>
    <td><div class="staff-product">${safePhoto(p.image)?`<img src="${escapeHTML(safePhoto(p.image))}" alt="" loading="lazy">`:'<span class="staff-product-fallback" aria-hidden="true">▣</span>'}<div><strong>${escapeHTML(p.name)}</strong><small>${escapeHTML(p.category)} · ${escapeHTML(p.subcategory)}</small></div></div></td>
    <td class="order-id">${escapeHTML(p.sku)}</td><td>${money(p.priceCents)}</td><td><strong>${p.stockQty}</strong></td><td>${stockStatus(p)}</td>
    <td><div class="staff-actions">${canManage()?`<button type="button" data-edit="${escapeHTML(p.databaseId)}">Editar</button>`:''}<button type="button" data-stock="${escapeHTML(p.databaseId)}">Stock</button>${canManage()&&p.active?`<button type="button" class="danger" data-deactivate="${escapeHTML(p.databaseId)}">Desactivar</button>`:''}${canManage()&&!p.active?`<button type="button" data-edit="${escapeHTML(p.databaseId)}">Reactivar</button>`:''}</div></td></tr>`).join('');}
  function inventory(){const c=counts();return `${caption('Inventario','Productos, existencias y alertas de reposición.')}
  <div class="admin-toolbar"><div><strong>${c.total} productos registrados</strong><small>${c.low.length} alertas de stock · cambios guardados en MongoDB</small></div>${canManage()?'<button class="btn btn-charcoal" id="new-product" type="button">+ Nuevo producto</button>':''}</div>
  <section class="dash-card"><div class="dash-card-head staff-inventory-head"><div><h3>Control de productos</h3><span>Editar, ajustar stock o desactivar sin eliminar el historial.</span></div><label class="sr-only" for="find-product">Buscar productos</label><input type="search" id="find-product" value="${escapeHTML(filter)}" placeholder="Buscar por nombre, SKU o categoría" autocomplete="off"></div>
  <div id="product-list-holder">${table(['Producto','SKU','Precio','Existencias','Estado','Acciones'],productRows(),'No hay productos para esta búsqueda.')}</div></section>
  <section class="dash-card" id="editor" hidden></section><section class="dash-card" id="stock-panel" hidden></section>`;}
  function settingsView(){if(!canManage())return pending('Configuración','Acceso limitado.','Solo las cuentas de administrador y propietario pueden modificar la configuración comercial.');return `${caption('Configuración','Gestiona la información comercial de Cazana.')}
  <section class="dash-card"><div class="dash-card-head"><h3>WhatsApp Business</h3><span>Contacto oficial de la empresa</span></div>
  <p class="muted-copy">Estos cambios se guardan en MongoDB. El número se puede actualizar sin modificar el código.</p><form id="settings-form" class="staff-form"><div class="staff-form-grid"><label>Número internacional (sin +)<input required inputmode="numeric" name="whatsappNumber" maxlength="15" value="${escapeHTML(settings?.whatsappNumber||'')}"></label><label>Nombre de contacto<input required maxlength="80" name="whatsappContactName" value="${escapeHTML(settings?.whatsappContactName||'')}"></label></div><div class="staff-actions"><button type="submit" class="btn btn-charcoal">Guardar contacto</button><a class="admin-text-link" href="/api/whatsapp" target="_blank" rel="noopener noreferrer">Probar enlace ↗</a></div></form>
  <p class="staff-hint">La integración bidireccional con la API de WhatsApp Business se desarrollará en otra fase.</p></section>`;}
  const views={overview,analytics,orders,inventory,accounting,support,testimonials,settings:settingsView};
  function render(){
    const view=views[tab]||overview;root.setAttribute('aria-busy','true');root.innerHTML=(flash?`<p class="staff-feedback ${flashError?'error':''}" id="admin-feedback" role="status">${escapeHTML(flash)}</p>`:'')+view();root.setAttribute('aria-busy','false');
    $$('[data-admin-tab]').forEach(b=>{const yes=b.dataset.adminTab===tab;b.classList.toggle('selected',yes);b.setAttribute('aria-current',yes?'page':'false');});
    $('#admin-export').disabled=!['overview','analytics','inventory'].includes(tab);
  }
  function selectTab(next){if(!views[next]||(next==='settings'&&!canManage()))return;tab=next;editId=stockId=null;flash='';render();history.replaceState(null,'',`#${next}`);}
  async function refresh(){const response=await api('/api/admin/products');products=response.items||[];render();}
  function editor(product=null){
    if(!canManage())return message('Tu rol no permite editar productos.',true);
    editId=product?.databaseId||null;stockId=null;
    $('#stock-panel').hidden=true;
    const panel=$('#editor');panel.hidden=false;
    panel.innerHTML=`<div class="dash-card-head"><div><p class="eyebrow">${product?'ACTUALIZAR REGISTRO':'CREAR ARTÍCULO'}</p><h3>${product?'Editar producto':'Registrar nuevo producto'}</h3></div><button class="admin-text-link" type="button" data-close-editor>Cerrar ×</button></div>
    <form id="product-form" class="staff-form">
    <div class="staff-form-grid">
    <label>Nombre<input name="name" required maxlength="180"></label><label>SKU<input name="sku" required maxlength="60"></label>
    <label>Slug (URL)<input name="slug" required maxlength="140" placeholder="nombre-del-producto"></label><label>Categoría<input name="category" required maxlength="80" placeholder="hogar"></label>
    <label>Subcategoría<input name="subcategory" maxlength="90"></label><label>Precio (S/)<input name="price" type="number" required min="0" step="0.01"></label>
    <label>Precio anterior (S/)<input name="originalPrice" type="number" min="0" step="0.01" placeholder="Opcional"></label>
    <label class="create-stock" ${product?'hidden':''}>Stock inicial<input name="stockQty" type="number" min="0" step="1" value="0" ${product?'disabled':''}></label>
    </div><label>Descripción<textarea name="description" rows="3" maxlength="5000"></textarea></label>
    <label>Imagen principal (ruta assets/)<input name="image" maxlength="500" placeholder="assets/productos/mi-articulo/principal.jpg"></label>
    <label>Galería (una ruta por línea)<textarea name="gallery" rows="3" placeholder="assets/productos/mi-articulo/detalle.jpg"></textarea></label>
    <div class="staff-flags"><label><input type="checkbox" name="isNew"> Nuevo</label><label><input type="checkbox" name="isBestseller"> Más vendido</label><label><input type="checkbox" name="isOffer"> Oferta</label><label><input type="checkbox" name="active" checked> Visible en catálogo</label></div>
    <button type="submit" class="btn btn-charcoal">Guardar en MongoDB</button><p class="staff-hint">La carga directa de fotografías se habilitará en otra fase. Por ahora utiliza rutas locales de assets/.</p></form>`;
    const form=$('#product-form',panel);
    for(const key of ['name','sku','slug','category','subcategory','description','image'])form.elements[key].value=product?.[key]||'';
    form.elements.price.value=product?String(product.priceCents/100):'';
    form.elements.originalPrice.value=product?.originalPriceCents!=null?String(product.originalPriceCents/100):'';
    form.elements.gallery.value=(product?.gallery||[]).join('\n');
    for(const key of ['isNew','isBestseller','isOffer'])form.elements[key].checked=!!product?.[key];
    form.elements.active.checked=product?.active??true;
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function stockEditor(product){
    if(!product)return;stockId=product.databaseId;editId=null;
    $('#editor').hidden=true;const panel=$('#stock-panel');panel.hidden=false;
    panel.innerHTML=`<div class="dash-card-head"><div><p class="eyebrow">MOVIMIENTO DE INVENTARIO</p><h3>Ajustar existencias</h3><span>${escapeHTML(product.name)} · Stock actual: ${product.stockQty}</span></div><button type="button" class="admin-text-link" data-close-stock>Cerrar ×</button></div>
    <form id="stock-form" class="staff-form"><div class="staff-form-grid"><label>Ajuste de unidades (+ entrada / − salida)<input type="number" name="delta" required min="-100000" max="100000" step="1" placeholder="5 o -2"></label><label>Motivo<input name="reason" minlength="3" maxlength="250" required placeholder="Reposición / corrección"></label></div><button type="submit" class="btn btn-charcoal">Registrar movimiento</button><p class="staff-hint">El servidor no permite que el inventario quede negativo.</p></form>`;
    panel.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function saveProduct(form){
    const f=Object.fromEntries(new FormData(form));const cents=v=>Math.round(Number(v)*100);
    const data={sku:String(f.sku||'').trim(),slug:String(f.slug||'').trim(),name:String(f.name||'').trim(),category:String(f.category||'').trim(),subcategory:String(f.subcategory||'').trim(),description:String(f.description||'').trim(),priceCents:cents(f.price),originalPriceCents:f.originalPrice?cents(f.originalPrice):null,image:String(f.image||'').trim(),gallery:String(f.gallery||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean),isNew:!!f.isNew,isBestseller:!!f.isBestseller,isOffer:!!f.isOffer,active:!!f.active};
    if(!editId){data.stockQty=Number(f.stockQty||0);data.details=[];}
    if(data.isOffer && (data.originalPriceCents==null||data.originalPriceCents<=data.priceCents))throw new Error('Una oferta necesita un precio anterior mayor que el actual.');
    await api(editId?`/api/admin/products/${editId}`:'/api/admin/products',{method:editId?'PATCH':'POST',body:data});
    flash='Producto guardado correctamente en MongoDB.';flashError=false;await refresh();
  }
  function exportCsv(){
    if(!['overview','analytics','inventory'].includes(tab))return;
    const rows=[['SKU','Producto','Categoría','Subcategoría','Precio PEN','Existencias','Publicado'],...products.map(p=>[p.sku,p.name,p.category,p.subcategory,(p.priceCents/100).toFixed(2),p.stockQty,p.active?'Sí':'No'])];
    const csv='\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='cazana-inventario-real.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
  }
  document.addEventListener('click',async event=>{
    if(event.target.closest('[data-wishlist-open]')){location.href='/cuenta.html#favoritos';return;}
    const menu=event.target.closest('#menu-button');if(menu){const nav=$('#nav-bar');if(nav){const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));}return;}
    const navTab=event.target.closest('[data-admin-tab],[data-navigate-tab]');if(navTab){const next=navTab.dataset.adminTab||navTab.dataset.navigateTab;selectTab(next);if(next==='orders'){try{await refreshOrders();}catch(err){message(err.message,true);}}return;}
    if(event.target.closest('#retry-admin')){location.reload();return;}
    if(event.target.closest('#refresh-orders')){try{await refreshOrders();}catch(err){message(err.message,true);}return;}
    const change=event.target.closest('[data-order-status]');if(change){const next=change.dataset.orderStatus,id=change.dataset.orderId;if(!confirm(`¿Cambiar el estado a ${orderStates[next]}?`))return;change.disabled=true;try{await api(`/api/admin/orders/${id}/status`,{method:'PATCH',body:{status:next,note:''}});flash='Estado del pedido guardado en MongoDB.';flashError=false;await refreshOrders();}catch(err){message(err.message,true);change.disabled=false;}return;}

    if(event.target.closest('#admin-export'))return exportCsv();
    if(event.target.closest('#new-product'))return editor();
    if(event.target.closest('[data-close-editor]')){$('#editor').hidden=true;return;}
    if(event.target.closest('[data-close-stock]')){$('#stock-panel').hidden=true;return;}
    const rowEdit=event.target.closest('[data-edit]');if(rowEdit){editor(products.find(p=>p.databaseId===rowEdit.dataset.edit));return;}
    const stock=event.target.closest('[data-stock]');if(stock){stockEditor(products.find(p=>p.databaseId===stock.dataset.stock));return;}
    const del=event.target.closest('[data-deactivate]');if(del){const item=products.find(p=>p.databaseId===del.dataset.deactivate);if(!item||!confirm(`¿Desactivar ${item.name}? El registro se conservará.`))return;
      try{await api(`/api/admin/products/${item.databaseId}`,{method:'DELETE'});flash='Artículo desactivado.';flashError=false;await refresh();}catch(e){message(e.message,true);}return;}
  });
  root.addEventListener('error',event=>{if(event.target.matches('.staff-product img')){const marker=document.createElement('span');marker.className='staff-product-fallback';marker.setAttribute('aria-hidden','true');marker.textContent='▣';event.target.replaceWith(marker);}},true);
  document.addEventListener('input',event=>{if(event.target.id==='find-product'){filter=event.target.value;const holder=$('#product-list-holder');if(holder)holder.innerHTML=table(['Producto','SKU','Precio','Existencias','Estado','Acciones'],productRows(),'No hay productos para esta búsqueda.');}});
  document.addEventListener('submit',async event=>{
    if(event.target.matches('[data-search-form]')){event.preventDefault();const q=event.target.elements.q.value.trim();if(q)location.href='/tienda.html?q='+encodeURIComponent(q);return;}
    if(event.target.id==='product-form'){event.preventDefault();try{await saveProduct(event.target);}catch(e){message(e.message,true);}return;}
    if(event.target.id==='stock-form'){event.preventDefault();try{const data=new FormData(event.target);await api(`/api/admin/products/${stockId}/stock`,{method:'POST',body:{delta:Number(data.get('delta')),reason:String(data.get('reason'))}});flash='Stock actualizado y movimiento registrado.';flashError=false;await refresh();}catch(e){message(e.message,true);}return;}
    if(event.target.id==='settings-form'){event.preventDefault();try{settings=await api('/api/admin/settings',{method:'PATCH',body:Object.fromEntries(new FormData(event.target))});flash='WhatsApp comercial actualizado correctamente.';flashError=false;render();}catch(e){message(e.message,true);}return;}
  });
  $('#logout').addEventListener('click',async()=>{try{await api('/api/staff/logout',{method:'POST'});}finally{location.replace('/staff/login');}});
  (async()=>{try{
    const r=await api('/api/staff/me');user=r.user;$('#staff-name').textContent=`${user.name} · ${user.role}`;
    if(!canManage())$$('[data-managers-only]').forEach(x=>x.hidden=true);
    const response=await api('/api/admin/products');products=response.items||[];
    try{const recent=await api('/api/admin/orders');orderRecords=recent.items||[];}catch{}
    if(canManage()){try{settings=await api('/api/admin/settings');}catch{settings=null;}}
    const hash=location.hash.slice(1);tab=views[hash]&&(hash!=='settings'||canManage())?hash:'overview';render();
  }catch(err){if(err.status===401||err.status===403)location.replace('/staff/login');else{root.innerHTML=`<div class="compact-notice"><strong>No pudimos cargar el panel.</strong><p>${escapeHTML(err.message)}</p><button type="button" id="retry-admin">Reintentar</button></div>`;}}})();
})();
