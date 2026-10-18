#!/usr/bin/env python3
"""Validacion basica sin dependencias del catalogo demo Cazana."""
from pathlib import Path
import json,re,collections,sys
root=Path(__file__).resolve().parent.parent
manifest=json.loads((root/'assets/productos/manifest.json').read_text(encoding='utf-8'))
js=(root/'js/data.js').read_text(encoding='utf-8');html=(root/'index.html').read_text(encoding='utf-8')
err=[];images=[]
for pid,product in manifest.items():
    if not re.search(r"\bid:'"+re.escape(pid)+r"'",js):err.append('ID ausente: '+pid)
    for filepath in product['gallery']:
        path=root/filepath
        if not path.is_file():err.append('FALTA '+filepath);continue
        if path.stat().st_size<500:err.append('Imagen sospechosamente vacia: '+filepath)
        if path.read_bytes()[:4]!=b'RIFF':err.append('No es WEBP: '+filepath)
        if filepath not in js:err.append('Sin referencia en data.js: '+filepath)
        images.append(filepath)
for filepath in ['assets/banners/hero-hogar.webp','assets/banners/hero-cocina.webp','assets/banners/hero-tecnologia.webp','assets/categorias/hogar.webp','assets/categorias/tecnologia.webp']:
    if not (root/filepath).exists():err.append('Falta '+filepath)
    if filepath not in html:err.append('No referenciada en index.html: '+filepath)
for f in (root/'assets/productos').glob('*/principal.webp'):
    if str(f.relative_to(root)).replace('\\','/') not in images:err.append('Imagen de producto sin registro: '+str(f))
print(f'Productos comprobados: {len(manifest)} | imagenes de galeria: {len(images)} | errores: {len(err)}')
for e in err:print('ERROR:',e)
sys.exit(1 if err else 0)
