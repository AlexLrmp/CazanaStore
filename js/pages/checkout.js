(() => {
  const products=window.CazanaData||[];
  const money=n=>'S/ '+Number(n||0).toFixed(2);
  let cart=[];try{cart=JSON.parse(localStorage.getItem('cazana_cart')||'[]')}catch{}
  const root=document.getElementById('checkout-items');if(!root)return;
  const subtotal=cart.reduce((sum,item)=>sum+(products.find(p=>p.id===item.id)?.price||0)*item.qty,0);
  let coupon=0;try{coupon=localStorage.getItem('cazana_demo_coupon')==='DEMO10'?Number((subtotal*.10).toFixed(2)):0}catch{}
  root.innerHTML=cart.map(item=>{const p=products.find(x=>x.id===item.id);if(!p)return '';return `<div class="checkout-item"><img src="${p.image}" alt=""><div><strong>${p.name}</strong><small>${item.qty} × ${money(p.price)}</small></div><b>${money(p.price*item.qty)}</b></div>`}).join('')||'<p class="muted-copy">No has agregado productos. <a href="tienda.html">Explorar tienda</a></p>';
  document.getElementById('checkout-subtotal').textContent=money(subtotal);
  document.getElementById('checkout-discount').textContent='− '+money(coupon);
  document.getElementById('checkout-total').textContent=money(subtotal-coupon);
})();
