'use strict';
// Cazana Store · Fase 3.3. No almacenar enlaces ni contraseñas en documentos de usuario.
const crypto=require('node:crypto');
const TOKEN_BYTES=32;
const RESET_TTL_MINUTES=15;
const RESET_TTL_MS=RESET_TTL_MINUTES*60*1000;
const sha256=value=>crypto.createHash('sha256').update(value).digest('hex');
const issueToken=()=>crypto.randomBytes(TOKEN_BYTES).toString('hex');
const validToken=token=>typeof token==='string'&&/^[a-f0-9]{64}$/.test(token);
const isDevLinkMode=()=>process.env.NODE_ENV!=='production'&&process.env.RESET_DEV_LINKS==='1';
const isConfigured=()=>isDevLinkMode()||Boolean(process.env.RESEND_API_KEY&&process.env.RESET_MAIL_FROM&&process.env.PUBLIC_SITE_URL);
function resetLink(token){
  if(!validToken(token))throw new Error('Token incorrecto.');
  const base=new URL(process.env.PUBLIC_SITE_URL||'http://localhost:3000');
  if(base.username||base.password||base.search||base.hash|| !['https:','http:'].includes(base.protocol))throw Error('PUBLIC_SITE_URL inválida.');
  if(process.env.NODE_ENV==='production'&&base.protocol!=='https:')throw Error('PUBLIC_SITE_URL debe usar HTTPS en producción.');
  // El fragmento no se transmite al servidor web ni a terceros mediante Referer.
  return new URL('/cuenta.html#restablecer='+token,base).toString();
}
async function deliverReset(to,token){
  const url=resetLink(token);
  if(isDevLinkMode()){
    // SOLO desarrollo local. Deshabilitar antes de publicar; evitar capturas con enlaces activos.
    console.log('[Cazana DEV] Enlace temporal de recuperación (15 min):',url);
    return;
  }
  if(!isConfigured())throw new Error('Proveedor de correo no configurado.');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),8000);
  try{
    const result=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        from:process.env.RESET_MAIL_FROM,
        to:[to],
        subject:'Restablecer tu contraseña de Cazana Store',
        text:`Recibimos una solicitud para cambiar la contraseña de tu cuenta en Cazana Store.\n\nAbre este enlace dentro de los próximos ${RESET_TTL_MINUTES} minutos:\n${url}\n\nSi no lo solicitaste, puedes ignorar este mensaje. Tu contraseña seguirá siendo la misma.\nNo compartas el enlace con otras personas.`
      }),signal:controller.signal
    });
    if(!result.ok)throw new Error('No fue posible entregar el correo de recuperación.');
  }finally{clearTimeout(timeout);}
}
module.exports={RESET_TTL_MS,RESET_TTL_MINUTES,sha256,issueToken,validToken,isDevLinkMode,isConfigured,resetLink,deliverReset};
