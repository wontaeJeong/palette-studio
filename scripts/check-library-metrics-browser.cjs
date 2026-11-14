/* Run the actual UI/client; fixtures replace only external HTTP responses. */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const base=process.env.PALETTE_URL||pathToFileURL(path.resolve(__dirname,'../index.html')).href;
const url=base+'#fontSource=system&bodyFont=system&codeFont=system';
(async()=>{
 const browser=await chromium.launch({headless:true});
 const errors=[];
 try{
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  let phase='success',requests=0;
  await context.route(/^https:\/\/(api.github.com|api.npmjs.org)\//,async route=>{
   requests++;const requestURL=route.request().url();
   const npm=requestURL.includes('npmjs'),release=requestURL.endsWith('/latest');
   if(phase==='partial'&&npm)return route.fulfill({status:503,json:{message:'unavailable'}});
   if(phase==='partial'&&release)return route.fulfill({status:404,json:{message:'Not Found'}});
   if(phase==='rate'&&!release)return route.fulfill({status:npm?403:429,headers:{'retry-after':'120','access-control-expose-headers':'retry-after'},json:{message:'rate limit'}});
   const body=npm?{downloads:2345678,start:'2026-11-07',end:'2026-11-13',package:'@base-ui/react'}:release?{tag_name:'v99.0.0',name:'Latest release',published_at:'2026-11-10T12:00:00Z',html_url:'https://github.com/mui/base-ui/releases/tag/v99.0.0'}:{stargazers_count:123456,full_name:'mui/base-ui'};
   await route.fulfill({status:200,json:body});
  });
  await page.goto(url);assert.deepEqual(errors,[],'initial document initialization');await page.locator('#library-options').evaluate(el=>el.open=true);
  assert.equal(requests,0,'initial render has zero metadata requests');
  const refresh=page.locator('[data-refresh-library="base-ui"]'),slot=page.locator('[data-library-metrics="base-ui"]');
  assert(await refresh.isEnabled(),'explicit refresh must be enabled');
  const before=await page.evaluate(()=>({config:PaletteCatalog.getConfig(),hash:location.hash,files:PaletteWorkspace.outputs()}));
  await refresh.click();await page.waitForFunction(()=>document.querySelector('[data-library-metrics="base-ui"]').textContent.includes('2,345,678'));
  assert.equal(requests,3);assert.match(await slot.innerText(),/123,456/);assert.match(await slot.innerText(),/2026-11-07.*2026-11-13/s);assert.match(await slot.innerText(),/v99\.0\.0/);
  assert.match(await page.locator('[data-library-card="base-ui"] small').first().innerText(),/1\.9\.0/,'tested version remains distinct from latest published non-prerelease release');
  assert.deepEqual(await page.evaluate(()=>({config:PaletteCatalog.getConfig(),hash:location.hash,files:PaletteWorkspace.outputs()})),before,'metrics never mutate design config/share URL/exports');
  assert.match(await page.locator('[data-library-card="shadcn"]').innerText(),/CLI/);assert.match(await page.locator('[data-library-card="radix"]').innerText(),/monorepo/i);
  await page.reload();await page.locator('#library-options').evaluate(el=>el.open=true);assert.equal(requests,3);assert.match(await slot.innerText(),/캐시/);assert.match(await slot.innerText(),/2,345,678/);
  phase='partial';await refresh.click();await page.waitForFunction(()=>document.querySelector('[data-library-metrics="base-ui"]').textContent.includes('503'));assert.match(await slot.innerText(),/이전 값/);assert.match(await slot.innerText(),/2,345,678/);assert.match(await slot.innerText(),/최신 정식 릴리스 없음/);
  phase='rate';await refresh.click();await page.waitForFunction(()=>document.querySelector('[data-library-metrics="base-ui"]').textContent.includes('429'));assert.match(await slot.innerText(),/재시도/);assert.match(await slot.innerText(),/123,456/);
  // Expired successes remain visible on a later offline initial render.
  await page.evaluate(()=>{for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(key.startsWith('palette-library-metrics:')){const r=JSON.parse(localStorage.getItem(key));r.fetchedAt-=7200000;localStorage.setItem(key,JSON.stringify(r));}}});
  await page.reload();await page.locator('#library-options').evaluate(el=>el.open=true);assert.match(await slot.innerText(),/기한 경과/);const countBefore=requests;assert.match(await slot.innerText(),/123,456/);assert.equal(requests,countBefore);
  phase='success';
  // Slow metadata continues to target its own card through real preview/config rerenders.
  const releases=[];let allRegistered;const registered=new Promise(resolve=>allRegistered=resolve);await context.unroute(/^https:\/\/(api.github.com|api.npmjs.org)\//);
  await context.route(/^https:\/\/(api.github.com|api.npmjs.org)\//,route=>new Promise(resolve=>{
   releases.push(async()=>{const u=route.request().url();await route.fulfill({status:200,json:u.includes('npmjs')?{downloads:3456789,start:'2026-11-07',end:'2026-11-13',package:'@base-ui/react'}:u.endsWith('/latest')?{tag_name:'v100',published_at:'2026-11-12T12:00:00Z',html_url:'https://github.com/mui/base-ui/releases/tag/v100'}:{stargazers_count:234567}});resolve();});
   if(releases.length===3)allRegistered();
  }));
  await refresh.click();await page.waitForFunction(()=>document.querySelector('[data-refresh-library="base-ui"]').disabled);
  await page.evaluate(()=>PaletteCatalog.update({uiLibrary:'radix',designSelection:{...PaletteCatalog.getConfig().designSelection,concept:'editorial'}}));
  const changed=await page.evaluate(()=>({config:PaletteCatalog.getConfig(),hash:location.hash,files:PaletteWorkspace.outputs()}));
  let registrationTimer;try{await Promise.race([registered,new Promise((_,reject)=>{registrationTimer=setTimeout(()=>reject(Error('Expected all three metadata requests before release')),5000);})]);}finally{clearTimeout(registrationTimer);}
  assert.equal(releases.length,3,'all sources are intercepted before releasing the held responses');
  await Promise.all(releases.map(release=>release()));await page.waitForFunction(()=>document.querySelector('[data-library-metrics="base-ui"]').textContent.includes('3,456,789'));
  assert.deepEqual(await page.evaluate(()=>({config:PaletteCatalog.getConfig(),hash:location.hash,files:PaletteWorkspace.outputs()})),changed);assert.match(await page.locator('[data-library-metrics="radix"]').innerText(),/조회 전/);
  for(const width of [1440,390]){await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'metric cards do not overflow '+width);}
  await context.close();
  // Browser-level localStorage getter and method failures, with the real client/UI.
  for(const blocked of ['getter','methods']){
   const c=await browser.newContext();await c.addInitScript(blocked=>{if(blocked==='getter')Object.defineProperty(window,'localStorage',{get(){throw Error('blocked storage');}});else{Storage.prototype.getItem=function(){throw Error('blocked read');};Storage.prototype.setItem=function(){throw Error('quota');};}},blocked);
   await c.route(/^https:\/\/(api.github.com|api.npmjs.org)\//,route=>route.fulfill({status:200,json:route.request().url().includes('npmjs')?{downloads:0,start:'2026-11-07',end:'2026-11-13',package:'@base-ui/react'}:route.request().url().endsWith('/latest')?{tag_name:'v1',published_at:'2026-11-12T12:00:00Z',html_url:'https://github.com/mui/base-ui/releases/tag/v1'}:{stargazers_count:0}}));
   const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(url);await p.locator('#library-options').evaluate(el=>el.open=true);await p.locator('[data-refresh-library="base-ui"]').click();await p.waitForFunction(()=>document.querySelector('[data-library-metrics="base-ui"] [data-metric-source="npm"]')?.textContent.includes('0'));
   assert.match(await p.locator('[data-library-metrics="base-ui"]').innerText(),/최신 조회/);await c.close();
  }
  assert.deepEqual(errors,[]);console.log('Library metrics browser: PASS (real client/UI, no initial requests, success/partial/rate/stale cache/blocked storage/rerender, stable exports, 390px)');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
