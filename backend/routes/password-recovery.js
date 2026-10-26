'use strict';
const {Router}=require('express');
const {rateLimit}=require('express-rate-limit');
const bcrypt=require('bcryptjs');
const {z}=require('zod');
const {User,Session,PasswordReset}=require('../src/models');
const {parse}=require('../src/validation');
const {RESET_TTL_MS,sha256,issueToken,isConfigured,deliverReset}=require('../src/password-recovery-core');
const router=Router();
const requestLimiter=rateLimit({windowMs:15*60*1000,limit:5,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Demasiadas solicitudes. Inténtalo más tarde.'}});
const resetLimiter=rateLimit({windowMs:15*60*1000,limit:10,standardHeaders:'draft-7',legacyHeaders:false,message:{error:'Demasiados intentos. Inténtalo más tarde.'}});
const emailSchema=z.object({email:z.string().trim().email().max(254).transform(v=>v.toLowerCase())}).strict();
const resetSchema=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:z.string().min(10).max(128)}).strict();
const generic={message:'Si existe una cuenta activa con ese correo, recibirás instrucciones para restablecer tu contraseña.'};

router.post('/forgot-password',requestLimiter,async(req,res)=>{
  const {email}=parse(emailSchema,req.body);
  // Falta de configuración no debe dar una respuesta distinta por dirección de correo.
  if(!isConfigured())return res.status(503).json({error:'La recuperación por correo todavía no está configurada.'});
  const customer=await User.findOne({email,role:'customer',active:true}).select('_id email');
  if(!customer)return res.json(generic);
  const token=issueToken();
  await PasswordReset.deleteMany({userId:customer._id});
  const document=await PasswordReset.create({userId:customer._id,tokenHash:sha256(token),expiresAt:new Date(Date.now()+RESET_TTL_MS)});
  try{await deliverReset(customer.email,token)}
  catch(_err){
    await PasswordReset.deleteOne({_id:document._id}).catch(()=>{});
    console.error('[Cazana] No se pudo entregar una recuperación de contraseña. Revisa el proveedor de correo.');
  }
  return res.json(generic);
});

router.post('/reset-password',resetLimiter,async(req,res)=>{
  const {token,password}=parse(resetSchema,req.body);
  // Bcrypt antes de consumir el token evita perderlo por una contraseña de formato válido.
  const passwordHash=await bcrypt.hash(password,12);
  const document=await PasswordReset.findOneAndUpdate(
    {tokenHash:sha256(token),usedAt:null,expiresAt:{$gt:new Date()}},
    {$set:{usedAt:new Date()}},{new:true}
  );
  if(!document)return res.status(400).json({error:'Este enlace es inválido o ha caducado. Solicita uno nuevo.'});
  const user=await User.findOneAndUpdate({_id:document.userId,role:'customer',active:true},{$set:{passwordHash}},{new:true});
  if(!user)return res.status(400).json({error:'Este enlace ya no está disponible.'});
  // Todos los dispositivos tendrán que volver a iniciar sesión con la contraseña nueva.
  await Promise.all([PasswordReset.deleteMany({userId:user._id}),Session.deleteMany({userId:user._id})]);
  res.clearCookie('cazana.sid',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});
  return res.json({message:'Tu contraseña se actualizó. Inicia sesión nuevamente.'});
});
module.exports=router;
