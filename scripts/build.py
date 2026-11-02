#!/usr/bin/env python3
"""Offline source generator. Python 3.10+, standard library only."""
from pathlib import Path
import json, colorsys, re, csv, io

ROOT = Path(__file__).resolve().parents[1]
def write(p, s):
    target=ROOT/p; target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(s,encoding='utf-8')
def rgb(h): return [int(h[i:i+2],16)/255 for i in (1,3,5)]
def hx(v): return '#'+''.join(f'{max(0,min(255,round(x*255))):02X}' for x in v)
def mix(a,b,t): return hx([x+(y-x)*t for x,y in zip(rgb(a),rgb(b))])
def lum(h):
    v=[x/12.92 if x<=0.04045 else ((x+.055)/1.055)**2.4 for x in rgb(h)]
    return sum(x*w for x,w in zip(v,[.2126,.7152,.0722]))
def contrast(a,b):
    a,b=sorted([lum(a),lum(b)]); return (b+.05)/(a+.05)
def fit(c,bgs,target=4.6):
    if min(contrast(c,b) for b in bgs)>=target: return c.upper()
    edge=max(['#000000','#FFFFFF'],key=lambda e:min(contrast(e,b) for b in bgs))
    for i in range(1,101):
        v=mix(c,edge,i/100)
        if min(contrast(v,b) for b in bgs)>=target:return v
    raise ValueError((c,bgs,target))

