/* Actual offline library island, kept separate from framework-neutral project examples. */
(()=>{
 'use strict';
 const registry=window.PaletteUILibraries,kit=window.PALETTE_KIT,host=document.getElementById('library-stage');
 if(!host)return;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const cards=document.getElementById('library-grid');
 cards.innerHTML=[...registry.libraries,...registry.references].map(l=>`<article class="library-card" data-library-card="${l.id}"><div class="library-card-title"><strong>${esc(l.name)}</strong><small>${l.version?'검증 버전 '+esc(l.version):l.runtime==='recipe'?'복사해서 관리':'기존 앱 우선'}</small></div><p>${esc(l.description)}</p>${l.repo?`<div class="library-source"><a href="${esc(l.docs)}" target="_blank" rel="noopener noreferrer">공식 문서 ↗</a><a href="https://github.com/${esc(l.repo)}" target="_blank" rel="noopener noreferrer">${esc(l.repo)}</a></div><code>${esc(l.npmPackage)}${l.packageLabel?' · CLI':''}</code><div data-library-metrics="${l.id}" class="library-metrics">지표 조회 전 · 자동 요청 없음</div><button type="button" data-refresh-library="${l.id}" disabled>지표 새로고침</button>`:'<div data-library-metrics="vanilla" class="library-metrics">외부 런타임 추가 없음</div>'}${l.runtime==='react'||l.runtime==='native'?`<button type="button" data-choose-library="${l.id}" aria-pressed="false">이 라이브러리로 비교</button>`:'<small class="help">선택 대상과 별도로 사용하는 참고 레시피</small>'}</article>`).join('');
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
 cards.addEventListener('click',e=>{const button=e.target.closest('[data-choose-library]');if(!button)return;window.PaletteCatalog.update({uiLibrary:button.dataset.chooseLibrary});});
 window.addEventListener('palette-selection',render);
 window.addEventListener('pagehide',cleanup);
 window.addEventListener('pageshow',render);
 window.PaletteLibraryWorkspace={render,unmount:cleanup};
 render();
})();
