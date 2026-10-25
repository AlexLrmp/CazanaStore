/* CAZANA Fase 3 — Datos de perfil y libreta de direcciones; solo clientes autenticados. */
(() => {
  'use strict';
  const escapeHTML = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const field = (name,label,value='',attrs='') => `<label class="customer-field"><span>${label}</span><input name="${name}" value="${escapeHTML(value)}" ${attrs} required></label>`;
  let profile=null,addresses=[],editingId=null,formOpen=false,busy=false,loaded=false,userRef=null;
  function clear(){profile=null;addresses=[];editingId=null;formOpen=false;busy=false;loaded=false;userRef=null;}
  async function load(api,currentUser){
    userRef=currentUser;
    const [p,a] = await Promise.all([api('/api/me/profile'),api('/api/me/addresses')]);
    profile=p.profile;addresses=a.items||[];loaded=true;
    editingId=null;formOpen=false;
  }
  function profileView(user){
    const p=profile||{name:user.name,email:user.email,phone:user.phone||'',marketingConsent:user.marketingConsent};
    return `<section class="customer-profile customer-profile-edit">
      <div class="cz-profile-caption"><div><h3>Datos de tu cuenta</h3><p>Actualiza tu información de contacto de manera segura.</p></div><span class="cz-profile-tag">Mi información</span></div>
      <form id="cz-profile-form" class="customer-form">
        ${field('name','Nombre y apellido',p.name,'autocomplete="name" minlength="2" maxlength="100"')}
        <div class="customer-form-grid">
          <label class="customer-field"><span>Correo electrónico</span><input value="${escapeHTML(p.email)}" type="email" disabled aria-describedby="cz-email-note"><small id="cz-email-note">Para cambiar el correo se requerirá verificación en una próxima fase.</small></label>
          <label class="customer-field"><span>Teléfono (opcional)</span><input name="phone" value="${escapeHTML(p.phone||'')}" type="tel" inputmode="tel" autocomplete="tel" maxlength="25" placeholder="+51 999 999 999"></label>
        </div>
        <label class="customer-consent"><input name="marketingConsent" type="checkbox" ${p.marketingConsent?'checked':''}><span>Deseo recibir promociones de Cazana por correo (opcional). Puedo retirar el consentimiento cuando quiera.</span></label>
        <div class="cz-account-actions"><button type="submit" class="btn btn-charcoal">Guardar cambios</button></div>
      </form>
      <div class="cz-profile-logout"><span>¿Deseas salir de tu cuenta en este dispositivo?</span><button id="customer-logout" type="button" class="btn btn-outline">Cerrar sesión</button></div>
    </section>`;
  }
  /* CAZANA-DISENO-3-1:ICONOS */
  const cz31Icons = {"pin":"<path d=\"M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z\"/><circle cx=\"12\" cy=\"10\" r=\"2.5\"/>","edit":"<path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z\"/>","delete":"<path d=\"M3 6h18\"/><path d=\"M8 6V4h8v2\"/><path d=\"M5 6l1 15h12l1-15\"/><path d=\"M10 10v7M14 10v7\"/>","star":"<path d=\"m12 2 3 6.5 7 .9-5.1 5 1.3 7L12 18l-6.2 3.4 1.3-7L2 9.4l7-.9Z\"/>","plus":"<path d=\"M12 5v14M5 12h14\"/>","close":"<path d=\"M18 6 6 18M6 6l12 12\"/>"};
  const cz31Icon = kind => `<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${cz31Icons[kind] || ''}</svg>`;
  function addressCard(a){return `<article class="cz-address-card">
      <div class="cz-address-top"><div><strong>${escapeHTML(a.label)}</strong>${a.isDefault?'<span class="cz-address-default">Predeterminada</span>':''}</div><span class="cz-address-marker" aria-hidden="true">${cz31Icon('pin')}</span></div>
      <p class="cz-address-recipient">${escapeHTML(a.fullName)} · ${escapeHTML(a.phone)}</p>
      <p>${escapeHTML(a.address)}${a.reference?` · ${escapeHTML(a.reference)}`:''}</p>
      <p>${escapeHTML(a.city)}, ${escapeHTML(a.region)}</p>
      <div class="cz-address-actions">
        <button type="button" class="cz-address-button" data-address-action="edit" data-address-id="${a.id}">${cz31Icon('edit')}<span>Editar</span></button>
        ${a.isDefault?'':`<button type="button" class="cz-address-button" data-address-action="default" data-address-id="${a.id}">${cz31Icon('star')}<span>Hacer principal</span></button>`}
        <button type="button" class="cz-address-button is-danger" data-address-action="delete" data-address-id="${a.id}">${cz31Icon('delete')}<span>Eliminar</span></button>
      </div>
    </article>`;}
  function addressForm(){
    if(!formOpen)return '';
    const a=addresses.find(x=>x.id===editingId)||{};
    return `<section class="cz-address-editor" aria-label="${editingId?'Editar dirección':'Nueva dirección'}">
      <div class="cz-address-editor-head"><h3>${editingId?'Editar dirección':'Nueva dirección'}</h3><button class="cz-address-button" type="button" data-address-action="close">${cz31Icon('close')}<span>Cancelar</span></button></div>
      <form id="cz-address-form" class="customer-form">
        ${field('label','Identifica esta dirección',a.label||'Casa','maxlength="35" placeholder="Casa, Trabajo..."')}
        <div class="customer-form-grid">
          ${field('fullName','Nombre de quien recibirá',a.fullName||profile?.name||'','autocomplete="name" minlength="3" maxlength="120"')}
          ${field('phone','Teléfono de contacto',a.phone||profile?.phone||'','type="tel" autocomplete="tel" inputmode="tel" minlength="7" maxlength="25"')}
        </div>
        ${field('address','Dirección de entrega',a.address||'','autocomplete="street-address" minlength="6" maxlength="220"')}
        <div class="customer-form-grid">
          ${field('city','Ciudad o distrito',a.city||'','autocomplete="address-level2" minlength="2" maxlength="100"')}
          ${field('region','Departamento o región',a.region||'','autocomplete="address-level1" minlength="2" maxlength="100"')}
        </div>
        <label class="customer-field"><span>Referencia (opcional)</span><input name="reference" value="${escapeHTML(a.reference||'')}" maxlength="220" placeholder="Piso, indicaciones para la entrega..."></label>
        <label class="customer-consent"><input name="isDefault" type="checkbox" ${a.isDefault||!addresses.length?'checked':''}><span>Utilizar como dirección predeterminada</span></label>
        <div class="cz-account-actions"><button class="btn btn-charcoal" type="submit">${editingId?'Guardar dirección':'Agregar dirección'}</button></div>
      </form>
    </section>`;
  }
  function addressesView(){return `<section class="cz-addresses">
    <div class="cz-profile-caption"><div><h3>Libreta de direcciones</h3><p>Guarda tus lugares de entrega para futuros pedidos.</p></div><span class="cz-profile-tag">${addresses.length} de 8</span></div>
    <div class="cz-address-toolbar"><p>Tu dirección predeterminada se ofrecerá en el checkout.</p>
      ${addresses.length<8?`<button class="btn btn-charcoal" data-address-action="add" type="button" ${formOpen?'disabled':''}>${cz31Icon('plus')}<span>Agregar dirección</span></button>`:''}
    </div>
    ${addresses.length?`<div class="cz-address-grid">${addresses.map(addressCard).join('')}</div>`:'<div class="cz-address-empty"><span aria-hidden="true">' + cz31Icon('pin') + '</span><h3>Todavía no guardaste direcciones</h3><p>Agrega tu primera dirección para completar tus pedidos más fácilmente.</p></div>'}
    ${addressForm()}
    ${loaded?'':'<p class="muted-copy">No se pudieron cargar todos los datos. Actualiza la página para volver a intentar.</p>'}
  </section>`;}
  async function click(target,api,render,notice){
    const b=target.closest('[data-address-action]');if(!b)return false;
    if(busy)return true;
    const action=b.dataset.addressAction,id=b.dataset.addressId;
    if(action==='add'){editingId=null;formOpen=true;render();return true;}
    if(action==='edit'){editingId=id;formOpen=true;render();return true;}
    if(action==='close'){editingId=null;formOpen=false;render();return true;}
    if(action==='delete' && !window.confirm('¿Eliminar esta dirección guardada?'))return true;
    busy=true;
    try{
      const response=await api(`/api/me/addresses/${encodeURIComponent(id)}`,action==='delete'?'DELETE':'PATCH',action==='default'?{isDefault:true}:undefined);
      addresses=response.items||[];formOpen=false;editingId=null;render();notice(action==='delete'?'Dirección eliminada.':'Dirección predeterminada actualizada.');
    }catch(e){notice(e.message,true);}finally{busy=false;}
    return true;
  }
  async function submit(form,api,render,notice){
    if(!['cz-profile-form','cz-address-form'].includes(form.id))return false;
    if(busy)return true;
    busy=true;const button=form.querySelector('[type=submit]');if(button)button.disabled=true;
    try{
      const f=new FormData(form);
      if(form.id==='cz-profile-form'){
        const response=await api('/api/me/profile','PATCH',{name:String(f.get('name')),phone:String(f.get('phone')||''),marketingConsent:f.has('marketingConsent')});
        profile=response.profile;if(userRef){userRef.name=profile.name;userRef.phone=profile.phone;userRef.marketingConsent=profile.marketingConsent;}render();notice('Datos de tu perfil actualizados correctamente.');
        // La cabecera de saludo toma el nombre desde la sesión. Actualizamos sin reiniciar sesión.
        const greeting=document.querySelector('.account-greeting strong,.account-greeting b');
        if(greeting)greeting.textContent=`Hola, ${profile.name.split(' ')[0]}`;
      }else{
        const body={label:String(f.get('label')),fullName:String(f.get('fullName')),phone:String(f.get('phone')),address:String(f.get('address')),city:String(f.get('city')),region:String(f.get('region')),reference:String(f.get('reference')||''),isDefault:f.has('isDefault')};
        const response=await api(editingId?`/api/me/addresses/${encodeURIComponent(editingId)}`:'/api/me/addresses',editingId?'PATCH':'POST',body);
        addresses=response.items||[];editingId=null;formOpen=false;render();notice('Dirección guardada correctamente.');
      }
    }catch(e){notice(e.message,true);}finally{busy=false;if(button)button.disabled=false;}
    return true;
  }
  window.CazanaAccountExtras=Object.freeze({clear,load,profileView,addressesView,click,submit});
})();