# All values are kit-owned, curated sRGB colors; these are not Tailwind's scales.
BASES = {
 'graphite': ['#F8F7FA','#FFFFFF','#F4F2F6','#ECE8F0','#F0EDF3','#E5E1E8','#28242D','#625B69', '#101114','#1C1D22','#25252D','#2D2E37','#18191D','#303038','#F2EFF5','#B1ADBB'],
 'slate': ['#F8FAFC','#FFFFFF','#F1F5F9','#E2E8F0','#F1F5F9','#D9E1EC','#172033','#536176', '#0F141D','#19212E','#232D3D','#2C394C','#131B27','#344256','#EFF4FC','#B0BED1'],
 'navy': ['#F5F8FC','#FFFFFF','#EDF3FA','#E0EAF5','#EAF0F8','#D7E3EF','#14243C','#4F647D', '#0B1424','#13223A','#1B2D48','#243A59','#0E1B2F','#304764','#EDF5FF','#ACC0D9'],
 'zinc': ['#FAFAFA','#FFFFFF','#F4F4F5','#E7E7EB','#F2F2F4','#DEDEE3','#252529','#62626C', '#111113','#1C1C20','#27272C','#323238','#17171A','#3A3A43','#F4F4F5','#B6B6C0'],
 'gray': ['#F9FAFB','#FFFFFF','#F3F4F6','#E5E7EB','#EFF1F4','#DDE1E7','#202833','#5C6572', '#11151B','#1C232D','#262F3B','#303C4B','#171E27','#394657','#F0F3F8','#B0BBCB'],
 'stone': ['#FAF9F6','#FFFFFF','#F3F1EC','#E9E5DE','#F0EDE7','#DEDAD2','#2D2924','#686056', '#181614','#24211D','#302C27','#3A352E','#1E1B17','#494137','#F6F1E8','#C1B6A7'],
 'sand': ['#FAF7F0','#FFFEFA','#F3EDE2','#E9E0D2','#F1EADD','#DED3C2','#32291E','#716250', '#191610','#262117','#332B1E','#403526','#201B13','#4A3F2F','#F7F0E3','#C5B79E'],
 'cream': ['#FCF8F2','#FFFEFB','#F5EFE6','#ECE1D4','#F4EBE0','#E1D4C5','#352A24','#746053', '#1B1613','#29211B','#362B23','#44372B','#231B16','#514033','#F7EEE5','#CCB8A8'],
 'pearl': ['#FAF9FC','#FFFFFF','#F3F1F9','#E9E5F1','#F2EFF7','#E0DCE9','#2C2639','#675E77', '#17141E','#241F2D','#302939','#3D3448','#1D1925','#473D55','#F4EFFB','#C1B2D0'],
 'neutral': ['#FAFAFA','#FFFFFF','#F2F2F2','#E5E5E5','#F0F0F0','#DBDBDB','#242424','#626262', '#121212','#1E1E1E','#292929','#343434','#181818','#3D3D3D','#F5F5F5','#B7B7B7'],
 'paper': ['#FBFAF6','#FFFFFF','#F5F3EC','#EAE6DA','#F2F0E8','#DBD7CA','#252822','#64675D', '#151713','#22251E','#2D3227','#394032','#1B1E18','#444C3B','#F1F4EB','#B9C2AC'],
 'midnight': ['#F7F8FE','#FFFFFF','#F0F2FC','#E4E7F7','#EFF1FA','#DCDFF0','#252840','#5F6583', '#101321','#1B2034','#272D45','#343C58','#151A2B','#3E4867','#F0F2FF','#B6BFDD'],
}
# id, base, light accent, strong, dark accent, strong, display name, family, useful contexts
SPECS = [
 ('graphite-plum','graphite','#78469E','#623680','#D4A1EB','#EAC7F6','Graphite / Plum','purple','관리 콘솔 · 업무 도구'),
 ('slate-indigo','slate','#4F46B5','#39318F','#B5AFFF','#D3CFFF','Slate / Indigo','blue','업무 SaaS · 관리 콘솔'),
 ('slate-blue','slate','#2563BB','#194D96','#9DC4FF','#C5DEFF','Slate / Blue','blue','범용 제품 · 관리자'),
 ('navy-cyan','navy','#087D93','#075D70','#77DBF0','#B1EEFA','Navy / Cyan','blue','인프라 · 관측 · 네트워크'),
 ('zinc-violet','zinc','#7441BC','#592C96','#C8A9F7','#E1CBFF','Zinc / Violet','purple','개발 도구 · AI 서비스'),
 ('gray-sky','gray','#096F9D','#075879','#89D6FA','#B8E9FF','Gray / Sky','blue','정보 포털 · 고객 지원'),
 ('slate-teal','slate','#0B7772','#075C58','#7AD9CC','#A9EBDD','Slate / Teal','green','B2B SaaS · 데이터 도구'),
 ('stone-emerald','stone','#087A55','#075A40','#7ADBB2','#B0EED4','Stone / Emerald','green','금융 · 승인 워크플로'),
 ('forest-mint','paper','#256C4C','#1B5239','#8DDFB6','#B6EED2','Forest / Mint','green','지속가능성 · 웰니스'),
 ('warm-sage','stone','#536B49','#3B5033','#BDD3AA','#D9E9CB','Warm Stone / Sage','green','차분한 콘텐츠 · 생산성'),
 ('stone-olive','stone','#687229','#4C541B','#C9D783','#E2EAB1','Stone / Olive','green','지식 관리 · 아웃도어'),
 ('slate-lime','slate','#597613','#41580C','#B9DE70','#D8EEA7','Slate / Lime','green','모니터링 · 실험 도구'),
 ('sand-amber','sand','#976208','#744A05','#EAC16B','#F6DCA4','Sand / Amber','warm','운영 · 예약 · 큐레이션'),
 ('stone-orange','stone','#B34D0A','#8A3906','#FFB581','#FFD4B5','Stone / Orange','warm','커머스 · 프로젝트 관리'),
 ('cream-terracotta','cream','#A24D3B','#7D392B','#E8A38E','#F4C6B6','Cream / Terracotta','warm','라이프스타일 · 블로그'),
 ('sand-copper','sand','#945A35','#704224','#DFA97D','#F0CCAB','Sand / Copper','warm','브랜드 사이트 · 카탈로그'),
 ('zinc-rose','zinc','#B33862','#8D284B','#F5A2BE','#FFD0DF','Zinc / Rose','red','커뮤니티 · 콘텐츠 서비스'),
 ('charcoal-ruby','neutral','#B02F49','#872137','#F49DAF','#FFC8D3','Charcoal / Ruby','red','강조형 업무 도구 · 브랜드'),
 ('warm-burgundy','stone','#853B56','#65283F','#DEA4B9','#F0CDDB','Warm Stone / Burgundy','red','프리미엄 콘텐츠 · 편집'),
 ('pearl-lavender','pearl','#766092','#594570','#CCB7E5','#E5D6F4','Pearl / Lavender','purple','노트 · 개인 지식 관리'),
 ('graphite-indigo-reference','midnight','#5252BE','#383899','#AAA9FF','#D2D0FF','Graphite / Indigo Reference','blue','기존 color-tokens.css 참고안'),
 ('slate-steel','slate','#526C88','#3C526C','#ACBED6','#D0DEEF','Slate / Steel','neutral','엔터프라이즈 · 문서'),
 ('slate-slate','slate','#475569','#334155','#CBD5E1','#E2E8F0','Slate / Slate','neutral','절제된 관리자 · 인프라'),
 ('zinc-zinc','zinc','#52525B','#3F3F46','#D4D4D8','#E4E4E7','Zinc / Zinc','neutral','중립 제품 · 디자인 도구'),
 ('stone-sand','stone','#79674D','#5C4C37','#D6C5AA','#EADFCC','Stone / Sand','neutral','라이프스타일 · 기록'),
 ('neutral-monochrome','neutral','#292929','#141414','#E7E7E7','#FFFFFF','Neutral / Monochrome','neutral','사진 · 포트폴리오 · 범용'),
 ('navy-blue','navy','#285DB6','#1B448A','#9DBEFF','#C8DAFF','Navy / Blue','blue','신뢰 중심 금융 · 보안'),
 ('charcoal-gold','neutral','#8D690E','#684D09','#E4C578','#F3DEA7','Charcoal / Gold','warm','차분한 프리미엄 · 큐레이션'),
 ('warm-coral','cream','#AC4B46','#843631','#F2AAA0','#FAD0C8','Warm Cream / Coral','red','협업 · 커뮤니티 · 라이프'),
 ('slate-turquoise','slate','#087A80','#075B60','#7CD6D9','#ADECEE','Slate / Turquoise','green','협업 · 기술 포털'),
 ('paper-ink','paper','#3D5846','#2B4031','#B0CBB5','#D4E6D7','Paper / Ink Green','green','문서 · 위키 · 읽기 중심'),
 ('midnight-periwinkle','midnight','#5C5FA5','#43457F','#B6BCF9','#D7DCFF','Midnight / Periwinkle','purple','개발 플랫폼 · 코드 도구'),
]
STYLES=[
 {'id':'operational','name':'Operational','label':'운영 콘솔','description':'작은 라운드, 평평한 카드, 명확한 정보 계층. Gate 기본 추천.','radius':'8px','card':'10px','padding':'20px','height':'38px','gap':'16px','font':'14px','line':'1.55','border':'1px','shadow':'none'},
 {'id':'soft','name':'Soft Product','label':'부드러운 SaaS','description':'넉넉한 여백과 16px 카드. 채도는 포인트에만 사용.','radius':'10px','card':'16px','padding':'24px','height':'42px','gap':'20px','font':'14px','line':'1.65','border':'1px','shadow':'none'},
 {'id':'outline','name':'Outline','label':'선 중심','description':'작은 라운드, 강한 카드 경계, 그림자 없는 도구형 UI.','radius':'4px','card':'5px','padding':'20px','height':'38px','gap':'16px','font':'14px','line':'1.6','border':'1px','shadow':'none'},
 {'id':'editorial','name':'Editorial','label':'읽기 중심','description':'20px 섹션 제목과 긴 행간, 문서·위키·콘텐츠 중심.','radius':'4px','card':'6px','padding':'28px','height':'42px','gap':'24px','font':'15px','line':'1.8','border':'1px','shadow':'none'},
 {'id':'compact','name':'Compact','label':'정보 밀도','description':'32px 컨트롤과 조밀한 표. 데스크톱 운영 화면용.','radius':'5px','card':'7px','padding':'16px','height':'32px','gap':'12px','font':'13px','line':'1.5','border':'1px','shadow':'none'},
 {'id':'contrast','name':'Clear Boundaries','label':'경계 강조','description':'2px 경계, 넓은 포커스. 색 대비 AAA 인증을 뜻하지 않음.','radius':'4px','card':'6px','padding':'20px','height':'42px','gap':'16px','font':'14px','line':'1.65','border':'2px','shadow':'none'},
]

