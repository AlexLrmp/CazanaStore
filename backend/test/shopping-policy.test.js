'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {combineGuestCart,combineFavorites}=require('../src/shopping-policy');
test('la migración del carrito de invitado es idempotente y sin duplicados',()=>{
 const server=[{id:'h1',qty:2},{id:'t1',qty:1}];
 const guest=[{id:'h1',qty:1},{id:'h2',qty:3}];
 const merged=combineGuestCart(server,guest);
 assert.deepEqual(merged,[{id:'h1',qty:2},{id:'t1',qty:1},{id:'h2',qty:3}]);
 assert.deepEqual(combineGuestCart(merged,guest),merged);
});
test('los favoritos no duplican productos al combinar dos dispositivos',()=>{
 assert.deepEqual(combineFavorites(['h1','h2'],['h2','h3']),['h1','h2','h3']);
});
test('la migración limita cantidades a la misma unidad que el checkout',()=>{
 assert.deepEqual(combineGuestCart([{id:'h1',qty:20}],[{id:'h1',qty:2}]),[{id:'h1',qty:20}]);
});
