/**
 * Contrato inicial de API, SIN USO EN LA DEMO v4.
 * Se activará cuando construyamos el backend Express + MongoDB.
 * No contiene usuarios, credenciales, secretos ni claves de pasarela.
 */
window.CazanaAPI = (() => {
  'use strict';
  const BASE = '/api';
  async function request(path, { method='GET', body, ...options }={}) {
    const res = await fetch(`${BASE}${path}`, {
      method,
      credentials:'same-origin',
      headers:{'Accept':'application/json',...(body?{'Content-Type':'application/json'}:{}),...options.headers},
      ...(body?{body:JSON.stringify(body)}:{}),
      ...options
    });
    if (!res.ok) {
      let data={};try{data=await res.json()}catch{}
      throw new Error(data.message || `No se pudo completar la operación (${res.status}).`);
    }
    if (res.status===204) return null;
    return res.json();
  }
  return Object.freeze({
    products: ({category='',q='',sort=''}={})=>request(`/products?${new URLSearchParams({category,q,sort})}`),
    product: slug=>request(`/products/${encodeURIComponent(slug)}`),
    categories: ()=>request('/categories'),
    login: (email,password)=>request('/auth/login',{method:'POST',body:{email,password}}),
    me: ()=>request('/auth/me'),
    logout: ()=>request('/auth/logout',{method:'POST'}),
    cart: ()=>request('/cart'),
    saveCart: items=>request('/cart',{method:'PUT',body:{items}}),
    orders: ()=>request('/orders/mine'),
    favorites: ()=>request('/favorites'),
    reviews: slug=>request(`/products/${encodeURIComponent(slug)}/reviews`),
    adminSummary: ()=>request('/admin/summary'),
    adminOrders: ()=>request('/admin/orders'),
    adminInventory: ()=>request('/admin/inventory'),
    adminFinance: ()=>request('/admin/finance')
  });
})();
