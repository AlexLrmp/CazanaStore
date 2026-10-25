'use strict';
/**
 * Cazana Store · Fase 3.1 — actualización visual controlada.
 * Ejecutar desde la raíz del proyecto: node tools/aplicar-diseno-3-1.cjs
 * Solo modifica presentación; nunca accede a MongoDB ni a archivos .env.
 */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const START = '/* CAZANA-DISENO-3-1:INICIO */';
const END = '/* CAZANA-DISENO-3-1:FIN */';
const dryRun = process.argv.includes('--check');

const ICON_CART = '<path d="M2 2h2l2.3 10.7a2 2 0 0 0 2 1.6h10.1a2 2 0 0 0 2-1.6L22 6H5"/><circle cx="9" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>';
const ICON_TRUCK = '<path d="M10 17h4V5H2v12h3"/><path d="M14 9h4l4 4v4h-3"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/>';
const ICON_ARROW_LEFT = '<path d="m14 18-6-6 6-6"/>';
const ICON_ARROW_RIGHT = '<path d="m10 18 6-6-6-6"/>';
const ICON_MAIL = '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>';
const ICON_SHIELD = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>';
const svg = (content, size=21) => `<svg aria-hidden="true" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;

const CSS = String.raw`
/* CAZANA-DISENO-3-1:INICIO */
/* Pulido de componentes existentes; conserva el sistema de diseño y la lógica. */
:root {
  --cz31-outline: #e9e1d5;
  --cz31-soft: #fbf9f5;
  --cz31-muted: #81786c;
  --cz31-shadow: 0 12px 30px rgba(43, 39, 32, .045);
}
/* Iconos de acciones principales: escala común entre tienda e intranet. */
.site-header .header-actions { align-items: center; }
.site-header .header-actions .head-action { position: relative; min-width: 45px; gap: 4px; padding: 7px 5px; line-height: 1.3; border-radius: 13px; }
.site-header .header-actions .head-action svg { display: block; width: 23px; height: 23px; flex: 0 0 23px; stroke: currentColor; }
.site-header .header-actions .head-action .label { font: 400 10px/1.3 var(--sans,Arial,sans-serif); letter-spacing: 0; white-space: nowrap; }
.site-header .header-actions .head-action:hover, .site-header .header-actions .head-action:focus-visible { color: var(--gold-dark); background: #faf7f1; }
.site-header .header-actions .head-bubble { display: grid; place-items: center; font: 700 9px/1 var(--sans,Arial,sans-serif); }
.site-header .header-actions .head-bubble[hidden] { display: none !important; }
/* Interacciones y botones: límites coherentes, sin cambiar la semántica HTML. */
.btn { text-align: center; line-height: 1.25; }
.btn:focus-visible, .cz-address-button:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
.btn:disabled, .cz-address-button:disabled { opacity: .58; cursor: not-allowed; transform: none; }
.btn-outline { border-color: #49443f; }
button:focus-visible, a:focus-visible { scroll-margin: 100px; }
/* Direcciones: tarjetas legibles, acciones e iconos consistentes. */
.cz-addresses { min-width: 0; }
.cz-addresses .cz-profile-caption { align-items: flex-start; padding-bottom: 2px; }
.cz-addresses .cz-profile-tag { font-weight: 600; font-variant-numeric: tabular-nums; }
.cz-address-toolbar { margin: 14px 0 20px; align-items: center; }
.cz-address-toolbar p { max-width: 420px; }
.cz-address-toolbar .btn { box-shadow: none; white-space: normal; min-height: 43px; }
.cz-address-grid { gap: 16px; align-items: stretch; }
.cz-address-card { display: flex; flex-direction: column; gap: 0; padding: 21px; border-radius: 18px; border: 1px solid var(--cz31-outline); box-shadow: var(--cz31-shadow); transition: border-color .2s, box-shadow .2s, transform .2s; }
.cz-address-card:hover { border-color: #d7c8b2; box-shadow: 0 15px 32px rgba(43,39,32,.07); }
.cz-address-card:has(.cz-address-default) { border-color: #d8e7db; }
.cz-address-top { align-items: flex-start; margin-bottom: 12px; }
.cz-address-top>div { gap: 7px 9px; }
.cz-address-top strong { font-size: 14px; letter-spacing: -.01em; }
.cz-address-marker { width: 37px; height: 37px; flex: 0 0 37px; display: inline-grid; place-items: center; padding: 0; border-radius: 11px; color: var(--gold-dark); background: #faf5ea; }
.cz-address-marker svg { display: block; width: 19px; height: 19px; }
.cz-address-default { padding: 5px 9px; line-height: 1.3; font-weight: 600; }
.cz-address-card p { margin: 5px 0; font-size: 12px; line-height: 1.65; }
.cz-address-card .cz-address-recipient { margin-bottom: 7px; }
.cz-address-actions { display: flex; gap: 8px; margin-top: auto; padding-top: 18px; border-top: 1px solid #f0ebe4; }
.cz-address-card .cz-address-actions { margin-top: auto; padding-top: 16px; }
.cz-address-button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; font: 600 11px/1.3 var(--sans,Arial,sans-serif); color: #906c26; min-height: 36px; border: 1px solid #e7dac7; border-radius: 10px; background: white; padding: 9px 11px; transition: background .18s, border-color .18s, color .18s; }
.cz-address-button svg { width: 15px; height: 15px; flex: 0 0 15px; }
.cz-address-button:hover { background: #faf4e9; border-color: #d3b984; }
.cz-address-button.is-danger { color: #a14d43; border-color: #ead7d2; }
.cz-address-button.is-danger:hover { color: #8f332c; background: #fff4f1; border-color: #dbada5; }
.cz-address-editor { margin-top: 22px; padding: clamp(16px,2.3vw,25px); border: 1px solid #e8decf; border-radius: 18px; background: #fdfbf7; }
.cz-address-editor-head { padding-bottom: 13px; margin-bottom: 12px; border-bottom: 1px solid #ede5d9; }
.cz-address-editor h3 { margin: 0; }
.cz-address-editor .customer-form { gap: 18px; }
.customer-field input, .customer-field textarea, .customer-field select, .cz-checkout-address select { box-sizing: border-box; width: 100%; border-radius: 12px; border: 1px solid #e4dbce; background: #fff; font-family: var(--sans,Arial,sans-serif); font-size: 12px; color: #342f29; transition: border-color .2s, box-shadow .2s; }
.customer-field :is(input,textarea,select):focus-visible, .cz-checkout-address select:focus-visible { outline: none; border-color: #c9a34e; box-shadow: 0 0 0 3px #c9a34e20; }
.customer-field input:disabled { background: #f7f5f1; }
.customer-consent { gap: 11px; }
.cz-address-empty { border-color: #e6d9c5; }
.cz-address-empty > span { display: inline-grid; place-items: center; width: 52px; height: 52px; border-radius: 15px; background: #f6eedf; }
.cz-address-empty > span svg { width: 22px; height: 22px; }
/* Producto: iconografía vectorial y lenguaje de confianza responsable. */
.product-summary .trust-box { display: grid; gap: 0; background: var(--cz31-soft); border: 1px solid #eee7dd; border-radius: 17px; padding: 6px 18px; }
.product-summary .trust-item { display: flex; gap: 13px; align-items: flex-start; padding: 13px 0; min-width: 0; }
.product-summary .trust-item + .trust-item { border-top: 1px solid #eae2d7; }
.product-summary .trust-icon { width: 35px; height: 35px; flex: 0 0 35px; display: grid; place-items: center; color: var(--gold-dark); background: #f3eadd; border-radius: 10px; }
.product-summary .trust-icon svg { display: block; width: 20px; height: 20px; }
.product-summary .trust-item strong { display: block; margin: 1px 0 3px; font-size: 11px; color: #35302b; font-weight: 700; }
.product-summary .trust-item small { display: block; font-size: 11px; font-weight: 400; line-height: 1.55; color: var(--cz31-muted); }
.product-summary .cta-row .btn { min-height: 48px; }
.product-summary .cta-row .icon-circle { flex: 0 0 auto; }
.product-gallery .gallery-nav svg { display: block; width: 20px; height: 20px; stroke-width: 1.9; }
.footer-social a svg { display: block; width: 17px; height: 17px; }
.product-summary .product-save { line-height: 1.4; }
/* Carrito, checkout y cuenta: mismas superficies y ritmo visual. */
.cart-list-panel, .cart-summary, .checkout-fields, .checkout-summary, .account-menu, .account-section { box-shadow: var(--cz31-shadow); }
.customer-order, .cz-checkout-address { border-color: var(--cz31-outline); }
.checkout-fields .customer-field, .cz-checkout-address { min-width: 0; }
.cz-checkout-address { padding: 17px; }
.cz-checkout-address-link { display: inline-flex; align-items: center; padding: 4px 0; }
.account-section { min-width: 0; }
.account-tab { min-height: 46px; }
/* Intranet: respetar la cuadrícula original, sin tocar estructura ni operaciones. */
.cazana-private .staff-actions button, .cazana-private .admin-nav-btn, .cazana-private .staff-form button { transition: background .18s, border-color .18s, color .18s; }
.cazana-private .staff-actions button:focus-visible { outline: 2px solid var(--gold); outline-offset: 2px; }
@media (max-width: 900px) {
  .cz-address-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .account-layout { min-width: 0; }
}
@media (max-width: 780px) {
  .cz-address-grid { grid-template-columns: 1fr; }
  .product-summary .trust-box { padding: 5px 15px; }
}
@media (max-width: 560px) {
  .cz-address-card { padding: 17px; }
  .cz-address-toolbar { align-items: stretch; }
  .cz-address-toolbar .btn { width: 100%; }
  .cz-address-actions { gap: 7px; }
  .cz-address-button { padding: 9px 10px; }
  .customer-order, .checkout-summary, .checkout-fields { min-width: 0; }
  .site-header .header-actions .head-action { min-width: 35px; padding: 5px 3px; }
  .site-header .header-actions .head-action svg { width: 22px; height: 22px; flex-basis: 22px; }
}
@media (max-width: 360px) {
  .cz-address-actions .cz-address-button { flex: 1 1 auto; }
  .cz-address-editor { padding: 14px; }
}
@media (hover: none) { .cz-address-card:hover { transform: none; box-shadow: var(--cz31-shadow); } }
@media (prefers-reduced-motion: reduce) { .cz-address-card, .cz-address-button, .customer-field input { transition: none; } }
/* CAZANA-DISENO-3-1:FIN */
`;

const iconPaths = {
  pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z"/>',
  delete: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M5 6l1 15h12l1-15"/><path d="M10 10v7M14 10v7"/>',
  star: '<path d="m12 2 3 6.5 7 .9-5.1 5 1.3 7L12 18l-6.2 3.4 1.3-7L2 9.4l7-.9Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="M18 6 6 18M6 6l12 12"/>'
};
function patchProfile(src) {
  if(src.includes('/* CAZANA-DISENO-3-1:ICONOS */'))return src;
  if(!src.includes('window.CazanaAccountExtras') || !src.includes('function addressCard(a)') || !src.includes('cz-address-marker')){
    throw Error('js/pages/customer-profile.js no corresponde a la Fase 3 esperada. Se canceló para no perder su lógica.');
  }
  const declaration = `  /* CAZANA-DISENO-3-1:ICONOS */\n  const cz31Icons = ${JSON.stringify(iconPaths)};\n  const cz31Icon = kind => ${'`'}<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">\u0024{cz31Icons[kind] || ''}</svg>${'`'};\n`;
  const anchor='  function addressCard(a)';
  if(!src.includes(anchor))throw Error('Falta addressCard en Fase 3.');
  let result=src.replace(anchor,declaration+anchor);
  let n=0;
  result=result.replace('class="cz-address-marker" aria-hidden="true">⌖</span>','class="cz-address-marker" aria-hidden="true">${cz31Icon(\'pin\')}</span>');
  if(result===src.replace(anchor,declaration+anchor))throw Error('No se reconoció el marcador de dirección.');
  result=result.replace('<span aria-hidden="true">⌖</span>', "<span aria-hidden=\"true\">' + cz31Icon('pin') + '</span>");
  for(const [action,oldText,kind] of [['edit','Editar','edit'],['default','Hacer principal','star'],['delete','Eliminar','delete'],['close','Cancelar','close']]){
    const pattern=new RegExp(`(data-address-action="${action}"[^>]*>)${oldText}(<\\/button>)`,'g');
    result=result.replace(pattern,(all,a,b)=>{n++;return `${a}\u0024{cz31Icon('${kind}')}<span>${oldText}</span>${b}`;});
  }
  if(n<4)throw Error('Algunas acciones de direcciones no coinciden con el código esperado; no se cambió nada.');
  const addOld='>+ Agregar dirección</button>';
  if(!result.includes(addOld))throw Error('No encontré el botón de agregar dirección.');
  result=result.replace(addOld, ">${cz31Icon('plus')}<span>Agregar dirección</span></button>");
  return result;
}
function patchMain(src){
  if(src.includes('<!-- CAZANA-DISENO-3-1:CONFIANZA -->'))return src;
  const start='<div class="trust-box">';
  const pattern=/<div class="trust-box">\s*<p>🚚\s*<strong>Entrega coordinada<\/strong>[\s\S]*?<\/p>\s*<p>🛡️\s*<strong>Compra protegida<\/strong>[\s\S]*?<\/p>\s*<\/div>/;
  if(!pattern.test(src))throw Error('El bloque de entrega/seguridad cambió en js/main.js. Se cancela para evitar daños.');
  const after=`<!-- CAZANA-DISENO-3-1:CONFIANZA -->\n            <div class="trust-box" aria-label="Información de entrega y solicitud">\n              <div class="trust-item"><span class="trust-icon">${svg(ICON_TRUCK)}</span><div><strong>Entrega coordinada</strong><small>Consulta cobertura y plazos según tu destino.</small></div></div>\n              <div class="trust-item"><span class="trust-icon">${svg(ICON_SHIELD)}</span><div><strong>Solicitud con información clara</strong><small>Confirmaremos disponibilidad, entrega y pago antes de continuar.</small></div></div>\n            </div>`;
  let result=src.replace(pattern,after);
  result=result.replace('aria-label="Imagen anterior">‹</button>', 'aria-label="Imagen anterior">'+svg(ICON_ARROW_LEFT,20)+'</button>');
  result=result.replace('aria-label="Imagen siguiente">›</button>', 'aria-label="Imagen siguiente">'+svg(ICON_ARROW_RIGHT,20)+'</button>');
  return result;
}
function patchHtml(src){
  const rx=/<a\b(?=[^>]*\bclass=["'][^"']*\bhead-action\b)(?=[^>]*\bhref=["']\/?carrito\.html["'])[^>]*>[\s\S]*?<\/a>/gi;
  let found=0;
  const out=src.replace(rx,fragment=>{
    let changed=false;
    const next=fragment.replace(/(<svg\b[^>]*>)[\s\S]*?(<\/svg>)/i,(_whole,a,b)=>{changed=true;return a+ICON_CART+b;});
    if(changed)found++;
    return next;
  });
  const mail=out.replace(/(<a\b[^>]*aria-label="Contactar a Cazana Store"[^>]*>)✉(<\/a>)/g,(_m,a,b)=>a+svg(ICON_MAIL,17)+b);
  return {content:mail,matched:found};
}
function requireProject(){
  if(!fs.existsSync(path.join(ROOT,'index.html')) || !fs.existsSync(path.join(ROOT,'css','style.css')) || !fs.existsSync(path.join(ROOT,'backend','package.json'))){
    throw Error('Ejecuta desde un proyecto CazanaStore completo. Faltan index.html, css/style.css o backend/package.json.');
  }
}
function main(){
  requireProject();
  const candidates={
    'css/style.css': s => s.includes(START) ? s : s.trimEnd()+'\n\n'+CSS.trim()+'\n',
    'js/main.js':patchMain,
    'js/pages/customer-profile.js':patchProfile
  };
  // El SVG del carrito cambia en todos los encabezados disponibles, sin alterar sus enlaces ni sus contadores.
  for(const file of ['index.html','tienda.html','producto.html','carrito.html','checkout.html','cuenta.html','nosotros.html','contacto.html','personal.html','admin.html','backend/staff/catalog.html']){
    if(fs.existsSync(path.join(ROOT,file)))candidates[file]=s=>patchHtml(s).content;
  }
  const old={},updated={};
  for(const [filename,func] of Object.entries(candidates)){
    const abs=path.join(ROOT,filename);
    if(!fs.existsSync(abs))throw Error(`Falta ${filename}. No apliqué cambios.`);
    old[filename]=fs.readFileSync(abs,'utf8');
    updated[filename]=func(old[filename]);
  }
  // Preflight sintáctico: si un parche alteró las plantillas JS, no escribe archivos.
  for(const script of ['js/main.js','js/pages/customer-profile.js']) { new vm.Script(updated[script],{filename:script}); }
  const changed=Object.keys(updated).filter(p=>old[p]!==updated[p]);
  const htmlChanged=changed.filter(p=>p.endsWith('.html')).length;
  if(!changed.length){console.log('[Cazana] Fase 3.1 ya está instalada. No se duplicó ningún cambio.');return;}
  console.log('[Cazana] Archivos a actualizar: '+changed.join(', '));
  console.log('[Cazana] HTML con icono de carrito unificado: '+htmlChanged);
  if(dryRun){console.log('[Cazana] Revisión completada. No escribí archivos (--check).');return;}
  const backup=fs.mkdtempSync(path.join(os.tmpdir(),'cazana-diseno-31-respaldo-'));
  for(const filename of changed){const dest=path.join(backup,filename);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(ROOT,filename),dest);}
  const saved=[];
  try{
    for(const filename of changed){fs.writeFileSync(path.join(ROOT,filename),updated[filename],'utf8');saved.push(filename);}
  }catch(e){for(const filename of saved)fs.copyFileSync(path.join(backup,filename),path.join(ROOT,filename));throw e;}
  console.log('[Cazana] Fase 3.1 aplicada correctamente.');
  console.log('[Cazana] Respaldo local: '+backup);
  console.log('[Cazana] No se modificaron .env, MongoDB, pedidos, productos ni autenticación.');
}
if(require.main===module){try{main();}catch(e){console.error('[Cazana] Error: '+e.message);process.exitCode=1;}}
module.exports={CSS,patchMain,patchProfile,patchHtml,main,START,END};
