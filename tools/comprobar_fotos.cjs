/** Comprobación local de fotografías reales. No modifica archivos. */
'use strict';
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const exts=['webp','jpg','jpeg','png','avif'];
const check=f=>{const base=f.replace(/\.(webp|jpe?g|png|avif)$/i,'');return exts.map(e=>base+'.'+e).find(p=>fs.existsSync(path.join(root,p)));};
const manifest=JSON.parse(fs.readFileSync(path.join(root,'assets/productos/manifest.json'),'utf8'));
let missing=0;let found=0;
const refs=[
 ...['hero-hogar','hero-cocina','hero-tecnologia'].map(x=>`assets/banners/${x}.webp`),
 ...['hogar','tecnologia'].map(x=>`assets/categorias/${x}.webp`),
 ...Object.values(manifest).flatMap(x=>x.gallery)
];
for(const f of refs){const p=check(f);if(p){found++;console.log('OK',p)}else{missing++;console.log('PENDIENTE',f.replace(/\.webp$/,'{.webp | .jpg | .png | .avif}'))}}
console.log(`\nFotografías: ${found} disponibles, ${missing} pendientes (de ${refs.length}).`);
console.log('Es normal tener pendientes hasta que coloques tus fotografías.');
