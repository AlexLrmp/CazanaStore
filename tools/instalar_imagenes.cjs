/* Cazana Store - instalador multiplataforma (Node.js, sin dependencias).
   Ejecucion: node tools/instalar_imagenes.cjs
   No agrega productos ni credenciales; solo reubica rutas de multimedia de la demo.
*/
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'assets/productos/manifest.json'),'utf8'));
function swapOnce(text,oldPath,newPath,where) {
  if(text.includes(newPath))return text;
  if(!text.includes(oldPath))throw new Error(`${where}: no se encuentra ${oldPath}`);
  return text.replace(oldPath,newPath);
}
function sliceSwap(text,from,to,mutate,label) {
  const i=text.indexOf(from); if(i<0)throw new Error(`Falta ${label}: ${from}`);
  const j=text.indexOf(to,i);if(j<0)throw new Error(`Falta cierre de ${label}: ${to}`);
  return text.slice(0,i)+mutate(text.slice(i,j))+text.slice(j);
}
function updateIndex(html) {
  html=sliceSwap(html,'<div class="hero-slider"','<div class="hero-backdrop"',s=>{
    s=swapOnce(s,'assets/hero-referencia.jpg','assets/banners/hero-hogar.webp','carrusel');
    s=swapOnce(s,'assets/cat-hogar.jpg','assets/banners/hero-cocina.webp','carrusel');
    return swapOnce(s,'assets/cat-tecnologia.jpg','assets/banners/hero-tecnologia.webp','carrusel');
  },'carrusel');
  return sliceSwap(html,'<div class="category-grid"','</section>',s=>{
    s=swapOnce(s,'assets/cat-hogar.jpg','assets/categorias/hogar.webp','categorias');
    s=swapOnce(s,'assets/cat-tecnologia.jpg','assets/categorias/tecnologia.webp','categorias');
    return s.replace('alt="Fotografía de cocina y hogar"','alt="Ambiente de sala contemporánea"').replace('alt="Laptop y tecnología"','alt="Tecnología para el hogar y la oficina"');
  },'categorias');
}
function updateData(js) {
 for(const [id,prod] of Object.entries(manifest)) {
   const i=js.indexOf(`id:'${id}',`);if(i<0)throw new Error(`No se encuentra producto ${id}`);
   let j=js.indexOf('\n  },',i);
   if(j<0)j=js.indexOf('\n  }\n]);',i);
   if(j<0)throw new Error(`No se encuentra fin del producto ${id}`);
   let block=js.slice(i,j);
   if(!/image:'[^']+',\s*fallback:'[^']+'/.test(block) || !/gallery:\[[^\]]*\]/.test(block))throw new Error(`Faltan imágenes en ${id}`);
   block=block.replace(/image:'[^']+',\s*fallback:'[^']+'/,`image:'${prod.image}',fallback:'${prod.image}'`);
   block=block.replace(/gallery:\[[^\]]*\]/,`gallery:[${prod.gallery.map(x=>`'${x}'`).join(',')}]`);
   js=js.slice(0,i)+block+js.slice(j);
 }
 return js;
}
function main() {
 const files=['index.html','js/data.js','css/style.css','nosotros.html','js/main.js'];
 for(const m of Object.values(manifest))for(const img of m.gallery)if(!fs.existsSync(path.join(root,img)))throw new Error(`Falta: ${img}`);
 const content=Object.fromEntries(files.map(f=>[f,fs.readFileSync(path.join(root,f),'utf8')]));
 const update={
   'index.html':updateIndex(content['index.html']),
   'js/data.js':updateData(content['js/data.js']),
   'css/style.css':content['css/style.css'].replaceAll('../assets/hero-referencia.jpg','../assets/banners/hero-hogar.webp').replaceAll('../assets/cat-hogar.jpg','../assets/categorias/hogar.webp'),
   'nosotros.html':swapOnce(content['nosotros.html'],'assets/cat-hogar.jpg','assets/categorias/hogar.webp','nosotros'),
   'js/main.js':content['js/main.js'].replace('alt="Miniatura ${i + 1}"','alt="${esc(product.name)} - vista ${i + 1}"')
 };
 for(const file of files) {
    if(update[file]!==content[file]){
       fs.writeFileSync(path.join(root,file),update[file],'utf8');console.log('ACTUALIZADO',file);
    }else console.log('SIN CAMBIOS',file);
 }
 console.log('[OK] 12 productos y 3 banners listos para la web demo.');
}
try{main();}catch(e){console.error('ERROR:',e.message);process.exitCode=1;}
