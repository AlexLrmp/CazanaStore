/* CAZANA — Clientes y pedidos (fase 2). Las sesiones usan cookies httpOnly. */
(() => {
  'use strict';
  const root=document.getElementById('account-panel');if(!root)return;
  const $=(s,c=document)=>c.querySelector(s);
  const $$=(s,c=document)=>Array.from(c.querySelectorAll(s));
  const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const money=c=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(Number(c||0)/100);
  const titles={orders:'Mis pedidos',favorites:'Mis favoritos',profile:'Mi perfil',addresses:'Mis direcciones'};
  const orderStatus={pending:'Por confirmar',confirmed:'Confirmado',preparing:'En preparación',shipped:'Enviado',delivered:'Entregado',cancelled:'Cancelado'};
  const products=Array.isArray(window.CazanaData)?window.CazanaData:[];
  let user=null,orders=[],tab='orders',busy=false;
  async function api(url,method='GET',payload){
    let r;try{r=await fetch(url,{method,credentials:'same-origin',headers:{Accept:'application/json','X-Cazana-Request':'1',...(payload===undefined?{}:{'Content-Type':'application/json'})},...(payload===undefined?{}:{body:JSON.stringify(payload)})});}catch{throw Error('No pudimos conectar con el servidor.');}
    let data={};try{data=await r.json();}catch{}
    if(!r.ok){const e=Error(data.error||'La operación no se pudo completar.');e.status=r.status;throw e;}
    return data;
  }
  function notice(text,error=false){const target=$('#account-message');if(target){target.textContent=text;target.className=error?'account-message error':'account-message';target.hidden=false;}else{const area=document.createElement('p');area.className='account-message'+(error?' error':'');area.id='account-message';area.setAttribute('role','status');area.textContent=text;root.prepend(area);}}
  const empty=(title,desc)=>`<div class="account-empty"><div class="account-empty-icon">▣</div><h2>${escapeHTML(title)}</h2><p>${escapeHTML(desc)}</p><a href="tienda.html" class="btn btn-green">Explorar productos</a></div>`;
  function favorites(){
    let ids=[];try{ids=JSON.parse(localStorage.getItem('cazana_wishlist')||'[]');}catch{}
    const found=products.filter(p=>ids.includes(p.id));
    return found.length?`<div class="account-favs">${found.map(p=>`<article><img src="${escapeHTML(p.image||'')}" alt="${escapeHTML(p.name)}"><div><span class="eyebrow">${escapeHTML(p.subcategory||'')}</span><h3>${escapeHTML(p.name)}</h3><strong>${money(Math.round(p.price*100))}</strong><a class="admin-text-link" href="producto.html?id=${encodeURIComponent(p.id)}">Ver producto ↗</a></div></article>`).join('')}</div>`:empty('Aún no tienes favoritos','Utiliza el corazón de cada producto para guardarlo en este navegador.');
  }
  const htmlLabel=(name,label,type='text',extra='')=>`<label class="customer-field"><span>${label}</span><input name="${name}" type="${type}" ${extra} required></label>`;
  function loginView(){return `<section class="customer-auth"><div class="customer-auth-header"><h3>Ingresar a Cazana</h3><p>Accede para consultar tus pedidos y datos de cuenta.</p></div>
    <form id="customer-login" class="customer-form">${htmlLabel('email','Correo electrónico','email','autocomplete="email" maxlength="254"')}${htmlLabel('password','Contraseña','password','autocomplete="current-password"')}<button class="btn btn-charcoal" type="submit">Iniciar sesión</button></form>
    <button type="button" class="customer-link" data-switch-auth="register">¿Es tu primera vez? Crear cuenta</button>
    <p class="customer-auth-foot">¿Eres empleado? <a href="/staff/login">Ingresar al acceso del personal</a>.</p></section>`;}
  function registerView(){return `<section class="customer-auth"><div class="customer-auth-header"><h3>Crear cuenta de cliente</h3><p>Podrás revisar el estado de tus solicitudes desde aquí.</p></div>
    <form id="customer-register" class="customer-form">${htmlLabel('name','Nombre y apellido','text','autocomplete="name" minlength="2" maxlength="100"')}${htmlLabel('email','Correo electrónico','email','autocomplete="email" maxlength="254"')}${htmlLabel('password','Contraseña (mínimo 10 caracteres)','password','autocomplete="new-password" minlength="10" maxlength="128"')}
    <label class="customer-consent"><input type="checkbox" name="marketingConsent"> <span>Deseo recibir ofertas de Cazana por correo (opcional; podré retirar mi consentimiento).</span></label>
    <button class="btn btn-charcoal" type="submit">Registrarme</button></form>
    <button type="button" class="customer-link" data-switch-auth="login">Ya tengo cuenta. Ingresar</button>
    <p class="customer-auth-foot">Esta fase aún no envía correos ni permite recuperar contraseñas. No reutilices una contraseña importante mientras esté en desarrollo.</p></section>`;}
  function renderOrders(){return orders.length?`<div class="customer-orders">${orders.map(o=>`<article class="customer-order">
   <div class="customer-order-header"><div><strong>Pedido ${escapeHTML(o.id.slice(-8).toUpperCase())}</strong><small>${new Date(o.createdAt).toLocaleDateString('es-PE',{year:'numeric',month:'long',day:'numeric'})}</small></div><span class="order-status ${o.status==='cancelled'?'critical':o.status==='delivered'?'delivered':'processing'}">${escapeHTML(orderStatus[o.status]||o.status)}</span></div>
   <p>${o.items.map(i=>`${escapeHTML(i.name)} × ${i.quantity}`).join(' · ')}</p>
   <div class="customer-order-bottom"><div><strong>${money(o.totalCents)}</strong><small>Sin pago procesado en línea</small></div><div>${o.status==='pending'?`<button class="btn btn-outline" data-cancel-order="${escapeHTML(o.id)}" type="button">Cancelar solicitud</button>`:''}</div></div>
  </article>`).join('')}</div>`:empty('Todavía no registraste pedidos','Cuando solicites un pedido, podrás seguir aquí su estado. No se realiza un pago en línea.');}
  function content(){if(!user){return loginView();}if(tab==='favorites')return favorites();if(tab==='orders')return renderOrders();if(tab==='profile')return `<div class="customer-profile"><h3>Datos de tu cuenta</h3><p><strong>Nombre:</strong> ${escapeHTML(user.name)}</p><p><strong>Correo:</strong> ${escapeHTML(user.email)}</p><p><strong>Promociones:</strong> ${user.marketingConsent?'Suscripción solicitada':'No suscrito'}</p><button id="customer-logout" class="btn btn-outline" type="button">Cerrar sesión</button></div>`;
   return empty('Direcciones próximamente','Por ahora la dirección se registra con cada pedido, sin guardarla como favorita.');}
  function render(){
    $$('[data-account-tab]').forEach(b=>{const selected=b.dataset.accountTab===tab;b.classList.toggle('is-current',selected);b.setAttribute('aria-current',selected?'page':'false');});
    const greeting=$('.account-greeting');if(greeting){const t=greeting.querySelector('strong,b');if(t)t.textContent=user?`Hola, ${user.name.split(' ')[0]}`:'Hola, bienvenido';}
    const note=$('.account-preview-note');if(note){note.hidden=!!user;const txt=note.querySelector('p');if(txt&&!user)txt.innerHTML='<strong>Tu espacio Cazana</strong><br>El registro de clientes y los pedidos ya están disponibles mediante MongoDB. Los pagos y las direcciones favoritas llegarán en otra etapa.';}
    root.innerHTML=`<div class="account-panel-heading"><h2>${user?titles[tab]||titles.orders:'Tu cuenta Cazana'}</h2><p>${user?'Gestión privada de tus pedidos y datos personales.':'Regístrate o inicia sesión para usar la tienda conectada a MongoDB.'}</p></div><div id="account-message" role="status" hidden></div>${content()}`;
  }
  async function loadOrders(){if(!user)return;const r=await api('/api/orders');orders=r.items||[];}
  async function start(){try{const r=await api('/api/auth/me');if(r.user?.role!=='customer')throw Object.assign(Error('Acceso exclusivo para clientes.'),{status:401});user=r.user;await loadOrders();}catch(err){if(err.status&&err.status!==401){render();notice(err.message,true);return;}user=null;}render();}
  document.addEventListener('click',async e=>{
    const tabBtn=e.target.closest('[data-account-tab]');if(tabBtn){tab=tabBtn.dataset.accountTab;history.replaceState(null,'','#'+(tab==='favorites'?'favoritos':tab));render();return;}
    const auth=e.target.closest('[data-switch-auth]');if(auth){root.innerHTML=`<div class="account-panel-heading"><h2>Cuenta de cliente</h2></div><div id="account-message" role="status" hidden></div>${auth.dataset.switchAuth==='register'?registerView():loginView()}`;return;}
    if(e.target.closest('#customer-logout')){try{await api('/api/auth/logout','POST');user=null;orders=[];render();}catch(err){notice(err.message,true);}return;}
    const cancel=e.target.closest('[data-cancel-order]');if(cancel){if(!confirm('¿Cancelar esta solicitud de pedido? Se liberarán las existencias reservadas.'))return;try{await api(`/api/orders/${cancel.dataset.cancelOrder}/cancel`,'POST');await loadOrders();render();notice('Solicitud cancelada.');}catch(err){notice(err.message,true);}return;}
  });
  document.addEventListener('submit',async e=>{
    const form=e.target;if(!['customer-login','customer-register'].includes(form.id))return;
    e.preventDefault();if(busy)return;busy=true;const button=form.querySelector('button[type=submit]');if(button)button.disabled=true;
    try{const fd=new FormData(form);const isReg=form.id==='customer-register';const payload=isReg?{name:String(fd.get('name')),email:String(fd.get('email')),password:String(fd.get('password')),marketingConsent:fd.has('marketingConsent')}:{email:String(fd.get('email')),password:String(fd.get('password'))};
      const r=await api(isReg?'/api/auth/register':'/api/auth/login','POST',payload);user=r.user;await loadOrders();render();notice(isReg?'Cuenta creada correctamente.':'Bienvenido de nuevo.');
    }catch(err){notice(err.message,true);}finally{busy=false;if(button)button.disabled=false;}
  });
  tab=location.hash==='#favoritos'?'favorites':location.hash==='#perfil'?'profile':'orders';start();
})();
