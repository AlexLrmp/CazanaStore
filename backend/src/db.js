'use strict';
const mongoose=require('mongoose');
async function connectDB(){
  if(!process.env.MONGODB_URI)throw new Error('Falta MONGODB_URI en backend/.env');
  await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:12000,autoIndex:process.env.NODE_ENV!=='production'});
  console.log('[Cazana] MongoDB conectado:',mongoose.connection.name);
}
module.exports={connectDB};
