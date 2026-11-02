/* Optional integration checks and real-browser preview renders. Requires Playwright. */
const {chromium}=require('playwright');
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const data=require(path.join(root,'data/palettes.json'));
const report={browser:'',pages:[],themeChecks:0,styleChecks:0,interactions:[],viewports:[],externalRequests:[],errors:[]};
async function qaFont(page){
  if(!process.env.PALETTE_QA_FONT_DIR)return;
  let css='';
  for(const w of [400,700]){
    let s=await fs.readFile(path.join(process.env.PALETTE_QA_FONT_DIR,w+'.css'),'utf8');
    const matches=[...s.matchAll(/url\(\.\/files\/([^()]+\.woff2)\)/g)];
    for(const m of matches){const b=await fs.readFile(path.join(process.env.PALETTE_QA_FONT_DIR,'files',m[1]));s=s.replace(m[0],`url(data:font/woff2;base64,${b.toString('base64')})`);}
    css+=s;
  }
  css+='\n:root{font-family:"Noto Sans KR",sans-serif} .cp-scope{--ui-font-sans:"Noto Sans KR",sans-serif}';
  await page.addStyleTag({content:css});await page.evaluate(()=>document.fonts.ready);
}
async function main(){
 const browser=await chromium.launch({headless:true,...(process.env.PALETTE_CHROMIUM_PATH?{executablePath:process.env.PALETTE_CHROMIUM_PATH,args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-zygote','--single-process','--disable-software-rasterizer']}: {})});
 try{
  report.browser=await browser.version();
  const page=await browser.newPage({viewport:{width:1440,height:1100}});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('request',r=>{if(/^https?:/.test(r.url()))report.externalRequests.push(r.url());});
  for(const file of ['index.html','START-HERE.html']){
   await page.goto('file://'+path.join(root,file)+'#fontSource=local-only');
   assert.equal(await page.locator('.palette-card').count(),32);
   assert.equal(await page.locator('#token-rows tr').count(),189);
   report.pages.push(file);
   await page.evaluate(()=>PaletteStudio.readyFonts());
  }
  await qaFont(page);
  for(const p of data.palettes)for(const mode of ['light','dark']){
   await page.selectOption('#palette',p.id);await page.selectOption('#mode',mode);
   const actual=await page.locator('[data-demo="0"]').evaluate(el=>{const c=getComputedStyle(el);return Object.fromEntries(window.PALETTE_KIT.tokens.map(t=>[t.token,c.getPropertyValue(t.token).trim().toUpperCase()]));});
   assert.deepEqual(actual,p.modes[mode]);report.themeChecks++;
  }
  for(const s of data.styles){await page.selectOption('#style',s.id);assert.equal(await page.locator('[data-demo="0"]').evaluate(el=>getComputedStyle(el).getPropertyValue('--ui-height').trim()),s.height);report.styleChecks++;}
  await page.selectOption('#palette','graphite-plum');await page.selectOption('#style','operational');await page.selectOption('#mode','light');
  await page.locator('[data-demo="0"] .ui-tab[data-filter="review"]').click();assert.equal(await page.locator('[data-demo="0"] tr[data-status]:visible').count(),1);
  await page.locator('[data-demo="0"] .ui-tab[data-filter="all"]').click();await page.locator('[data-demo="0"] .row-search').fill('analytics');assert.equal(await page.locator('[data-demo="0"] tr[data-status]:visible').count(),1);
  await page.locator('[data-demo="0"] .row-search').fill('');report.interactions.push('row filters + search');
  await page.locator('[data-demo="0"] .run-scan').click();assert.equal(await page.locator('dialog[open]').count(),1);await page.getByRole('button',{name:'확인',exact:true}).first().click();report.interactions.push('native modal open + close');
  await page.selectOption('#target','existing-gate');await page.selectOption('#scope','dark-only');
  let exported=await page.evaluate(()=>({css:PaletteStudio.selectedCSS(),profile:PaletteStudio.profile()}));assert(!exported.css.includes(':root:not('));assert(exported.css.includes(':root[data-theme="dark"]'));assert.equal(exported.profile.scope,'dark-only');
  await fs.writeFile(path.join(root,'data/qa-exported-profile.json'),JSON.stringify(exported.profile,null,2)+'\n');
  await page.selectOption('#scope','light-only');exported=await page.evaluate(()=>PaletteStudio.selectedCSS());assert(exported.includes(':root:not('));assert(!exported.includes(':root[data-theme="dark"]'));
  await page.selectOption('#target','new-app');assert.equal(await page.locator('#scope').inputValue(),'both');exported=await page.evaluate(()=>PaletteStudio.selectedCSS());assert(exported.includes(':root:not(')&&exported.includes(':root[data-theme="dark"]'));report.interactions.push('dark-only / light-only / both export isolation');
  const downloadPromise=page.waitForEvent('download');await page.click('#export-profile');const download=await downloadPromise;assert.equal(download.suggestedFilename(),'design-profile.json');report.interactions.push('profile download');
  await page.selectOption('#mode','compare');await page.selectOption('#compare','slate-teal');await page.selectOption('#compare-mode','dark');assert.equal(await page.locator('[data-demo]').count(),2);assert.equal(await page.locator('[data-demo="1"]').getAttribute('data-palette'),'slate-teal');
  await page.reload();assert.equal(await page.locator('#compare').inputValue(),'slate-teal');assert.equal(await page.locator('#mode').inputValue(),'compare');report.interactions.push('side-by-side comparison + selection persistence');await qaFont(page);
  await page.click('a[href="#gallery"]');const savedURL=await page.evaluate(()=>PaletteStudio.selectionURL());assert(savedURL.includes('palette=graphite-plum')&&savedURL.includes('compare=slate-teal'));report.interactions.push('selection link after section navigation');
  await page.selectOption('#mode','split');await page.selectOption('#target','existing-gate');
  await page.evaluate(()=>scrollTo(0,0));
  await page.screenshot({path:path.join(root,'previews/studio-overview.png'),fullPage:false});
  await page.locator('#stage').screenshot({path:path.join(root,'previews/plum-light-dark.png')});
  await page.locator('#palette-gallery').screenshot({path:path.join(root,'previews/palettes-light.png')});
  await page.selectOption('#mode','dark');await page.locator('#palette-gallery').screenshot({path:path.join(root,'previews/palettes-dark.png')});
  await page.locator('#specimens').screenshot({path:path.join(root,'previews/components-dark.png')});
  for(const width of [360,390,768,1440]){
    await page.setViewportSize({width,height:1000});
    for(const mode of ['light','split','compare']){await page.selectOption('#mode',mode);const dims=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));assert(dims.scroll<=dims.viewport,JSON.stringify({width,mode,...dims}));}
    report.viewports.push({width,rootHorizontalOverflow:false});
  }
  await page.setViewportSize({width:390,height:1000});await page.selectOption('#mode','dark');await page.locator('.studio-pane').screenshot({path:path.join(root,'previews/mobile-dark.png')});
  await page.emulateMedia({reducedMotion:'reduce',forcedColors:'active'});assert.equal(await page.locator('[data-demo="0"] .run-scan').evaluate(el=>getComputedStyle(el).borderTopColor),'rgb(0, 0, 0)');report.interactions.push('reduced motion / forced colors render');
  assert.equal(report.errors.length,0);assert.equal(report.externalRequests.length,0);
 }finally{await browser.close();}
 report.result='pass';await fs.writeFile(path.join(root,'data/browser-check-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
