'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {passwordResetEmailHtml,escapeHtml}=require('../src/mail-template');
test('HTML de recuperación lleva el enlace exacto y la expiración',()=>{
  const link='https://cazana.example/cuenta.html#restablecer='+'a'.repeat(64);
  const html=passwordResetEmailHtml({url:link,minutes:15});
  assert.match(html,/CAZANA/);assert.match(html,/15 minutos/);
  assert.ok(html.includes(link));assert.match(html,/Restablecer contraseña/);
  assert.ok(!html.includes('https://fonts.googleapis.com'));
});
test('escapa HTML inesperado de los campos',()=>{
  const html=passwordResetEmailHtml({url:'https://cazana.example/?q="<script>&',minutes:'<i>'});
  assert.ok(!html.includes('<script>'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('&lt;i&gt;'));
  assert.equal(escapeHtml('&'),'&amp;');
});
