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
  const extras=window.CazanaAccountExtras;
  let user=null,orders=[],tab='orders',authMode='login',busy=false;
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
  function authSelector(){
    return `<div class="account-auth-switch" role="group" aria-label="Acceso de clientes">
      <button class="account-auth-tab ${authMode==='login'?'is-current':''}" type="button" data-switch-auth="login" aria-pressed="${authMode==='login'}">Iniciar sesión</button>
      <button class="account-auth-tab ${authMode==='register'?'is-current':''}" type="button" data-switch-auth="register" aria-pressed="${authMode==='register'}">Crear cuenta</button>
    </div>`;
  }
  function loginView(){return `<section class="customer-auth"><div class="customer-auth-header"><h3>Bienvenido de nuevo</h3><p>Ingresa para consultar tus pedidos y datos personales.</p></div>
    <form id="customer-login" class="customer-form">${htmlLabel('email','Correo electrónico','email','autocomplete="email" maxlength="254"')}${htmlLabel('password','Contraseña','password','autocomplete="current-password"')}<button class="btn btn-charcoal" type="submit">Ingresar a mi cuenta</button></form>
    <p class="customer-auth-foot">¿Trabajas en Cazana? <a href="/staff/login">Acceso del personal</a>.</p></section>`;}
  function registerView(){return `<section class="customer-auth"><div class="customer-auth-header"><h3>Empieza tu experiencia Cazana</h3><p>Crea una cuenta para consultar tus solicitudes y guardar tus datos personales.</p></div>
    <form id="customer-register" class="customer-form">${htmlLabel('name','Nombre y apellido','text','autocomplete="name" minlength="2" maxlength="100"')}${htmlLabel('email','Correo electrónico','email','autocomplete="email" maxlength="254"')}${htmlLabel('password','Contraseña (mínimo 10 caracteres)','password','autocomplete="new-password" minlength="10" maxlength="128"')}
    <label class="customer-consent"><input type="checkbox" name="marketingConsent"> <span>Deseo recibir ofertas de Cazana por correo (opcional; podré retirar mi consentimiento).</span></label>
    <button class="btn btn-charcoal" type="submit">Crear mi cuenta</button></form>
    <p class="customer-auth-foot">Por ahora no enviamos correos de confirmación ni ofrecemos recuperación de contraseñas. Usa una contraseña exclusiva mientras esté en desarrollo.</p></section>`;}
  function renderOrders(){return orders.length?`<div class="customer-orders">${orders.map(o=>`<article class="customer-order">
   <div class="customer-order-header"><div><strong>Pedido ${escapeHTML(o.id.slice(-8).toUpperCase())}</strong><small>${new Date(o.createdAt).toLocaleDateString('es-PE',{year:'numeric',month:'long',day:'numeric'})}</small></div><span class="order-status ${o.status==='cancelled'?'critical':o.status==='delivered'?'delivered':'processing'}">${escapeHTML(orderStatus[o.status]||o.status)}</span></div>
   <p>${o.items.map(i=>`${escapeHTML(i.name)} × ${i.quantity}`).join(' · ')}</p>
   <div class="customer-order-bottom"><div><strong>${money(o.totalCents)}</strong><small>Sin pago procesado en línea</small></div><div>${o.status==='pending'?`<button class="btn btn-outline" data-cancel-order="${escapeHTML(o.id)}" type="button">Cancelar solicitud</button>`:''}</div></div>
  </article>`).join('')}</div>`:empty('Todavía no registraste pedidos','Cuando solicites un pedido, podrás seguir aquí su estado. No se realiza un pago en línea.');}
  function content(){if(!user){return authSelector()+(authMode==='register'?registerView():loginView());}if(tab==='favorites')return favorites();if(tab==='orders')return renderOrders();if(tab==='profile')return extras.profileView(user);return extras.addressesView();}
  function render(){
    const layout=root.closest('.account-layout');
    if(layout)layout.classList.toggle('account-guest-mode',!user);
    const menu=$('.account-menu');
    if(menu){menu.setAttribute('aria-hidden',user?'false':'true');menu.inert=!user;}
    $$('[data-account-tab]').forEach(b=>{const selected=b.dataset.accountTab===tab;b.classList.toggle('is-current',selected);b.setAttribute('aria-current',selected?'page':'false');});
    const greeting=$('.account-greeting');if(greeting){const t=greeting.querySelector('strong,b');if(t)t.textContent=user?`Hola, ${user.name.split(' ')[0]}`:'Hola, bienvenido';}
    const note=$('.account-preview-note');if(note)note.remove();
    const pill=$('.account-intro .status-pill');if(pill)pill.innerHTML=`<span class="status-dot"></span> ${user?'Sesión iniciada':'Acceso de clientes'}`;
    const intro=$('.account-intro .page-intro');if(intro)intro.textContent=user?'Tus pedidos, favoritos y direcciones, en un mismo lugar.':'Inicia sesión o regístrate para comenzar.';
    root.innerHTML=`<div class="account-panel-heading"><h2>${user?titles[tab]||titles.orders:'Tu espacio Cazana'}</h2><p>${user?'Gestiona tus pedidos y datos personales.':'Un lugar para comprar con tranquilidad y consultar tus pedidos.'}</p></div><div id="account-message" role="status" hidden></div>${content()}`;
  }
  async function loadOrders(){if(!user)return;const r=await api('/api/orders');orders=r.items||[];}
  async function start(){root.closest('.account-layout')?.classList.add('account-guest-mode');try{const r=await api('/api/auth/me');if(r.user?.role!=='customer')throw Object.assign(Error('Acceso exclusivo para clientes.'),{status:401});user=r.user;await loadOrders();await extras.load(api,user).catch(()=>{});}catch(err){if(err.status&&err.status!==401){render();notice(err.message,true);return;}user=null;}render();}
  document.addEventListener('click',async e=>{
    if(user && await extras.click(e.target,api,render,notice))return;
    const tabBtn=e.target.closest('[data-account-tab]');if(tabBtn&&user){tab=tabBtn.dataset.accountTab;history.replaceState(null,'','#'+(tab==='favorites'?'favoritos':tab));render();return;}
    const auth=e.target.closest('[data-switch-auth]');if(auth&&!user){authMode=auth.dataset.switchAuth==='register'?'register':'login';render();return;}
    if(e.target.closest('#customer-logout')){try{await api('/api/auth/logout','POST');user=null;orders=[];extras.clear();authMode='login';render();}catch(err){notice(err.message,true);}return;}
    const cancel=e.target.closest('[data-cancel-order]');if(cancel){if(!confirm('¿Cancelar esta solicitud de pedido? Se liberarán las existencias reservadas.'))return;try{await api(`/api/orders/${cancel.dataset.cancelOrder}/cancel`,'POST');await loadOrders();render();notice('Solicitud cancelada.');}catch(err){notice(err.message,true);}return;}
  });
  document.addEventListener('submit',async e=>{
    const form=e.target;
    if(user && ['cz-profile-form','cz-address-form'].includes(form.id)){e.preventDefault();await extras.submit(form,api,render,notice);return;}
    if(!['customer-login','customer-register'].includes(form.id))return;
    e.preventDefault();if(busy)return;busy=true;const button=form.querySelector('button[type=submit]');if(button)button.disabled=true;
    try{const fd=new FormData(form);const isReg=form.id==='customer-register';const payload=isReg?{name:String(fd.get('name')),email:String(fd.get('email')),password:String(fd.get('password')),marketingConsent:fd.has('marketingConsent')}:{email:String(fd.get('email')),password:String(fd.get('password'))};
      const r=await api(isReg?'/api/auth/register':'/api/auth/login','POST',payload);user=r.user;await loadOrders();await extras.load(api,user).catch(()=>{});render();notice(isReg?'Cuenta creada correctamente.':'Bienvenido de nuevo.');
    }catch(err){notice(err.message,true);}finally{busy=false;if(button)button.disabled=false;}
  });
  tab=location.hash==='#favoritos'?'favorites':location.hash==='#perfil'?'profile':location.hash==='#addresses'?'addresses':'orders';
  window.addEventListener('hashchange',()=>{if(!user)return;const next=location.hash==='#favoritos'?'favorites':location.hash==='#perfil'?'profile':location.hash==='#addresses'?'addresses':'orders';if(next!==tab){tab=next;render();}});
  start();
})();
