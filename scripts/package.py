#!/usr/bin/env python3
"""Create a portable ZIP and a SHA256 inventory, with no runtime dependencies."""
from pathlib import Path
import zipfile,json,hashlib
root=Path(__file__).resolve().parents[1]
files=sorted(p for p in root.rglob('*') if p.is_file() and not any(part in ['__pycache__','node_modules','.git','.venv','.DS_Store'] for part in p.relative_to(root).parts) and p.name!='MANIFEST.json')
manifest={'version':'1.1.0','files':[{'path':str(p.relative_to(root)),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]}
(root/'MANIFEST.json').write_text(json.dumps(manifest,indent=2)+'\n')
archive=root.parent/'ui-color-palette-studio-v1.1.0.zip'
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for p in files+[root/'MANIFEST.json']:z.write(p,str(Path(root.name)/p.relative_to(root)))
with zipfile.ZipFile(archive) as z:
    bad=z.testzip()
    if bad:raise ValueError('ZIP integrity failed: '+bad)
print(json.dumps({'archive':str(archive),'files':len(files)+1,'bytes':archive.stat().st_size}))
