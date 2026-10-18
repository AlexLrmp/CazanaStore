/**
 * Cazana Store - Pulido visual responsive (octubre 2026).
 * No elimina imágenes, no cambia datos ni modifica Git.
 * Requiere el repositorio CazanaStore con css/style.css y js/components/ui.js.
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
const rel = name => path.join(root,name);
const read = name => fs.readFileSync(rel(name),'utf8');
function stop(message){throw new Error(message)}
function main(){
  const cssName = 'css/style.css';
  const jsName = 'js/components/ui.js';
  const css = read(cssName);
  const js = read(jsName);
  if (!fs.existsSync(rel('tienda.html')) || !fs.existsSync(rel('cuenta.html')))
    stop('Ejecuta en la carpeta principal de CazanaStore, donde esta index.html.');
  const marker = 'CAZANA | PULIDO VISUAL';
  const foundCss = css.includes(marker);
  const foundJs = js.includes('Cazana Store: controles de filtros consistentes');
  if(foundCss && foundJs) {console.log('[OK] Pulido visual ya instalado. No se modifico nada.');return;}
  if(foundCss !== foundJs) stop('Se encontro solo una parte de la instalacion anterior. Revisa los archivos antes de continuar.');
  const startToken = '  function filterDrawer() {';
  const endToken = '  function enhanceSelect(select) {';
  const start = js.indexOf(startToken);
  const end = js.indexOf(endToken,start);
  if(start<0 || end<0 || !js.includes("const mq = matchMedia('(max-width: 900px)');"))
    stop('La version de js/components/ui.js no coincide con la esperada. No cambie archivos.');
  if(!css.includes('.shop-layout') || !css.includes('.account-menu'))
    stop('No reconozco los estilos actuales de Cazana. No cambie archivos.');
  const replacement = read('tools/filtros_premium.js.txt').trimEnd()+'\n\n';
  const cssAdd = read('tools/estilos_premium.css.txt');
  const edits = [
    {filename:jsName,content:js.slice(0,start)+replacement+js.slice(end),old:js},
    {filename:cssName,content:css.trimEnd()+'\n\n'+cssAdd,old:css}
  ];
  const stamp = new Date().toISOString().replace(/[.:]/g,'-');
  const backupDir = path.join(path.dirname(root),path.basename(root)+'-RESPALDO-PULIDO-'+stamp);
  fs.mkdirSync(backupDir,{recursive:true});
  for(const e of edits){
    const dst=path.join(backupDir,e.filename);
    fs.mkdirSync(path.dirname(dst),{recursive:true});
    fs.writeFileSync(dst,e.old,'utf8');
  }
  for(const e of edits){ fs.writeFileSync(rel(e.filename),e.content,'utf8'); console.log('ACTUALIZADO',e.filename); }
  console.log('[OK] Navegacion, filtros de escritorio/movil y cuenta responsive actualizados.');
  console.log('Respaldo externo:',backupDir);
  console.log('Revisa tienda.html y cuenta.html en PC y celular antes de hacer git push.');
}
try{main();}catch(e){console.error('[ERROR]',e.message);process.exitCode=1;}
