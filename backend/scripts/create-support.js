'use strict';
// Esta utilidad se ejecuta solo en una terminal autorizada del servidor.
require('dotenv').config({path:require('node:path').resolve(__dirname,'../.env')});
const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const readline=require('node:readline');
const {stdin,stdout}=require('node:process');
const {connectDB}=require('../src/db');
const {User}=require('../src/models');
function question(text){const rl=readline.createInterface({input:stdin,output:stdout});return new Promise(resolve=>rl.question(text,value=>{rl.close();resolve(value.trim());}));}
async function secret(text){
  if(!stdin.isTTY || typeof stdin.setRawMode!=='function')throw new Error('Abre una terminal interactiva de VS Code.');
  stdout.write(text);stdin.setRawMode(true);stdin.resume();
  return new Promise((resolve,reject)=>{
    let value='';
    const cleanup=()=>{stdin.off('data',onData);stdin.setRawMode(false);stdin.pause();};
    function onData(chunk){for(const ch of chunk.toString('utf8')){
      if(ch==='\r'||ch==='\n'){cleanup();stdout.write('\n');resolve(value);return;}
      if(ch==='\u0003'){cleanup();reject(new Error('Operación cancelada.'));return;}
      if(ch==='\u007f'||ch==='\b'){value=value.slice(0,-1);continue;}
      if(ch>=' '&&value.length<128)value+=ch;
    }}
    stdin.on('data',onData);
  });
}
(async()=>{
  if(!stdin.isTTY)throw new Error('Ejecuta en una terminal interactiva de VS Code.');
  stdout.write('[Cazana] Alta de personal de ATENCIÓN. Solo con autorización del propietario.\n');
  const employeeCode=(await question('Código (CZ-SUP-0001): ')).toUpperCase();
  const name=await question('Nombre completo: ');
  const email=(await question('Correo de trabajo: ')).toLowerCase();
  const password=await secret('Contraseña inicial (mínimo 12 caracteres, entrada oculta): ');
  if(!/^CZ-SUP-\d{4,}$/.test(employeeCode)||name.length<2||name.length>100||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length<12||password.length>128)
    throw new Error('Código, nombre, correo o contraseña inválidos.');
  await connectDB();
  if(await User.exists({$or:[{employeeCode},{email}]}))throw new Error('Código o correo ya registrado.');
  await User.create({employeeCode,name,email,passwordHash:await bcrypt.hash(password,12),role:'support',active:true});
  stdout.write(`[Cazana] Empleado de atención ${employeeCode} registrado. No se comparte su contraseña.\n`);
})().catch(error=>{console.error('[Cazana]',error.message);process.exitCode=1;}).finally(async()=>{await mongoose.disconnect();});
