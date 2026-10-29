'use strict';
/* CAZANA FASE 3.7 · Herramientas del CRM y bandeja, sin dependencias externas. */
(() => {
  let search='',scope='all',agents=[],user=null,debounceId=null;
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const manager=()=>['owner','admin'].includes(user?.role);
  const assignedToMe=r=>r.assignedTo&&String(r.assignedTo)===String(user?.id);
  const canEdit=r=>manager()||assignedToMe(r);
  function setUser(next){user=next;}
  function setAgents(next){agents=Array.isArray(next)?next:[];}
  function query(){return '&scope='+encodeURIComponent(scope)+'&q='+encodeURIComponent(search);}
  function toolbar(isCrm=false){
    const label=isCrm?'Buscar contacto':'Buscar conversación';
    return `<div class="cz-workflow-toolbar"><label class="cz-workflow-search">${label}<input id="cz-wf-search" maxlength="60" value="${esc(search)}" placeholder="Nombre o correo" autocomplete="off" aria-label="${label}"></label><div class="cz-scope-options" role="group" aria-label="Asignación"><button type="button" data-wf-scope="all" aria-pressed="${scope==='all'}">Todas</button><button type="button" data-wf-scope="unassigned" aria-pressed="${scope==='unassigned'}">Sin asignar</button><button type="button" data-wf-scope="mine" aria-pressed="${scope==='mine'}">Mías</button></div></div>`;
  }
  function bindToolbar(reload){
    const input=$('#cz-wf-search');if(!input)return;
    input.addEventListener('input',()=>{clearTimeout(debounceId);search=input.value.trim();debounceId=setTimeout(reload,350);});
    document.querySelectorAll('[data-wf-scope]').forEach(b=>b.addEventListener('click',()=>{
      scope=b.dataset.wfScope;
      document.querySelectorAll('[data-wf-scope]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.wfScope===scope)));
      reload();
    }));
  }
  function updateUnread(n){
    const count=Math.max(0,Number(n)||0),el=$('#cz-wf-unread');
    if(el){el.hidden=!count;el.textContent=count>99?'99+':String(count);el.setAttribute('aria-label',count+' conversaciones sin leer');}
    document.title=(count?'('+count+') ':'')+'Atención al cliente — Intranet Cazana';
  }
  function agentName(id){if(!id)return 'Sin asignar';if(String(id)===String(user?.id))return 'Asignada a ti';const found=agents.find(a=>a.id===String(id));return found?found.name:'Asignada a otro empleado';}
  function listTags(row){return `<div class="cz-wf-tags">${row.priority==='high'?'<span class="cz-wf-high">Prioridad alta</span>':''}<span class="cz-wf-assignee">${esc(agentName(row.assignedTo))}</span></div>`;}
  function caseHtml(r){
    const editable=canEdit(r),open=r.status==='open',assigned=Boolean(r.assignedTo);
    const assignControls=manager()&&open?`<label class="cz-wf-assignment">Asignar empleado<select id="cz-wf-agent"><option value="">Sin asignar</option>${agents.map(a=>`<option value="${esc(a.employeeCode)}" ${String(r.assignedTo)===a.id?'selected':''}>${esc(a.name)} · ${esc(a.employeeCode)}</option>`).join('')}</select></label><button type="button" class="cz-wf-outline" id="cz-wf-assign">Guardar asignación</button>`:'';
    const claim=!assigned&&open?'<button type="button" class="cz-wf-main" id="cz-wf-claim">Tomar conversación</button>':'';
    const release=assigned&&open&&editable?'<button type="button" class="cz-wf-outline" id="cz-wf-release">Liberar</button>':'';
    const noteTools=editable?`<div class="cz-wf-note-row"><label>Prioridad<select id="cz-wf-priority"><option value="normal" ${r.priority!=='high'?'selected':''}>Normal</option><option value="high" ${r.priority==='high'?'selected':''}>Alta</option></select></label><label class="cz-wf-note">Nota interna (no visible para clientes)<textarea id="cz-wf-note" rows="2" maxlength="400" placeholder="Contexto para el equipo…">${esc(r.internalNote||'')}</textarea></label><button type="button" class="cz-wf-main" id="cz-wf-save">Guardar notas</button></div>`:'<p class="cz-wf-hint">Toma esta conversación para responder y gestionar su prioridad o notas.</p>';
    return `<section class="cz-wf-case" id="cz-wf-case" aria-label="Gestión del caso"><div class="cz-wf-case-head"><div><strong>Seguimiento del caso</strong><small>${esc(agentName(r.assignedTo))}</small></div><span class="${r.priority==='high'?'cz-wf-high':'cz-wf-normal'}">${r.priority==='high'?'Prioridad alta':'Prioridad normal'}</span></div><div class="cz-wf-actions">${claim}${release}${assignControls}</div>${noteTools}</section>`;
  }
  function bindCase({thread:r,request,refresh,onError}){
    const base='/api/staff/chat/threads/'+encodeURIComponent(r.id);
    const run=async(btn,endpoint,method='POST',data)=>{
      if(btn)btn.disabled=true;
      try{await request(base+endpoint,{method,data});await refresh();}
      catch(err){onError(err.message||'No fue posible actualizar el caso.');}
      finally{if(btn&&btn.isConnected)btn.disabled=false;}
    };
    $('#cz-wf-claim')?.addEventListener('click',e=>run(e.currentTarget,'/claim'));
    $('#cz-wf-release')?.addEventListener('click',e=>run(e.currentTarget,'/release'));
    $('#cz-wf-assign')?.addEventListener('click',e=>run(e.currentTarget,'/assign','POST',{employeeCode:$('#cz-wf-agent').value}));
    $('#cz-wf-save')?.addEventListener('click',e=>run(e.currentTarget,'/meta','PATCH',{priority:$('#cz-wf-priority').value,internalNote:$('#cz-wf-note').value}));
  }
  window.CazanaWorkflow=Object.freeze({setUser,setAgents,query,toolbar,bindToolbar,updateUnread,listTags,caseHtml,bindCase,canEdit});
})();
