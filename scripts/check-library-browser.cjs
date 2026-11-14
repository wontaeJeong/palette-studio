#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'||r.request().url().startsWith('file:')?r.continue():r.abort());
 await page.goto(process.env.PALETTE_URL||'http://127.0.0.1:8766/index.html');
 await page.waitForFunction(()=>window.PaletteCatalog);
 assert.equal(await page.locator('[data-library-card]').count(),8,'six runtime choices plus two disclosed references');
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  if(width===390)await page.locator('#toggle-preview').click();
  for(const id of ['base-ui','radix','react-aria','mui','mantine'].filter(id=>!process.env.LIBRARY_ID||id===process.env.LIBRARY_ID)){
   await page.evaluate(id=>window.PaletteCatalog.update({uiLibrary:id,fonts:{source:'system'}}),id);
   await page.locator(`.library-preview-pane[data-library="${id}"]`).first().waitFor();
   for(const mode of ['light','dark']){
    console.log('Checking',width,id,mode);
    const pane=page.locator(`.library-preview-pane[data-theme="${mode}"]`);
    const portal=page.locator(`[data-library-portal="${id}"][data-theme="${mode}"]`);
    assert(!(await pane.locator('[data-library-trigger="tooltip"]').evaluate(el=>el.classList.contains('ps-tooltip'))),'tooltip surface styling must not leak onto the trigger');
    const colors=await pane.locator('[data-library-runtime]').evaluate(el=>{const css=getComputedStyle(el);const hex=css.getPropertyValue('--color-canvas').trim();return {background:css.backgroundColor,expected:'rgb('+[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(', ')+')'};});
    assert.equal(colors.background,colors.expected,'whole real library canvas consumes selected theme');
    await page.keyboard.press('Tab');
    await pane.locator('[data-library-trigger="tooltip"]').focus();
    await portal.locator('[data-library-component="tooltip"]').waitFor({state:'visible'});
    await page.keyboard.press('Escape');
    await pane.locator('[data-library-trigger="popover"]').click();
    const popover=portal.locator('[data-library-component="popover"]');await popover.waitFor({state:'visible'});
    assert.equal(await popover.evaluate(el=>getComputedStyle(el).getPropertyValue('--color-canvas').trim()),await pane.evaluate(el=>getComputedStyle(el).getPropertyValue('--color-canvas').trim()));
    const rect=await popover.boundingBox();assert(rect.x>=0&&rect.x+rect.width<=width+1,'popover stays in viewport');
    await page.keyboard.press('Escape');
    await pane.locator('[data-library-trigger="toast"]').click();
    await portal.locator('[data-library-component="toast"]').first().waitFor({state:'visible'});
    const other=page.locator(`[data-library-portal="${id}"][data-theme="${mode==='dark'?'light':'dark'}"]`);
    assert.equal(await other.locator('[data-library-component="toast"]').count(),0,'one action must not broadcast to both panes');
    await portal.locator('[data-library-dismiss="toast"]').first().click();
    await portal.locator('[data-library-component="toast"]').waitFor({state:'hidden'});
    await pane.locator('[data-library-trigger="dialog"]').click();
    const dialog=portal.locator('[data-library-component="dialog"]');await dialog.waitFor({state:'visible'});
    const box=await dialog.boundingBox();assert(box.x>=0&&box.x+box.width<=width+1,'dialog stays in viewport');
    await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});
    await page.waitForFunction(({id,mode})=>document.querySelector(`.library-preview-pane[data-library="${id}"][data-theme="${mode}"] [data-library-trigger="dialog"]`)===document.activeElement,{id,mode});
   }
   if(width===1440) {
    for(const concept of ['brutalist','expressive']) {
     await page.evaluate(concept=>{const c=window.PaletteCatalog.getConfig();window.PaletteCatalog.update({designSelection:{...c.designSelection,concept}});},concept);
     const pane=page.locator('.library-preview-pane[data-theme="dark"]');
     const portal=page.locator(`[data-library-portal="${id}"][data-theme="dark"]`);
     const button=await pane.locator('[data-library-trigger="button"]').evaluate(el=>({border:getComputedStyle(el).borderTopWidth,radius:getComputedStyle(el).borderTopLeftRadius}));
     if(concept==='brutalist')assert.deepEqual(button,{border:'2px',radius:'0px'},id+' actual brutalist button geometry');
     await pane.locator('[data-library-trigger="dialog"]').click();
     await portal.locator('[data-library-component="dialog"]').waitFor({state:'visible'});
     const surface=await portal.locator('.ps-surface').first().evaluate(el=>{const c=getComputedStyle(el);return {border:c.borderTopWidth,left:c.borderTopLeftRadius,right:c.borderTopRightRadius,shadow:c.boxShadow};});
     if(concept==='brutalist'){assert.equal(surface.border,'2px',id+' brutalist border');assert.equal(surface.left,'0px');assert.notEqual(surface.shadow,'none',id+' brutalist elevation');}
     else {assert.equal(surface.left,'26px',id+' expressive surface shape');assert.equal(surface.right,'8px');}
     await page.keyboard.press('Escape');
    }
    await page.evaluate(()=>{const c=window.PaletteCatalog.getConfig();window.PaletteCatalog.update({designSelection:{...c.designSelection,concept:'minimal'}});});
   }
   assert(await page.evaluate(()=>{const c=window.PaletteCatalog.getConfig(),files=window.PaletteHandoff.libraryFiles(c,window.PALETTE_KIT),ui=window.PaletteWorkspace.outputs();return Object.entries(files).every(([name,body])=>ui[name]===body);}), 'workspace uses exact shared library files');
   await page.locator('.library-preview').screenshot({path:`/private/tmp/palette-library-${id}-${width}.png`});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no document horizontal overflow');
  }
 }
 const lifecycle=await page.evaluate(()=>{
  const before=[...document.querySelectorAll('[data-library-portal]')].map(el=>el.id);
  const element=document.createElement('div');document.body.append(element);
  const palette=window.PALETTE_KIT.palettes[0],concept=window.PaletteDesignConcepts.get('minimal');
  const options={library:'base-ui',theme:'light',tokens:palette.modes.light,concept:'minimal',shape:concept.tokens};
  const handle=window.PaletteLibraryPreview.mount(element,options);
  const portal=[...document.querySelectorAll('[data-library-portal]')].find(el=>!before.includes(el.id));
  const id=portal.id;
  handle.update({...options,theme:'dark',tokens:palette.modes.dark});
  const updated=portal.dataset.theme==='dark'&&portal.style.getPropertyValue('--color-canvas')===palette.modes.dark['--color-canvas'];
  const same=document.getElementById(id)===portal;
  handle.unmount();handle.unmount();element.remove();
  return {updated,same,removed:!document.getElementById(id),count:document.querySelectorAll('[data-library-portal]').length===before.length};
 });
 assert.deepEqual(lifecycle,{updated:true,same:true,removed:true,count:true},'mount/update retains one owned portal and unmount is idempotent');
 await page.evaluate(()=>window.PaletteCatalog.update({uiLibrary:'vanilla'}));
 assert.equal(await page.locator('[data-library-portal]').count(),0,'owned portals removed when library unmounts');
 await page.setViewportSize({width:1440,height:1000});
 await page.goto('file://'+path.resolve(__dirname,'../START-HERE.html'));
 for(const id of ['base-ui','radix','react-aria','mui','mantine']) {
  await page.evaluate(uiLibrary=>window.PaletteCatalog.update({uiLibrary,fonts:{source:'system'}}),id);
  await page.locator('[data-library-trigger="dialog"]').first().click();
  await page.locator('[data-library-component="dialog"]').waitFor({state:'visible'});
  await page.keyboard.press('Escape');
 }
 await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));
 assert.equal(await page.locator('[data-library-portal]').count(),0,'page hide cleans owned roots');
 await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));
 assert.equal(await page.locator('[data-library-portal]').count(),2,'returning from page cache restores both library panes');
 assert.deepEqual(errors,[],'no runtime errors');
 await browser.close();console.log('Library browser: PASS (five real runtimes, both modes, 390px, scoped portals/toasts, offline START-HERE)');
})().catch(e=>{console.error(e);process.exit(1)});
