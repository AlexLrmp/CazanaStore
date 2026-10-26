'use strict';
const {Router}=require('express');
const mongoose=require('mongoose');
const {z}=require('zod');
const {CustomerShopping,Product}=require('../src/models');
const {auth,roles}=require('../src/security');
const {parse}=require('../src/validation');
const {MAX_LINES,MAX_FAVORITES,MAX_QTY,combineGuestCart,combineFavorites}=require('../src/shopping-policy');
const router=Router();
router.use(auth,roles('customer'));

const key=z.string().trim().min(1).max(140).regex(/^[a-zA-Z0-9_-]+$/);
const cartLine=z.object({id:key,qty:z.number().int().min(1).max(MAX_QTY)}).strict();
const cart=z.array(cartLine).max(MAX_LINES).refine(a=>new Set(a.map(x=>x.id)).size===a.length,'No se permiten productos duplicados.');
const favorites=z.array(key).max(MAX_FAVORITES).refine(a=>new Set(a).size===a.length,'No se permiten favoritos duplicados.');
const revision=z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);
const cartBody=z.object({items:cart,revision}).strict();
const favoritesBody=z.object({ids:favorites,revision}).strict();
const mergeBody=z.object({cart, favorites}).strict();

function fail(message,status=400){const e=new Error(message);e.status=status;return e;}
function publicId(p){return p.legacyId||String(p._id);}
async function resolveProducts(keys){
  if(!keys.length)return new Map();
  const objectIds=keys.filter(s=>/^[a-fA-F0-9]{24}$/.test(s));
  const items=await Product.find({active:true,$or:[
    {legacyId:{$in:keys}},{slug:{$in:keys}},{sku:{$in:keys}},{_id:{$in:objectIds}}
  ]}).select('_id legacyId slug sku stockQty priceCents active').lean();
  const map=new Map();
  for(const item of items)for(const alias of [String(item._id),item.legacyId,item.slug,item.sku])if(alias)map.set(alias,item);
  return map;
}
async function normalizeCart(lines){
  const products=await resolveProducts(lines.map(x=>x.id));
  const normalized=[];
  const used=new Set();
  for(const line of lines){
    const p=products.get(line.id);
    if(!p)continue; // Producto eliminado o retirado: nunca persistir una referencia inválida.
    const id=String(p._id);
    if(used.has(id))throw fail('El carrito contiene el mismo producto dos veces.');
    used.add(id);
    normalized.push({productId:p._id,quantity:line.qty});
  }
  return normalized;
}
async function normalizeFavorites(ids){
  const products=await resolveProducts(ids);
  return [...new Set(ids.map(id=>products.get(id)).filter(Boolean).map(x=>String(x._id)))].map(id=>new mongoose.Types.ObjectId(id));
}
async function getOrCreate(customerId){
  try{await CustomerShopping.updateOne({customerId},{$setOnInsert:{cart:[],favorites:[],revision:0}},{upsert:true});}
  catch(e){if(e.code!==11000)throw e;}
  return CustomerShopping.findOne({customerId});
}
async function serialize(state){
  const ids=[...state.cart.map(i=>String(i.productId)),...state.favorites.map(String)];
  const products=await Product.find({_id:{$in:ids},active:true}).select('_id legacyId stockQty priceCents').lean();
  const found=new Map(products.map(p=>[String(p._id),p]));
  return {
    revision:state.revision||0,
    cart:state.cart.filter(i=>found.has(String(i.productId))).map(i=>{
      const p=found.get(String(i.productId));
      return {id:publicId(p),qty:i.quantity,stockQty:p.stockQty,priceCents:p.priceCents,available:p.stockQty>=i.quantity};
    }),
    favorites:state.favorites.map(id=>found.get(String(id))).filter(Boolean).map(publicId)
  };
}
async function commit(current,fields){
  const saved=await CustomerShopping.findOneAndUpdate(
    {_id:current._id,revision:current.revision},
    {$set:fields,$inc:{revision:1}},
    {new:true,runValidators:true}
  );
  if(!saved)throw fail('Tus favoritos o carrito cambiaron en otra pestaña. Actualiza la página para ver los datos recientes.',409);
  return saved;
}
router.get('/',async(req,res)=>{
  const state=await getOrCreate(req.user._id);
  res.set('Cache-Control','no-store').json(await serialize(state));
});
router.put('/cart',async(req,res)=>{
  const data=parse(cartBody,req.body);
  const lines=await normalizeCart(data.items);
  const state=await getOrCreate(req.user._id);
  if(state.revision!==data.revision)throw fail('El carrito cambió en otra pestaña. Recarga la página antes de volver a modificarlo.',409);
  res.set('Cache-Control','no-store').json(await serialize(await commit(state,{cart:lines})));
});
router.put('/favorites',async(req,res)=>{
  const data=parse(favoritesBody,req.body);
  const ids=await normalizeFavorites(data.ids);
  const state=await getOrCreate(req.user._id);
  if(state.revision!==data.revision)throw fail('Los favoritos cambiaron en otra pestaña. Recarga la página antes de volver a modificarlos.',409);
  res.set('Cache-Control','no-store').json(await serialize(await commit(state,{favorites:ids})));
});
router.post('/merge',async(req,res)=>{
  const data=parse(mergeBody,req.body);
  for(let attempt=0;attempt<4;attempt++){
    const current=await getOrCreate(req.user._id);
    const snapshot=await serialize(current);
    const mergedCart=combineGuestCart(snapshot.cart,data.cart);
    const mergedFavorites=combineFavorites(snapshot.favorites,data.favorites);
    const items=await normalizeCart(mergedCart);
    const ids=await normalizeFavorites(mergedFavorites);
    const saved=await CustomerShopping.findOneAndUpdate(
      {_id:current._id,revision:current.revision},
      {$set:{cart:items,favorites:ids},$inc:{revision:1}},
      {new:true,runValidators:true}
    );
    if(saved)return res.set('Cache-Control','no-store').json(await serialize(saved));
  }
  throw fail('El carrito cambió mientras iniciabas sesión. Actualiza la página para reintentar.',409);
});
module.exports=router;
