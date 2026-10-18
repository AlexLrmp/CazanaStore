/**
 * Cazana Store - Instalador seguro de fotografias reales.
 * Nodo de entrada: INSTALAR-FOTOS.cmd, ejecutar desde la terminal de VS Code.
 * Conserva HTML, JS y CSS ajenos a las secciones fotográficas.
 * Crea un respaldo FUERA del repositorio antes de escribir o mover archivos.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f),'utf8');
const exists = (f) => fs.existsSync(path.join(root, f));
function assert(ok, message) { if (!ok) throw new Error(message); }
function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  assert(source.includes(from), `No encontre ${label}. No cambié este archivo.`);
  return source.replace(from,to);
}
function patchMain(source) {
  if (source.includes('const requestedGallery = product.gallery?.length')) return source;
  source = replaceRequired(source,
    '    const gallery = product.gallery?.length ? product.gallery : [product.image];',
    '    const requestedGallery = product.gallery?.length ? product.gallery : [product.image];\n    let gallery = [];',
    'variable de galeria');
  source = replaceRequired(source,
    '<img id="product-main-image" class="gallery-stage" src="${esc(gallery[0])}" alt="${esc(product.name)}">',
    '<img id="product-main-image" class="gallery-stage" src="${window.CazanaMedia.placeholder}" alt="Fotografía pendiente de ${esc(product.name)}">',
    'imagen principal');
  const thumbs = '<div class="gallery-thumbs">${gallery.map((img, i) => `<button type="button" class="gallery-thumb ${i === 0 ? \'is-active\' : \'\'}" data-thumb="${i}" aria-label="Ver imagen ${i + 1}"><img src="${esc(img)}" alt="${esc(product.name)} - vista ${i + 1}"></button>`).join(\'\')}</div>';
  source = replaceRequired(source, thumbs,
    '<div class="gallery-thumbs"><p class="gallery-photo-note">Buscando fotografías disponibles…</p></div>',
    'miniaturas del producto');
  const from = "    let current = 0;\n    const stage = $('#product-main-image', root);";
  const to = '    let qty = 1;';
  const i = source.indexOf(from); const j=source.indexOf(to,i);
  assert(i>=0 && j>i, 'No encontré la seccion de navegación de galería de la v5');
  return source.slice(0,i) + read('tools/galeria_fotos_reales.txt') + source.slice(j);
}
function patchCss(source) {
  source=source.replaceAll(",url('../assets/banners/hero-hogar.webp')",'');
  source=source.replaceAll("url('../assets/categorias/hogar.webp')",'linear-gradient(135deg,#ede8e1,#d5c9ba)');
  if (!source.includes('CAZANA · FOTOGRAFÍA REAL PENDIENTE')) source += '\n'+read('tools/css_fotos_reales.txt');
  return source;
}
function patchHtml(source, filename) {
  if (source.includes('js/components/media.js')) return source;
  const dataScript=/<script\b[^>]*\bsrc=["']js\/data\.js["'][^>]*>\s*<\/script>/i;
  assert(dataScript.test(source), `${filename}: no encontré el script js/data.js`);
  return source.replace(dataScript, match => '<script defer src="js/components/media.js"></script>'+match);
}
function main() {
  assert(exists('js/data.js') && exists('js/main.js') && exists('css/style.css'), 'Ejecuta dentro de la carpeta CazanaStore, junto a index.html');
  const catalogue=read('js/data.js');
  assert(catalogue.includes('assets/productos/'), 'Primero aplica el organizador de imágenes anterior: js/data.js aun usa rutas antiguas.');
  assert(exists('js/components/media.js') && exists('assets/placeholders/foto-pendiente.svg'),'Faltan archivos del paquete; vuelve a copiarlo completo.');
  const paths=fs.readdirSync(root).filter(x=>x.endsWith('.html'));
  const changes=[];
  for (const f of paths) {
    const original=read(f), altered=patchHtml(original,f);
    if (altered!==original)changes.push({f,original,altered});
  }
  for (const [f,patch] of [['js/main.js',patchMain],['css/style.css',patchCss]]){
    const original=read(f), altered=patch(original);
    if (altered!==original)changes.push({f,original,altered});
  }
  const fingerprints=JSON.parse(read('tools/arte_anterior_hashes.json'));
  const art=Object.entries(fingerprints).filter(([f,hash])=>{
    const name=path.join(root,f);if(!fs.existsSync(name)) return false;
    const actual=crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex');
    return actual===hash;
  }).map(([f])=>f);
  if(!changes.length && !art.length){console.log('[OK] La correccion ya esta aplicada. No hay nada que cambiar.');return;}
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  const backup=path.join(path.dirname(root),path.basename(root)+'-RESPALDO-FOTOS-'+stamp);
  fs.mkdirSync(backup,{recursive:true});
  for(const x of changes){
    const dst=path.join(backup,x.f);fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,x.original,'utf8');
  }
  for(const f of art){
    const dst=path.join(backup,f);fs.mkdirSync(path.dirname(dst),{recursive:true});
    fs.renameSync(path.join(root,f),dst);
  }
  for(const x of changes){fs.writeFileSync(path.join(root,x.f),x.altered,'utf8');console.log('ACTUALIZADO',x.f)}
  console.log(`Ilustraciones antiguas retiradas: ${art.length}.`);
  console.log('Respaldo de originales:',backup);
  console.log('[OK] Listo para agregar fotografias reales en assets/.');
  console.log('Comprobacion: node tools/comprobar_fotos.cjs');
}
try{main()}catch(e){console.error('[ERROR]',e.message);process.exitCode=1;}
