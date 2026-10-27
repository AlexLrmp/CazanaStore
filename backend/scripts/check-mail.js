'use strict';
// Diagnóstico sin exponer la API key. Para enviar PRUEBA REAL usar --send correo@tudominio.com
const path=require('node:path');
require('dotenv').config({path:path.resolve(__dirname,'../.env')});
const {passwordResetEmailHtml}=require('../src/mail-template');
const recipientIndex=process.argv.indexOf('--send');
const to=recipientIndex===-1?null:process.argv[recipientIndex+1];
const key=process.env.RESEND_API_KEY||'';
const from=process.env.RESET_MAIL_FROM||'';
const replyTo=process.env.RESET_MAIL_REPLY_TO||'';
const base=process.env.PUBLIC_SITE_URL||'';
const isProd=process.env.NODE_ENV==='production';
const emailPattern=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const extractedFrom=from.match(/<([^<>]+)>\s*$/)?.[1]||from;
async function run(){
  const problems=[];
  if(!key.startsWith('re_'))problems.push('Falta RESEND_API_KEY válida en backend/.env.');
  if(!emailPattern.test(extractedFrom))problems.push('RESET_MAIL_FROM debe contener una dirección válida de un dominio verificado.');
  if(replyTo&&!emailPattern.test(replyTo))problems.push('RESET_MAIL_REPLY_TO no es una dirección válida.');
  let url;
  try{url=new URL(base);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw Error();}
  catch{problems.push('PUBLIC_SITE_URL debe ser una URL válida.');}
  if(isProd&&url?.protocol!=='https:')problems.push('En producción se necesita PUBLIC_SITE_URL con HTTPS.');
  if(process.env.RESET_DEV_LINKS==='1')problems.push('Desactiva RESET_DEV_LINKS (usa 0) para enviar correos reales.');
  if(to&&!emailPattern.test(to))problems.push('Después de --send introduce un correo destinatario válido.');
  if(to&&base.includes('localhost'))console.warn('[Cazana] Atención: un enlace con localhost solo funciona en tu computadora.');
  if(problems.length){for(const s of problems)console.error('[Cazana correo] '+s);process.exitCode=1;return;}
  console.log('[Cazana correo] Variables presentes y con formato válido.');
  console.log('[Cazana correo] Remitente:',from);
  console.log('[Cazana correo] URL pública:',base);
  console.log('[Cazana correo] Asegúrate de que el dominio esté VERIFICADO en Resend (la validación local no lo verifica).');
  if(!to){console.log('[Cazana correo] Para enviar una prueba real: npm.cmd run mail:test -- --send destinatario@ejemplo.com');return;}
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),10000);
  try{
    const payload={from,to:[to],subject:'Cazana Store · Prueba de correo real',
      text:'Esta es una prueba de envío del sistema Cazana Store. No contiene enlaces ni contraseñas.',
      html:passwordResetEmailHtml({url:base+'/cuenta.html',minutes:15}).replace(/Recupera tu acceso/g,'Prueba de correo').replace(/Restablecer contraseña/g,'Visitar Cazana')};
    if(replyTo)payload.reply_to=replyTo;
    const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    const body=await response.json().catch(()=>({}));
    if(!response.ok){console.error('[Cazana correo] Resend rechazó el mensaje (HTTP '+response.status+'). Verifica dominio, remitente y permisos.');process.exitCode=1;return;}
    console.log('[Cazana correo] Resend aceptó el mensaje. ID:',body.id||'(sin ID en respuesta)');
    console.log('[Cazana correo] Revisa la bandeja del destinatario y la sección Emails de Resend para confirmar entrega.');
  }catch(err){console.error('[Cazana correo] No se pudo contactar al proveedor:',err.name==='AbortError'?'tiempo de espera agotado':'error de red');process.exitCode=1;}
  finally{clearTimeout(timeout);}
}
run();
