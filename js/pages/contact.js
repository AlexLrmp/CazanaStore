(() => {
  const form=document.getElementById('contact-demo-form');if(!form)return;
  form.addEventListener('submit',e=>{
    e.preventDefault();
    const status=document.getElementById('contact-status');
    status.textContent='El formulario aún no está habilitado. No se envió ningún mensaje.';
    form.reset();
  });
})();
