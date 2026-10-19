'use strict';
const crypto=require('node:crypto');
const {User,Session}=require('./models');
const COOKIE='cazana.sid';
const DAYS=7;
const cookieOptions=()=>({httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:DAYS*24*60*60*1000});
const hashToken=token=>crypto.createHash('sha256').update(token).digest('hex');
function readCookie(req,name=COOKIE){
  const header=req.headers.cookie || '';
  for(const chunk of header.split(';')){const idx=chunk.indexOf('=');if(idx>-1 && chunk.slice(0,idx).trim()===name)return chunk.slice(idx+1).trim();}
  return null;
}
async function createSession(user,res){
  const token=crypto.randomBytes(32).toString('hex');
  await Session.create({userId:user._id,tokenHash:hashToken(token),expiresAt:new Date(Date.now()+DAYS*86400000)});
  res.cookie(COOKIE,token,cookieOptions());
}
async function destroySession(req,res){
  const token=readCookie(req);if(token)await Session.deleteOne({tokenHash:hashToken(token)});
  res.clearCookie(COOKIE,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});
}
async function optionalUser(req,res,next){
  try{
    const token=readCookie(req);
    if(token && /^[a-f0-9]{64}$/.test(token)){
      const session=await Session.findOne({tokenHash:hashToken(token),expiresAt:{$gt:new Date()}});
      if(session){const user=await User.findById(session.userId);if(user?.active)req.user=user;}
    }
    next();
  }catch(err){next(err);}
}
function auth(req,res,next){if(!req.user)return res.status(401).json({error:'Debes iniciar sesión.'});next();}
function roles(...allowed){return (req,res,next)=>{
  if(!req.user)return res.status(401).json({error:'Debes iniciar sesión.'});
  if(!allowed.includes(req.user.role))return res.status(403).json({error:'No tienes permiso para esta operación.'});
  next();
};}
function userJSON(user){return {id:String(user._id),name:user.name,email:user.email,role:user.role,employeeCode:user.employeeCode||null,marketingConsent:user.marketingConsent};}
function requireSameOrigin(req,res,next){
  if(['GET','HEAD','OPTIONS'].includes(req.method))return next();
  const origin=req.get('Origin');
  if(origin){
    try{const target=new URL(origin);if(target.host!==req.get('host')||!['https:','http:'].includes(target.protocol))return res.status(403).json({error:'Origen de solicitud no permitido.'});}
    catch{return res.status(403).json({error:'Origen inválido.'});}
  }
  if(req.get('X-Cazana-Request')!=='1')return res.status(403).json({error:'Falta la cabecera de protección de solicitudes.'});
  next();
}
module.exports={readCookie,optionalUser,auth,roles,userJSON,requireSameOrigin,createSession,destroySession};