def theme(spec,mode):
    pid,base,a,strong,ad,sd,*_=spec
    v=BASES[base][0:8] if mode=='light' else BASES[base][8:16]
    canvas,raised,surface,soft,shell,line,ink,muted=v
    if pid=='graphite-indigo-reference':
        # Preserve historical primary/reference anchors; support tokens are audited anew.
        if mode=='light': canvas,raised,surface,soft,line,ink,muted='#F8F9FC','#FFFFFF','#F1F3F8','#E9ECF4','#E0E4EE','#222636','#606A7C'
        else: canvas,raised,surface,soft,line,ink,muted='#0D1018','#171B26','#1E2432','#272D40','#2C3445','#EDF0F8','#A5AEC0'
    bgs=[canvas,raised,surface,soft,shell]
    a,strong=(a,strong) if mode=='light' else (ad,sd)
    # accent anchors remain exact: other foreground roles may be fitted.
    on='#FFFFFF' if mode=='light' else '#101114'
    if pid=='graphite-indigo-reference' and mode=='dark':on='#0D1018'
    if contrast(on,a)<4.5: on=max(['#FFFFFF','#101114'],key=lambda c:contrast(c,a))
    subtle=mix(raised,a,.085 if mode=='light' else .13)
    ink=fit(ink,bgs); muted=fit(muted,bgs)
    accent_text=fit(strong,[subtle]+bgs)
    border=fit(muted,bgs,3.1)
    focus=fit(a,bgs+[subtle],3.1)
    t={}
    def setv(k,v): t['--color-'+k]=v.upper()
    for k,v in {'canvas':canvas,'raised':raised,'surface':surface,'surface-soft':soft,'shell':shell,'line':line,'line-strong':border,'ink':ink,'ink-muted':muted,'ink-subtle':muted,'accent':a,'accent-strong':strong,'accent-hover':strong,'accent-active':mix(strong, '#000000' if mode=='light' else '#FFFFFF',.10),'on-accent':on,'accent-subtle':subtle,'accent-text':accent_text,'accent-line':fit(a,[subtle],3.1),'link':fit(a,bgs),'link-hover':fit(strong,bgs),'focus':focus,'focus-gap':raised,'selection':subtle,'on-selection':accent_text,'overlay':'#000000','tooltip-bg':ink,'tooltip-fg':raised,'skeleton':soft,'skeleton-highlight':line,'disabled-bg':soft,'disabled-fg':muted,'disabled-border':line,'scrollbar':border,'scrollbar-track':surface}.items():setv(k,v)
    # Separate semantic solids and on-solid tokens; never assume white for all hues.
    colors={
      'success':('#247453','#8CD5AA'), 'warning':('#8B5409','#F5C96D'),
      'danger':('#A63850','#F2A0B0'), 'info':('#385EAD','#A8C3FF'),
      'rejected':('#984719','#FFB68A'),
    }
    for name,p in colors.items():
        c=p[0 if mode=='light' else 1]
        bg=mix(raised,c,.08 if mode=='light' else .13)
        fg=fit(c,[bg]+bgs)
        solid=fit(c,[on],4.6)
        for k,v in {name:fg,name+'-subtle':bg,name+'-line':fit(c,[bg],3.1),name+'-solid':solid,'on-'+name:on,name+'-hover':fit(mix(solid,'#000000' if mode=='light' else '#FFFFFF',.10),[on])}.items():setv(k,v)
    status={'passed':'success','review':'warning','rejected':'rejected','failed':'danger','running':'accent','queued':None,'cancelled':None,'skipped':None,'unknown':None}
    for name,src in status.items():
        bg=t['--color-'+src+'-subtle'] if src else soft
        fg=t['--color-'+src+('-text' if src=='accent' else '')] if src else muted
        fg=fit(fg,[bg])
        for suffix,val in [('',bg),('-text',fg),('-line',fit(fg,[bg],3.1))]:setv('status-'+name+suffix,val)
    for name,src in {'critical':'danger','high':'rejected','medium':'warning','low':'info','info':None,'unknown':None}.items():
        bg=t['--color-'+src+'-subtle'] if src else soft
        fg=t['--color-'+src] if src else muted
        setv('sev-'+name,bg);setv('sev-'+name+'-text',fg);setv('sev-'+name+'-line',fit(fg,[bg],3.1))
    for name,src in {'total':'ink-muted','active':'accent','passed':'success','review':'warning','rejected':'rejected','failed':'danger'}.items():setv('card-'+name,fit(t['--color-'+src],bgs))
    # Component tokens duplicate literals intentionally, for simple contrast parsers.
    derived={
      'button-secondary-bg':raised,'button-secondary-hover':surface,'button-secondary-active':soft,'button-secondary-fg':ink,'button-secondary-border':border,
      'button-ghost-bg':raised,'button-ghost-hover':surface,'button-ghost-active':soft,'button-ghost-fg':ink,
      'input-bg':raised,'input-fg':ink,'input-placeholder':muted,'input-border':border,'input-hover-border':focus,'input-readonly-bg':surface,'input-invalid-bg':t['--color-danger-subtle'],'input-invalid-border':t['--color-danger'],
      'nav-bg':shell,'nav-fg':muted,'nav-hover':surface,'nav-active-bg':subtle,'nav-active-fg':accent_text,'nav-active-line':focus,
      'tab-bg':raised,'tab-fg':muted,'tab-hover-bg':surface,'tab-active-fg':fit(a,[raised]),'tab-active-line':focus,
      'table-head-bg':surface,'table-row-bg':raised,'table-row-hover':surface,'table-row-selected':subtle,'table-fg':ink,'table-muted':muted,'table-line':line,
      'code-bg':surface,'code-fg':ink,'code-line':border,'code-inline-bg':soft,'code-accent':fit(a,[surface,soft]),'diff-add-bg':t['--color-success-subtle'],'diff-add-fg':t['--color-success'],'diff-remove-bg':t['--color-danger-subtle'],'diff-remove-fg':t['--color-danger'],
      'chart-grid':line,'chart-axis':muted,'chart-tooltip-bg':ink,'chart-tooltip-fg':raised,
      'empty-icon':muted,'progress-track':soft,'progress-fill':fit(a,[soft],3.1),
      'switch-track':border,'switch-thumb':raised,'switch-checked':a,'switch-checked-thumb':on,
    }
    for k,v in derived.items():setv(k,v)
    syntax={
      'key':('#78469E','#D4A1EB'),'string':('#247453','#8CD5AA'),'number':('#984719','#FFB68A'),
      'boolean':('#385EAD','#A8C3FF'),'null':('#A63850','#F2A0B0'),'comment':(muted,muted),'punctuation':(ink,ink),
      'function':('#855D0E','#EDD18E'),'keyword':('#78469E','#D4A1EB'),'tag':('#A63850','#F2A0B0'),'attribute':('#385EAD','#A8C3FF'),
    }
    for k,p in syntax.items():setv('syntax-'+k,fit(p[0 if mode=='light' else 1],[surface]))
    chart=['#5252BE','#277B86','#A36216','#B23862','#28704D','#775BA9','#54677B','#9B4F35'] if mode=='light' else ['#AAA9FF','#80D5DB','#F0B86E','#F3A1C0','#89D1AB','#C8A8ED','#B0C4DA','#E9B198']
    for i,c in enumerate(chart,1):setv('chart-'+str(i),fit(c,[raised,surface],3.1))
    return t

