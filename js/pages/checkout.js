/* CAZANA — Solicitudes de pedidos sin pagos integrados. */
(() => {
'use strict';
const root=document.getElementById('checkout-items');if(!root)return;
const $=s=>document.querySelector(s);
const escapeHTML=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const money=c=>new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(Number(c||0)/100);
const products=Array.isArray(window.CazanaData)?window.CazanaData:[],map=new Map(products.map(p=>[p.id,p]));
let cart=[];try{cart=JSON.parse(localStorage.getItem('cazana_cart')||'[]');}catch{};
cart=cart.filter(x=>map.has(x.id)&&Number.isInteger(x.qty)&&x.qty>0&&x.qty<=20);
let user=null,busy=false;
async function api(url,method='GET',payload){const response=await fetch(url,{method,credentials:'same-origin',headers:{Accept:'application/json','X-Cazana-Request':'1',...(payload===undefined?{}:{'Content-Type':'application/json'})},...(payload===undefined?{}:{body:JSON.stringify(payload)})});let data={};try{data=await response.json();}catch{}if(!response.ok)throw Error(data.error||'No se pudo completar la solicitud.');return data;}
function prices(){const subtotal=cart.reduce((sum,item)=>sum+Math.round(map.get(item.id).price*100)*item.qty,0);root.innerHTML=cart.length?cart.map(item=>{const p=map.get(item.id);return `<div class="checkout-item"><img src="${escapeHTML(p.image||'')}" alt=""><div><strong>${escapeHTML(p.name)}</strong><small>${item.qty} × ${money(Math.round(p.price*100))}</small></div><b>${money(Math.round(p.price*100)*item.qty)}</b></div>`;}).join(''):'<p class="muted-copy">Tu carrito está vacío. <a href="tienda.html">Explorar tienda</a>.</p>';
 $('#checkout-subtotal').textContent=money(subtotal);$('#checkout-discount').textContent='—';$('#checkout-total').textContent=money(subtotal);
 return subtotal;
}
function form(){const container=$('.checkout-form-display');if(!container)return;
const info=$('.checkout-head .compact-notice');if(info)info.textContent='Registra una solicitud de pedido sin realizar pagos. El personal de Cazana confirmará la disponibilidad, cobertura y entrega.';
const area=$('.checkout-fields');if(!area)return;
container.innerHTML=`<div class="customer-checkout"><div id="checkout-alert" role="status"></div><form id="request-order-form" class="customer-form">
  <div class="customer-form-grid"><label class="customer-field"><span>Nombre y apellido</span><input name="fullName" autocomplete="name" minlength="3" maxlength="120" required value="${escapeHTML(user?.name||'')}"></label><label class="customer-field"><span>Teléfono</span><input name="phone" type="tel" inputmode="tel" minlength="7" maxlength="25" autocomplete="tel" required></label></div>
  <label class="customer-field"><span>Dirección de entrega</span><input name="address" minlength="6" maxlength="220" autocomplete="street-address" required></label>
  <div class="customer-form-grid"><label class="customer-field"><span>Ciudad</span><input name="city" minlength="2" maxlength="100" autocomplete="address-level2" required></label><label class="customer-field"><span>Departamento / región</span><input name="region" minlength="2" maxlength="100" autocomplete="address-level1" required></label></div>
  <label class="customer-field"><span>Referencia (opcional)</span><input name="reference" maxlength="220"></label>
  <label class="customer-field"><span>Nota para el pedido (opcional)</span><textarea name="notes" rows="3" maxlength="500"></textarea></label>
  <div class="compact-notice"><strong>No se realiza ningún cobro.</strong> Los montos se vuelven a calcular en el servidor. La entrega y cualquier método de pago se coordinarán posteriormente.</div>
  <button type="submit" class="btn btn-green" ${cart.length?'':'disabled'}>Enviar solicitud de pedido</button></form></div>`;
const paymentTitle=Array.from(area.querySelectorAll('h3')).find(x=>/Métodos de pago/i.test(x.textContent));if(paymentTitle)paymentTitle.textContent='Pago y entrega por coordinar';
const methods=area.querySelector('.payment-methods');if(methods)methods.remove();
const preview=area.querySelector('.checkout-head .demo-tag');if(preview)preview.textContent='SOLICITUD REAL · SIN COBRO';
const headline=document.querySelector('.checkout-shell>h1');if(headline)headline.textContent='Solicita tu pedido';
const description=document.querySelector('.checkout-shell>.page-intro');if(description)description.textContent='Confirma tus datos para registrar la solicitud. No se realiza ningún pago en línea.';
const progress=document.querySelectorAll('.checkout-progress>div');if(progress.length>2){progress[1].innerHTML='02 <span>Confirmación</span>';progress[2].innerHTML='03 <span>Seguimiento</span>';}
const discount=$('#checkout-discount');if(discount&&discount.parentElement?.firstElementChild)discount.parentElement.firstElementChild.textContent='Descuentos (no disponibles)';
const old=Array.from(area.querySelectorAll('button')).find(x=>/Confirmar pedido/i.test(x.textContent));if(old)old.remove();
}
function alert(text,isError=false){const n=$('#checkout-alert');if(n){n.textContent=text;n.classList.toggle('error',isError);}}
async function startup(){prices();if(!cart.length)return;try{const result=await api('/api/auth/me');if(result.user?.role!=='customer')throw Error('Se necesita una cuenta de cliente.');user=result.user;form();}
catch{const c=$('.checkout-form-display');if(c)c.innerHTML=`<div class="compact-notice">Para solicitar un pedido necesitas <a href="cuenta.html">iniciar sesión o crear tu cuenta de cliente</a>. Tus productos permanecen en el carrito de este navegador.</div>`;}}
document.addEventListener('submit',async e=>{
if(e.target.id!=='request-order-form')return;e.preventDefault();if(busy||!cart.length)return;busy=true;const btn=e.target.querySelector('button[type=submit]');btn.disabled=true;
const f=new FormData(e.target),items=cart.map(x=>({productId:x.id,quantity:x.qty}));
const currentKey=JSON.stringify(items);
let requestId='';try{const saved=JSON.parse(sessionStorage.getItem('cazana-order-request')||'null');if(saved?.key===currentKey)requestId=saved.id;}catch{}
if(!requestId){requestId=crypto.randomUUID();try{sessionStorage.setItem('cazana-order-request',JSON.stringify({key:currentKey,id:requestId}));}catch{}}
const payload={requestId,items,shipping:{fullName:String(f.get('fullName')),phone:String(f.get('phone')),address:String(f.get('address')),city:String(f.get('city')),region:String(f.get('region')),reference:String(f.get('reference'))},notes:String(f.get('notes'))};
try{const response=await api('/api/orders','POST',payload);cart=[];localStorage.setItem('cazana_cart','[]');sessionStorage.removeItem('cazana-order-request');
 const c=$('.checkout-form-display');c.innerHTML=`<div class="customer-order-success"><div class="customer-order-success-mark">✓</div><h3>Solicitud registrada</h3><p>Pedido <strong>${escapeHTML(response.order.id.slice(-8).toUpperCase())}</strong> guardado en MongoDB.</p><p>Importe del pedido: <strong>${money(response.order.totalCents)}</strong>. No se ha realizado ningún cobro.</p><p>Un empleado deberá confirmar la entrega y el método de pago.</p><a class="btn btn-green" href="cuenta.html">Ver mis pedidos</a></div>`;prices();
}catch(err){alert(err.message,true);btn.disabled=false;}finally{busy=false;}
});
startup();
})();
