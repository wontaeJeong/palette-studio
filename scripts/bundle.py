#!/usr/bin/env python3
"""Build the one-file offline HTML from modular preview sources."""
from pathlib import Path
import re,json,base64
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text()
html=re.sub(r'<link\s+rel="stylesheet"\s+href="([^"]+)"\s*/?>',lambda m:'<style>\n'+(root/m[1]).read_text()+'\n</style>',html)
fonts=json.loads((root/'data/fonts.json').read_text())
embedded={f['local']:base64.b64encode((root/f['local']).read_bytes()).decode() for font in fonts['fonts'] for f in font['faces']}
def inline_script(match):
    prefix=''
    if match[1]=='font-loader.js':prefix='window.PALETTE_EMBEDDED_FONTS = '+json.dumps(embedded,separators=(',',':'))+';\n'
    return '<script>\n'+prefix+(root/match[1]).read_text().replace('</script','<\\/script')+'\n</script>'
html=re.sub(r'<script src="([^"]+)"></script>',inline_script,html)
(root/'START-HERE.html').write_text(html)
print('Built START-HERE.html:',len(html.encode()),'bytes')
