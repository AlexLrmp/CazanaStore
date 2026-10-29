'use strict';
/* CAZANA-FASE-3-6-1 · Bandeja y CRM: selector elegante y sincronización sin perder el borrador. */
(() => {
  const $=q=>document.querySelector(q);
  const $$=q=>Array.from(document.querySelectorAll(q));
  const panel=$('#sp-panel');if(!panel)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=s=>{try{return new Date(s).toLocaleString('es-PE',{dateStyle:'short',timeStyle:'short'});}catch{return ''}};
  const POLL_MS=8000;
  const wf=window.CazanaWorkflow;let staffUser=null;
  let tab='inbox',status='open',rows=[],selected=null,working=false,loading=false,queued=false,listKey='';
  let selectToken=0;
  async function api(url,{method='GET',data}={}){
    const res=await fetch(url,{method,credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json','X-Cazana-Request':'1',...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});
    const payload=res.status===204?{}:await res.json().catch(()=>({}));
    if(!res.ok)throw Object.assign(new Error(payload.error||'No se pudo completar la solicitud.'),{status:res.status});
    return payload;
  }
  function setTab(next){if(tab===next)return;tab=next;selected=null;listKey='';selectToken++;render();load();}
  function head(title,subtitle){return `<p class="sp-section-eyebrow">ATENCIÓN · PERSONAL AUTORIZADO</p><h2>${esc(title)}</h2><p>${esc(subtitle)}</p>`;}
  function flash(msg){const node=$('#cz-staff-flash');if(node){node.textContent=msg;node.hidden=!msg;}}
  const labelOf=value=>value==='closed'?'Cerradas':'Abiertas';
  function closeFilter(restoreFocus=false){
    const menu=$('#cz-state-options'),button=$('#cz-state-trigger');
    if(!menu||!button)return;
    menu.hidden=true;button.setAttribute('aria-expanded','false');
    if(restoreFocus)button.focus();
  }
  function setupFilter(){
    const button=$('#cz-state-trigger'),menu=$('#cz-state-options');if(!button||!menu)return;
    const choices=Array.from(menu.querySelectorAll('[data-chat-status]'));
    const openFilter=()=>{menu.hidden=false;button.setAttribute('aria-expanded','true');choices.find(x=>x.dataset.chatStatus===status)?.focus();};
    button.addEventListener('click',()=>menu.hidden?openFilter():closeFilter());
    button.addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp',' ','Enter'].includes(e.key)){e.preventDefault();openFilter();}});
    choices.forEach((choice,i)=>{
      choice.setAttribute('aria-selected',String(choice.dataset.chatStatus===status));
      choice.addEventListener('click',()=>{
        const next=choice.dataset.chatStatus;status=next;selected=null;listKey='';selectToken++;
        $('#cz-state-label').textContent=labelOf(next);
        choices.forEach(x=>x.setAttribute('aria-selected',String(x===choice)));
        closeFilter(true);paintList();const detail=$('#cz-thread-detail');if(detail)detail.innerHTML='<p class="cz-placeholder">Selecciona una conversación para comenzar.</p>';
        load();
      });
      choice.addEventListener('keydown',e=>{
        if(e.key==='Escape'){e.preventDefault();closeFilter(true);}
        if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();choices[(i+(e.key==='ArrowDown'?1:-1)+choices.length)%choices.length].focus();}
        if(e.key==='Home'){e.preventDefault();choices[0].focus();}
        if(e.key==='End'){e.preventDefault();choices[choices.length-1].focus();}
      });
    });
  }
  function render(){
    if(tab==='inbox'){
      panel.innerHTML=head('Conversaciones','Consultas recibidas desde la tienda, guardadas en MongoDB.')+
        `<div class="cz-inbox-bar"><div class="cz-filter-combo" id="cz-filter-combo"><span class="cz-filter-caption">Mostrar</span><div class="cz-filter-control"><button id="cz-state-trigger" class="cz-state-trigger" type="button" aria-label="Filtrar conversaciones" aria-haspopup="listbox" aria-expanded="false" aria-controls="cz-state-options"><span id="cz-state-label">${labelOf(status)}</span><svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></button><div id="cz-state-options" class="cz-state-options" role="listbox" aria-label="Estado de conversación" hidden><button type="button" role="option" data-chat-status="open"><span class="cz-state-dot open"></span>Abiertas<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 5 5 9-10"/></svg></button><button type="button" role="option" data-chat-status="closed"><span class="cz-state-dot closed"></span>Cerradas<svg aria-hidden="true" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="m5 12 5 5 9-10"/></svg></button></div></div></div><button type="button" id="cz-reload">Actualizar</button></div><p class="cz-staff-flash" id="cz-staff-flash" hidden role="status"></p>${wf.toolbar()}<div class="cz-inbox-grid"><nav class="cz-thread-list" id="cz-thread-list" aria-label="Conversaciones"><p>Cargando conversaciones…</p></nav><div class="cz-thread-detail" id="cz-thread-detail"><p class="cz-placeholder">Selecciona una conversación para comenzar.</p></div></div>`;
      setupFilter();wf.bindToolbar(()=>{selected=null;selectToken++;listKey='';const d=$('#cz-thread-detail');if(d){d.dataset.thread='';d.innerHTML='<p class="cz-placeholder">Selecciona una conversación para comenzar.</p>';}load();});$('#cz-reload').addEventListener('click',()=>load());
    }else{
      panel.innerHTML=head('CRM de clientes','Contactos que iniciaron una conversación. No se muestra la base completa de clientes.')+
        `${wf.toolbar(true)}<div class="cz-crm-wrap" id="cz-crm-wrap"><p>Consultando conversaciones…</p></div><p class="cz-staff-flash" id="cz-staff-flash" hidden role="status"></p>`;
    }
    if(tab==='crm')wf.bindToolbar(()=>{selectToken++;load();});
    $$('[data-sp-tab]').forEach(b=>{const yes=b.dataset.spTab===tab;b.classList.toggle('is-current',yes);if(yes)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    panel.setAttribute('aria-busy','false');
  }
  document.addEventListener('click',e=>{const combo=$('#cz-filter-combo');if(combo&&!combo.contains(e.target))closeFilter();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFilter();});
  function paintList(){
    const host=$('#cz-thread-list');if(!host)return;
    const signature=JSON.stringify([selected,rows]);
    if(signature===listKey)return;
    listKey=signature;
    if(!rows.length){host.innerHTML='<div class="cz-placeholder">No hay conversaciones en esta categoría.</div>';return;}
    host.innerHTML=rows.map(r=>`<button class="cz-thread-row ${selected===r.id?'is-active':''}" type="button" data-thread="${esc(r.id)}"><strong>${esc(r.name)}${r.unreadForStaff?'<span class="cz-unread" aria-label="Sin leer"></span>':''}</strong><small>${esc(r.preview)}</small>${wf.listTags(r)}<span>${esc(date(r.lastMessageAt))}</span></button>`).join('');
    host.querySelectorAll('[data-thread]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.thread)));
  }
  function paintCrm(){
    const host=$('#cz-crm-wrap');if(!host)return;
    const cards=new Map();rows.forEach(r=>{if(!cards.has(r.email||r.id)||new Date(r.lastMessageAt)>new Date(cards.get(r.email||r.id).lastMessageAt))cards.set(r.email||r.id,r);});
    const unique=Array.from(cards.values());const signature=JSON.stringify(unique);
    if(signature===host.dataset.signature)return;host.dataset.signature=signature;
    if(!unique.length){host.innerHTML='<div class="cz-placeholder">Todavía no hay contactos desde el chat.</div>';return;}
    host.replaceChildren();unique.forEach(r=>{
      const article=document.createElement('article');article.className='cz-crm-card';
      const h=document.createElement('strong');h.textContent=r.name;
      const em=document.createElement('small');em.textContent=r.email||'Sin correo proporcionado';
      const meta=document.createElement('small');meta.textContent='Último contacto: '+date(r.lastMessageAt);
      article.append(h,em,meta);host.append(article);
    });
  }
  async function load(){
    if(loading){queued=true;return;}
    loading=true;const initialTab=tab,initialStatus=status,initialToken=selectToken;
    try{
      if(initialTab==='crm'){
        const [open,closed]=await Promise.all([api('/api/staff/chat/threads?status=open'+wf.query()),api('/api/staff/chat/threads?status=closed'+wf.query())]);
        if(tab!==initialTab||selectToken!==initialToken)return;
        rows=[...open.items,...closed.items];paintCrm();return;
      }
      const data=await api('/api/staff/chat/threads?status='+initialStatus+wf.query());
      if(tab!==initialTab||status!==initialStatus||selectToken!==initialToken)return;
      rows=data.items;wf.updateUnread(data.unreadCount);paintList();
      if(selected&&rows.some(x=>x.id===selected))await open(selected,{background:true});
      else if(selected){selected=null;listKey='';paintList();const detail=$('#cz-thread-detail');if(detail)detail.innerHTML='<p class="cz-placeholder">Selecciona una conversación para comenzar.</p>';}
    }catch(err){flash(err.message);}
    finally{loading=false;if(queued){queued=false;queueMicrotask(()=>load());}}
  }
  function paintHistory(log,messages){
    const signature=JSON.stringify(messages);if(log.dataset.signature===signature)return;
    const nearBottom=log.scrollHeight-log.scrollTop-log.clientHeight<60,scroll=log.scrollTop;
    log.replaceChildren();messages.forEach(m=>{
      const el=document.createElement('article');el.className='cz-staff-bubble '+(m.sender==='staff'?'from-staff':'from-client');
      const title=document.createElement('small');title.textContent=(m.sender==='staff'?'Equipo':'Cliente')+' · '+date(m.at);
      const p=document.createElement('p');p.textContent=m.text;el.append(title,p);log.append(el);
    });
    log.dataset.signature=signature;log.scrollTop=nearBottom?log.scrollHeight:scroll;
  }
  async function open(id,{background=false}={}){
    const token=background?selectToken:++selectToken;
    if(!background){selected=id;listKey='';paintList();}
    try{
      const response=await api('/api/staff/chat/threads/'+encodeURIComponent(id));
      const r=response.thread;
      if(selected!==id||token!==selectToken||tab!=='inbox')return;
      const detail=$('#cz-thread-detail');if(!detail)return;
      const reuse=detail.dataset.thread===id && detail.dataset.status===r.status && !!detail.querySelector('.cz-staff-messages');
      if(!reuse){
        detail.dataset.thread=id;detail.dataset.status=r.status;
        detail.innerHTML=`<div class="cz-detail-heading"><div><strong>${esc(r.name)}</strong><small>${esc(r.email||'Sin correo')}</small></div><span>${r.status==='open'?'Abierta':'Cerrada'}</span></div>${wf.caseHtml(r)}<div class="cz-staff-messages" id="cz-staff-messages" role="log"></div>`+
          (r.status==='open'&&wf.canEdit(r)?`<form class="cz-staff-reply" id="cz-staff-reply"><label>Respuesta al cliente<textarea name="message" maxlength="1200" required minlength="2" rows="3" placeholder="Escribe una respuesta profesional…"></textarea></label><div class="cz-staff-actions"><button type="submit">Responder</button><button type="button" id="cz-close-thread" class="muted">Cerrar conversación</button></div></form>`:r.status==='open'?'<p class="cz-placeholder">Toma esta conversación para poder responder.</p>':'<p class="cz-placeholder">Esta conversación está cerrada. Si el cliente vuelve a escribir, se reabrirá.</p>');
        $('#cz-staff-reply')?.addEventListener('submit',async e=>{
          e.preventDefault();if(working)return;working=true;
          const form=e.currentTarget,btn=form.querySelector('button[type=submit]');btn.disabled=true;
          try{await api('/api/staff/chat/threads/'+encodeURIComponent(id)+'/reply',{method:'POST',data:Object.fromEntries(new FormData(form))});form.querySelector('textarea').value='';await load();}
          catch(err){flash(err.message);}finally{btn.disabled=false;working=false;}
        });
        $('#cz-close-thread')?.addEventListener('click',async()=>{
          if(working)return;working=true;
          try{await api('/api/staff/chat/threads/'+encodeURIComponent(id)+'/close',{method:'POST'});selected=null;listKey='';const detail=$('#cz-thread-detail');if(detail){detail.dataset.thread='';detail.innerHTML='<p class="cz-placeholder">Selecciona una conversación para comenzar.</p>';}await load();}
          catch(err){flash(err.message);}finally{working=false;}
        });
        wf.bindCase({thread:r,request:api,onError:flash,refresh:async()=>{const d=$('#cz-thread-detail');if(d){d.dataset.thread='';d.dataset.status='';}await open(id);await load();}});
      }
      paintHistory($('#cz-staff-messages'),r.messages);
    }catch(err){flash(err.message);}
  }
  $$('[data-sp-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.spTab)));
  $('#sp-logout')?.addEventListener('click',async()=>{try{await api('/api/staff/logout',{method:'POST'});}catch{}location.replace('/staff/login');});
  (async()=>{
    try{
      const data=await api('/api/staff/me');
      staffUser=data.user;wf.setUser(staffUser);
      if(['owner','admin'].includes(staffUser?.role)){try{const agents=await api('/api/staff/chat/agents');wf.setAgents(agents.items);}catch{wf.setAgents([]);}}
      if(!['support','owner','admin'].includes(data.user?.role)){location.replace('/staff/login');return;}
      $('#sp-name').textContent=`${data.user.name} · ${data.user.role==='support'?'Atención':'Administración'}`;
      render();await load();
      setInterval(()=>{if(!document.hidden&&!working)load();},POLL_MS);
      document.addEventListener('visibilitychange',()=>{if(!document.hidden)load();});
    }catch(err){if([401,403].includes(err.status))location.replace('/staff/login');else{panel.removeAttribute('aria-busy');panel.textContent='No se pudo verificar el acceso. Recarga la página.';}}
  })();
})();
