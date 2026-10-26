'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const installed=path.resolve(__dirname,'../../../js/services/shopping.js');
const source=fs.existsSync(installed)?installed:path.resolve(__dirname,'../../js/services/shopping.js');
const script=fs.readFileSync(source,'utf8');
function environment(initial={},handler=async()=>({status:401,error:'Debes iniciar sesión.'})){
 const cache=new Map(Object.entries(initial));
 const events=[];
 const localStorage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,String(v)),removeItem:k=>cache.delete(k)};
 const fetch=async(url,opts={})=>{
  const data=await handler(url,opts);
  return {ok:!data.status||data.status<400,status:data.status||200,json:async()=>data};
 };
 const window={addEventListener() {}};
 const document={hidden:false,dispatchEvent(e){events.push(e);},addEventListener() {}};
 const context=vm.createContext({window,document,localStorage,fetch,CustomEvent:class{constructor(type,data){this.type=type;this.detail=data.detail;}},JSON,Map,Set,String,Number,Array,Promise,console});
 vm.runInContext(script,context);
 return {store:cache,state:window.CazanaShopping,events};
}
test('un visitante conserva su carrito de localStorage sin sesión',async()=>{
 const x=environment({'cazana_cart':JSON.stringify([{id:'h1',qty:2}])});
 await x.state.initialize();
 assert.equal(x.state.cart()[0].qty,2);
 assert.equal(x.store.get('cazana_shopping_owner'),undefined);
});
test('al iniciar sesión combina el carrito de invitado una sola vez',async()=>{
 const calls=[];
 const x=environment({'cazana_cart':JSON.stringify([{id:'h1',qty:1}]),'cazana_wishlist':'["h1"]'},
  async(url,opts)=>{
   calls.push([url,opts.method]);
   if(url==='/api/auth/me')return {user:{id:'customer-1',role:'customer'}};
   if(url==='/api/me/shopping/merge')return {revision:1,cart:[{id:'h1',qty:2}],favorites:['h1','h2']};
   if(url==='/api/me/shopping')return {revision:1,cart:[{id:'h1',qty:2}],favorites:['h1','h2']};
   throw Error('Llamada inesperada '+url);
  });
 await x.state.initialize();
 assert.equal(x.store.get('cazana_shopping_owner'),'customer-1');
 assert.equal(x.state.cart()[0].qty,2);
 assert.deepEqual(Array.from(x.state.favorites()),['h1','h2']);
 await x.state.initialize(true);
 assert.equal(calls.filter(([url])=>url==='/api/me/shopping/merge').length,1);
});
test('el carrito autenticado se guarda con revisión y el logout limpia datos privados',async()=>{
 let revision=4;
 let lastPut=null;
 const x=environment({'cazana_shopping_owner':'customer-1'},async(url,opts)=>{
  if(url==='/api/auth/me')return {user:{id:'customer-1',role:'customer'}};
  if(url==='/api/me/shopping'&&(!opts.method||opts.method==='GET'))return {revision,cart:[],favorites:[]};
  if(url==='/api/me/shopping/cart'){
    lastPut=JSON.parse(opts.body);revision++;
    return {revision,cart:lastPut.items,favorites:[]};
  }
  throw Error('Llamada inesperada '+url);
 });
 await x.state.initialize();
 await x.state.setCart([{id:'h2',qty:3}]);
 assert.equal(lastPut.revision,4);
 assert.equal(x.state.cart()[0].qty,3);
 x.state.logout();
 assert.deepEqual(Array.from(x.state.cart()),[]);
 assert.equal(x.store.has('cazana_shopping_owner'),false);
});
