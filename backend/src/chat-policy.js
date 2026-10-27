'use strict';
const crypto=require('node:crypto');
const STAFF_ROLES=new Set(['support','owner','admin']);
const MAX_TEXT=1200;
const clean=(value,max)=>typeof value==='string'?value.trim().slice(0,max):'';
const validEmail=value=>!value||/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
function message(value){const text=clean(value,MAX_TEXT+1);if(text.length<2||text.length>MAX_TEXT)throw Object.assign(new Error('El mensaje debe tener entre 2 y 1200 caracteres.'),{status:400});return text;}
function identity(data){
  const name=clean(data?.name,80),email=clean(data?.email,180).toLowerCase();
  if(name.length<2)throw Object.assign(new Error('Escribe tu nombre para iniciar la consulta.'),{status:400});
  if(email&&!validEmail(email))throw Object.assign(new Error('El correo electrónico no es válido.'),{status:400});
  return {name,email};
}
function staffRole(role){return STAFF_ROLES.has(role);}
function cookieHash(token){return crypto.createHash('sha256').update(token).digest('hex');}
function isValidToken(token){return typeof token==='string'&&/^[0-9a-f]{64}$/.test(token);}
function contactSafe(row){return {id:String(row._id),name:row.name,email:row.email||'',status:row.status,lastMessageAt:row.lastMessageAt,updatedAt:row.updatedAt,unreadForStaff:!!row.unreadForStaff,preview:row.messages?.at(-1)?.text?.slice(0,110)||''};}
function visitorSafe(row){return {id:String(row._id),status:row.status,messages:(row.messages||[]).map(msg=>({sender:msg.sender,text:msg.text,at:msg.at}))};}
module.exports={message,identity,staffRole,cookieHash,isValidToken,contactSafe,visitorSafe,MAX_TEXT};
