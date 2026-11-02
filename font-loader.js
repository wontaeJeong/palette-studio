/* Shared CDN -> bundled WOFF2 -> system loader. No third-party scripts. */
(() => {
  'use strict';
  const catalog=window.PALETTE_FONT_CATALOG;
  const sans='-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans KR", sans-serif';
  const mono='"SFMono-Regular", Consolas, "Liberation Mono", monospace';
  const choices=role=>[{id:'system',role,name:role==='body'?'시스템 기본':'시스템 고정폭',family:''},...catalog.fonts.filter(f=>f.role===role)];
  const resolve=(id,role)=>choices(role).find(f=>f.id===id)||choices(role)[0];
  const cache=new Map();let generation=0,active=[];
  let status={body:{source:'pending'},code:{source:'pending'}};
  const emit=()=>window.dispatchEvent(new CustomEvent('palette-font-status',{detail:JSON.parse(JSON.stringify(status))}));
  function stack(font,role,source){return source==='system'||font.id==='system'?(role==='body'?sans:mono):JSON.stringify(font.family)+', '+(font.korean===false?JSON.stringify(role==='body'?'Pretendard Variable':'D2Coding')+', ':'')+(role==='body'?sans:mono);}
  function required(config){const selected=[resolve(config.bodyFont,'body'),resolve(config.codeFont,'code')].filter(f=>f.id!=='system');if(config.fontSource!=='system')for(const font of [...selected])if(font.korean===false){const fallback=resolve(font.role==='body'?'pretendard':'d2coding',font.role);if(!selected.some(f=>f.id===fallback.id))selected.push(fallback);}return selected;}
  function snapshot(config){return {body:config.bodyFont,code:config.codeFont,source:config.fontSource,display:'swap',timeoutMs:catalog.timeoutMs,fallback:['bundled-woff2','system'],koreanFallback:{body:'pretendard',code:'d2coding'},assetsBase:'./palette-studio/',fonts:required(config).map(f=>({id:f.id,family:f.family,version:f.version,versionKind:f.versionKind,license:f.license,licenseUse:f.licenseUse,upstream:f.upstream,faces:f.faces.map(face=>({weight:face.weight,cdn:face.cdn,local:face.local,unicodeRange:face.unicodeRange,sha256:face.sha256}))}))};}
  function css(config,base='./palette-studio/'){
    let out='/* Font settings are independent of light/dark color scope. */\n';
    const fonts=[resolve(config.bodyFont,'body'),resolve(config.codeFont,'code')];
    if(config.fontSource!=='system')for(const font of required(config))for(const face of font.faces){
      const urls=(config.fontSource==='cdn-first'?[face.cdn]:[]).concat(base+face.local);
      out+='@font-face {\n  font-family: '+JSON.stringify(font.family)+';\n  font-style: normal;\n  font-weight: '+face.weight+';\n  font-display: swap;\n'+(face.unicodeRange?'  unicode-range: '+face.unicodeRange+';\n':'')+'  src: '+urls.map(u=>'url('+JSON.stringify(u)+') format("woff2")').join(',\n       ')+';\n}\n';
    }
    out+=':root {\n  --kit-font-sans: '+stack(fonts[0],'body',config.fontSource)+';\n  --kit-font-mono: '+stack(fonts[1],'code',config.fontSource)+';\n}\n';
    out+='/* Existing components can consume the same font stacks. */\n.cp-scope { --ui-font-sans: var(--kit-font-sans); --ui-font-mono: var(--kit-font-mono); }\n';return out;
  }
  function withTimeout(promise){let timer;return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('font timeout')),catalog.timeoutMs);})]).finally(()=>clearTimeout(timer));}
  function embeddedBuffer(key){const value=window.PALETTE_EMBEDDED_FONTS?.[key];if(!value)return null;const binary=atob(value),bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes.buffer;}
  async function face(font,item,source,family=font.family){
    const key=family+'|'+item.local+'|'+item.weight+'|'+source;
    if(cache.has(key))return cache.get(key);
    let input=source==='local'?embeddedBuffer(item.local):null;
    if(!input){const url=source==='cdn'?item.cdn:new URL(item.local,document.baseURI).href;input='url('+JSON.stringify(url)+')';}
    const loaded=await withTimeout(new FontFace(family,input,{weight:item.weight,style:'normal',display:'swap',...(item.unicodeRange?{unicodeRange:item.unicodeRange}:{})}).load());cache.set(key,loaded);return loaded;
  }
  async function loadFont(font,config,token){
    const role=font.role;
    if(config.fontSource==='system'||font.id==='system')return {id:font.id,name:font.name,source:'system',faces:[]};
    if(!window.FontFace||!document.fonts)return {id:font.id,name:font.name,source:'system',reason:'unsupported',faces:[]};
    const attempts=config.fontSource==='cdn-first'?['cdn','local']:['local'];
    for(const source of attempts){
      try{const loaded=await Promise.all(font.faces.map(item=>face(font,item,source)));if(token!==generation)return null;return {id:font.id,name:font.name,source:source==='local'&&window.PALETTE_EMBEDDED_FONTS?'embedded':source,faces:loaded};}
      catch {if(token!==generation)return null;}
    }
    return {id:font.id,name:font.name,source:'system',reason:'load-failed',faces:[]};
  }
  async function apply(config){
    const token=++generation;active.forEach(f=>document.fonts?.delete(f));active=[];
    const body=resolve(config.bodyFont,'body'),code=resolve(config.codeFont,'code');
    document.documentElement.style.setProperty('--kit-font-sans',stack(body,'body',config.fontSource));
    document.documentElement.style.setProperty('--kit-font-mono',stack(code,'code',config.fontSource));
    status={body:{id:body.id,name:body.name,source:'pending'},code:{id:code.id,name:code.name,source:'pending'},fallbacks:[]};emit();
    await Promise.all([body,code].map(async font=>{const result=await loadFont(font,config,token);if(!result||token!==generation)return;for(const f of result.faces){document.fonts.add(f);active.push(f);}const {faces,...visible}=result;status[font.role]=visible;emit();}));
    if(token===generation)await Promise.all(required(config).filter(f=>f.id!==body.id&&f.id!==code.id).map(async font=>{const result=await loadFont(font,config,token);if(!result||token!==generation)return;for(const f of result.faces){document.fonts.add(f);active.push(f);}const {faces,...visible}=result;status.fallbacks.push(visible);emit();}));
    return JSON.parse(JSON.stringify(status));
  }
  function intersects(range,text){if(!range)return true;const points=[...text].map(c=>c.codePointAt(0));return range.split(',').some(segment=>{const s=segment.trim().replace(/^U\+/i,''),parts=s.split('-'),low=parseInt(parts[0].replace(/\?/g,'0'),16),high=parseInt((parts[1]||parts[0]).replace(/\?/g,'F'),16);return points.some(p=>p>=low&&p<=high);});}
  async function preview(font,source,text){
    const family='Palette Sample '+font.id+' '+source;
    if(source==='system')return {source:'system',family:font.role==='body'?sans:mono};
    const sampleFaces=font.faces.filter(item=>{const weights=item.weight.split(/\s+/).map(Number);return weights[0]<=400&&(weights.at(-1)||400)>=400&&intersects(item.unicodeRange,text);});
    for(const location of (source==='cdn-first'?['cdn','local']:['local']))try{const loaded=await Promise.all(sampleFaces.map(item=>face(font,item,location,family)));loaded.forEach(f=>document.fonts.add(f));return {source:location==='local'&&window.PALETTE_EMBEDDED_FONTS?'embedded':location,family:JSON.stringify(family)+', '+(font.role==='body'?sans:mono)};}catch{}
    return {source:'system',family:font.role==='body'?sans:mono};
  }
  window.PaletteFonts={choices,resolve,apply,css,snapshot,preview,getStatus:()=>JSON.parse(JSON.stringify(status)),retry(config){cache.clear();return apply(config);}};
})();
