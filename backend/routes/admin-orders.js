'use strict';
const {Router}=require('express');
const mongoose=require('mongoose');
const {Order}=require('../src/models');
const {roles}=require('../src/security');
const {parse,orderStatusBody}=require('../src/validation');
const {changeStatus,staffOrder}=require('../src/order-service');
const router=Router();
router.get('/',roles('owner','admin','inventory'),async(req,res)=>{
  const page=Math.min(Math.max(Number(req.query.page)||1,1),1000),limit=30;
  const status=typeof req.query.status==='string'?req.query.status:'';
  const filter=['pending','confirmed','preparing','shipped','delivered','cancelled'].includes(status)?{status}:{};
  const [items,total]=await Promise.all([Order.find(filter).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),Order.countDocuments(filter)]);
  res.json({items:items.map(staffOrder),pagination:{page,total,pages:Math.ceil(total/limit)}});
});
router.patch('/:id/status',roles('owner','admin','inventory'),async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Pedido inválido.'});
  const {status,note}=parse(orderStatusBody,req.body);
  const order=await changeStatus(req.params.id,status,req.user._id,note);
  res.json({order:staffOrder(order)});
});
module.exports=router;
