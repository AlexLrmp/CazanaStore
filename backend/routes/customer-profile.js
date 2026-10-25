'use strict';
const { Router } = require('express');
const mongoose = require('mongoose');
const { User, AuditLog } = require('../src/models');
const { auth, roles } = require('../src/security');
const { profilePatch, addressBase, addressPatch, parse } = require('../src/customer-validation');

const router = Router();
router.use(auth, roles('customer'));
const MAX_ADDRESSES = 8;
const addressJSON = a => ({
  id: String(a._id), label: a.label, fullName: a.fullName, phone: a.phone,
  address: a.address, city: a.city, region: a.region,
  reference: a.reference || '', isDefault: Boolean(a.isDefault)
});
const profileJSON = u => ({
  name: u.name, email: u.email, phone: u.phone || '',
  marketingConsent: Boolean(u.marketingConsent)
});
function normalizeDefault(addresses, preferredId) {
  const chosen = addresses.find(a => String(a._id) === String(preferredId)) || addresses[0];
  for (const a of addresses) a.isDefault = Boolean(chosen && String(a._id) === String(chosen._id));
}
function invalidId(req,res,next) {
  if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Identificador de dirección inválido.'});
  next();
}
function missing(res){return res.status(404).json({error:'No encontramos esa dirección en tu cuenta.'});}
async function userFor(req) {
  return User.findOne({_id:req.user._id,role:'customer',active:true});
}
async function auditConsent(user, oldValue, nextValue) {
  if(oldValue === nextValue) return;
  await AuditLog.create({actorId:user._id,action:'customer.marketing_consent',resource:'User',resourceId:String(user._id),details:{consent:nextValue}});
}
router.get('/profile', async(req,res)=>res.json({profile:profileJSON(req.user)}));
router.patch('/profile', async(req,res)=>{
  const data=parse(profilePatch,req.body);
  const user=await userFor(req);
  if(!user)return res.status(401).json({error:'La sesión ya no está disponible.'});
  if(data.name !== undefined) user.name=data.name;
  if(data.phone !== undefined) user.phone=data.phone;
  const before=Boolean(user.marketingConsent);
  if(data.marketingConsent !== undefined){
    user.marketingConsent=data.marketingConsent;
    user.marketingConsentAt=data.marketingConsent?user.marketingConsentAt || new Date():null;
  }
  await user.save();
  // Un fallo de auditoría no debería borrar la actualización ya guardada.
  try { await auditConsent(user,before,Boolean(user.marketingConsent)); }
  catch(e){ console.error('[Cazana] No se pudo auditar el consentimiento:',e.message); }
  res.json({profile:profileJSON(user)});
});
router.get('/addresses', async(req,res)=>{
  const user=await userFor(req);
  if(!user)return res.status(401).json({error:'La sesión ya no está disponible.'});
  res.json({items:user.addresses.map(addressJSON),limit:MAX_ADDRESSES});
});
router.post('/addresses', async(req,res)=>{
  const data=parse(addressBase,req.body);
  const user=await userFor(req);
  if(!user)return res.status(401).json({error:'La sesión ya no está disponible.'});
  if(user.addresses.length>=MAX_ADDRESSES)return res.status(409).json({error:'Puedes guardar hasta ocho direcciones.'});
  const isFirst=user.addresses.length===0;
  user.addresses.push({...data,isDefault:data.isDefault||isFirst});
  if(data.isDefault || isFirst)normalizeDefault(user.addresses,user.addresses[user.addresses.length-1]._id);
  await user.save();
  res.status(201).json({items:user.addresses.map(addressJSON)});
});
router.patch('/addresses/:id', invalidId, async(req,res)=>{
  const data=parse(addressPatch,req.body);
  const user=await userFor(req);
  if(!user)return res.status(401).json({error:'La sesión ya no está disponible.'});
  const item=user.addresses.id(req.params.id);
  if(!item)return missing(res);
  const currentDefault=Boolean(item.isDefault);
  Object.assign(item,data);
  if(data.isDefault===true)normalizeDefault(user.addresses,item._id);
  else if(currentDefault && data.isDefault===false)normalizeDefault(user.addresses,user.addresses.find(a=>String(a._id)!==String(item._id))?._id || item._id);
  await user.save();
  res.json({items:user.addresses.map(addressJSON)});
});
router.delete('/addresses/:id',invalidId,async(req,res)=>{
  const user=await userFor(req);
  if(!user)return res.status(401).json({error:'La sesión ya no está disponible.'});
  const item=user.addresses.id(req.params.id);
  if(!item)return missing(res);
  const wasDefault=Boolean(item.isDefault);
  user.addresses.pull(item._id);
  if(wasDefault || (user.addresses.length>0 && !user.addresses.some(a=>a.isDefault)))normalizeDefault(user.addresses,user.addresses[0]?._id);
  await user.save();
  res.json({items:user.addresses.map(addressJSON)});
});
module.exports = router;
