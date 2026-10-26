'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {RESET_TTL_MS,sha256,issueToken,validToken,resetLink,isConfigured,isDevLinkMode}=require('../src/password-recovery-core');

test('el token de recuperación es impredecible, hexadecimal y no se reusa',()=>{
  const a=issueToken(),b=issueToken();
  assert.equal(a.length,64);assert.ok(validToken(a));assert.ok(validToken(b));assert.notEqual(a,b);
  assert.equal(validToken('token-sin-formato'),false);
});
test('solo se almacena el hash SHA256 del token',()=>{
  const token=issueToken();assert.match(sha256(token),/^[a-f0-9]{64}$/);assert.notEqual(sha256(token),token);
  assert.equal(RESET_TTL_MS,15*60*1000);
});
test('el enlace usa fragmento # y no parámetros de URL con tokens',()=>{
  const old=process.env.PUBLIC_SITE_URL;process.env.PUBLIC_SITE_URL='http://localhost:3000';
  try{const token=issueToken(),url=new URL(resetLink(token));assert.equal(url.search,'');assert.equal(url.pathname,'/cuenta.html');assert.equal(url.hash,'#restablecer='+token)}
  finally{if(old===undefined)delete process.env.PUBLIC_SITE_URL;else process.env.PUBLIC_SITE_URL=old;}
});
test('el enlace rechaza tokens mal formados',()=>{assert.throws(()=>resetLink('invalido'));});
test('modo de prueba solo existe fuera de producción',()=>{
  const oldEnv=process.env.NODE_ENV,oldMode=process.env.RESET_DEV_LINKS;
  process.env.RESET_DEV_LINKS='1';
  try{process.env.NODE_ENV='production';assert.equal(isDevLinkMode(),false);process.env.NODE_ENV='development';assert.equal(isDevLinkMode(),true);assert.equal(isConfigured(),true);}
  finally{if(oldEnv===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldEnv;if(oldMode===undefined)delete process.env.RESET_DEV_LINKS;else process.env.RESET_DEV_LINKS=oldMode;}
});
