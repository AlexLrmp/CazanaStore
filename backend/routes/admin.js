'use strict';
const {Router}=require('express');
const mongoose=require('mongoose');
const {Product,SiteSettings,StockMovement,AuditLog}=require('../src/models');
const {serializeProduct}=require('../src/format');
const {roles}=require('../src/security');
const {parse,productBody,productPatch,settingsPatch,stockBody}=require('../src/validation');
const router=Router();
const canManage=roles('admin','owner');
const canRead=roles('admin','owner','inventory');
const canStock=roles('admin','owner','inventory');
async function audit(req,action,resource,id,details={}){
  await AuditLog.create({actorId:req.user._id,action,resource,resourceId:String(id),details});
}
function ensureID(req,res,next){if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Identificador inválido.'});next();}
router.get('/products',canRead,async(req,res)=>{
  const items=await Product.find({}).sort({updatedAt:-1}).limit(500).lean();
  res.json({items:items.map(serializeProduct)});
});
router.post('/products',canManage,async(req,res)=>{
  const data=parse(productBody,req.body);
  if(!data.image && data.gallery.length)data.image=data.gallery[0];
  if(data.image && !data.gallery.includes(data.image))data.gallery.unshift(data.image);
  const product=await Product.create(data);
  await audit(req,'product.create','product',product._id,{sku:product.sku});
  res.status(201).json({product:serializeProduct(product)});
});
router.patch('/products/:id',canManage,ensureID,async(req,res)=>{
  const data=parse(productPatch,req.body);
  const product=await Product.findById(req.params.id);
  if(!product)return res.status(404).json({error:'Producto no encontrado.'});
  const candidate={...product.toObject(),...data};
  if(candidate.isOffer && (candidate.originalPriceCents==null || candidate.originalPriceCents<=candidate.priceCents))
    return res.status(400).json({error:'Una oferta necesita un precio anterior mayor.'});
  if(Object.hasOwn(data,'image') && data.image && !data.gallery && !product.gallery.includes(data.image))data.gallery=[data.image,...product.gallery];
  if(data.gallery?.length && !data.image)data.image=data.gallery[0];
  Object.assign(product,data);await product.save();
  await audit(req,'product.update','product',product._id,{fields:Object.keys(data)});
  res.json({product:serializeProduct(product)});
});
router.delete('/products/:id',canManage,ensureID,async(req,res)=>{
  const product=await Product.findByIdAndUpdate(req.params.id,{$set:{active:false}},{new:true});
  if(!product)return res.status(404).json({error:'Producto no encontrado.'});
  await audit(req,'product.deactivate','product',product._id);
  res.json({product:serializeProduct(product),message:'Producto desactivado. Su historial se conserva.'});
});
router.post('/products/:id/stock',canStock,ensureID,async(req,res)=>{
  const {delta,reason}=parse(stockBody,req.body);
  const where={_id:req.params.id};
  if(delta<0)where.stockQty={$gte:-delta};
  const product=await Product.findOneAndUpdate(where,{$inc:{stockQty:delta}},{new:true,runValidators:true});
  if(!product)return res.status(409).json({error:'Producto inexistente o existencias insuficientes.'});
  await StockMovement.create({productId:product._id,actorId:req.user._id,delta,reason,resultingQty:product.stockQty});
  await audit(req,'stock.adjust','product',product._id,{delta,reason,resultingQty:product.stockQty});
  res.json({product:serializeProduct(product)});
});
router.get('/settings',roles('admin','owner'),async(req,res)=>{
  let s=await SiteSettings.findOne({key:'main'});
  if(!s)s=await SiteSettings.create({key:'main'});
  res.json({whatsappNumber:s.whatsappNumber,whatsappContactName:s.whatsappContactName});
});
router.patch('/settings',canManage,async(req,res)=>{
  const data=parse(settingsPatch,req.body);
  const settings=await SiteSettings.findOneAndUpdate({key:'main'},{$set:data}, {new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true});
  await audit(req,'settings.update','settings','main',{fields:Object.keys(data)});
  res.json({whatsappNumber:settings.whatsappNumber,whatsappContactName:settings.whatsappContactName});
});
module.exports=router;
