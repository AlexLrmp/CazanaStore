'use strict';
document.getElementById('signout')?.addEventListener('click',async()=>{
  try{await fetch('/api/staff/logout',{method:'POST',credentials:'same-origin',headers:{'X-Cazana-Request':'1'}});}catch{}
  location.replace('/staff/login');
});
