'use strict';
const mongoose=require('mongoose');
const {Product,Order,StockMovement,AuditLog}=require('./models');
const {parse,orderBody,orderStatusBody}=require('./validation');
const {STATE_TRANSITIONS,canChangeStatus,sumOrderLines}=require('./order-policy');
const money=c=>Math.round(Number(c)||0);
function publicOrder(order){
 const o=order.toObject?order.toObject():order;
 return {id:String(o._id),createdAt:o.createdAt,updatedAt:o.updatedAt,status:o.status,paymentStatus:o.paymentStatus,
  items:o.items.map(i=>({sku:i.sku,name:i.name,image:i.image,quantity:i.quantity,unitPriceCents:i.unitPriceCents,lineTotalCents:i.lineTotalCents})),
  shipping:o.shipping,notes:o.notes,subtotalCents:o.subtotalCents,totalCents:o.totalCents,currency:o.currency,
  customerName:o.shipping.fullName,customerEmail:o.customerEmail,statusHistory:(o.statusHistory||[]).map(x=>({status:x.status,at:x.at,note:x.note||''}))};
}
function staffOrder(order){const o=publicOrder(order);return {...o,customerId:String(order.customerId)};}
function fail(message,status=400){const e=new Error(message);e.status=status;return e;}
async function reserveOrder(user,payload){
 const data=parse(orderBody,payload);
 const previous=await Order.findOne({customerId:user._id,requestId:data.requestId});
 if(previous)return {order:previous,existing:true};
 const session=await mongoose.startSession();let saved=null;
 try{
  await session.withTransaction(async()=>{
   const existing=await Order.findOne({customerId:user._id,requestId:data.requestId}).session(session);
   if(existing){saved=existing;return;}
   const lines=[];
   for(const entry of data.items){
    const product=mongoose.isValidObjectId(entry.productId)?await Product.findOne({$or:[{_id:entry.productId},{legacyId:entry.productId}],active:true}).session(session):await Product.findOne({$or:[{legacyId:entry.productId},{slug:entry.productId},{sku:entry.productId}],active:true}).session(session);
    if(!product)throw fail('Uno de los productos ya no está disponible.',409);
    const updated=await Product.findOneAndUpdate({_id:product._id,active:true,stockQty:{$gte:entry.quantity}},{$inc:{stockQty:-entry.quantity}},{session,new:true});
    if(!updated)throw fail(`Existencias insuficientes para ${product.name}.`,409);
    const unitPrice=money(product.priceCents),lineTotal=unitPrice*entry.quantity;
    if(!Number.isSafeInteger(lineTotal))throw fail('Monto inválido.');
    lines.push({productId:product._id,sku:product.sku,name:product.name,image:product.image,quantity:entry.quantity,unitPriceCents:unitPrice,lineTotalCents:lineTotal});
    await StockMovement.create([{productId:product._id,actorId:user._id,delta:-entry.quantity,reason:`Reserva de pedido ${data.requestId}`,resultingQty:updated.stockQty}],{session});
   }
   const subtotal=sumOrderLines(lines);
   const docs=await Order.create([{customerId:user._id,requestId:data.requestId,items:lines,shipping:data.shipping,customerEmail:user.email,notes:data.notes,subtotalCents:subtotal,totalCents:subtotal,statusHistory:[{status:'pending',at:new Date(),actorId:user._id,note:'Solicitud registrada; pago pendiente de coordinar.'}]}],{session});
   saved=docs[0];
   await AuditLog.create([{actorId:user._id,action:'order.create',resource:'order',resourceId:String(saved._id),details:{items:lines.length,totalCents:subtotal}}],{session});
  });
 }catch(err){
  if(err.code===11000){const found=await Order.findOne({customerId:user._id,requestId:data.requestId});if(found)return {order:found,existing:true};}
  throw err;
 }finally{await session.endSession();}
 return {order:saved,existing:false};
}
async function changeStatus(orderId,newStatus,actorId,note='',customerOnly=false){
 const session=await mongoose.startSession();let saved;
 try{await session.withTransaction(async()=>{
  const order=await Order.findById(orderId).session(session);
  if(!order)throw fail('Pedido no encontrado.',404);
  if(customerOnly && String(order.customerId)!==String(actorId))throw fail('Pedido no encontrado.',404);
  const allowed=STATE_TRANSITIONS[order.status]||[];
  if(!allowed.includes(newStatus) || (customerOnly && !(order.status==='pending'&&newStatus==='cancelled')))
    throw fail('No se permite ese cambio de estado.',409);
  // Restock and record stock movements before committing a cancellation.
  if(newStatus==='cancelled')for(const item of order.items){
   const product=await Product.findByIdAndUpdate(item.productId,{$inc:{stockQty:item.quantity}},{new:true,session});
   if(product)await StockMovement.create([{productId:item.productId,actorId,delta:item.quantity,reason:`Cancelación de pedido ${order._id}`,resultingQty:product.stockQty}],{session});
  }
  order.status=newStatus;if(newStatus==='cancelled')order.cancelledAt=new Date();
  order.statusHistory.push({status:newStatus,at:new Date(),actorId,note});
  await order.save({session});
  await AuditLog.create([{actorId,action:'order.status.change',resource:'order',resourceId:String(order._id),details:{newStatus,customerOnly}}],{session});
  saved=order;
 });}finally{await session.endSession();}
 return saved;
}
module.exports={reserveOrder,changeStatus,publicOrder,staffOrder,STATE_TRANSITIONS};
