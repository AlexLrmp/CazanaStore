#!/usr/bin/env python3
"""Valida las fotos de Cazana en JPEG, WebP, PNG y AVIF (sin dependencias externas)."""
from pathlib import Path
import json, sys
ROOT = Path(__file__).resolve().parents[1]
EXTENSIONS = ('.webp','.jpg','.jpeg','.png','.avif')
manifest = json.loads((ROOT/'assets/productos/manifest.json').read_text(encoding='utf8'))
def resolve(relative):
    p=ROOT/relative
    if p.is_file(): return p
    return next((p.with_suffix(ext) for ext in EXTENSIONS if p.with_suffix(ext).is_file()),None)
def matches_header(p):
    b=p.read_bytes()[:32]; ext=p.suffix.lower()
    if ext=='.webp': return b.startswith(b'RIFF') and b[8:12]==b'WEBP'
    if ext in ('.jpg','.jpeg'): return b.startswith(b'\xff\xd8\xff')
    if ext=='.png': return b.startswith(b'\x89PNG\r\n\x1a\n')
    if ext=='.avif': return b[4:8]==b'ftyp' and (b'avif' in b[8:28] or b'avis' in b[8:28])
    return False
refs=[p for item in manifest.values() for p in item.get('gallery',[])]
refs += [f'assets/banners/{name}.webp' for name in ('hero-hogar','hero-cocina','hero-tecnologia')]
refs += [f'assets/categorias/{name}.webp' for name in ('hogar','tecnologia')]
errors=[]; aliases=0
for ref in refs:
    p=resolve(ref)
    if not p: errors.append(f'Imagen ausente: {ref}');continue
    if p.relative_to(ROOT).as_posix()!=ref: aliases+=1
    if p.stat().st_size<500 or not matches_header(p):errors.append(f'Imagen no válida: {p.relative_to(ROOT)}')
print(f'Productos: {len(manifest)} | Fotos previstas: {len(refs)} | Extensiones alternativas: {aliases} | Errores: {len(errors)}')
for problem in errors: print('ERROR:',problem)
sys.exit(bool(errors))
