#!/usr/bin/env python3
from pathlib import Path
import json,hashlib
root=Path(__file__).resolve().parents[1]
catalog=json.loads((root/'data/fonts.json').read_text())
files=0;total=0
for font in catalog['fonts']:
    license_file=root/'assets/fonts'/font['id']/'OFL.txt'
    assert 'OPEN FONT LICENSE' in license_file.read_text().upper(),font['id']
    assert font['licenseText']==license_file.read_text(),font['id']+' license drift'
    for face in font['faces']:
        payload=(root/face['local']).read_bytes()
        assert payload[:4]==b'wOF2',face['local']
        assert hashlib.sha256(payload).hexdigest()==face['sha256'],face['local']
        assert len(payload)==face['bytes'],face['local']
        assert '@' in face['cdn'] and not any(part in face['cdn'] for part in ['@main/','@master/','@latest/']),face['cdn']
        files+=1;total+=len(payload)
result={'families':len(catalog['fonts']),'woff2Files':files,'bytes':total,'licenses':'OFL-1.1 copies verified','pinnedURLs':True,'hashes':'pass'}
(root/'data/font-audit-results.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
