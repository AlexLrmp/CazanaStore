/* Cazana Store — Fase 3.2. Invitados en navegador; clientes autenticados en MongoDB. */
(() => {
  'use strict';
  const CART='cazana_cart', WISH='cazana_wishlist', OWNER='cazana_shopping_owner';
  const PENDING_CART='cazana_shopping_pending_cart', PENDING_WISH='cazana_shopping_pending_wish';
  const MAX_CART=20,MAX_WISH=100;
  let mode='initial',userId=null,revision=0,initTask=null,work=Promise.resolve(),generation=0;
  const safeRead=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key)||'null')??fallback;}catch{return fallback;}};
  const safeGet=key=>{try{return localStorage.getItem(key);}catch{return null;}};
  const safePut=(key,value)=>{try{localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value));}catch{}};
  const safeDel=key=>{try{localStorage.removeItem(key);}catch{}};
  function cleanCart(input){
    if(!Array.isArray(input))return [];
    const unique=new Map();
    for(const line of input){const id=String(line?.id||'');const qty=Number(line?.qty);
      if(!/^[A-Za-z0-9_-]{1,140}$/.test(id)||!Number.isInteger(qty)||qty<1)continue;
      unique.set(id,Math.min(20,qty));
      if(unique.size>=MAX_CART)break;
    }
    return [...unique].map(([id,qty])=>({id,qty}));
  }
  function cleanWish(input){return [...new Set((Array.isArray(input)?input:[]).filter(s=>typeof s==='string'&&/^[A-Za-z0-9_-]{1,140}$/.test(s)))].slice(0,MAX_WISH);}
  function cart(){return cleanCart(safeRead(CART,[]));}
  function favorites(){return cleanWish(safeRead(WISH,[]));}
  function notify(){document.dispatchEvent(new CustomEvent('cazana:shopping-change',{detail:{cart:cart(),favorites:favorites(),authenticated:mode==='customer'}}));}
  function pendingFor(key){const item=safeRead(key,null);return item?.owner===userId?item:null;}
  function hasPending(){return Boolean(pendingFor(PENDING_CART)||pendingFor(PENDING_WISH));}
  function setSnapshot(data){
    revision=data.revision;
    safePut(CART,cleanCart(data.cart));safePut(WISH,cleanWish(data.favorites));
    notify();
  }
  async function request(url,method='GET',payload){
    const opts={method,credentials:'same-origin',headers:{Accept:'application/json','X-Cazana-Request':'1'}};
    if(payload!==undefined){opts.headers['Content-Type']='application/json';opts.body=JSON.stringify(payload);}
    if(typeof AbortSignal!=='undefined'&&typeof AbortSignal.timeout==='function')opts.signal=AbortSignal.timeout(12000);
    const response=await fetch(url,opts);
    let data={};try{data=await response.json();}catch{}
    if(!response.ok){const error=Error(data.error||`No se pudo sincronizar (${response.status}).`);error.status=response.status;throw error;}
    return data;
  }
  function guest(clearPrivate=false){
    mode='guest';userId=null;revision=0;
    if(clearPrivate){safeDel(OWNER);safeDel(PENDING_CART);safeDel(PENDING_WISH);safePut(CART,[]);safePut(WISH,[]);notify();}
  }
  async function initialize(force=false){
    if(!force&&initTask)return initTask;
    const requestGeneration=generation;
    initTask=(async()=>{
      try{
        const result=await request('/api/auth/me');
        if(requestGeneration!==generation)return;
        if(!result.user||result.user.role!=='customer'){guest(Boolean(safeGet(OWNER)));return;}
        const incomingId=String(result.user.id);
        const previousOwner=safeGet(OWNER);
        if(previousOwner&&previousOwner!==incomingId){
          safePut(CART,[]);safePut(WISH,[]);safeDel(PENDING_CART);safeDel(PENDING_WISH);
        }
        userId=incomingId;mode='customer';
        const guestCart=previousOwner?[]:cart();
        const guestWish=previousOwner?[]:favorites();
        let data=(!previousOwner&&(guestCart.length||guestWish.length))?
          await request('/api/me/shopping/merge','POST',{cart:guestCart,favorites:guestWish}):
          await request('/api/me/shopping');
        if(requestGeneration!==generation)return;
        safePut(OWNER,incomingId);
        if(pendingFor(PENDING_CART)){
          const queued=pendingFor(PENDING_CART);
          data=await request('/api/me/shopping/cart','PUT',{items:cleanCart(queued.value),revision:data.revision});
          safeDel(PENDING_CART);
        }
        if(pendingFor(PENDING_WISH)){
          const queued=pendingFor(PENDING_WISH);
          data=await request('/api/me/shopping/favorites','PUT',{ids:cleanWish(queued.value),revision:data.revision});
          safeDel(PENDING_WISH);
        }
        if(requestGeneration===generation)setSnapshot(data);
      }catch(error){
        if(requestGeneration!==generation)return;
        if(error.status===401||error.status===403)guest(Boolean(safeGet(OWNER)));
        else if(error.status===404){guest(Boolean(safeGet(OWNER)));}
        else{mode='offline';document.dispatchEvent(new CustomEvent('cazana:sync-error',{detail:{message:'No se pudo conectar con MongoDB. Los cambios quedarán pendientes hasta recuperar la conexión.'}}));}
      }
    })();
    return initTask;
  }
  async function save(kind,value){
    const key=kind==='cart'?CART:WISH;
    const pendingKey=kind==='cart'?PENDING_CART:PENDING_WISH;
    const normalized=kind==='cart'?cleanCart(value):cleanWish(value);
    safePut(key,normalized);
    notify();
    try{await initialize();}catch{}
    if(mode!=='customer'){
      const existingOwner=safeGet(OWNER);
      if(existingOwner&&mode==='offline')safePut(pendingKey,{owner:existingOwner,value:normalized});
      return;
    }
    const stamp=JSON.stringify({owner:userId,value:normalized});
    safePut(pendingKey,stamp);
    const ownerAtCall=userId, generationAtCall=generation;
    work=work.catch(()=>{}).then(async()=>{
      if(generationAtCall!==generation||ownerAtCall!==userId)return;
      const queued=pendingFor(pendingKey);
      if(!queued)return;
      try{
        const data=await request(`/api/me/shopping/${kind==='cart'?'cart':'favorites'}`,'PUT',kind==='cart'?
          {items:cleanCart(queued.value),revision}:{ids:cleanWish(queued.value),revision});
        if(generationAtCall!==generation||ownerAtCall!==userId)return;
        revision=data.revision;
        if(safeGet(pendingKey)===JSON.stringify(queued))safeDel(pendingKey);
        if(!hasPending())setSnapshot(data);
      }catch(error){
        if(generationAtCall!==generation||ownerAtCall!==userId)return;
        if(error.status===401||error.status===403){guest(true);return;}
        if(error.status===409){
          // No sobreescribir otros dispositivos: preferir el estado más reciente del servidor.
          safeDel(pendingKey);
          try{const fresh=await request('/api/me/shopping');revision=fresh.revision;
            if(!hasPending())setSnapshot(fresh);
          }catch{}
        }
        document.dispatchEvent(new CustomEvent('cazana:sync-error',{detail:{message:error.message}}));
      }
    });
    return work;
  }
  async function refresh(){
    if(mode!=='customer'||hasPending())return;
    const forUser=userId,forGeneration=generation;
    try{const data=await request('/api/me/shopping');
      if(forUser!==userId||forGeneration!==generation)return;
      if(data.revision!==revision)setSnapshot(data);
    }catch(e){if((e.status===401||e.status===403)&&forUser===userId)guest(true);}
  }
  function logout(){
    generation++;
    safeDel(OWNER);safeDel(PENDING_CART);safeDel(PENDING_WISH);
    safePut(CART,[]);safePut(WISH,[]);
    mode='guest';userId=null;revision=0;initTask=null;work=Promise.resolve();notify();
  }
  window.addEventListener('focus',()=>{if(mode==='customer')refresh();});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&mode==='customer')refresh();});
  window.addEventListener('storage',e=>{if([CART,WISH,OWNER].includes(e.key)&&mode==='customer')refresh();});
  window.CazanaShopping=Object.freeze({initialize,setCart:items=>save('cart',items),setFavorites:ids=>save('favorites',ids),clearCart:()=>save('cart',[]),cart,favorites,logout,refresh});
})();
