'use strict';
require('dotenv').config({path:require('node:path').resolve(__dirname,'../.env')});
const mongoose=require('mongoose');
const {connectDB}=require('../src/db');
const models=require('../src/models');
(async()=>{await connectDB();for(const m of Object.values(models)){await m.createIndexes();console.log('Índices verificados:',m.modelName);}await mongoose.disconnect();})().catch(e=>{console.error(e.message);mongoose.disconnect().finally(()=>process.exit(1));});
