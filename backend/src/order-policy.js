'use strict';
const STATE_TRANSITIONS=Object.freeze({pending:['confirmed','cancelled'],confirmed:['preparing','cancelled'],preparing:['shipped','cancelled'],shipped:['delivered'],delivered:[],cancelled:[]});
function canChangeStatus(current,next,{customerOnly=false}={}){
  return (STATE_TRANSITIONS[current]||[]).includes(next)&&(!customerOnly||(current==='pending'&&next==='cancelled'));
}
function sumOrderLines(lines){
  let sum=0;
  for(const line of lines){
    const price=line.unitPriceCents,quantity=line.quantity;
    if(!Number.isSafeInteger(price)||price<0||!Number.isSafeInteger(quantity)||quantity<1||quantity>20)throw Error('Importe o cantidad inválidos.');
    const amount=price*quantity;
    if(!Number.isSafeInteger(amount)||!Number.isSafeInteger(sum+amount))throw Error('Importe fuera de rango.');
    sum+=amount;
  }
  return sum;
}
module.exports={canChangeStatus,sumOrderLines,STATE_TRANSITIONS};
