'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=p=>fs.readFileSync(path.join(root,p),'utf8');
test('el frontend estático no expone .env ni código del backend a través de static(root)',()=>{
  assert.equal(source('src/app.js').includes('express.static(ROOT)'),false);
  assert.ok(source('src/app.js').includes("app.use('/assets',express.static"));
});
test('las rutas de empleados exigen rol para administración',()=>{
  assert.ok(source('routes/admin.js').includes("roles('admin','owner')"));
  assert.ok(source('routes/admin.js').includes("roles('admin','owner','inventory')"));
});
test('no hay credenciales fijas en el código y la plantilla de env es segura',()=>{
  assert.ok(source('../.gitignore').includes('backend/.env'));
  assert.ok(!source('src/security.js').includes('password:'));
});
