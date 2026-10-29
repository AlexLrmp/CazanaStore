'use strict';
const {Router}=require('express');
const crypto=require('node:crypto');
const {rateLimit}=require('express-rate-limit');
const ChatThread=require('../src/chat-model');
const {readCookie}=require('../src/security');
const {message,identity,cookieHash,isValidToken,visitorSafe}=require('../src/chat-policy');
const router=Router();
const COOKIE='cazana.chat';
const LIFETIME=90*24*60*60*1000;
const cookieOptions=()=>({httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:LIFETIME});
const expires=()=>new Date(Date.now()+LIFETIME);
const limiter=rateLimit({windowMs:15*60*1000,limit:12,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Demasiadas solicitudes. Inténtalo más tarde.'}});
// CAZANA-CHAT-POR-CUENTA-2026: la identidad de la cuenta se verifica en el servidor.
function chatQuery(req,now=new Date()){
  if(req.user?.role==='customer')return {customerId:req.user._id,expiresAt:{$gt:now}};
  if(req.user)return null; // empleados no pueden usar un chat ajeno
  const token=readCookie(req,COOKIE);
  if(!isValidToken(token))return null;
  return {tokenHash:cookieHash(token),customerId:{$exists:false},expiresAt:{$gt:now}};
}
async function current(req){
  const query=chatQuery(req);
  return query?ChatThread.findOne(query):null;
}
router.use((req,res,next)=>{
  if(req.user&&req.user.role!=='customer')return res.status(403).json({error:'El chat de la tienda es para clientes y visitantes. Accede a la intranet para responder.'});
  next();
});
router.get('/session',async(req,res)=>{const thread=await current(req);res.set('Cache-Control','no-store');res.json({thread:thread?visitorSafe(thread):null});});
router.post('/start',limiter,async(req,res)=>{
  const text=message(req.body?.message);
  const customer=req.user?.role==='customer'?req.user:null;
  const {name,email}=customer?{name:customer.name,email:customer.email}:identity(req.body);
  const previous=await current(req);
  if(previous)return res.status(409).json({error:'Ya tienes una conversación. Actualiza la bandeja para continuar.'});
  const token=crypto.randomBytes(32).toString('hex');
  const now=new Date();
  // Un indice unico por customerId evita la mezcla y las aperturas simultaneas.
  if(customer)await ChatThread.deleteMany({customerId:customer._id,expiresAt:{$lte:now}});
  const fields={tokenHash:cookieHash(token),name,email,messages:[{sender:'visitor',text,at:now}],lastMessageAt:now,expiresAt:expires()};
  if(customer)fields.customerId=customer._id;
  const thread=await ChatThread.create(fields);
  if(!customer)res.cookie(COOKIE,token,cookieOptions());
  res.status(201).json({thread:visitorSafe(thread)});
});
router.post('/message',limiter,async(req,res)=>{
  const query=chatQuery(req);
  if(!query)return res.status(401).json({error:'Abre una conversacion primero.'});
  const text=message(req.body?.message),now=new Date();
  const thread=await ChatThread.findOneAndUpdate(query,
    {$push:{messages:{$each:[{sender:'visitor',text,at:now}],$slice:-80}},$set:{status:'open',lastMessageAt:now,unreadForStaff:true,expiresAt:expires()}},{new:true});
  if(!thread)return res.status(401).json({error:'Tu conversacion expiro. Inicia una consulta nueva.'});
  res.json({thread:visitorSafe(thread)});
});
module.exports=router;
