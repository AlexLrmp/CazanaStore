'use strict';
const path=require('node:path');
const fs=require('node:fs');
const mongoose=require('mongoose');
const express=require('express');
const helmet=require('helmet');
const {rateLimit}=require('express-rate-limit');
const {Product}=require('./models');
const {serializeProduct}=require('./format');
const {optionalUser,requireSameOrigin}=require('./security');
const authRoutes=require('../routes/auth').router;
const staffRoutes=require('../routes/staff');
const publicRoutes=require('../routes/catalog');
const adminRoutes=require('../routes/admin');
const customerOrdersRoutes=require('../routes/orders');
const customerProfileRoutes=require('../routes/customer-profile');
const adminOrdersRoutes=require('../routes/admin-orders');
const ROOT=path.resolve(__dirname,'../..');
const HERE=path.resolve(__dirname,'..');
const KNOWN_PAGES=new Set(['index','tienda','producto','carrito','checkout','cuenta','contacto','nosotros','personal','admin']);
const app=express();
app.disable('x-powered-by');
if(process.env.TRUST_PROXY==='1')app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:{directives:{
  defaultSrc:["'self'"],scriptSrc:["'self'"],
  styleSrc:["'self'","'unsafe-inline'",'https://fonts.googleapis.com'],
  fontSrc:["'self'",'https://fonts.gstatic.com','data:'],
  imgSrc:["'self'",'data:','blob:','https:'],
  connectSrc:["'self'"],
  upgradeInsecureRequests:process.env.NODE_ENV==='production'?[]:null
}}}));
app.use(express.json({limit:'48kb'}));
app.use('/api',rateLimit({windowMs:15*60*1000,limit:300,standardHeaders:'draft-7',legacyHeaders:false}));
app.use('/api',requireSameOrigin,optionalUser);
app.get('/api/health',(req,res)=>res.json({status:mongoose.connection.readyState===1?'ok':'database_unavailable',database:mongoose.connection.readyState===1?'connected':'disconnected'}));
app.use('/api/auth',authRoutes);
app.use('/api/staff',staffRoutes);
app.use('/api/admin',adminRoutes);
app.use('/api/admin/orders',adminOrdersRoutes);
app.use('/api/orders',customerOrdersRoutes);
app.use('/api/me',customerProfileRoutes);
app.use('/api',publicRoutes);
app.use('/api',(req,res)=>res.status(404).json({error:'Ruta API no encontrada.'}));

// Las carpetas sensibles (backend/, docs/, tools/, .env) NO se sirven públicamente.
app.use('/assets',express.static(path.join(ROOT,'assets'),{dotfiles:'deny',index:false,maxAge:'1h'}));
app.use('/css',express.static(path.join(ROOT,'css'),{dotfiles:'deny',index:false,maxAge:'10m'}));
app.get('/js/data.js',async(req,res,next)=>{
  try{
    const all=await Product.find({active:true}).sort({isBestseller:-1,createdAt:1}).limit(1000).lean();
    const data=all.map(serializeProduct);
    res.set('Cache-Control','no-store');res.type('application/javascript');
    res.send('/* Catálogo generado desde MongoDB para la primera etapa de transición */\nwindow.CazanaData=Object.freeze('+JSON.stringify(data).replace(/</g,'\\u003c')+');\n');
  }catch(err){next(err);}
});
app.use('/js',express.static(path.join(ROOT,'js'),{dotfiles:'deny',index:false,maxAge:0}));
app.use('/staff-assets',express.static(path.join(HERE,'staff'),{dotfiles:'deny',index:false,maxAge:0}));
app.get('/staff/login',optionalUser,(req,res)=>{
  if(req.user && ['owner','admin','inventory'].includes(req.user.role)) return res.redirect('/staff');
  res.sendFile(path.join(HERE,'staff','login.html'));
});
app.get('/staff',optionalUser,(req,res)=>{
  if(!req.user || !['owner','admin','inventory'].includes(req.user.role))return res.redirect('/staff/login');
  res.sendFile(path.join(HERE,'staff','catalog.html'));
});
// Un único acceso: la tienda dirige a la intranet real. No exponer admin.html de muestra
// cuando Express y MongoDB están activos. En GitHub Pages la demo sigue siendo estática.
app.get('/personal.html',optionalUser,(req,res)=>res.redirect(req.user && ['owner','admin','inventory'].includes(req.user.role)?'/staff':'/staff/login'));
app.get('/admin.html',optionalUser,(req,res)=>res.redirect(req.user && ['owner','admin','inventory'].includes(req.user.role)?'/staff':'/staff/login'));
app.get('/',(req,res)=>res.sendFile(path.join(ROOT,'index.html')));
app.get(/^\/(index|tienda|producto|carrito|checkout|cuenta|contacto|nosotros|personal|admin)\.html$/,(req,res)=>{
  const name=req.path.slice(1,-5);
  if(!KNOWN_PAGES.has(name))return res.status(404).end();
  res.sendFile(path.join(ROOT,`${name}.html`));
});
app.use((req,res)=>res.status(404).send('Página no encontrada.'));
app.use((err,req,res,next)=>{
  if(res.headersSent)return next(err);
  if(err.code===11000)return res.status(409).json({error:'Ya existe un registro con ese identificador o correo.'});
  if(err.name==='ValidationError'||err.name==='CastError')return res.status(400).json({error:'Datos inválidos.'});
  if(err.status)return res.status(err.status).json({error:err.message,details:err.details});
  console.error('[Cazana] Error:',err.message);
  res.status(500).json({error:'Ocurrió un error interno. Inténtalo más tarde.'});
});
module.exports=app;
