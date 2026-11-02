#!/usr/bin/env python3
"""Import unchanged, pinned WOFF2 subsets and original OFL notices from package archives."""
from pathlib import Path,PurePosixPath
import json,urllib.request,tarfile,io,re,posixpath,concurrent.futures,tempfile
ROOT=Path(__file__).resolve().parents[1]
specs=json.loads((ROOT/'data/font-packages.source.json').read_text())
cache=ROOT.parent/'font-packages';cache.mkdir(exist_ok=True)
def import_one(spec):
    archive=cache/(spec['package'].replace('/','__').replace('@','')+'.tgz')
    if not archive.exists():
        with urllib.request.urlopen(spec['tarball'],timeout=60) as response:archive.write_bytes(response.read())
    with tarfile.open(archive,mode='r:gz') as package:
        def read(name):return package.extractfile('package/'+name).read()
        license_data=read(spec['licenseFile'])
        assert b'OPEN FONT LICENSE' in license_data.upper(),spec['id']+' requires verified OFL text'
        folder=ROOT/'assets/fonts'/spec['id'];folder.mkdir(parents=True,exist_ok=True);(folder/'OFL.txt').write_bytes(license_data)
        faces=[];family=None
        for cssfile in spec['cssFiles']:
            for block in re.findall(r'@font-face\s*\{([^}]+)\}',read(cssfile).decode(),re.S):
                def value(k):
                    m=re.search(r'(?:^|;)\s*'+re.escape(k)+r'\s*:\s*([^;]+)',block,re.S);return m[1].strip() if m else ''
                if value('font-style') not in ['', 'normal']:continue
                weight=value('font-weight')
                if spec['package']=='spoqa-han-sans' and weight not in ['400','700']:continue
                match=re.search(r'url\([\'"]?([^\)\'\"]+\.woff2)[\'"]?\)',block)
                if not match:continue
                relative=posixpath.normpath(posixpath.join(posixpath.dirname(cssfile),match[1]))
                assert not relative.startswith('../'),relative
                payload=read(relative);assert payload[:4]==b'wOF2',relative
                local='assets/fonts/'+spec['id']+'/'+PurePosixPath(relative).name
                (ROOT/local).write_bytes(payload)
                face={'weight':weight,'cdn':'https://cdn.jsdelivr.net/npm/'+spec['package']+'@'+spec['packageVersion']+'/'+relative,'local':local}
                if value('unicode-range'):face['unicodeRange']=value('unicode-range')
                family=value('font-family').strip('\'"')
                faces.append(face)
    assert faces,spec['id']+' no font faces'
    result={k:spec[k] for k in ['id','name','role','group','korean','purpose','upstream']}
    result.update(family=family,version=spec['packageVersion'],versionKind='package',package=spec['package'],license='OFL-1.1',licenseUrls=['https://cdn.jsdelivr.net/npm/'+spec['package']+'@'+spec['packageVersion']+'/'+spec['licenseFile']],faces=faces)
    return result
results=list(concurrent.futures.ThreadPoolExecutor(max_workers=5).map(import_one,specs))
catalog=json.loads((ROOT/'data/fonts.source.json').read_text());old={f['id']:f for f in catalog['fonts']}
for f in results:old[f['id']]=f
catalog['fonts']=list(old.values())
for font in catalog['fonts']:
    font['licenseUse']={'internalBusiness':True,'commercial':True,'webEmbedding':True,'redistribution':'retain-copyright-and-OFL','fontModification':'respect-reserved-font-names'}
catalog['combos']=[
 {'id':'gate-default','name':'Gate 기본 · Pretendard + D2Coding','body':'pretendard','code':'d2coding'},
 {'id':'neutral-product','name':'중립 제품 · SUIT + D2Coding','body':'suit','code':'d2coding'},
 {'id':'geometric-product','name':'기하학적 UI · Wanted + Geist Mono','body':'wanted-sans','code':'geist-mono'},
 {'id':'enterprise','name':'기업용 도구 · IBM Plex Sans KR + IBM Plex Mono','body':'ibm-plex-sans-kr','code':'ibm-plex-mono'},
 {'id':'docs','name':'문서 포털 · Noto Sans KR + Source Code Pro','body':'noto-sans-kr','code':'source-code-pro'},
 {'id':'editorial','name':'한국어 읽기 · Noto Serif KR + D2Coding','body':'noto-serif-kr','code':'d2coding'},
 {'id':'english-saas','name':'영문 SaaS · Inter + JetBrains Mono','body':'inter','code':'jetbrains-mono'},
 {'id':'minimal-dev','name':'영문 개발 도구 · Geist + Geist Mono','body':'geist','code':'geist-mono'}
]
(ROOT/'data/fonts.source.json').write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
for f in results:print(f['id'],len(f['faces']),'faces')
print('Total families:',len(catalog['fonts']))
