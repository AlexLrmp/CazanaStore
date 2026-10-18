/* Testimonios demo; cambiar a API autenticada en producción. */
(function testimonialsModule() {
  'use strict';
  const KEY = 'cazana_home_testimonials_v1';
  // Los ejemplos siguientes son ilustrativos: NO son compras ni reseñas verificadas.
  const samples = [
    {id:'demo-1',name:'María García',city:'Lima, Perú',rating:5,text:'Diseño elegante y café muy bueno. Llegó rápido y se ve aún mejor en persona.',product:'Cafetera Espresso Premium',image:'',published:true},
    {id:'demo-2',name:'Carlos Rodríguez',city:'Bogotá, Colombia',rating:5,text:'La uso todos los días. Fácil de limpiar y la crema queda excelente.',product:'Cafetera Espresso Premium',image:'',published:true},
    {id:'demo-3',name:'Ana Torres',city:'Santiago, Chile',rating:5,text:'Desde la primera noche se siente la diferencia. Muy buena calidad.',product:'Sábanas Egipcias',image:'',published:true},
    {id:'demo-4',name:'Luis Hernández',city:'Buenos Aires, Argentina',rating:5,text:'La cancelación de ruido es increíble y el acabado se ve premium.',product:'Auriculares Noise Cancelling',image:'',published:true}
  ];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function validImage(source) {
    const url = String(source ?? '').trim();
    return /^(https:\/\/[^\s]+|assets\/[a-zA-Z0-9_./-]+\.(?:png|jpe?g|webp|avif))$/i.test(url) ? url : '';
  }
  function normalise(item) {
    if (!item || typeof item !== 'object') return null;
    const name=String(item.name ?? '').trim().slice(0,80);
    const text=String(item.text ?? '').trim().slice(0,600);
    if (!name || !text) return null;
    return {
      id:String(item.id ?? '').slice(0,80),name,
      city:String(item.city ?? '').trim().slice(0,80),
      product:String(item.product ?? '').trim().slice(0,100),
      text,rating:Math.min(5,Math.max(1,Math.round(Number(item.rating)||5))),
      image:validImage(item.image),published:item.published===true
    };
  }
  function readRaw() {
    try {
      const raw=localStorage.getItem(KEY);
      if(raw===null)return null;
      const parsed=JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalise).filter(Boolean) : [];
    } catch {return null;}
  }
  const getAll=()=>readRaw()??[];
  const isDemo=()=>readRaw()===null;
  const getVisible=()=>(readRaw()??samples).filter(item=>item.published).slice(0,4);
  function saveAll(items){
    try{
      localStorage.setItem(KEY,JSON.stringify(items.map(normalise).filter(Boolean)));
      window.dispatchEvent(new Event('cazana:testimonials-updated'));
      return true;
    }catch{return false;}
  }
  function card(item){
    const avatar=validImage(item.image)
      ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy">`
      : escapeHtml(item.name.charAt(0).toUpperCase());
    const stars='★'.repeat(item.rating)+'☆'.repeat(5-item.rating);
    return `<article class="review-card testimonial-card">
      <div class="testimonial-stars" aria-label="${item.rating} de 5 estrellas">${stars}</div>
      <blockquote>“${escapeHtml(item.text)}”</blockquote>
      <div class="review-user"><div class="review-avatar">${avatar}</div>
        <div class="testimonial-person"><b>${escapeHtml(item.name)}</b><span>${escapeHtml(item.city||'Cliente de Cazana')}</span></div>
      </div>${item.product?`<p class="testimonial-product">${escapeHtml(item.product)}</p>`:''}
    </article>`;
  }
  function render(){
    const grid=document.getElementById('homepage-testimonials');
    if(!grid)return;
    const list=getVisible();
    grid.innerHTML=list.length?list.map(card).join(''):'<p class="testimonials-empty">Pronto compartiremos aquí las experiencias de nuestros clientes.</p>';
    const note=document.getElementById('testimonials-demo-note');
    if(note)note.hidden=!isDemo();
  }
  window.CazanaTestimonials=Object.freeze({KEY,getAll,getVisible,isDemo,saveAll,render,escapeHtml,validImage});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render);
  else render();
  window.addEventListener('storage',event=>{if(event.key===KEY)render();});
  window.addEventListener('cazana:testimonials-updated',render);
})();
