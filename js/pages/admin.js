/* Panel de demostración. Los datos son ficticios; en producción se obtendrán desde una API autenticada. */
(() => {
  'use strict';
  const root = document.getElementById('admin-panel');
  if (!root) return;
  const money = n => 'S/ ' + Number(n).toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2});
  const escape = value => String(value ?? '').replace(/[&<>"']/g, x => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const sales = [
    {month:'Abr',amount:18400,orders:84},{month:'May',amount:22100,orders:103},{month:'Jun',amount:28600,orders:131},
    {month:'Jul',amount:25300,orders:117},{month:'Ago',amount:31800,orders:149},{month:'Sep',amount:24200,orders:114}
  ];
  const orders = [
    {id:'CZ-2609-0241',name:'Cliente de ejemplo A',item:'Auriculares Noise Cancelling Pro X',city:'Lima',total:199.99,status:'Enviado'},
    {id:'CZ-2609-0240',name:'Cliente de ejemplo B',item:'Smartwatch Serie 7',city:'Cusco',total:249.99,status:'Procesando'},
    {id:'CZ-2609-0239',name:'Cliente de ejemplo C',item:'Laptop Ultradelgada 14″',city:'Arequipa',total:749.99,status:'Pendiente'},
    {id:'CZ-2609-0238',name:'Cliente de ejemplo D',item:'Juego de Ollas Inox',city:'Lima',total:149.99,status:'Entregado'},
    {id:'CZ-2609-0237',name:'Cliente de ejemplo E',item:'Cafetera Espresso',city:'Piura',total:89.99,status:'Entregado'}
  ];
  const inventory = (window.CazanaData || []).map((p,i)=>({id:p.id,name:p.name,sku:`CZ-${p.category==='hogar'?'HOG':'TEC'}-${String(i+1).padStart(3,'0')}`,category:p.subcategory,price:p.price,stock:[17,24,4,9,2,27,0,16,11,8,5,13][i] ?? 10,sold:[88,35,57,104,62,18,11,43,26,31,49,10][i]??5}));
  const expenses = [{name:'Publicidad digital',category:'Marketing',amount:1850},{name:'Logística',category:'Envíos',amount:2640},{name:'Servicios y operación',category:'Operaciones',amount:1210},{name:'Comisiones',category:'Pagos',amount:640}];
  const revenue = sales.at(-1).amount;
  const totalExpenses = expenses.reduce((sum,x)=>sum+x.amount,0);
  const statusStyle = x => ({'Pendiente':'pending','Procesando':'processing','Enviado':'shipped','Entregado':'delivered'}[x]||'pending');
  const tableWrap = (headers, rows) => `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${headers.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  const note = 'Datos ilustrativos. Este panel no está conectado a ventas ni a usuarios reales.';
  const heading = (title,subtitle)=>`<div class="dash-section-header"><div><p class="eyebrow">Septiembre 2026 · muestra</p><h2>${title}</h2><p>${subtitle}</p></div><span class="admin-inline-tag">Vista de ejemplo</span></div>`;
  function overview() {
    const orderRows=orders.slice(0,4).map(o=>`<tr><td class="order-id">${o.id}</td><td>${o.name}</td><td>${money(o.total)}</td><td><span class="order-status ${statusStyle(o.status)}">${o.status}</span></td></tr>`).join('');
    const low=inventory.filter(p=>p.stock<=5).slice(0,4);
    const bars=sales.map(s=>`<div class="chart-column"><span class="chart-bar" style="height:${Math.max(22,Math.round(s.amount/35000*195))}px" title="${s.month}: ${money(s.amount)}"></span><span class="chart-label">${s.month}</span></div>`).join('');
    return `${heading('Resumen general','Una mirada rápida al movimiento del negocio.')}
      <div class="kpi-grid"><article class="kpi-card"><span>Ventas del mes</span><strong>${money(revenue)}</strong><small>Último mes de la muestra</small><div class="kpi-icon">↗</div></article><article class="kpi-card"><span>Pedidos</span><strong>${sales.at(-1).orders}</strong><small>Órdenes ilustrativas</small><div class="kpi-icon">▣</div></article><article class="kpi-card"><span>Gastos</span><strong>${money(totalExpenses)}</strong><small>Clasificados por categoría</small><div class="kpi-icon">◎</div></article><article class="kpi-card"><span>Productos bajo mínimo</span><strong>${low.length}</strong><small>Requieren reposición</small><div class="kpi-icon">!</div></article></div>
      <div class="admin-dual-grid"><section class="dash-card"><div class="dash-card-head"><h3>Ventas de los últimos meses</h3><span>Ingresos ilustrativos</span></div><div class="chart-amount">${money(revenue)}</div><div class="bar-chart" aria-label="Gráfico de ventas de ejemplo de abril a septiembre">${bars}</div></section><section class="dash-card"><div class="dash-card-head"><h3>Resumen operativo</h3></div><div class="activity-item"><span class="activity-dot emerald"></span><div><strong>${orders.filter(x=>x.status==='Entregado').length} pedidos entregados</strong><small>Ejemplo de flujo finalizado</small></div></div><div class="activity-item"><span class="activity-dot gold"></span><div><strong>${orders.filter(x=>x.status==='Pendiente'||x.status==='Procesando').length} requieren seguimiento</strong><small>Pedidos pendientes o en proceso</small></div></div><div class="activity-item"><span class="activity-dot rust"></span><div><strong>${low.length} alertas de inventario</strong><small>Stock igual o menor a 5 unidades</small></div></div><a class="admin-text-link" href="#inventario" data-navigate-tab="inventory">Revisar inventario →</a></section></div>
      <div class="admin-dual-grid"><section class="dash-card"><div class="dash-card-head"><h3>Pedidos recientes</h3><button class="admin-text-link" data-navigate-tab="orders">Ver todos →</button></div>${tableWrap(['Pedido','Cliente','Monto','Estado'],orderRows)}</section><section class="dash-card"><div class="dash-card-head"><h3>Stock bajo</h3><button class="admin-text-link" data-navigate-tab="inventory">Ver inventario →</button></div><div class="lowstock-list">${low.map(p=>`<div class="stock-item"><span class="stock-avatar">${escape(p.name.charAt(0))}</span><span class="stock-item-name">${escape(p.name)}</span><strong>${p.stock} uds</strong></div>`).join('')}</div></section></div>`;
  }
  function analytics(){const categories={hogar:0,tecnologia:0};inventory.forEach(p=>categories[p.sku.includes('HOG')?'hogar':'tecnologia']+=p.sold*p.price);
    return `${heading('Estadísticas','Tendencias y rendimiento de muestra.')}
     <div class="kpi-grid"><article class="kpi-card"><span>Unidades disponibles</span><strong>${inventory.reduce((n,p)=>n+p.stock,0)}</strong><small>Inventario ilustrativo</small></article><article class="kpi-card"><span>Productos registrados</span><strong>${inventory.length}</strong><small>Hogar y tecnología</small></article><article class="kpi-card"><span>Ventas del período</span><strong>${money(sales.reduce((n,s)=>n+s.amount,0))}</strong><small>Abril a septiembre</small></article></div>
      <div class="admin-dual-grid"><section class="dash-card"><h3>Ingresos por mes</h3><div class="trend-list">${sales.map(s=>`<div class="trend-item"><span>${s.month}</span><div class="trend-track"><span style="width:${Math.round(s.amount/35000*100)}%"></span></div><strong>${money(s.amount)}</strong></div>`).join('')}</div></section><section class="dash-card"><h3>Productos destacados</h3><div class="trend-list">${inventory.slice().sort((a,b)=>b.sold-a.sold).slice(0,5).map((p,i)=>`<div class="trend-item"><span>${i+1}.</span><strong class="grow-text">${escape(p.name)}</strong><small>${p.sold} uds.</small></div>`).join('')}</div></section></div>`;
  }
  function ordersPage(){return `${heading('Gestión de pedidos','Consulta los pedidos y sus estados.')}
    <section class="dash-card"><div class="dash-card-head"><h3>Listado de pedidos</h3><span>${orders.length} registros de muestra</span></div>${tableWrap(['Código','Cliente','Producto','Ciudad','Total','Estado'],orders.map(o=>`<tr><td class="order-id">${o.id}</td><td>${escape(o.name)}</td><td>${escape(o.item)}</td><td>${escape(o.city)}</td><td>${money(o.total)}</td><td><span class="order-status ${statusStyle(o.status)}">${o.status}</span></td></tr>`).join(''))}</section>`;}
  function inventoryPage(){return `${heading('Inventario','Productos, existencias y alertas de reposición.')}
    <section class="dash-card"><div class="dash-card-head"><h3>Control de productos</h3><span>${inventory.filter(p=>p.stock<=5).length} alertas · 12 productos</span></div>${tableWrap(['SKU','Producto','Categoría','Precio','Existencias','Estado'],inventory.map(p=>`<tr><td class="order-id">${p.sku}</td><td>${escape(p.name)}</td><td>${escape(p.category)}</td><td>${money(p.price)}</td><td>${p.stock}</td><td><span class="order-status ${p.stock<=5?'critical':'delivered'}">${p.stock===0?'Agotado':p.stock<=5?'Stock bajo':'Disponible'}</span></td></tr>`).join(''))}</section>`;}
  function accountingPage(){return `${heading('Contabilidad','Resumen ilustrativo de ingresos y gastos.')}
      <div class="kpi-grid"><article class="kpi-card"><span>Ingresos</span><strong>${money(revenue)}</strong><small>Septiembre</small></article><article class="kpi-card"><span>Gastos</span><strong>${money(totalExpenses)}</strong><small>Gastos de ejemplo</small></article><article class="kpi-card"><span>Margen simple</span><strong>${money(revenue-totalExpenses)}</strong><small>No incluye impuestos ni costo de mercadería</small></article></div>
      <section class="dash-card"><div class="dash-card-head"><h3>Desglose de gastos</h3><span>Valores ficticios</span></div>${tableWrap(['Concepto','Categoría','Monto'],expenses.map(e=>`<tr><td>${escape(e.name)}</td><td>${escape(e.category)}</td><td>${money(e.amount)}</td></tr>`).join(''))}</section><div class="compact-notice admin-finance-note">El margen mostrado no es utilidad neta. El módulo contable real incorporará impuestos, costo de venta, devoluciones y conciliación.</div>`;}
  function supportPage(){return `${heading('Atención al cliente','Consultas y conversaciones en un solo lugar.')}
    <div class="support-preview-grid"><section class="dash-card"><h3>Bandeja de consultas</h3>${[['Consulta de producto','Nuevo'],['Estado de entrega','Pendiente'],['Cambio o devolución','Cerrado']].map(([a,b])=>`<div class="support-preview-item"><span class="support-preview-avatar">✉</span><div><strong>${a}</strong><small>Conversación de ejemplo</small></div><span class="order-status ${b==='Cerrado'?'delivered':'pending'}">${b}</span></div>`).join('')}</section><section class="dash-card support-preview-empty"><div class="support-large-icon">♡</div><h3>Atención más cercana</h3><p>Las conversaciones se mostrarán aquí cuando habilitemos el canal de soporte.</p><a class="btn btn-outline" href="contacto.html">Ver contacto</a></section></div>`;}

  function testimonialsPage(){
    const T=window.CazanaTestimonials;
    if(!T)return '<p>No se pudo cargar el editor de testimonios.</p>';
    const list=T.getAll();
    const rows=list.map((x,n)=>`<article class="admin-testimonial-item">
      <div><strong>${escape(x.name)}</strong> <small>${escape(x.city)}</small><p>${escape(x.text)}</p>
      <small>${escape(x.product)} · ${'★'.repeat(x.rating)} · ${x.published?'Publicado':'Oculto'}</small></div>
      <div class="admin-testimonial-actions">
        <button class="btn btn-outline" type="button" data-review-act="edit" data-id="${escape(x.id)}">Editar</button>
        <button class="btn btn-outline" type="button" data-review-act="toggle" data-id="${escape(x.id)}">${x.published?'Ocultar':'Publicar'}</button>
        <button class="btn btn-outline" type="button" aria-label="Subir testimonio" title="Subir" data-review-act="up" data-id="${escape(x.id)}" ${n===0?'disabled':''}>↑</button>
        <button class="btn btn-outline" type="button" aria-label="Bajar testimonio" title="Bajar" data-review-act="down" data-id="${escape(x.id)}" ${n===list.length-1?'disabled':''}>↓</button>
        <button class="btn btn-outline" type="button" data-review-act="delete" data-id="${escape(x.id)}">Eliminar</button>
      </div>
    </article>`).join('');
    return `${heading('Testimonios de clientes','Gestiona los comentarios que aparecen en la portada.')}
      <div class="compact-notice">Modo de demostración: los cambios se guardan únicamente en este navegador. Para que todos los visitantes vean los testimonios, será necesaria una API y autenticación del administrador. Publica solo opiniones reales autorizadas. Las compras no se verifican en esta versión.</div>
      ${T.isDemo()?'<div class="compact-notice">La portada muestra cuatro ejemplos ilustrativos hasta que registres el primer testimonio.</div>':''}
      <div class="admin-testimonial-layout">
        <section class="dash-card"><h3 id="review-form-title">Añadir testimonio</h3>
          <form id="admin-testimonial-form">
            <input type="hidden" name="id">
            <label>Cliente<input required maxlength="80" name="name" placeholder="Nombre del cliente"></label>
            <label>Ciudad y país<input maxlength="80" name="city" placeholder="Lima, Perú"></label>
            <label>Producto<input maxlength="100" name="product" placeholder="Producto comprado"></label>
            <div class="rating-field"><span class="rating-label">Calificación</span>
              <div class="star-picker" role="radiogroup" aria-label="Calificación del testimonio">
                ${[1,2,3,4,5].map(n=>`<label class="rating-star is-on" aria-label="${n} ${n===1?'estrella':'estrellas'}"><input type="radio" name="rating" value="${n}" ${n===5?'checked':''} aria-label="${n} ${n===1?'estrella':'estrellas'}"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m12 2 3.1 6.4 7.1 1-5.1 4.9 1.2 7-6.3-3.3-6.3 3.3 1.2-7-5.1-4.9 7.1-1L12 2Z"/></svg></label>`).join('')}
              </div>
              <span class="rating-feedback" aria-live="polite">5 de 5 estrellas</span>
            </div>
            <label>Foto opcional (URL HTTPS o ruta assets/)<input maxlength="400" name="image" placeholder="https://..."></label>
            <label>Comentario<textarea required minlength="10" maxlength="600" rows="4" name="text" placeholder="Experiencia del cliente"></textarea></label>
            <label class="admin-testimonial-checkbox"><input type="checkbox" checked name="published"> Publicar en inicio</label>
            <div class="admin-testimonial-actions"><button class="btn btn-gold" type="submit">Guardar</button><button class="btn btn-outline" type="reset" id="reset-testimonial-form">Cancelar edición</button></div>
            <p role="status" id="admin-testimonial-status"></p>
          </form>
        </section>
        <section class="dash-card"><h3>Testimonios registrados (${list.length})</h3>
          <p class="admin-testimonial-help">Se muestran los primeros cuatro publicados, según su orden.</p>
          ${rows||'<p>Aún no hay testimonios registrados.</p>'}
        </section>
      </div>`;
  }
  function bindTestimonials(){
    const T=window.CazanaTestimonials, form=root.querySelector('#admin-testimonial-form');
    if(!T||!form)return;
    const status=message=>{const el=root.querySelector('#admin-testimonial-status');if(el)el.textContent=message;};
    const syncRatingStars=()=>{
      const selected=Number(form.querySelector('input[name="rating"]:checked')?.value||5);
      form.querySelectorAll('.rating-star').forEach(label=>
        label.classList.toggle('is-on',Number(label.querySelector('input')?.value||0)<=selected));
      form.querySelector('.rating-feedback').textContent=`${selected} de 5 estrellas`;
    };
    form.addEventListener('reset',()=>{
      root.querySelector('#review-form-title').textContent='Añadir testimonio';
      setTimeout(syncRatingStars,0);
    });
    form.addEventListener('submit',event=>{
      event.preventDefault();
      const fd=new FormData(form),entries=T.getAll(),id=String(fd.get('id')||'');
      const image=String(fd.get('image')||'').trim();
      if(image&&!T.validImage(image))return status('La foto requiere una URL HTTPS o ruta assets/ válida.');
      const item={id:id||'test-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),name:String(fd.get('name')||'').trim(),
        city:String(fd.get('city')||'').trim(),product:String(fd.get('product')||'').trim(),text:String(fd.get('text')||'').trim(),
        image,rating:Number(fd.get('rating')),published:fd.has('published')};
      if(!item.name||item.text.length<10)return status('Completa el nombre y el comentario (mínimo 10 caracteres).');
      const idx=entries.findIndex(x=>x.id===id);
      if(id&&idx===-1)return status('No se encontró el testimonio para actualizar.');
      if(idx>=0)entries[idx]=item;else entries.unshift(item);
      if(!T.saveAll(entries))return status('No se pudo guardar en este navegador.');
      render('testimonials');
    });
    root.querySelectorAll('[data-review-act]').forEach(btn=>btn.addEventListener('click',()=>{
      const list=T.getAll(),idx=list.findIndex(x=>x.id===btn.dataset.id),action=btn.dataset.reviewAct;
      if(idx<0)return;
      if(action==='edit'){
        const item=list[idx];
        for(const key of ['id','name','city','product','text','image'])form.elements.namedItem(key).value=item[key]??'';
        const radio=form.querySelector(`input[name="rating"][value="${item.rating}"]`);
        if(radio)radio.checked=true;
        syncRatingStars();
        form.elements.namedItem('published').checked=item.published;
        root.querySelector('#review-form-title').textContent='Editar testimonio';
        form.scrollIntoView({behavior:'smooth',block:'nearest'});
        return;
      }
      if(action==='delete'){if(!confirm('¿Eliminar este testimonio?'))return;list.splice(idx,1);}
      else if(action==='toggle')list[idx].published=!list[idx].published;
      else if(action==='up'&&idx>0)[list[idx-1],list[idx]]=[list[idx],list[idx-1]];
      else if(action==='down'&&idx<list.length-1)[list[idx+1],list[idx]]=[list[idx],list[idx+1]];
      else return;
      if(!T.saveAll(list))return status('No se pudo guardar en este navegador.');
      render('testimonials');
    }));
  }

  const sections={overview,analytics,orders:ordersPage,inventory:inventoryPage,accounting:accountingPage,support:supportPage,testimonials:testimonialsPage};
  function render(tab){const id=sections[tab]?tab:'overview';root.innerHTML=sections[id]();document.querySelectorAll('[data-admin-tab]').forEach(b=>{b.classList.toggle('selected',b.dataset.adminTab===id);b.setAttribute('aria-current',b.dataset.adminTab===id?'page':'false')});root.querySelectorAll('[data-navigate-tab]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();render(b.dataset.navigateTab)}));if(id==='testimonials')bindTestimonials();}
  document.querySelectorAll('[data-admin-tab]').forEach(btn=>btn.addEventListener('click',()=>render(btn.dataset.adminTab)));
  const csv = (rows)=> '\uFEFF'+rows.map(row=>row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(';')).join('\r\n');
  document.getElementById('admin-export')?.addEventListener('click',()=>{
    const current=document.querySelector('[data-admin-tab].selected')?.dataset.adminTab||'overview';
    let rows=[['Mes','Ventas (PEN)','Pedidos'],...sales.map(s=>[s.month,s.amount,s.orders])];
    if(current==='orders')rows=[['Pedido','Cliente','Artículo','Destino','Monto','Estado'],...orders.map(o=>[o.id,o.name,o.item,o.city,o.total,o.status])];
    if(current==='inventory')rows=[['SKU','Producto','Categoría','Precio','Stock','Vendidos'],...inventory.map(p=>[p.sku,p.name,p.category,p.price,p.stock,p.sold])];
    if(current==='accounting')rows=[['Concepto','Categoría','Monto'],...expenses.map(e=>[e.name,e.category,e.amount])];
    const blob=new Blob([csv(rows)],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`cazana-${current}-ejemplo.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  });
  render('overview');
})();
