#!/usr/bin/env python3
"""Actualiza referencias de imágenes de Cazana Store. No requiere paquetes externos.
Ejecuta desde la carpeta raiz del proyecto: py -3 tools/instalar_imagenes.py
Se puede re-ejecutar: es idempotente. Git conserva la version anterior.
"""
from __future__ import annotations
from pathlib import Path
import argparse, re, json, sys, shutil

ROOT=Path(__file__).resolve().parent.parent
MANIFEST=ROOT/'assets/productos/manifest.json'

def replace_once(segment: str, old: str, new: str, label: str) -> str:
    if new in segment: return segment
    if old not in segment: raise ValueError(f'{label}: no se encuentra la ruta original {old}')
    return segment.replace(old,new,1)

def patch_index(html):
    if '<div class="hero-slider"' not in html: raise ValueError('Falta hero-slider en index.html')
    start=html.index('<div class="hero-slider"')
    end=html.find('<div class="hero-backdrop"',start)
    if end<0: raise ValueError('No se encontro hero-backdrop')
    slider=html[start:end]
    for old,new in [
      ('assets/hero-referencia.jpg','assets/banners/hero-hogar.webp'),
      ('assets/cat-hogar.jpg','assets/banners/hero-cocina.webp'),
      ('assets/cat-tecnologia.jpg','assets/banners/hero-tecnologia.webp')]:
        slider=replace_once(slider,old,new,'carrusel')
    html=html[:start]+slider+html[end:]
    start=html.find('<div class="category-grid"')
    if start<0:raise ValueError('Falta category-grid en index.html')
    end=html.find('</section>',start)
    if end<0: raise ValueError('Falta cierre de la seccion de categorias')
    cats=html[start:end]
    cats=replace_once(cats,'assets/cat-hogar.jpg','assets/categorias/hogar.webp','categoria hogar')
    cats=replace_once(cats,'assets/cat-tecnologia.jpg','assets/categorias/tecnologia.webp','categoria tecnologia')
    cats=cats.replace('alt="Fotografía de cocina y hogar"','alt="Ambiente de sala contemporánea"')
    cats=cats.replace('alt="Laptop y tecnología"','alt="Tecnología para el hogar y la oficina"')
    return html[:start]+cats+html[end:]

def patch_data(js,manifest):
    # Un bloque pertenece a un id hasta el siguiente registro. Las 12 fichas existentes se conservan sin reescribir precio ni descripcion.
    for pid,m in manifest.items():
        token=f"id:'{pid}',"
        start=js.find(token)
        if start<0:raise ValueError(f'Producto {pid} no encontrado en js/data.js')
        end=js.find("\n  },",start)
        if end<0: end=js.find("\n  }\n]);",start)
        if end<0:raise ValueError(f'Fin del producto {pid} no encontrado')
        block=js[start:end]
        before=block
        block,n=re.subn(r"image:'[^']+',\s*fallback:'[^']+'",f"image:'{m['image']}',fallback:'{m['image']}'",block,count=1)
        if n!=1:raise ValueError(f'Campos image/fallback ausentes para {pid}')
        gallery="gallery:["+','.join("'"+x+"'" for x in m['gallery'])+"]"
        block,n=re.subn(r"gallery:\[[^\]]*\]",lambda _:gallery,block,count=1)
        if n!=1:raise ValueError(f'Galeria ausente para {pid}')
        js=js[:start]+block+js[end:]
    return js

def patch_about(html):
    if 'assets/categorias/hogar.webp' in html:return html
    return replace_once(html,'assets/cat-hogar.jpg','assets/categorias/hogar.webp','nosotros')

def patch_css(css):
    return css.replace("../assets/hero-referencia.jpg","../assets/banners/hero-hogar.webp").replace("../assets/cat-hogar.jpg","../assets/categorias/hogar.webp")

def patch_js_main(src):
    # Accessibility improvement is intentionally narrowly scoped.
    return src.replace('alt="Miniatura ${i + 1}"','alt="${esc(product.name)} - vista ${i + 1}"')

def main():
    p=argparse.ArgumentParser(description='Instala la biblioteca de imágenes Cazana Store')
    p.add_argument('--limpiar-antiguas',action='store_true',help='Elimina fotografias JPEG antiguas que ya no son referenciadas')
    args=p.parse_args()
    if not MANIFEST.is_file():raise SystemExit('Falta assets/productos/manifest.json. Extrae todo el ZIP primero.')
    manifest=json.loads(MANIFEST.read_text(encoding='utf-8'))
    paths=['index.html','js/data.js','css/style.css','nosotros.html','js/main.js']
    original={p:(ROOT/p).read_text(encoding='utf-8') for p in paths}
    updated={
       'index.html':patch_index(original['index.html']),
       'js/data.js':patch_data(original['js/data.js'],manifest),
       'css/style.css':patch_css(original['css/style.css']),
       'nosotros.html':patch_about(original['nosotros.html']),
       'js/main.js':patch_js_main(original['js/main.js']),
    }
    for pid,entry in manifest.items():
        for x in entry['gallery']:
            if not (ROOT/x).is_file():raise ValueError(f'Imagen ausente: {x}')
    for p in paths:
        if updated[p]!=original[p]:
            (ROOT/p).write_text(updated[p],encoding='utf-8',newline='')
            print('ACTUALIZADO',p)
        else:print('SIN CAMBIOS',p)
    if args.limpiar_antiguas:
        # Only delete old root-level images that are absent from all active HTML/JS/CSS file references.
        source='\n'.join(f.read_text(encoding='utf-8') for glob in ('*.html','css/*.css','js/**/*.js','js/*.js') for f in ROOT.glob(glob))
        removed=[]
        for file in (ROOT/'assets').iterdir():
            if file.is_file() and file.suffix.lower() in ('.jpg','.jpeg','.png','.webp') and f'assets/{file.name}' not in source and f'../assets/{file.name}' not in source:
                file.unlink();removed.append(file.name)
        print('IMAGENES ANTIGUAS ELIMINADAS:',len(removed),', '.join(removed))
    print('\n[OK] Galerias y banners listos. Comprueba index.html y producto.html con Live Server.')

if __name__=='__main__':
    try:main()
    except Exception as e:
        print(f'ERROR: {e}',file=sys.stderr);sys.exit(1)
