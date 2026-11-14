/* Cross-feature contract: actual navigation, concept, library, metrics and exports. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {execFileSync}=require('node:child_process');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),temp=fs.mkdtempSync(path.join(os.tmpdir(),'palette-nav-libraries-')),browser=await chromium.launch({headless:true});
 try{
  for(const [file,width]of [['index.html',1440],['START-HERE.html',390]]){
   const context=await browser.newContext({viewport:{width,height:1100},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];let metricRequests=0;
   page.on('pageerror',e=>errors.push(e.message));
   await context.route(/^https:\/\/(api.github.com|api.npmjs.org)\//,route=>{metricRequests++;const url=route.request().url();return route.fulfill({status:200,json:url.includes('npmjs')?{downloads:45678,start:'2026-11-06',end:'2026-11-12',package:'@base-ui/react'}:url.endsWith('/latest')?{tag_name:'v1.9.0',published_at:'2026-10-09T08:50:49Z',html_url:'https://github.com/mui/base-ui/releases/tag/v1.9.0'}:{stargazers_count:12345}});});
   await page.goto(pathToFileURL(path.join(root,file)).href+'#fontSource=system&bodyFont=system&codeFont=system');
   await page.locator('[data-choose-concept="brutalist"]').click();await page.locator('#structure-options').evaluate(el=>el.open=true);
   await page.selectOption('#catalog-navigation','hybrid');await page.selectOption('#catalog-navigationStructure','grouped');await page.locator('[data-navigation-style="edge"]').click();
   if(width===390)await page.locator('#toggle-preview').click();
   await page.locator('#project-stage .mock-nav [data-nav-page="settings"]').first().click();
   await page.locator('[data-choose-concept="glass"]').click();
   assert(await page.locator('#project-stage [data-preview-settings]').first().evaluate(el=>!el.hidden),'settings selection survives concept render');
   const navStates=await page.locator('#project-stage .ps-navigation').evaluateAll(nodes=>nodes.map(nav=>{const active=nav.querySelector('[aria-current="page"]'),other=nav.querySelector('[data-nav-page="projects"]');return {style:nav.dataset.navStyle,structure:nav.dataset.navStructure,active:active.dataset.navPage,border:getComputedStyle(active).borderInlineStartWidth,bg:getComputedStyle(active).backgroundColor,otherBg:getComputedStyle(other).backgroundColor};}));
   assert.equal(navStates.length,2);for(const state of navStates)assert.deepEqual(state,{style:'edge',structure:'grouped',active:'settings',border:'3px',bg:state.otherBg,otherBg:state.otherBg},'glass retains edge-only active marker without selected fill');
   await page.locator('#library-options').evaluate(el=>el.open=true);await page.locator('[data-choose-library="base-ui"]').click();
   assert(await page.locator('#project-stage [data-preview-settings]').first().evaluate(el=>!el.hidden),'settings survives library selection');
   assert.deepEqual(await page.locator('[data-library-runtime="base-ui"]').evaluateAll(nodes=>nodes.map(el=>el.dataset.concept)),['glass','glass']);
   await page.locator('.library-preview-pane[data-theme="dark"] [data-library-trigger="dialog"]').click();await page.locator('[data-library-portal="base-ui"][data-theme="dark"] [data-library-component="dialog"]').waitFor({state:'visible'});await page.keyboard.press('Escape');
   assert.equal(metricRequests,0,'combined selections and real library previews never auto-request metrics');
   const before=await page.evaluate(()=>({config:PaletteCatalog.getConfig(),hash:location.hash,files:PaletteWorkspace.outputs()}));
   await page.locator('[data-refresh-library="base-ui"]').click();await page.waitForFunction(()=>document.querySelector('[data-library-metrics="base-ui"]').textContent.includes('45,678'));
   assert.equal(metricRequests,3);assert.deepEqual(await page.evaluate(()=>({config:PaletteCatalog.getConfig(),hash:location.hash,files:PaletteWorkspace.outputs()})),before);
   await page.locator('#open-export').click();await page.selectOption('#target','existing-app');await page.selectOption('#scope','dark-only');await page.selectOption('#framework','astro');
   await page.locator('#library-export-note').evaluate(el=>el.closest('details').open=true);assert.match(await page.locator('#library-export-note').innerText(),/Astro React island/);
   const downloadPromise=page.waitForEvent('download');await page.locator('#export-files [data-export="design-profile.json"]').click();const download=await downloadPromise;const profilePath=path.join(temp,width+'-profile.json');await download.saveAs(profilePath);
   const profile=JSON.parse(fs.readFileSync(profilePath));assert.equal(profile.uiLibrary,'base-ui');assert.equal(profile.scope,'dark-only');assert.equal(profile.framework,'astro');for(const [key,value]of Object.entries({concept:'glass',navigation:'hybrid',navigationStyle:'edge',navigationStructure:'grouped'}))assert.equal(profile.designSelection[key],value);
   const {config,outputs}=await page.evaluate(()=>({config:PaletteCatalog.getConfig(),outputs:PaletteWorkspace.outputs()}));const configFile=path.join(temp,width+'-config.json'),out=path.join(temp,String(width));fs.writeFileSync(configFile,JSON.stringify(config));
   execFileSync(process.execPath,[path.join(root,'scripts/create-design-handoff.cjs'),'--config',configFile,'--out',out]);execFileSync(process.execPath,[path.join(root,'scripts/create-design-handoff.cjs'),'--config',configFile,'--out',out,'--check']);
   for(const name of ['selected-style.css','design-profile.json','design.md','AGENT-TASK.md','library-theme.ts','library-adapter.tsx','library-README.md'])assert.equal(fs.readFileSync(path.join(out,name),'utf8'),outputs[name],name+' cross-feature CLI/UI parity');
   assert(outputs['selected-style.css'].includes('data-nav-style="edge"'));assert(outputs['selected-style.css'].includes('data-concept="glass"'));assert(outputs['library-theme.ts'].includes('"dark"'));assert(!outputs['library-theme.ts'].includes('"light":'));
   assert.deepEqual(errors,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await context.close();
  }
  console.log('Navigation/library integration: PASS (index1440/START390; glass+edge+grouped+hybrid, active settings, real Base UI, explicit metrics/stable outputs, Astro dark-only actual download and CLI parity)');
 }finally{await browser.close();fs.rmSync(temp,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exit(1);});
