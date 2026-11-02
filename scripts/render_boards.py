#!/usr/bin/env python3
"""Optional exact-color contact sheets; needs Pillow. English labels for font portability."""
from pathlib import Path
import json, argparse
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--font',help='Optional TrueType font path');args=parser.parse_args()
data=json.loads((ROOT/'data/palettes.json').read_text())
fontpaths=[args.font,'/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/System/Library/Fonts/Supplemental/Arial.ttf','C:/Windows/Fonts/arial.ttf']
fontpath=next((p for p in fontpaths if p and Path(p).exists()),None)
def font(n):return ImageFont.truetype(fontpath,n) if fontpath else ImageFont.load_default(size=n)
for mode in ['light','dark']:
    w,h=2160,2680;im=Image.new('RGB',(w,h),'#F6F6F8' if mode=='light' else '#111113');d=ImageDraw.Draw(im)
    ink='#25252D' if mode=='light' else '#F4F4F5';muted='#626270' if mode=='light' else '#B6B6C0'
    d.text((56,35),'PALETTE STUDIO',font=font(38),fill=ink);d.text((56,94),'32 CURATED COMBINATIONS / '+mode.upper()+' / 01',font=font(18),fill=muted)
    for i,p in enumerate(data['palettes']):
        x=56+(i%4)*520;y=150+(i//4)*306;t=p['modes'][mode];c=lambda n:t['--color-'+n]
        d.rounded_rectangle((x,y,x+492,y+284),radius=12,fill=c('raised'),outline=c('line'),width=2)
        d.rounded_rectangle((x+12,y+12,x+480,y+182),radius=6,fill=c('canvas'))
        d.rectangle((x+12,y+12,x+115,y+182),fill=c('shell'))
        d.rounded_rectangle((x+25,y+40,x+101,y+59),radius=3,fill=c('accent-subtle'))
        d.rectangle((x+25,y+40,x+28,y+59),fill=c('accent'))
        for j in range(3):d.rounded_rectangle((x+30,y+75+j*20,x+86,y+80+j*20),radius=2,fill=c('line-strong'))
        d.text((x+133,y+23),'Workspace',font=font(14),fill=c('ink'))
        d.rounded_rectangle((x+386,y+21,x+463,y+43),radius=4,fill=c('accent'))
        d.text((x+403,y+24),'Create',font=font(10),fill=c('on-accent'))
        for j,v in enumerate(['1,284','96.8%','12']):
            xx=x+133+j*111;d.rounded_rectangle((xx,y+55,xx+100,y+100),radius=4,fill=c('raised'),outline=c('line'))
            d.text((xx+9,y+66),v,font=font(18),fill=c('ink' if j==0 else 'success' if j==1 else 'warning'))
        d.rounded_rectangle((x+133,y+112,x+464,y+168),radius=4,fill=c('raised'),outline=c('line'))
        for j in range(2):
            d.text((x+143,y+119+j*21),'mcp / '+['analytics','workspace'][j],font=font(11),fill=c('ink'))
            name=['passed','review'][j];d.rounded_rectangle((x+385,y+119+j*21,x+453,y+134+j*21),radius=3,fill=c('status-'+name));d.text((x+393,y+120+j*21),['PASS','REVIEW'][j],font=font(9),fill=c('status-'+name+'-text'))
        d.text((x+16,y+194),p['name'],font=font(18),fill=c('ink'))
        for j,n in enumerate(['canvas','shell','surface','ink','accent','accent-subtle']):d.rounded_rectangle((x+16+j*78,y+229,x+86+j*78,y+244),radius=3,fill=c(n),outline=c('line-strong'))
        d.text((x+16,y+255),c('accent')+'  /  '+p['base'].upper(),font=font(11),fill=c('ink-muted'))
    d.text((56,h-52),'Exact sRGB colors. Static reference illustration, not a browser screenshot. Open START-HERE.html to interact.',font=font(15),fill=muted)
    im.save(ROOT/'previews'/('color-board-'+mode+'.png'),optimize=True)
    print('Saved color-board-'+mode+'.png')
