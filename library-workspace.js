/* Actual offline library island, kept separate from framework-neutral project examples. */
(()=>{
 'use strict';
 const registry=window.PaletteUILibraries,kit=window.PALETTE_KIT,host=document.getElementById('library-stage');
 if(!host)return;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cards=document.getElementById('library-grid');
 cards.innerHTML=[...registry.libraries,...registry.references].map(l=>`<article class="library-card" data-library-card="${l.id}"><div class="library-card-title"><strong>${esc(l.name)}</strong><small>${l.version?'검증 버전 '+esc(l.version):l.runtime==='recipe'?'복사해서 관리':'기존 앱 우선'}</small></div><p>${esc(l.description)}</p>${l.repo?`<div class="library-source"><a href="${esc(l.docs)}" target="_blank" rel="noopener noreferrer">공식 문서 ↗</a><a href="https://github.com/${esc(l.repo)}" target="_blank" rel="noopener noreferrer">${esc(l.repo)}</a></div><code>${esc(l.npmPackage)}${l.packageLabel?' · CLI':''}</code><div data-library-metrics="${l.id}" class="library-metrics">지표 조회 전 · 자동 요청 없음</div><button type="button" data-refresh-library="${l.id}" aria-label="${esc(l.name)} 지표 새로고침">지표 새로고침</button>`:'<div data-library-metrics="vanilla" class="library-metrics">외부 런타임 추가 없음</div>'}${l.runtime==='react'||l.runtime==='native'?`<button type="button" data-choose-library="${l.id}" aria-pressed="false">이 라이브러리로 비교</button>`:'<small class="help">선택 대상과 별도로 사용하는 참고 레시피</small>'}</article>`).join('');
 const metricClient=window.PaletteLibraryMetrics.createClient(),metricLibraries=[...registry.libraries,...registry.references].filter(l=>l.repo),busy=new Set();
 let suspended=false;
 const formatCount=value=>new Intl.NumberFormat('ko-KR').format(value);
 const formatTime=value=>new Date(value).toLocaleString('ko-KR',{timeZone:'UTC',hour12:false})+' UTC';
 function renderMetrics(library,result=metricClient.peek(library.id)){
  if(suspended)return;
  const slot=cards.querySelector(`[data-library-metrics="${library.id}"]`),button=cards.querySelector(`[data-refresh-library="${library.id}"]`);
  if(!slot||!button)return;
  const loading=busy.has(library.id);
  button.disabled=loading;button.textContent=loading?'조회 중…':'지표 새로고침';slot.setAttribute('aria-busy',String(loading));
  slot.innerHTML=(loading?'<p class="metric-loading" role="status">공개 소스 조회 중…</p>':'')+['github','release','npm'].map(source=>{
   const record=result[source],value=record.value;
   const label=source==='github'?'GitHub stars'+(library.monorepo?' · monorepo':''):source==='release'?'최신 저장소 릴리스':library.packageLabel?'주간 npm · CLI downloads':'주간 npm · 대표 패키지';
   const text=!value?'—':source==='github'?formatCount(value.stars):source==='npm'?formatCount(value.downloads):value.noRelease?'게시된 릴리스 없음':value.tag;
   const url=record.sourceUrl||(source==='npm'?'https://api.npmjs.org/downloads/point/last-week/'+encodeURIComponent(library.npmPackage):'https://api.github.com/repos/'+library.repo+(source==='release'?'/releases/latest':''));
   const state=!value&&!record.error?'조회 전':{fresh:'최신 조회',cached:'캐시 · 1시간 이내',stale:record.error?'이전 값 · 조회 실패':'이전 값 · 기한 경과',unavailable:'조회 불가'}[record.state];
   const detail=value&&source==='npm'?`${value.start} ~ ${value.end}`:value&&source==='release'&&!value.noRelease?'게시 '+formatTime(value.publishedAt):'';
   return `<div class="metric-source" data-metric-source="${source}"><div class="metric-heading"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a><span class="metric-state" data-metric-state="${record.state}">${esc(state)}</span></div><strong class="metric-value">${source==='release'&&value&&!value.noRelease?`<a href="${esc(value.url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`:esc(text)}</strong>${detail?`<small>${esc(detail)}</small>`:''}${record.fetchedAt!==null?`<small>정상 조회 <time datetime="${new Date(record.fetchedAt).toISOString()}">${esc(formatTime(record.fetchedAt))}</time></small>`:''}${record.error?`<small class="metric-error">! ${esc(record.error)}${record.attemptedAt!==null?' · 시도 '+esc(formatTime(record.attemptedAt)):''}</small>`:''}${record.retryAt!==null?`<small>재시도 가능 시각 ${esc(formatTime(record.retryAt))}</small>`:''}</div>`;
  }).join('');
 }
 metricLibraries.forEach(library=>{const slot=cards.querySelector(`[data-library-metrics="${library.id}"]`);slot.setAttribute('aria-live','polite');renderMetrics(library);});
 cards.addEventListener('click',async e=>{
  const button=e.target.closest('[data-refresh-library]');if(!button)return;
  const library=metricLibraries.find(l=>l.id===button.dataset.refreshLibrary);if(!library||busy.has(library.id))return;
  busy.add(library.id);renderMetrics(library);
  try{const result=await metricClient.load(library,{force:true});busy.delete(library.id);renderMetrics(library,result);}
  finally{busy.delete(library.id);if(!suspended)cards.querySelector(`[data-refresh-library="${library.id}"]`).disabled=false;}
 });
 window.addEventListener('pagehide',()=>{suspended=true;});
 window.addEventListener('pageshow',()=>{suspended=false;metricLibraries.forEach(l=>renderMetrics(l));});
 let mounts=[],lastKey='';
 function cleanup(){mounts.forEach(m=>m.unmount());mounts=[];host.replaceChildren();lastKey="";}
 function render(){
  const c=window.PaletteCatalog.getConfig(),selected=registry.get(c.uiLibrary);
  document.getElementById('library-summary').textContent=selected.name;
  for(const button of cards.querySelectorAll('[data-choose-library]')){
   const active=button.dataset.chooseLibrary===c.uiLibrary;button.setAttribute('aria-pressed',String(active));button.textContent=active?'선택됨':'이 라이브러리로 비교';
  }
  const external=selected.runtime==='react';
  document.getElementById('library-runtime-note').textContent=external?`${selected.name} 실제 컴포넌트 · React 런타임${c.framework==='astro'?' / Astro React island 필요':c.framework==='vanilla'?' / Vanilla 대상은 React root 추가 필요':''}${['radix','react-aria'].includes(c.uiLibrary)?' · 알림: Sonner 2.0.8':''} · 기존 앱은 현재 라이브러리 우선`: '프로젝트·컴포넌트 예시는 프레임워크 중립 UI입니다. 현재 앱의 컴포넌트를 우선 재사용하세요.';
  document.getElementById('library-preview-title').textContent=external?selected.name+' · 실제 라이브러리 동작':'기존 UI에 적용하기';
  const key=JSON.stringify(c);
  if(key===lastKey)return;cleanup();lastKey=key;
  if(!external){host.innerHTML='<p class="help">선택한 토큰과 디자인 기준을 현재 앱에 적용합니다. 실제 라이브러리를 고르면 Button · Tooltip · Dialog · Popover · Toast를 여기에서 직접 비교할 수 있습니다.</p>';return;}
  const palette=kit.palettes.find(p=>p.id===c.palette),concept=window.PaletteDesignConcepts.get(c.designSelection.concept),style=kit.styles.find(s=>s.id===c.style);
  for(const theme of ['light','dark']){
   const pane=document.createElement('section');pane.className='library-preview-pane';pane.dataset.library=c.uiLibrary;pane.dataset.theme=theme;pane.dataset.palette=c.palette;
   pane.innerHTML=`<div class="library-pane-label"><strong>${theme.toUpperCase()}</strong><span>${esc(selected.npmPackage)} · ${esc(selected.version)}</span></div><div data-library-mount></div>`;
   host.append(pane);
   mounts.push(window.PaletteLibraryPreview.mount(pane.querySelector('[data-library-mount]'),{library:c.uiLibrary,theme,palette:c.palette,concept:concept.id,style:c.style,tokens:palette.modes[theme],shape:concept.tokens,density:style,fonts:{...c.fonts,bodyFamily:'var(--kit-font-sans,system-ui)',codeFamily:'var(--kit-font-mono,monospace)'}}));
  }
 }
 cards.addEventListener('click',e=>{
  const button=e.target.closest('[data-choose-library]');if(!button)return;
  const id=button.dataset.chooseLibrary;window.PaletteCatalog.update({uiLibrary:id});
  if(registry.get(id).runtime!=='react')return;
  const panel=document.getElementById('preview-panel'),toggle=document.getElementById('toggle-preview');
  // Reveal the result in its own scroll area; keep the inspector/focus in place.
  if(getComputedStyle(toggle).display!=='none'&&toggle.getAttribute('aria-expanded')!=='true')toggle.click();
  const target=panel.querySelector('.library-preview');
  panel.scrollTop+=target.getBoundingClientRect().top-panel.getBoundingClientRect().top-24;
 });
 window.addEventListener('palette-selection',render);
 window.addEventListener('pagehide',cleanup);
 window.addEventListener('pageshow',render);
 window.PaletteLibraryWorkspace={render,unmount:cleanup};
 render();
})();
