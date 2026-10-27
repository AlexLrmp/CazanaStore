'use strict';
const {Router}=require('express');
const mongoose=require('mongoose');
const ChatThread=require('../src/chat-model');
const {auth,roles}=require('../src/security');
const {message,contactSafe}=require('../src/chat-policy');
const router=Router();
router.use(auth,roles('support','admin','owner'));
router.get('/threads',async(req,res)=>{
  const status=req.query.status==='closed'?'closed':'open';
  const rows=await ChatThread.find({status,expiresAt:{$gt:new Date()}}).sort({lastMessageAt:-1}).limit(40).lean();
  res.set('Cache-Control','no-store');res.json({items:rows.map(contactSafe)});
});
router.get('/threads/:id',async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Conversación inválida.'});
  const row=await ChatThread.findOne({_id:req.params.id,expiresAt:{$gt:new Date()}}).lean();
  if(!row)return res.status(404).json({error:'Conversación no encontrada.'});
  await ChatThread.updateOne({_id:row._id},{$set:{unreadForStaff:false}});
  res.set('Cache-Control','no-store');res.json({thread:{...contactSafe(row),messages:row.messages.map(m=>({sender:m.sender,text:m.text,at:m.at}))}});
});
router.post('/threads/:id/reply',async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Conversación inválida.'});
  const text=message(req.body?.message),now=new Date();
  const row=await ChatThread.findOneAndUpdate({_id:req.params.id,status:'open',expiresAt:{$gt:now}},
    {$push:{messages:{$each:[{sender:'staff',actorId:req.user._id,text,at:now}],$slice:-80}},$set:{lastMessageAt:now,unreadForVisitor:true,unreadForStaff:false,expiresAt:new Date(Date.now()+90*86400000)}},{new:true});
  if(!row)return res.status(404).json({error:'La conversación no existe o está cerrada.'});
  res.json({ok:true});
});
router.post('/threads/:id/close',async(req,res)=>{
  if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Conversación inválida.'});
  const row=await ChatThread.findOneAndUpdate({_id:req.params.id,status:'open'},{$set:{status:'closed',unreadForStaff:false}},{new:true});
  if(!row)return res.status(404).json({error:'La conversación no existe o ya está cerrada.'});
  res.json({ok:true});
});
module.exports=router;
