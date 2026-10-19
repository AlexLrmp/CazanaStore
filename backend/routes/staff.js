'use strict';
const {Router}=require('express');
const bcrypt=require('bcryptjs');
const {User}=require('../src/models');
const {staffLoginBody,parse}=require('../src/validation');
const {loginLimiter}=require('./auth');
const {auth,roles,userJSON,createSession,destroySession}=require('../src/security');
const router=Router();
router.post('/login',loginLimiter,async(req,res)=>{
  const data=parse(staffLoginBody,req.body);
  const user=await User.findOne({employeeCode:data.employeeCode,active:true,role:{$ne:'customer'}}).select('+passwordHash');
  const valid=user?await bcrypt.compare(data.password,user.passwordHash):false;
  if(!valid)return res.status(401).json({error:'Credenciales incorrectas.'});
  await createSession(user,res);res.json({user:userJSON(user)});
});
router.post('/logout',async(req,res)=>{await destroySession(req,res);res.status(204).end();});
router.get('/me',auth,roles('support','inventory','accounting','admin','owner'),(req,res)=>res.json({user:userJSON(req.user)}));
module.exports=router;