def cssblock(selector,t,mode):return selector+' {\n  color-scheme: '+mode+';\n'+''.join(f'  {k}: {v};\n' for k,v in t.items())+'}\n'

def main():
    palettes=[]
    for spec in SPECS:
        pid,base,a,strong,ad,sd,name,family,use=spec
        palettes.append({'id':pid,'name':name,'base':base,'family':family,'use':use,'origin':'historical-anchors' if pid in ['graphite-plum','graphite-indigo-reference'] else 'new-curated','modes':{m:theme(spec,m) for m in ['light','dark']}})
    keys=list(palettes[0]['modes']['light'])
    catalog=[]
    for key in keys:
        short=key.removeprefix('--color-')
        catalog.append({'token':key,'classSuffix':short,'classes':{p:'cp-'+p+'-'+short for p in ['bg','text','border','fill','stroke']},'category':short.split('-')[0]})
    data={'version':'1.2.0','created':'2026-10-27','defaultPalette':'slate-blue','defaultStyle':'operational','styles':STYLES,'palettes':palettes,'tokens':catalog,'chartPatterns':['solid','diagonal','dots','cross','horizontal','vertical','grid','dash'],'scope':'Static color-pair checks, not whole-application WCAG certification.'}
    write('data/palettes.json',json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    write('data/catalog.js','/* generated; file:// compatible, no fetch */\nwindow.PALETTE_KIT = '+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
    write('data/tokens.json',json.dumps(catalog,ensure_ascii=False,indent=2)+'\n')
    allcss='/* Generated. Semantic values are literal #RRGGBB. Use ONE theme source. */\n'+cssblock(':root',palettes[0]['modes']['light'],'light')
    allcss+=cssblock('html[data-theme="dark"]:not([data-palette])',palettes[0]['modes']['dark'],'dark')
    for p in palettes:
        individual='/* '+p['name']+' | one palette, both modes. */\n'
        for m,t in p['modes'].items():
            allcss+=cssblock(f'[data-palette="{p["id"]}"][data-theme="{m}"]',t,m)
            individual+=cssblock(':root' if m=='light' else ':root[data-theme="dark"]',t,m)
        write('css/palettes/'+p['id']+'.css',individual)
    write('css/palettes.css',allcss)
    utilities='/* Consume semantic values; do not import alongside Tailwind utilities.css. */\n'
    tw='/* Tailwind v4 custom utilities: import after tailwindcss. No color-token aliases. */\n'
    for k in keys:
        short=k.removeprefix('--color-')
        for name,prop in [('bg','background-color'),('text','color'),('border','border-color'),('fill','fill'),('stroke','stroke')]:
            utilities+=f'.cp-{name}-{short} {{ {prop}: var({k}); }}\n'
            tw+=f'@utility cp-{name}-{short} {{ {prop}: var({k}); }}\n'
    write('css/utilities.css',utilities);write('css/tailwind-v4.css',tw)
    ramps={}
    for s in SPECS:
        # One ramp per displayed accent; include neutral base names as well.
        n=s[0];c=s[2]
        ramps[n]={str(level):(mix('#FFFFFF',c,f) if level<600 else mix(c,'#000000',f)) for level,f in [(50,.05),(100,.12),(200,.25),(300,.43),(400,.68),(500,.86),(600,0),(700,.16),(800,.31),(900,.47),(950,.65)]}
    for n,v in BASES.items():
        c=v[7];ramps['neutral-'+n]={str(level):(mix('#FFFFFF',c,f) if level<600 else mix(c,'#000000',f)) for level,f in [(50,.05),(100,.12),(200,.25),(300,.43),(400,.68),(500,.86),(600,0),(700,.16),(800,.31),(900,.47),(950,.65)]}
    write('data/ramps.json',json.dumps(ramps,indent=2)+'\n')
    raw='/* Raw exploration ramps. NOT pre-approved foreground/background pairs. */\n:root {\n'
    raw+=''.join(f'  --raw-{n}-{l}: {c};\n' for n,r in ramps.items() for l,c in r.items())+'}\n'
    for n,r in ramps.items():
        for l in r:
            for name,prop in [('bg','background-color'),('text','color'),('border','border-color')]:raw+=f'.raw-{name}-{n}-{l} {{ {prop}: var(--raw-{n}-{l}); }}\n'
    write('css/primitives.css',raw)
    stylecss='/* Color-independent style presets. */\n'
    for s in STYLES:
        stylecss+=f'[data-style="{s["id"]}"] {{\n'+''.join(f'  --ui-{k}: {s[k]};\n' for k in ['radius','card','padding','height','gap','font','line','border','shadow'])+'}\n'
        write('css/styles/'+s['id']+'.css',stylecss[stylecss.rfind('[data-style='):])
    write('css/styles.css',stylecss)
    out=io.StringIO();writer=csv.writer(out);writer.writerow(['palette','mode','token','hex'])
    for p in palettes:
        for m,t in p['modes'].items():
            for k,v in t.items():writer.writerow([p['id'],m,k,v])
    write('data/tokens.csv',out.getvalue())
    # Structured token interchange: sRGB components, no aliases or vendor-specific IDs.
    dtcg={}
    for p in palettes:
        dtcg[p['id']]={m:{k.removeprefix('--color-'):{'$type':'color','$value':{'colorSpace':'srgb','components':rgb(v),'alpha':1}} for k,v in t.items()} for m,t in p['modes'].items()}
    # JSON is a portable flattened interchange format; no vendor compatibility claim.
    write('data/design-tokens.json',json.dumps(dtcg,ensure_ascii=False,indent=2)+'\n')
    pairs=[]
    def pair(f,b,threshold=4.5,kind='text'):
        pairs.append({'name':f+' / '+b,'fg':'--color-'+f,'bg':'--color-'+b,'min':threshold,'kind':kind})
    for bg in ['canvas','raised','surface','surface-soft','shell']:
        for fg in ['ink','ink-muted','ink-subtle','link','link-hover','accent-text']:pair(fg,bg)
        for fg in ['focus','line-strong']:pair(fg,bg,3,'ui')
    for bg in ['accent','accent-hover','accent-active','accent-strong']:pair('on-accent',bg)
    pair('accent-text','accent-subtle');pair('on-selection','selection');pair('focus','accent-subtle',3,'ui')
    for name in colors_names():
        pair(name,name+'-subtle');pair(name,'raised');pair('on-'+name,name+'-solid');pair('on-'+name,name+'-hover');pair(name+'-line',name+'-subtle',3,'ui')
    for name in ['passed','review','rejected','failed','running','queued','cancelled','skipped','unknown']:
        pair('status-'+name+'-text','status-'+name);pair('status-'+name+'-line','status-'+name,3,'ui')
    for name in ['critical','high','medium','low','info','unknown']:
        pair('sev-'+name+'-text','sev-'+name);pair('sev-'+name+'-line','sev-'+name,3,'ui')
    for fg,bg in [('tooltip-fg','tooltip-bg'),('input-fg','input-bg'),('input-placeholder','input-bg'),('input-fg','input-readonly-bg'),('input-fg','input-invalid-bg'),('nav-fg','nav-bg'),('nav-fg','nav-hover'),('nav-active-fg','nav-active-bg'),('tab-fg','tab-bg'),('tab-fg','tab-hover-bg'),('tab-active-fg','tab-bg'),('table-fg','table-head-bg'),('table-fg','table-row-hover'),('table-fg','table-row-selected'),('table-muted','table-row-hover'),('code-fg','code-bg'),('code-fg','code-inline-bg'),('code-accent','code-bg'),('code-accent','code-inline-bg'),('diff-add-fg','diff-add-bg'),('diff-remove-fg','diff-remove-bg'),('button-secondary-fg','button-secondary-bg'),('button-secondary-fg','button-secondary-hover'),('button-secondary-fg','button-secondary-active'),('button-ghost-fg','button-ghost-bg'),('button-ghost-fg','button-ghost-hover'),('button-ghost-fg','button-ghost-active'),('disabled-fg','disabled-bg')]:pair(fg,bg)
    for f,b in [('input-border','input-bg'),('input-border','surface'),('input-hover-border','input-bg'),('input-invalid-border','input-invalid-bg'),('code-line','code-bg'),('code-line','raised'),('button-secondary-border','button-secondary-bg'),('nav-active-line','nav-active-bg'),('tab-active-line','tab-bg'),('progress-fill','progress-track'),('switch-thumb','switch-track'),('switch-checked-thumb','switch-checked')]:pair(f,b,3,'ui')
    for n in ['key','string','number','boolean','null','comment','punctuation','function','keyword','tag','attribute']:pair('syntax-'+n,'code-bg')
    for n in ['total','active','passed','review','rejected','failed']:pair('card-'+n,'raised')
    for n in range(1,9):
        pair('chart-'+str(n),'raised',3,'chart');pair('chart-'+str(n),'surface',3,'chart')
    for bg in ['raised','surface']:pair('chart-axis',bg)
    write('data/contrast-pairs.json',json.dumps({'pairs':pairs,'note':'Decorative line, disabled controls and chart pairwise discrimination are not WCAG pass claims.'},ensure_ascii=False,indent=2)+'\n')
    index=['# 팔레트 선택표\n','아래 32종은 이 키트의 큐레이션이며 인기 순위가 아닙니다. 기본 바탕과 포인트를 함께 설계했습니다.\n','| ID | 조합 | 용도 | Light accent | Dark accent |\n|---|---|---|---|---|']
    for p,s in zip(palettes,SPECS):index.append(f'| `{p["id"]}` | {p["name"]} | {p["use"]} | `{s[2]}` | `{s[4]}` |')
    write('docs/PALETTES.md','\n'.join(index)+'\n')
    schema={'$schema':'https://json-schema.org/draft/2020-12/schema','title':'Palette Studio design profile','type':'object','required':['palette','style','target','scope'],'properties':{'$schema':{'type':'string'},'kitVersion':{'type':'string'},'palette':{'enum':[p['id'] for p in palettes]},'style':{'enum':[s['id'] for s in STYLES]},'target':{'enum':['existing-app','new-app','existing-gate']},'scope':{'enum':['dark-only','both','light-only']},'previewMode':{'enum':['light','dark']},'tokenPolicy':{'const':'literal-hex-no-color-aliases'},'constraints':{'type':'array','items':{'type':'string'}},'reviewScreens':{'type':'array','items':{'type':'string'}}},'additionalProperties':True}
    font_catalog=json.loads((ROOT/'data/fonts.source.json').read_text())
    schema['properties']['fonts']={'type':'object','required':['body','code','source'],'properties':{'body':{'enum':['system']+[f['id'] for f in font_catalog['fonts'] if f['role']=='body']},'code':{'enum':['system']+[f['id'] for f in font_catalog['fonts'] if f['role']=='code']},'source':{'enum':['cdn-first','local-only','system']}},'additionalProperties':True}
    schema['properties']['fontScope']={'const':'global'}
    write('data/profile.schema.json',json.dumps(schema,ensure_ascii=False,indent=2)+'\n')
    stylesdoc=['# 스타일 선택 가이드\n','색상을 바꾸지 않고 형태·여백·밀도를 비교할 수 있습니다. 모든 스타일은 그림자 없이 시작합니다. Clear Boundaries는 경계 강조이며 WCAG AAA를 뜻하지 않습니다.\n','| ID | 스타일 | 컨트롤 | 기본 글자 | 카드 라운드 | 패딩 | 간격 | 용도 |\n|---|---|---|---|---|---|---|---|']
    for s in STYLES:stylesdoc.append(f'| `{s["id"]}` | {s["name"]} | {s["height"]} | {s["font"]} | {s["card"]} | {s["padding"]} | {s["gap"]} | {s["description"]} |')
    stylesdoc.append('\n색상 비교에서는 스타일을 고정하고, 스타일 비교에서는 색상을 고정하세요. `foundation.css` 다음에 선택한 스타일 CSS를 불러오고, 같은 `.cp-scope` 요소에 `data-style`을 지정합니다. 터치 환경 예제는 컨트롤 높이를 최소 44px로 확장합니다.\n')
    write('docs/STYLES.md','\n'.join(stylesdoc))
    tokenref=['# 의미 토큰과 클래스\n','각 팔레트는 아래 모든 토큰을 두 모드에 제공합니다. `cp-bg-*`는 background-color, `cp-text-*`는 color, `cp-border-*`는 border-color, `cp-fill-*`/`cp-stroke-*`는 SVG 속성입니다. 경계선 너비·스타일은 별도로 지정하세요.\n','모든 토큰에 5종 클래스가 있지만 아무 전경·배경이나 조합해도 된다는 뜻은 아닙니다. 허용된 사용 쌍과 대비 기준은 `data/contrast-pairs.json`, 실제 값은 `data/tokens.csv`를 확인하세요. 아래는 클래스 재고 목록입니다.\n','| 토큰 | Text | Background | Border |\n|---|---|---|---|']
    for item in catalog:tokenref.append(f'| `{item["token"]}` | `{item["classes"]["text"]}` | `{item["classes"]["bg"]}` | `{item["classes"]["border"]}` |')
    tokenref.append('\n원시 램프는 `raw-bg-{paletteId}-{50..950}` / `raw-text-*` / `raw-border-*`입니다. 예: `raw-bg-graphite-plum-100`. 중립 바탕은 `raw-bg-neutral-slate-100`입니다. 제품 컴포넌트에서는 의미 토큰을 우선하세요.\n')
    write('docs/TOKEN-REFERENCE.md','\n'.join(tokenref))
    legacy=(ROOT/'reference/color-tokens.css.original.txt').read_text()
    legacykeys=list(dict.fromkeys(re.findall(r'(--color-[\w-]+)\s*:',legacy)))
    missing=set(legacykeys)-set(keys)
    if missing:raise ValueError('Legacy token contract missing: '+str(missing))
    olddoc=['# 이전 토큰 이름 호환표\n','원본 `color-tokens.css`에서 확인한 전체 토큰 이름입니다. 새 팔레트는 이름을 모두 포함합니다. 값의 완전 동일을 뜻하지 않습니다. 실제 앱의 CSS 클래스 이름은 확인하지 않았습니다. 대응 유틸리티는 선택적으로 사용할 수 있는 새 클래스입니다.\n','| 이전 토큰 | 새 토큰 | 유틸리티 예 |\n|---|---|---|']
    for key in legacykeys:olddoc.append(f'| `{key}` | 동일 | `cp-text-{key.removeprefix("--color-")}` |')
    write('docs/LEGACY-MAP.md','\n'.join(olddoc)+'\n')
    write('examples/design-profile.example.json',json.dumps({'$schema':'../data/profile.schema.json','kitVersion':'1.2.0','palette':'slate-blue','style':'operational','target':'new-app','scope':'both','previewMode':'light','fonts':{'body':'pretendard','code':'d2coding','source':'cdn-first'},'fontScope':'global','tokenPolicy':'literal-hex-no-color-aliases','constraints':['Apply only the selected theme scope.','Reuse existing components.','Merge into canonical theme definitions.']},ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'palettes':len(palettes),'modes':len(palettes)*2,'semanticTokens':len(keys),'utilityClasses':len(keys)*5,'styles':len(STYLES),'contrastPairsPerTheme':len(pairs),'rawRamps':len(ramps)}))

def colors_names():return ['success','warning','danger','info','rejected']
if __name__=='__main__':main()
