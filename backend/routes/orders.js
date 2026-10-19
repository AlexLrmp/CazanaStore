'use strict';
const {Router}=require('express');
const mongoose=require('mongoose');
const {Order}=require('../src/models');
const {auth}=require('../src/security');
const {reserveOrder,changeStatus,publicOrder}=require('../src/order-service');
const router=Router();
function onlyCustomer(req,res,next){if(req.user?.role!=='customer')return res.status(403).json({error:'Este acceso está reservado para clientes.'});next();}
router.use(auth,onlyCustomer);
router.get('/',async(req,res)=>{
  const page=Math.min(Math.max(Number(req.query.page)||1,1),1000);
  const limit=15;
  const filter={customerId:req.user._id};
  const [items,total]=await Promise.all([Order.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),Order.countDocuments(filter)]);
  res.json({items:items.map(publicOrder),pagination:{page,total,pages:Math.ceil(total/limit)}});
});
router.post('/',async(req,res)=>{
  const {order,existing}=await reserveOrder(req.user,req.body);
  res.status(existing?200:201).json({order:publicOrder(order),existing,notice:'Solicitud recibida. No se ha realizado ningún cobro. Cazana confirmará disponibilidad y entrega.'});
});
router.get('/:id',async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Pedido inválido.'});
  const order=await Order.findOne({_id:req.params.id,customerId:req.user._id}).lean();
  if(!order)return res.status(404).json({error:'Pedido no encontrado.'});
  res.json({order:publicOrder(order)});
});
router.post('/:id/cancel',async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Pedido inválido.'});
  const order=await changeStatus(req.params.id,'cancelled',req.user._id,'Cancelado por el cliente',true);
  res.json({order:publicOrder(order)});
});
module.exports=router;
