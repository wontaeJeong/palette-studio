/* Concise UI guidance; full canonical technical guidance stays downloadable. */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const os=require('node:os');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true}),temporary=fs.mkdtempSync(path.join(os.tmpdir(),'palette-export-summary-'));
 try{
  for(const width of [1440,390]){
   const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
   await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href+'#fontSource=system&bodyFont=system&codeFont=system');
   await page.locator('#open-export').click();
   for(const scenario of [
    {uiLibrary:'base-ui',framework:'react',scope:'dark-only',scopeLabel:'다크 색상만',runtime:'React 런타임'},
    {uiLibrary:'radix',framework:'astro',scope:'both',scopeLabel:'라이트·다크',runtime:'Astro React island'},
    {uiLibrary:'mui',framework:'vanilla',scope:'light-only',scopeLabel:'라이트 색상만',runtime:'React root'},
    {uiLibrary:'vanilla',framework:'vanilla',scope:'both',scopeLabel:'라이트·다크',runtime:'현재 컴포넌트'}
   ]){
    const {scopeLabel,runtime,...config}=scenario;
    await page.evaluate(config=>PaletteCatalog.update(config),config);
    const note=page.locator('#library-export-note');await note.evaluate(el=>el.closest('details').open=true);
    const text=await note.innerText();assert(text.length<260,'export guidance must be a concise summary, not the full recipe: '+text.length+' characters');assert.match(text,/[가-힣]/);assert(text.includes(scopeLabel));assert(text.includes(runtime));assert(text.includes('library-README.md'));
    const geometry=await note.evaluate(el=>{const next=el.nextElementSibling,button=next.querySelector('button');return {height:el.getBoundingClientRect().height,distance:button.getBoundingClientRect().top-el.getBoundingClientRect().top};});assert(geometry.height<200&&geometry.distance<230,'library buttons follow a compact summary at '+width);
   }
   await page.evaluate(()=>PaletteCatalog.update({uiLibrary:'base-ui',framework:'astro',scope:'dark-only',target:'existing-app'}));
   const note=await page.locator('#library-export-note').innerText();assert.match(note,/기존 앱/);
   const expected=await page.evaluate(()=>PaletteWorkspace.outputs()['library-README.md']);assert.match(expected,/For an existing application, preserve its existing library/);assert.match(expected,/React 19\.3\.1/);assert.match(expected,/@astrojs\/react island with client:load/);
   const pending=page.waitForEvent('download');await page.locator('#library-export-files [data-export="library-README.md"]').click();const download=await pending;const saved=path.join(temporary,width+'-library-README.md');await download.saveAs(saved);assert.equal(fs.readFileSync(saved,'utf8'),expected,'full canonical README download remains byte-identical');
   await page.keyboard.press('Escape');assert.deepEqual(errors,[]);await page.close();
  }
  const page=await browser.newPage();await page.route(/^https?:/,r=>r.abort());await page.goto(pathToFileURL(path.resolve(__dirname,'../handoff.html')).href+'#uiLibrary=base-ui&framework=astro&scope=dark-only&fontSource=system');
  const text=await page.locator('#ah-library-note').innerText();assert(text.length<260);assert(text.includes('Astro React island'));assert(text.includes('다크 색상만'));await page.close();
  console.log('Library export summary: PASS (concise Korean, runtime/scope disclosure, reachable buttons, full canonical README download, workspace1440/390 and standalone handoff)');
 }finally{await browser.close();fs.rmSync(temporary,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exit(1);});
