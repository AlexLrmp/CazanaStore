'use strict';
const {Router}=require('express');
const mongoose=require('mongoose');
const ChatThread=require('../src/chat-model');
const {User}=require('../src/models');
const {auth,roles}=require('../src/security');
const {message,contactSafe}=require('../src/chat-policy');
const {isManager,isSupport,scopeFilter,listQuery,visibleThreadQuery,noteValue,priorityValue}=require('../src/chat-workflow');
const router=Router();
router.use(auth,roles('support','admin','owner'));
const idOk=(req,res)=>{if(!mongoose.isValidObjectId(req.params.id)){res.status(400).json({error:'Conversación inválida.'});return false;}return true;};
const noStore=res=>res.set('Cache-Control','no-store');
const expired=()=>({$gt:new Date()});
const ownerFilter=req=>isSupport(req.user)?{assignedTo:req.user._id}:{};

// Solo las conversaciones visibles para el rol; los filtros tambien se aplican en el servidor.
router.get('/threads',async(req,res)=>{
  const status=req.query.status??'open',scope=req.query.scope??'all',search=req.query.q??'';
  const filter=listQuery(req.user,{status,scope,search});
  const unreadFilter=listQuery(req.user,{status:'open'});
  unreadFilter.$and.push({unreadForStaff:true});
  const [rows,unreadCount]=await Promise.all([
    ChatThread.find(filter).sort({lastMessageAt:-1}).limit(40).lean(),
    ChatThread.countDocuments(unreadFilter)
  ]);
  noStore(res);res.json({items:rows.map(contactSafe),unreadCount});
});
router.get('/agents',roles('owner','admin'),async(req,res)=>{
  const rows=await User.find({active:true,role:'support'}).select('_id name employeeCode').sort({name:1}).limit(150).lean();
  noStore(res);res.json({items:rows.map(a=>({id:String(a._id),name:a.name,employeeCode:a.employeeCode}))});
});
router.get('/threads/:id',async(req,res)=>{
  if(!idOk(req,res))return;
  const row=await ChatThread.findOne(visibleThreadQuery(req.user,req.params.id)).lean();
  if(!row)return res.status(404).json({error:'Conversación no encontrada o no asignada a tu perfil.'});
  if(isManager(req.user)||String(row.assignedTo||'')===String(req.user._id))
    await ChatThread.updateOne({_id:row._id},{$set:{unreadForStaff:false}});
  noStore(res);res.json({thread:{...contactSafe(row),internalNote:row.internalNote||'',messages:row.messages.map(m=>({sender:m.sender,text:m.text,at:m.at}))}});
});
router.post('/threads/:id/claim',async(req,res)=>{
  if(!idOk(req,res))return;
  const row=await ChatThread.findOneAndUpdate({_id:req.params.id,status:'open',expiresAt:expired(),assignedTo:null},
    {$set:{assignedTo:req.user._id,assignedAt:new Date(),unreadForStaff:false}},{new:true});
  if(!row)return res.status(409).json({error:'Esta conversación ya está asignada o cerrada. Actualiza la bandeja.'});
  noStore(res);res.json({ok:true});
});
router.post('/threads/:id/release',async(req,res)=>{
  if(!idOk(req,res))return;
  const assigned=isSupport(req.user)?req.user._id:{$ne:null};
  const row=await ChatThread.findOneAndUpdate({_id:req.params.id,assignedTo:assigned,status:'open',expiresAt:expired()},
    {$set:{assignedTo:null,assignedAt:null,unreadForStaff:true}},{new:true});
  if(!row)return res.status(409).json({error:'No puedes liberar esta conversación.'});
  noStore(res);res.json({ok:true});
});
router.post('/threads/:id/assign',roles('owner','admin'),async(req,res)=>{
  if(!idOk(req,res))return;
  const employeeCode=req.body?.employeeCode;
  if(typeof employeeCode!=='string'||(employeeCode!==''&&!/^CZ-SUP-\d{4,}$/.test(employeeCode)))
    return res.status(400).json({error:'Código de atención inválido.'});
  const agent=employeeCode?await User.findOne({employeeCode,role:'support',active:true}).select('_id').lean():null;
  if(employeeCode&&!agent)return res.status(404).json({error:'Empleado de atención no encontrado o inactivo.'});
  const row=await ChatThread.findOneAndUpdate({_id:req.params.id,status:'open',expiresAt:expired()},
    {$set:{assignedTo:agent?agent._id:null,assignedAt:agent?new Date():null,unreadForStaff:true}},{new:true});
  if(!row)return res.status(409).json({error:'La conversación ya no está abierta.'});
  noStore(res);res.json({ok:true});
});
router.patch('/threads/:id/meta',async(req,res)=>{
  if(!idOk(req,res))return;
  const keys=Object.keys(req.body||{});
  if(!keys.length||keys.some(k=>!['priority','internalNote'].includes(k)))return res.status(400).json({error:'Campos inválidos.'});
  const update={};
  if(Object.hasOwn(req.body,'priority'))update.priority=priorityValue(req.body.priority);
  if(Object.hasOwn(req.body,'internalNote'))update.internalNote=noteValue(req.body.internalNote);
  const row=await ChatThread.findOneAndUpdate({_id:req.params.id,expiresAt:expired(),...ownerFilter(req)},{$set:update},{new:true});
  if(!row)return res.status(403).json({error:'Toma primero esta conversación o pide una asignación.'});
  noStore(res);res.json({ok:true});
});
router.post('/threads/:id/reply',async(req,res)=>{
  if(!idOk(req,res))return;
  const text=message(req.body?.message),now=new Date();
  const row=await ChatThread.findOneAndUpdate({_id:req.params.id,status:'open',expiresAt:{$gt:now},...ownerFilter(req)},
    {$push:{messages:{$each:[{sender:'staff',actorId:req.user._id,text,at:now}],$slice:-80}},$set:{lastMessageAt:now,unreadForVisitor:true,unreadForStaff:false,expiresAt:new Date(Date.now()+90*86400000)}},{new:true});
  if(!row)return res.status(403).json({error:'La conversación está cerrada o no está asignada a tu usuario.'});
  noStore(res);res.json({ok:true});
});
router.post('/threads/:id/close',async(req,res)=>{
  if(!idOk(req,res))return;
  const row=await ChatThread.findOneAndUpdate({_id:req.params.id,status:'open',expiresAt:expired(),...ownerFilter(req)},{$set:{status:'closed',unreadForStaff:false}},{new:true});
  if(!row)return res.status(403).json({error:'No tienes permiso o la conversación ya está cerrada.'});
  noStore(res);res.json({ok:true});
});
module.exports=router;
