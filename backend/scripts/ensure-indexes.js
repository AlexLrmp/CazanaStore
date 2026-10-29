'use strict';
require('dotenv').config({path:require('node:path').resolve(__dirname,'../.env')});
const mongoose=require('mongoose');
const {connectDB}=require('../src/db');
const models=require('../src/models');
const ChatThread=require('../src/chat-model'); // CAZANA-CHAT-POR-CUENTA-2026
const ChatThread=require('../src/chat-model');
(async()=>{await connectDB();for(const m of [...Object.values(models),ChatThread]){await m.createIndexes();console.log('Índices verificados:',m.modelName);}await ChatThread.createIndexes();console.log('Indices verificados: CazanaChatThread');await mongoose.disconnect();})().catch(e=>{console.error(e.message);mongoose.disconnect().finally(()=>process.exit(1));});
