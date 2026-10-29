'use strict';
// Politica de acceso al flujo de atencion. Pura y comprobable sin MongoDB.
const MANAGERS=new Set(['owner','admin']);
const bad=message=>Object.assign(new Error(message),{status:400});
const isManager=user=>MANAGERS.has(user?.role);
const isSupport=user=>user?.role==='support';
const scopeFilter=(user,scope='all')=>{
  if(!isManager(user)&&!isSupport(user))throw Object.assign(new Error('Sin permiso.'),{status:403});
  if(!['all','mine','unassigned'].includes(scope))throw bad('Filtro de asignación inválido.');
  if(scope==='mine')return {assignedTo:user._id};
  if(scope==='unassigned')return {assignedTo:null};
  return isSupport(user)?{$or:[{assignedTo:null},{assignedTo:user._id}]}:{};
};
const escapedSearch=value=>{
  if(value==null||value==='')return '';
  if(typeof value!=='string'||value.trim().length>60)throw bad('La búsqueda debe contener como máximo 60 caracteres.');
  return value.trim().replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
};
function listQuery(user,{status='open',scope='all',search='',now=new Date()}={}){
  if(!['open','closed'].includes(status))throw bad('Estado inválido.');
  const safe=escapedSearch(search);
  const conditions=[{status,expiresAt:{$gt:now}},scopeFilter(user,scope)];
  if(safe)conditions.push({$or:[{name:{$regex:safe,$options:'i'}},{email:{$regex:safe,$options:'i'}}]});
  return {$and:conditions};
}
function visibleThreadQuery(user,id,now=new Date()){
  return {$and:[{_id:id,expiresAt:{$gt:now}},scopeFilter(user)]};
}
const canEdit=(user,thread)=>isManager(user)||Boolean(isSupport(user)&&thread?.assignedTo&&String(thread.assignedTo)===String(user._id));
const noteValue=value=>{if(typeof value!=='string'||value.length>500||value.trim().length>400)throw bad('La nota interna admite hasta 400 caracteres.');return value.trim();};
const priorityValue=value=>{if(value!=='normal'&&value!=='high')throw bad('Prioridad inválida.');return value;};
module.exports={isManager,isSupport,scopeFilter,listQuery,visibleThreadQuery,canEdit,noteValue,priorityValue};
