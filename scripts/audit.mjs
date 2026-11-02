/** Dependency-free static CSS + JSON contract audit. Run: node scripts/audit.mjs */
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async p=>JSON.parse(await readFile(path.join(root,p),'utf8'));
const [data,rules]=await Promise.all([read('data/palettes.json'),read('data/contrast-pairs.json')]);
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
const lum=h=>rgb(h).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((a,x,i)=>a+x*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
let failures=[],details=[],checks=0;
const expected=data.tokens.map(t=>t.token).sort();
const css=await readFile(path.join(root,'css/palettes.css'),'utf8');
for(const match of css.matchAll(/(--color-[\w-]+)\s*:\s*([^;]+);/g))if(!/^#[0-9A-Fa-f]{6}$/.test(match[2].trim()))failures.push({error:'Nonliteral color in generated semantic CSS',token:match[1]});
for(const p of data.palettes)for(const [mode,t] of Object.entries(p.modes)){
  if(JSON.stringify(Object.keys(t).sort())!==JSON.stringify(expected))failures.push({palette:p.id,mode,error:'Token contract mismatch'});
  const selector=`[data-palette="${p.id}"][data-theme="${mode}"]`;
  const start=css.indexOf(selector+' {'),end=css.indexOf('}',start);
  if(start<0){failures.push({palette:p.id,mode,error:'Missing selector'});continue;}
  const block=css.slice(start,end),parsed=Object.fromEntries([...block.matchAll(/(--color-[\w-]+):\s*(#[\da-f]{6});/gi)].map(m=>[m[1],m[2].toUpperCase()]));
  const single=await readFile(path.join(root,'css/palettes',p.id+'.css'),'utf8');
  for(const [key,value] of Object.entries(t)){
    if(!/^#[\da-f]{6}$/i.test(value)||parsed[key]!==value)failures.push({palette:p.id,mode,key,error:'Invalid value or CSS/JSON drift'});
    if(!single.includes(`${key}: ${value};`))failures.push({palette:p.id,mode,key,error:'Single-palette export drift'});
  }
  for(const pair of rules.pairs){
    checks++;const a=t[pair.fg],b=t[pair.bg];
    if(!a||!b){failures.push({palette:p.id,mode,...pair,error:'Missing contrast token'});continue;}
    const ratio=contrast(a,b),pass=ratio>=pair.min;
    const d={palette:p.id,mode,...pair,fgHex:a,bgHex:b,ratio:Number(ratio.toFixed(4)),pass};
    details.push(d);if(!pass)failures.push(d);
  }
}
// Historical anchors: only these are assertions about the Gate palette, not its entire current source.
const gate=data.palettes.find(p=>p.id==='graphite-plum');
for(const [mode,key,val] of [['light','accent','#78469E'],['light','accent-strong','#623680'],['dark','accent','#D4A1EB'],['dark','accent-strong','#EAC7F6'],['dark','canvas','#101114'],['dark','raised','#1C1D22'],['dark','surface','#25252D'],['dark','shell','#18191D'],['dark','line','#303038']]){
  if(gate.modes[mode]['--color-'+key]!==val)failures.push({error:'Historical anchor changed',mode,key,val});
}
const foundation=await readFile(path.join(root,'css/foundation.css'),'utf8');
const utils=await readFile(path.join(root,'css/utilities.css'),'utf8');
const used=[...foundation.matchAll(/var\((--color-[\w-]+)\)/g)].map(x=>x[1]);
for(const k of used)if(!expected.includes(k))failures.push({error:'Undefined component token',token:k});
for(const t of data.tokens)for(const cls of Object.values(t.classes))if(!utils.includes('.'+cls+' {'))failures.push({error:'Missing utility',cls});
const result={date:'2026-10-27',palettes:data.palettes.length,themes:data.palettes.length*2,tokensPerTheme:expected.length,pairsPerTheme:rules.pairs.length,checks,failures:failures.length,minimumTextRatio:Math.min(...details.filter(d=>d.kind==='text').map(d=>d.ratio)),minimumUIRatio:Math.min(...details.filter(d=>d.kind!=='text').map(d=>d.ratio)),scope:'Declared opaque sRGB token pairs, CSS/JSON parity, component token references, utility inventory, historical anchors. No full-app or chart pairwise accessibility certification.'};
await writeFile(path.join(root,'data/audit-results.json'),JSON.stringify({summary:result,failures,details},null,2)+'\n');
await writeFile(path.join(root,'docs/AUDIT.md'),`# 색상 검증 결과\n\n생성일: ${result.date}\n\n- 팔레트 ${result.palettes}종 / 테마 ${result.themes}개\n- 테마당 의미 토큰 ${result.tokensPerTheme}개\n- 색상 쌍 ${checks.toLocaleString('en-US')}건 / 실패 ${failures.length}건\n- 일반 텍스트 최소 ${result.minimumTextRatio}:1 / 지정 UI·차트 요소 최소 ${result.minimumUIRatio}:1\n\n수치 기준은 원시 비율로 판정하며 표시는 소수점 4자리입니다. CSS·JSON 일치, 모든 의미 토큰의 직접 HEX 값, 유틸리티 누락, 과거 앵커 값도 검사합니다.\n\n선언된 불투명 sRGB 쌍의 정적 검사입니다. 실제 앱의 상속·겹침·투명도·키보드 흐름·접근성 전체 준수 여부는 별도 검토 대상입니다. 장식용 경계선은 3:1 기준을 일괄 적용하지 않습니다. 차트 색상끼리의 구별과 색각 이상 적합성을 보증하지 않습니다.\n\n다시 실행: \`node scripts/audit.mjs\`\n`);
console.log(JSON.stringify(result,null,2));
if(failures.length){console.error(JSON.stringify(failures.slice(0,12),null,2));process.exitCode=1;}
