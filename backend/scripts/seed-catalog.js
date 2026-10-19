'use strict';
// Importa EXCLUSIVAMENTE los datos de confianza del archivo local js/data.js del propio proyecto.
require('dotenv').config({path:require('node:path').resolve(__dirname,'../.env')});
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {connectDB}=require('../src/db');
const mongoose=require('mongoose');
const {Product}=require('../src/models');
const root=path.resolve(__dirname,'../..');
const formats=['webp','jpg','jpeg','png','avif'];
function existingPhoto(old){
  if(!old || typeof old!=='string')return '';
  if(fs.existsSync(path.join(root,old)))return old;
  const match=/^(.*)\.(webp|jpe?g|png|avif)$/i.exec(old);
  if(match)for(const ext of formats){const candidate=`${match[1]}.${ext}`;if(fs.existsSync(path.join(root,candidate)))return candidate;}
  return 'assets/placeholders/foto-pendiente.svg';
}
function catalogFromTrustedJs(){
  const source=fs.readFileSync(path.join(root,'js/data.js'),'utf8');
  const sandbox={window:{}};
  // Solo usar con el js/data.js controlado por el propietario; jamás ejecutar código remoto o subido por clientes.
  vm.runInNewContext(source,sandbox,{filename:'js/data.js',timeout:1500});
  if(!Array.isArray(sandbox.window.CazanaData))throw new Error('No se encontró window.CazanaData');
  return sandbox.window.CazanaData;
}
(async()=>{
  if(process.argv.includes('--reset'))throw new Error('No se permiten borrados masivos por esta herramienta.');
  const catalog=catalogFromTrustedJs();
  await connectDB();
  let created=0,kept=0;
  for(let index=0;index<catalog.length;index++){
    const p=catalog[index];
    const category=p.category==='hogar'?'HOG':'TEC';
    const gallery=(p.gallery||[p.image]).map(existingPhoto).filter(Boolean);
    const main=existingPhoto(p.image);
    if(main && !gallery.includes(main))gallery.unshift(main);
    const item={
      legacyId:p.id,sku:`CZ-${category}-${String(index+1).padStart(3,'0')}`,
      slug:p.slug,name:p.name,category:p.category,subcategory:p.subcategory||'',
      description:p.description||'',details:p.details||[],
      priceCents:Math.round(p.price*100),originalPriceCents:p.originalPrice?Math.round(p.originalPrice*100):null,
      // El stock inicial es SOLO PARA PRUEBAS; confirmar existencias antes de publicar venta real.
      stockQty:10,
      image:main,gallery,isOffer:Boolean(p.isOffer),isNew:Boolean(p.isNew),isBestseller:Boolean(p.isBestseller),active:true,
      rating:0,reviewCount:0
    };
    const result=await Product.updateOne({legacyId:p.id},{$setOnInsert:item},{upsert:true});
    if(result.upsertedCount)created++;else kept++;
  }
  console.log(`[Cazana] Importación terminada: ${created} productos añadidos, ${kept} existentes conservados.`);
  console.log('[Cazana] IMPORTANTE: precios y stock importados son de demostración. Actualiza precios e inventario antes de vender.');
  await mongoose.disconnect();
})().catch(e=>{console.error(e.message);mongoose.disconnect().finally(()=>process.exit(1));});
