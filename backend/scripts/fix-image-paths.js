'use strict';
/** Revisión segura de referencias multimedia: por defecto SOLO VISTA PREVIA. */
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const files=['index.html','nosotros.html','js/data.js','assets/productos/manifest.json'];
const exts=['webp','jpg','jpeg','png','avif'];
const pattern=/assets\/(?:banners|categorias|productos)\/[a-zA-Z0-9_./-]+\.(?:webp|jpe?g|png|avif)/g;
function realPath(p){
  if(fs.existsSync(path.join(ROOT,p)))return p;
  const m=/^(.*)\.(webp|jpe?g|png|avif)$/.exec(p);
  if(!m)return p;
  return exts.map(ext=>`${m[1]}.${ext}`).find(q=>fs.existsSync(path.join(ROOT,q)))||p;
}
let replacements=0;const apply=process.argv.includes('--apply');
for(const file of files){
  const full=path.join(ROOT,file);
  if(!fs.existsSync(full)){console.log('OMITIDO:',file);continue;}
  const current=fs.readFileSync(full,'utf8');
  const changes=[];
  const updated=current.replace(pattern,(value)=>{const result=realPath(value);if(result!==value)changes.push([value,result]);return result;});
  for(const [a,b] of changes)console.log(`${file}: ${a} -> ${b}`);
  replacements+=changes.length;
  if(apply && updated!==current)fs.writeFileSync(full,updated,'utf8');
}
console.log(`${replacements} referencias ${apply?'actualizadas':'que se pueden actualizar'}.`);
if(!apply)console.log('Vista previa: para aplicar después de guardar un commit, ejecuta npm run fix-images:apply');
