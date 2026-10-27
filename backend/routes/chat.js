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
async function current(req){const token=readCookie(req,COOKIE);return isValidToken(token)?ChatThread.findOne({tokenHash:cookieHash(token),expiresAt:{$gt:new Date()}}):null;}
router.get('/session',async(req,res)=>{const thread=await current(req);res.set('Cache-Control','no-store');res.json({thread:thread?visitorSafe(thread):null});});
router.post('/start',limiter,async(req,res)=>{
  const {name,email}=identity(req.body);
  const text=message(req.body?.message);
  const previous=await current(req);
  if(previous)return res.status(409).json({error:'Ya tienes una conversación. Actualiza la bandeja para continuar.'});
  const token=crypto.randomBytes(32).toString('hex');
  const now=new Date();
  const thread=await ChatThread.create({tokenHash:cookieHash(token),name,email,messages:[{sender:'visitor',text,at:now}],lastMessageAt:now,expiresAt:expires()});
  res.cookie(COOKIE,token,cookieOptions());res.status(201).json({thread:visitorSafe(thread)});
});
router.post('/message',limiter,async(req,res)=>{
  const token=readCookie(req,COOKIE);
  if(!isValidToken(token))return res.status(401).json({error:'Abre una conversación primero.'});
  const text=message(req.body?.message),now=new Date();
  const thread=await ChatThread.findOneAndUpdate({tokenHash:cookieHash(token),expiresAt:{$gt:now}},
    {$push:{messages:{$each:[{sender:'visitor',text,at:now}],$slice:-80}},$set:{status:'open',lastMessageAt:now,unreadForStaff:true,expiresAt:expires()}},{new:true});
  if(!thread)return res.status(401).json({error:'Tu conversación expiró. Inicia una consulta nueva.'});
  res.json({thread:visitorSafe(thread)});
});
module.exports=router;
