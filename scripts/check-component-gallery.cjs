/* Every generic family remains inspectable in every concept at both widths. */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href+'#fontSource=system&bodyFont=system&codeFont=system');
  for(const width of [1440,390]){
   await page.setViewportSize({width,height:1000});
   const failures=await page.evaluate(()=>{
    document.querySelector('#components-options').open=true;document.querySelector('#library-options').open=true;
    const failures=[],concepts=PaletteDesignConcepts.concepts.map(c=>c.id);
    for(const concept of concepts){PaletteCatalog.update({designSelection:{...PaletteCatalog.getConfig().designSelection,concept}});
     const buttons=[...document.querySelectorAll('[data-component]')];if(buttons.length!==19)failures.push('family count '+buttons.length);
     for(const button of buttons){button.click();const dialog=document.querySelector('#component-dialog');
      if(!dialog.open)failures.push(concept+' '+button.dataset.component+' detail did not open');
      const panes=[...document.querySelectorAll('#detail-demo .preview-pane')];
      if(panes.length!==2)failures.push(concept+' '+button.dataset.component+' missing mode');
      for(const pane of panes)if(pane.scrollWidth>pane.clientWidth+1)failures.push(concept+' '+button.dataset.component+' '+pane.dataset.theme+' pane overflow '+pane.scrollWidth+'/'+pane.clientWidth);
      const r=dialog.getBoundingClientRect();if(r.x<0||r.right>innerWidth+1)failures.push(concept+' '+button.dataset.component+' dialog overflow');
      dialog.close();
     }
     if(document.documentElement.scrollWidth>innerWidth+1)failures.push(concept+' page overflow');
    }return failures;
   });assert.deepEqual(failures,[],'all19 families across9 concepts, width '+width);
  }
  assert.deepEqual(errors,[]);console.log('Component gallery: PASS (19 families × 9 concepts × 2 widths, paired light/dark, zero overflow/errors)');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
