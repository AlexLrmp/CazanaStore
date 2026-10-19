'use strict';
const fs=require('node:fs');const path=require('node:path');
const root=path.resolve(__dirname,'..');
const file=path.join(root,'css','style.css');
if(!fs.existsSync(file)||!fs.existsSync(path.join(root,'backend','package.json')))throw Error('Ejecuta este instalador desde el proyecto de Cazana, junto a index.html.');
const start='/* CAZANA FASE 2: CLIENTES Y PEDIDOS */';
const end='/* FIN CAZANA FASE 2 */';
const css=`${start}
/* Conserva el estilo Cazana: una sola hoja de estilos. */
.customer-form{display:grid;gap:14px;margin:20px 0}
.customer-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
.customer-field{display:flex;flex-direction:column;gap:7px;min-width:0;color:#403b35;font-size:12px;font-weight:600}
.customer-field input,.customer-field textarea{width:100%;min-height:45px;border:1px solid #e5dfd5;border-radius:12px;background:#fff;color:#302d28;font:inherit;font-size:13px;padding:11px 13px;outline:none}
.customer-field textarea{resize:vertical;min-height:88px}
.customer-field input:focus-visible,.customer-field textarea:focus-visible{border-color:var(--gold,#c9a34e);box-shadow:0 0 0 3px #c9a34e22}
.customer-auth{padding:clamp(8px,2vw,25px)}
.customer-auth-header h3,.customer-profile h3,.customer-order-success h3{font:500 clamp(23px,3vw,30px)/1.3 var(--serif,Georgia,serif);margin:0 0 8px}
.customer-auth-header p,.customer-auth-foot{font-size:12px;line-height:1.7;color:#777068}
.customer-auth .btn,.customer-form .btn{justify-self:start;min-width:185px}
.customer-link{background:transparent;border:0;color:var(--gold-dark,#a8832a);font-weight:600;cursor:pointer;margin-top:7px;padding:8px 0;text-align:left;font-size:12px}
.customer-consent{display:flex;align-items:flex-start;gap:10px;font-size:12px;line-height:1.6;color:#615c55}
.customer-consent input{margin-top:3px;accent-color:#b49450}
.account-message:not([hidden]),#checkout-alert:not(:empty){display:block;border:1px solid #e2d2b3;background:#fff9ed;color:#765822;border-radius:12px;padding:12px 15px;font-size:12px;margin-bottom:15px}
.account-message.error,#checkout-alert.error{border-color:#ddaaa3;background:#fff4f2;color:#8c2c23}
.customer-orders{display:grid;gap:14px;margin-top:12px}
.customer-order{background:white;border:1px solid #eae4d9;border-radius:16px;padding:18px;display:grid;gap:13px}
.customer-order-header,.customer-order-bottom{display:flex;gap:16px;justify-content:space-between;align-items:center;flex-wrap:wrap}
.customer-order-header>div,.customer-order-bottom>div:first-child{display:grid;gap:4px}
.customer-order small{display:block;color:#8b847a;font-size:11px}
.customer-order>p{font-size:12px;line-height:1.7;color:#554e45;margin:0}
.customer-order .order-status{white-space:nowrap}
.customer-profile{display:grid;gap:9px;padding:12px 0}
.customer-profile p{font-size:13px;color:#615951}
.customer-checkout{display:grid;gap:10px}
.customer-order-success{padding:30px 10px;display:grid;gap:12px;justify-items:start}
.customer-order-success-mark{display:grid;place-items:center;background:#e7f4ed;color:#08724d;width:50px;height:50px;border-radius:50%;font-size:27px}
.customer-order-success p{color:#5d5549;font-size:13px;line-height:1.7;margin:0}
.staff-order-date{display:block;font-size:10px;color:#969087;line-height:1.6;margin-top:5px}
@media(max-width:640px){.customer-form-grid{grid-template-columns:1fr}.customer-auth{padding:4px}.customer-order{padding:14px}.customer-order-header,.customer-order-bottom{align-items:flex-start}.customer-auth .btn,.customer-form .btn{width:100%;justify-self:stretch}}
${end}`;
let source=fs.readFileSync(file,'utf8');
const a=source.indexOf(start),b=source.indexOf(end);
if(a>=0&&b>a){source=source.slice(0,a)+source.slice(b+end.length);}
fs.writeFileSync(file,source.trimEnd()+'\n\n'+css+'\n');
console.log('Cazana Fase 2: estilos agregados a css/style.css (sin crear otro CSS).');
console.log('Los archivos de backend y los módulos JS ya fueron colocados al copiar el ZIP.');
