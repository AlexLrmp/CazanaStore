'use strict';
const {Router}=require('express');
const {Product,SiteSettings}=require('../src/models');
const {serializeProduct,waLink}=require('../src/format');
const router=Router();
const escRegex=s=>String(s).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
router.get('/products',async(req,res)=>{
  const page=Math.min(Math.max(Number.parseInt(req.query.page,10)||1,1),100000);
  const limit=Math.min(Math.max(Number.parseInt(req.query.limit,10)||24,1),100);
  const filter={active:true};
  if(req.query.category && typeof req.query.category==='string')filter.category=req.query.category.slice(0,80);
  if(req.query.q && typeof req.query.q==='string'){
    const query=req.query.q.trim().slice(0,80);
    if(query)filter.$or=[{name:{$regex:escRegex(query),$options:'i'}},{description:{$regex:escRegex(query),$options:'i'}}];
  }
  const sorts={'price-asc':{priceCents:1},'price-desc':{priceCents:-1},'newest':{createdAt:-1},'relevance':{isBestseller:-1,createdAt:-1}};
  const sort=sorts[req.query.sort]||sorts.relevance;
  const [items,total]=await Promise.all([Product.find(filter).sort(sort).skip((page-1)*limit).limit(limit).lean(),Product.countDocuments(filter)]);
  res.json({items:items.map(serializeProduct),pagination:{page,limit,total,pages:Math.ceil(total/limit)}});
});
router.get('/categories',async(req,res)=>{
  const categories=await Product.aggregate([{$match:{active:true}},{$group:{_id:'$category',products:{$sum:1}}},{$sort:{_id:1}}]);
  res.json({items:categories.map(x=>({slug:x._id,name:x._id,products:x.products}))});
});
router.get('/products/:slug',async(req,res)=>{
  const lookup=req.params.slug;
  const product=await Product.findOne({active:true,$or:[{slug:lookup},{legacyId:lookup}]}).lean();
  if(!product)return res.status(404).json({error:'Producto no encontrado.'});
  res.json({product:serializeProduct(product)});
});
router.get('/settings',async(req,res)=>{
  const config=await SiteSettings.findOne({key:'main'}).lean();
  const whatsappNumber=config?.whatsappNumber||process.env.WHATSAPP_NUMBER||'51986803872';
  const whatsappContactName=config?.whatsappContactName||process.env.WHATSAPP_CONTACT_NAME||'Percy';
  res.json({whatsapp:{number:whatsappNumber,contactName:whatsappContactName,url:waLink(whatsappNumber)}});
});
router.get('/whatsapp',async(req,res)=>{
  const config=await SiteSettings.findOne({key:'main'}).lean();
  const number=config?.whatsappNumber||process.env.WHATSAPP_NUMBER||'51986803872';
  const msg=typeof req.query.message==='string'?req.query.message.slice(0,450):'Hola Percy, te escribo desde Cazana Store.';
  res.redirect(302,waLink(number,msg));
});
module.exports=router;
