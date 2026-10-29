'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {scopeFilter,listQuery,visibleThreadQuery,canEdit,noteValue,priorityValue}=require('../src/chat-workflow');
const support={role:'support',_id:'agent-A'},other={role:'support',_id:'agent-B'},manager={role:'owner',_id:'owner-X'};
test('un agente ve solo libres y propias; un gerente puede ver todas',()=>{
  assert.deepEqual(scopeFilter(support),{$or:[{assignedTo:null},{assignedTo:'agent-A'}]});
  assert.deepEqual(scopeFilter(support,'mine'),{assignedTo:'agent-A'});
  assert.deepEqual(scopeFilter(support,'unassigned'),{assignedTo:null});
  assert.deepEqual(scopeFilter(manager),{});
  assert.throws(()=>scopeFilter({role:'customer',_id:'x'}));
});
test('busqueda literal impide inyeccion de expresiones regulares',()=>{
  const q=listQuery(support,{status:'open',scope:'all',search:'Ana.*'});
  assert.equal(q.$and[2].$or[0].name.$regex,'Ana\\.\\*');
  assert.throws(()=>listQuery(support,{search:'a'.repeat(61)}));
  assert.throws(()=>listQuery(support,{status:'all'}));
});
test('consultar por id aplica el mismo filtro de privacidad',()=>{
  assert.deepEqual(visibleThreadQuery(support,'my-id').$and[1],scopeFilter(support));
});
test('solo asignado o gerente puede editar un caso',()=>{
  assert.equal(canEdit(support,{assignedTo:'agent-A'}),true);
  assert.equal(canEdit(support,{assignedTo:null}),false);
  assert.equal(canEdit(other,{assignedTo:'agent-A'}),false);
  assert.equal(canEdit(manager,{assignedTo:'agent-A'}),true);
});
test('nota interna con limite estricto y prioridad enumerada',()=>{
  assert.equal(noteValue(' Pendiente '),'Pendiente');
  assert.throws(()=>noteValue('z'.repeat(401)));
  assert.equal(priorityValue('high'),'high');
  assert.throws(()=>priorityValue('urgent'));
});
