#!/usr/bin/env python3
"""Download pinned OFL font files and licenses; validate WOFF2 magic and record hashes."""
from pathlib import Path
import json,urllib.request,hashlib,argparse
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--refresh',action='store_true');args=parser.parse_args()
catalog=json.loads((ROOT/'data/fonts.source.json').read_text())
def download(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'PaletteStudio/1.1.0'}),timeout=45) as response:
        if response.status!=200:raise ValueError(f'{response.status}: {url}')
        return response.read()
for font in catalog['fonts']:
    folder=ROOT/'assets/fonts'/font['id'];folder.mkdir(parents=True,exist_ok=True)
    license_path=folder/'OFL.txt'
    if not license_path.exists() or args.refresh:
        errors=[]
        for url in font['licenseUrls']:
            try:
                payload=download(url)
                if b'OPEN FONT LICENSE' not in payload.upper():raise ValueError('Not an OFL license')
                license_path.write_bytes(payload);font['licenseSource']=url;break
            except Exception as error:errors.append(str(error))
        else:raise RuntimeError('License fetch failed '+font['id']+': '+str(errors))
    else:font['licenseSource']=font['licenseUrls'][0]
    font['licenseText']=license_path.read_text(encoding='utf-8')
    for face in font['faces']:
        target=ROOT/face['local']
        if args.refresh or not target.exists():
            payload=download(face['cdn'])
            if payload[:4]!=b'wOF2':raise ValueError('Not WOFF2: '+face['cdn'])
            target.write_bytes(payload)
        payload=target.read_bytes()
        if payload[:4]!=b'wOF2':raise ValueError('Invalid local WOFF2: '+str(target))
        face['bytes']=len(payload);face['sha256']=hashlib.sha256(payload).hexdigest()
    print(font['id'],sum(face['bytes'] for face in font['faces']),'bytes')
(ROOT/'data/fonts.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
(ROOT/'data/font-catalog.js').write_text('window.PALETTE_FONT_CATALOG = '+json.dumps(catalog,ensure_ascii=False,separators=(',',':'))+';\n')
for mode in ['cdn','local']:
    css='/* Pinned font sources. All bundled fonts are OFL-1.1; see assets/fonts/*/OFL.txt. */\n'
    for font in [f for f in catalog['fonts'] if f['id'] in [catalog['defaults']['body'],catalog['defaults']['code']]]:
        for face in font['faces']:
            urls=([face['cdn']] if mode=='cdn' else [])+['../'+face['local']]
            css+='@font-face { font-family: '+json.dumps(font['family'])+'; font-style: normal; font-weight: '+face['weight']+'; font-display: swap; '+('unicode-range: '+face['unicodeRange']+'; ' if face.get('unicodeRange') else '')+'src: '+', '.join('url('+json.dumps(url)+') format("woff2")' for url in urls)+'; }\n'
    css+=':root { --kit-font-sans: "Pretendard Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif; --kit-font-mono: D2Coding, "SFMono-Regular", Consolas, "Liberation Mono", monospace; }\n'
    (ROOT/'css'/('fonts-'+mode+'.css')).write_text(css)
print('Pinned font assets and licenses ready.')
