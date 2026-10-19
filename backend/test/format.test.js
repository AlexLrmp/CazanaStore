'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {serializeProduct,waLink}=require('../src/format');
test('serializeProduct conserva el ID del frontend y convierte el dinero',()=>{
  const result=serializeProduct({_id:'mongo123',legacyId:'h1',sku:'CZ-HOG-001',priceCents:8999,originalPriceCents:11999,stockQty:3,name:'Cafetera',category:'hogar',gallery:['assets/productos/cafetera-espresso/principal.jpg'],image:'assets/productos/cafetera-espresso/principal.jpg'});
  assert.equal(result.id,'h1');assert.equal(result.price,89.99);assert.equal(result.originalPrice,119.99);assert.equal(result.stock,true);
});
test('sin stock devuelve no disponible',()=>{
  assert.equal(serializeProduct({_id:'x',priceCents:0,stockQty:0}).stock,false);
});
test('whatsapp configurable usa el número recibido y codifica el mensaje',()=>{
  const link=waLink('51986803872','Hola Percy, ¿tienes esta cafetera?');
  assert.ok(link.startsWith('https://wa.me/51986803872?text='));
  assert.ok(decodeURIComponent(new URL(link).searchParams.get('text'))==='Hola Percy, ¿tienes esta cafetera?');
});
