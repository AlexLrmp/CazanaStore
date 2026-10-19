'use strict';
require('dotenv').config({path:require('node:path').resolve(__dirname,'../.env')});
const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');
const readline=require('node:readline');
const {stdin,stdout}=require('node:process');
const {connectDB}=require('../src/db');
const {User}=require('../src/models');
async function ask(label,hidden=false){
  if(!stdin.isTTY)throw new Error('Ejecuta este comando en una terminal interactiva de VS Code.');
  if(!hidden){const rl=readline.createInterface({input:stdin,output:stdout});return new Promise(resolve=>rl.question(label,a=>{rl.close();resolve(a.trim());}));}
  // Solicita la contraseña sin mostrarla ni escribirla en el historial de PowerShell.
  stdout.write(label);stdin.setRawMode(true);stdin.resume();
  return await new Promise((resolve,reject)=>{
    let value='';
    const onData=chunk=>{
      const ch=chunk.toString('utf8');
      for(const c of ch){
        if(c==='\r'||c==='\n'){cleanup();stdout.write('\n');resolve(value);return;}
        if(c==='\u0003'){cleanup();reject(new Error('Operación cancelada.'));return;}
        if(c==='\u007f'||c==='\b'){value=value.slice(0,-1);continue;}
        if(c>=' ' && value.length<128)value+=c;
      }
    };
    const cleanup=()=>{stdin.off('data',onData);stdin.setRawMode(false);stdin.pause();};
    stdin.on('data',onData);
  });
}
(async()=>{
  const code=(await ask('Código del empleado (ej. CZ-ADM-0001): ')).toUpperCase();
  const name=await ask('Nombre del responsable: ');
  const email=(await ask('Correo de trabajo: ')).toLowerCase();
  const pass=await ask('Contraseña (mínimo 12 caracteres; entrada oculta): ',true);
  if(!/^CZ-[A-Z]{3}-\d{4,}$/.test(code)||name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||pass.length<12)
    throw new Error('Código, nombre, email o contraseña inválidos.');
  await connectDB();
  if(await User.exists({$or:[{email},{employeeCode:code}]}))throw new Error('El correo o código ya está registrado.');
  await User.create({name,email,employeeCode:code,passwordHash:await bcrypt.hash(pass,12),role:'owner',active:true});
  console.log(`[Cazana] Propietario creado con código ${code}. Nunca compartas su contraseña.`);
  await mongoose.disconnect();
})().catch(e=>{console.error('[Cazana]',e.message);mongoose.disconnect().finally(()=>process.exit(1));});
