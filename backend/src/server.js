'use strict';
require('dotenv').config({path:require('node:path').resolve(__dirname,'../.env')});
const app=require('./app');
const mongoose=require('mongoose');
const {connectDB}=require('./db');
const {SiteSettings}=require('./models');
(async()=>{
  await connectDB();
  await SiteSettings.updateOne({key:'main'},{$setOnInsert:{key:'main'}},{upsert:true});
  const port=Number(process.env.PORT||3000);
  const server=app.listen(port,()=>console.log(`[Cazana] Tienda + API: http://localhost:${port} | Intranet: http://localhost:${port}/staff/login`));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(async()=>{await mongoose.disconnect();process.exit(0);}));
})().catch(err=>{console.error('[Cazana] No se pudo iniciar:',err.message);process.exit(1);});
