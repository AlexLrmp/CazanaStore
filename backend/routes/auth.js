'use strict';
const {Router}=require('express');
const bcrypt=require('bcryptjs');
const {rateLimit}=require('express-rate-limit');
const {User}=require('../src/models');
const {parse,registerBody,loginBody,staffLoginBody}=require('../src/validation');
const {auth,userJSON,createSession,destroySession}=require('../src/security');
const router=Router();
// CAZANA-CHAT-POR-CUENTA-2026: una cookie de visitante no debe reaparecer al cambiar de cuenta.
const clearGuestChat=res=>res.clearCookie('cazana.chat',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});
const loginLimiter=rateLimit({windowMs:15*60*1000,limit:12,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Demasiados intentos. Intenta nuevamente más tarde.'}});
const registerLimiter=rateLimit({windowMs:60*60*1000,limit:8,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Límite temporal de registros. Intenta más tarde.'}});
router.post('/register',registerLimiter,async(req,res)=>{
  const data=parse(registerBody,req.body);
  if(await User.exists({email:data.email}))return res.status(409).json({error:'No se pudo registrar este correo electrónico.'});
  const user=await User.create({name:data.name,email:data.email,passwordHash:await bcrypt.hash(data.password,12),role:'customer',marketingConsent:data.marketingConsent,marketingConsentAt:data.marketingConsent?new Date():null});
  await createSession(user,res);clearGuestChat(res);
  res.status(201).json({user:userJSON(user)});
});
router.post('/login',loginLimiter,async(req,res)=>{
  const data=parse(loginBody,req.body);
  const user=await User.findOne({email:data.email,role:'customer',active:true}).select('+passwordHash');
  const valid=user?await bcrypt.compare(data.password,user.passwordHash):false;
  if(!valid)return res.status(401).json({error:'Datos de acceso incorrectos.'});
  await createSession(user,res);clearGuestChat(res);res.json({user:userJSON(user)});
});
router.post('/logout',async(req,res)=>{await destroySession(req,res);clearGuestChat(res);res.status(204).end();});
router.get('/me',auth,(req,res)=>res.json({user:userJSON(req.user)}));
module.exports={router,loginLimiter};
