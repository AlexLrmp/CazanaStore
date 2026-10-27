'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {homeFor,canOpenAdmin,canOpenSupport,canOpenAdminTab}=require('../src/staff-access');
const fs=require('node:fs');
const path=require('node:path');
const read=p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
test('solo propietario, admin e inventario entran al panel operativo',()=>{
  for(const role of ['owner','admin','inventory'])assert.equal(canOpenAdmin(role),true);
  for(const role of ['support','accounting','customer',undefined])assert.equal(canOpenAdmin(role),false);
});
test('atencion solo para soporte y responsables autorizados',()=>{
  for(const role of ['support','owner','admin'])assert.equal(canOpenSupport(role),true);
  for(const role of ['inventory','accounting','customer',undefined])assert.equal(canOpenSupport(role),false);
});
test('cada empleado obtiene su inicio correcto',()=>{
  assert.equal(homeFor('support'),'/staff/atencion');
  assert.equal(homeFor('accounting'),'/staff/sin-modulo');
  assert.equal(homeFor('owner'),'/staff');
  assert.equal(homeFor('customer'),null);
});
test('inventario no puede abrir apartados de CRM ni contabilidad',()=>{
  for(const tab of ['overview','analytics','orders','inventory'])assert.equal(canOpenAdminTab('inventory',tab),true);
  for(const tab of ['support','accounting','testimonials','settings'])assert.equal(canOpenAdminTab('inventory',tab),false);
  assert.equal(canOpenAdminTab('support','inventory'),false);
});
test('la intranet comprueba rol antes de servir HTML privado',()=>{
  const src=read('src/app.js');
  assert.match(src,/canOpenSupport\(req\.user\.role\)/);
  assert.match(src,/canOpenAdmin\(req\.user\.role\)/);
  assert.match(src,/staff-assets[\s\S]*\.html/);
});
test('las API administrativas mantienen autorización en backend',()=>{
  const inventory=read('routes/admin.js');
  const orders=read('routes/admin-orders.js');
  assert.match(inventory,/roles\('admin','owner','inventory'\)/);
  assert.match(orders,/roles\('owner','admin','inventory'\)/);
});
