'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {profilePatch,addressBase,addressPatch}=require('../src/customer-validation');
test('perfil permite actualizar nombre y teléfono sin aceptar rol ni correo',()=>{
  assert.equal(profilePatch.safeParse({name:'Cliente de prueba',phone:'+51 999 888 777'}).success,true);
  assert.equal(profilePatch.safeParse({role:'owner'}).success,false);
  assert.equal(profilePatch.safeParse({email:'otro@correo.com'}).success,false);
});
test('perfil admite cambiar el consentimiento de promociones',()=>{
  assert.equal(profilePatch.parse({marketingConsent:false}).marketingConsent,false);
});
test('direcciones requieren datos de entrega y no permiten campos extra',()=>{
  const base={label:'Casa',fullName:'Cliente Ejemplo',phone:'999888777',address:'Avenida Ejemplo 123',city:'Lima',region:'Lima',reference:'',isDefault:true};
  assert.equal(addressBase.safeParse(base).success,true);
  assert.equal(addressBase.safeParse({...base,customerId:'otro'}).success,false);
  assert.equal(addressBase.safeParse({...base,address:'X'}).success,false);
});
test('actualizaciones de dirección permiten campos parciales pero no payload vacío',()=>{
  assert.equal(addressPatch.safeParse({label:'Trabajo'}).success,true);
  assert.equal(addressPatch.safeParse({}).success,false);
});
