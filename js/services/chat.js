/* CAZANA-FASE-3-6-1 · Chat sincronizado sin perder borradores. */
(() => {
  'use strict';
  const root=document.getElementById('support-panel');
  if(!root || location.hostname.endsWith('.github.io'))return;
  const body=root.querySelector('.support-body'),cta=root.querySelector('.support-cta');
  const subtitle=root.querySelector('.support-sub');
  if(!body||!cta)return;
  const INTERVAL_MS=7000;
  let thread=null,busy=false,checking=false,authRevision=0;
  const api=async (path,{method='GET',data}={})=>{
    const res=await fetch('/api/chat'+path,{method,credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json','X-Cazana-Request':'1',...(data?{'Content-Type':'application/json'}:{})},...(data?{body:JSON.stringify(data)}:{})});
    if(!res.ok){const error=await res.json().catch(()=>({}));throw Error(error.error||'No se pudo contactar al equipo.');}
    return res.json();
  };
  const field=(tag,label,opts={})=>{
    const wrapper=document.createElement('label');wrapper.className='cz-chat-field';
    const text=document.createElement('span');text.textContent=label;
    const input=document.createElement(tag);input.name=opts.name;input.maxLength=opts.maxLength||1200;
    if(opts.type)input.type=opts.type;
    if(opts.required)input.required=true;
    if(opts.placeholder)input.placeholder=opts.placeholder;
    if(tag==='textarea')input.rows=3;
    wrapper.append(text,input);return wrapper;
  };
  const displayMessage=(target,msg)=>{
    const bubble=document.createElement('div');bubble.className='cz-chat-line '+(msg.sender==='visitor'?'mine':'team');
    const label=document.createElement('small');label.textContent=msg.sender==='visitor'?'Tú':'Equipo Cazana';
    const text=document.createElement('p');text.textContent=msg.text;
    bubble.append(label,text);target.append(bubble);
  };
  const key=m=>[m.sender,m.text,m.at||''].join('\u001f');
  const statusText=s=>s==='closed'?'Conversación cerrada. Puedes escribir para solicitar seguimiento.':'Conversación abierta · el equipo te responderá por este medio.';
  function feedback(container,text){const p=document.createElement('p');p.className='cz-chat-feedback';p.setAttribute('role','status');p.textContent=text;container.append(p);}
  function updateHistory(next){
    const log=body.querySelector('.cz-chat-log'),status=body.querySelector('.cz-chat-status');
    if(!log||!status)return false;
    status.textContent=statusText(next.status);
    const old=thread?.messages||[],incoming=next.messages||[];
    const samePrefix=old.length<=incoming.length && old.every((m,i)=>key(m)===key(incoming[i]));
    const atBottom=log.scrollHeight-log.scrollTop-log.clientHeight<60;
    if(samePrefix){incoming.slice(old.length).forEach(m=>displayMessage(log,m));}
    else{
      const offset=log.scrollTop;
      log.replaceChildren();incoming.forEach(m=>displayMessage(log,m));
      if(!atBottom)log.scrollTop=offset;
    }
    if(atBottom)log.scrollTop=log.scrollHeight;
    return true;
  }
  function render(){
    subtitle.textContent=thread?'Conversación conectada':'Consultas al equipo Cazana';
    body.replaceChildren();cta.replaceChildren();
    const note=document.createElement('p');note.className='cz-chat-privacy';note.textContent='Este chat guarda tus mensajes para que el equipo autorizado pueda responder. No compartas contraseñas ni datos de pago.';
    if(!thread){
      const form=document.createElement('form');form.id='cz-chat-start';form.className='cz-chat-form';
      const title=document.createElement('h3');title.textContent='¿En qué podemos ayudarte?';form.append(title);
      form.append(field('input','Tu nombre',{name:'name',maxLength:80,required:true,placeholder:'Nombre'}));
      form.append(field('input','Correo (opcional)',{name:'email',type:'email',maxLength:180,placeholder:'correo@ejemplo.com'}));
      form.append(field('textarea','Mensaje',{name:'message',required:true,placeholder:'Escribe tu consulta…'}));
      const submit=document.createElement('button');submit.type='submit';submit.className='cz-chat-primary';submit.textContent='Enviar consulta';form.append(submit,note);
      form.addEventListener('submit',async e=>{
        e.preventDefault();if(busy)return;
        busy=true;submit.disabled=true;
        const data=Object.fromEntries(new FormData(form)),revision=authRevision;
        try{const result=(await api('/start',{method:'POST',data})).thread;if(revision!==authRevision)return;thread=result;render();}
        catch(err){feedback(form,err.message);submit.disabled=false;}finally{busy=false;}
      });body.append(form);
    }else{
      const status=document.createElement('p');status.className='cz-chat-status';status.textContent=statusText(thread.status);
      const log=document.createElement('div');log.className='cz-chat-log';log.setAttribute('role','log');log.setAttribute('aria-label','Mensajes de atención');
      thread.messages.forEach(m=>displayMessage(log,m));
      const form=document.createElement('form');form.className='cz-chat-compose';form.append(field('textarea','Tu respuesta',{name:'message',required:true,placeholder:'Escribe aquí…'}));
      const btn=document.createElement('button');btn.type='submit';btn.className='cz-chat-primary';btn.textContent='Enviar mensaje';form.append(btn);
      form.addEventListener('submit',async e=>{
        e.preventDefault();if(busy)return;busy=true;btn.disabled=true;
        try{const revision=authRevision;const next=(await api('/message',{method:'POST',data:Object.fromEntries(new FormData(form))})).thread;
          if(revision!==authRevision)return;updateHistory(next);thread=next;form.querySelector('textarea').value='';
        }catch(err){feedback(form,err.message);}finally{btn.disabled=false;busy=false;}
      });body.append(status,log,form,note);log.scrollTop=log.scrollHeight;
    }
    const contact=document.createElement('a');contact.href='contacto.html';contact.textContent='Otros canales de contacto ↗';cta.append(contact);
  }
  // CAZANA-CHAT-POR-CUENTA-2026: revisar cambios de cuenta sin conservar mensajes de la sesion anterior.
  async function refresh(){
    if(busy||checking)return;
    checking=true;const revision=authRevision;
    try{
      const data=await api('/session');
      if(revision!==authRevision)return; // descartar respuesta anterior a un cambio de cuenta
      if(!data || !Object.prototype.hasOwnProperty.call(data,'thread'))return;
      const next=data.thread;
      const needsForm=!next&&!body.querySelector('#cz-chat-start');
      const needsLog=!!next&&(!thread||thread.id!==next.id||!body.querySelector('.cz-chat-log'));
      if(needsForm||needsLog){thread=next;render();return;}
      if(!next){thread=null;return;}
      if(thread.status!==next.status || JSON.stringify(thread.messages)!==JSON.stringify(next.messages))updateHistory(next);
      thread=next;
    }catch{/* Si hay un fallo de red, no mezclamos nuevos mensajes. */}
    finally{
      checking=false;
      if(revision!==authRevision)queueMicrotask(()=>refresh());
    }
  }
  function accountChanged(){
    authRevision++;thread=null;render();if(!checking)refresh();
  }
  window.addEventListener('cazana:auth-changed',accountChanged);
  window.addEventListener('storage',e=>{if(e.key==='cazana_auth_revision')accountChanged();});
  // En GitHub Pages continúa disponible la demostración estática.
  const css=document.createElement('link');css.rel='stylesheet';css.href='/css/chat.css';document.head.append(css);
  refresh();
  document.getElementById('support-toggle')?.addEventListener('click',()=>{if(root.classList.contains('open'))refresh();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&root.classList.contains('open'))refresh();});
  window.addEventListener('focus',()=>{if(root.classList.contains('open'))refresh();});
  setInterval(()=>{if(root.classList.contains('open')&&!document.hidden)refresh();},INTERVAL_MS);
})();
