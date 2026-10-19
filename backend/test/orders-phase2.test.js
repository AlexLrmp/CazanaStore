'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {canChangeStatus,sumOrderLines}=require('../src/order-policy');
test('permisos de cambio de estado: solo transiciones válidas',()=>{
  assert.equal(canChangeStatus('pending','confirmed'),true);
  assert.equal(canChangeStatus('confirmed','preparing'),true);
  assert.equal(canChangeStatus('preparing','shipped'),true);
  assert.equal(canChangeStatus('shipped','delivered'),true);
  assert.equal(canChangeStatus('delivered','pending'),false);
  assert.equal(canChangeStatus('cancelled','confirmed'),false);
  assert.equal(canChangeStatus('pending','cancelled',{customerOnly:true}),true);
  assert.equal(canChangeStatus('confirmed','cancelled',{customerOnly:true}),false);
});
test('cálculo de precios en centavos y verificación de cantidades',()=>{
  assert.equal(sumOrderLines([{unitPriceCents:8999,quantity:2},{unitPriceCents:1099,quantity:1}]),19097);
  assert.throws(()=>sumOrderLines([{unitPriceCents:-1,quantity:1}]));
  assert.throws(()=>sumOrderLines([{unitPriceCents:100,quantity:0}]));
  assert.throws(()=>sumOrderLines([{unitPriceCents:100,quantity:21}]));
  assert.throws(()=>sumOrderLines([{unitPriceCents:Number.MAX_SAFE_INTEGER,quantity:2}]));
});
