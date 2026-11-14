/* Selecting a library must reveal it without automation scrolling its demos. */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [1440,390]){
   const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
   await page.route(/^https?:/,r=>r.abort());await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href+'#fontSource=system&bodyFont=system&codeFont=system');
   await page.locator('#library-options').evaluate(el=>el.open=true);
   for(const id of ['base-ui','mantine']){
    const choose=page.locator(`[data-choose-library="${id}"]`);
    await choose.evaluate(el=>el.scrollIntoView({block:'center'}));
    await page.evaluate(()=>document.querySelector('#library-grid').addEventListener('click',()=>{window.selectionScrollAtClick=scrollY;},{capture:true,once:true}));
    await choose.click(); // Only the selection is clicked; do not scroll any demo.
    await page.waitForFunction(id=>document.querySelector(`.library-preview-pane[data-library="${id}"] [data-library-trigger="dialog"]`),id);
    const visibility=await page.evaluate(id=>{
     const trigger=document.querySelector(`.library-preview-pane[data-library="${id}"] [data-library-trigger="dialog"]`),r=trigger.getBoundingClientRect(),panel=document.querySelector('#preview-panel'),p=panel.getBoundingClientRect();
     return {shown:!!trigger.getClientRects().length&&r.top>=Math.max(0,p.top)&&r.bottom<=Math.min(innerHeight,p.bottom)&&r.left>=p.left&&r.right<=p.right,expanded:panel.classList.contains('expanded'),focused:document.activeElement?.dataset.chooseLibrary,scroll:scrollY};
    },id);
    assert(visibility.shown,`selected ${id} real demo must be visible at ${width}px without scrolling its trigger: `+JSON.stringify(visibility));
    if(width===390)assert(visibility.expanded,'reuse the mobile expanded preview');
    assert.equal(visibility.focused,id,'selection keeps inspector focus');assert.equal(visibility.scroll,await page.evaluate(()=>window.selectionScrollAtClick),'selection preserves inspector scroll from actual click');
   }
   await page.close();
  }
  console.log('Library selection: PASS (actual click reveals real demo at1440/390px, existing mobile expansion, inspector scroll/focus preserved)');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
