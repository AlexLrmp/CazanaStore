'use strict';
const form=document.getElementById('staff-login-form');
form.addEventListener('submit',async e=>{
  e.preventDefault();const feedback=document.getElementById('feedback'),button=document.getElementById('submit');
  feedback.textContent='Validando credenciales...';button.disabled=true;
  try{
    const data=Object.fromEntries(new FormData(form));
    const res=await fetch('/api/staff/login',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json','X-Cazana-Request':'1'},body:JSON.stringify(data)});
    const result=await res.json();
    if(!res.ok)throw new Error(result.error||'No fue posible iniciar sesión.');
    location.replace('/staff');
  }catch(err){feedback.textContent=err.message;button.disabled=false;}
});
