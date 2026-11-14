/* Distribution behavior: real split modules, transient failures, selection races,
 * export parity and relocated offline operation. No external network required. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
const root = path.resolve(__dirname, '..');
const web = path.join(root, 'out/web');
const ids = ['base-ui', 'radix', 'react-aria', 'mui', 'mantine'];
const libraryRequest = url => /\/library-(base-ui|radix|react-aria|mui|mantine)\.js(?:\?|$)/.test(url);
async function startServer(base = '/', directory = web) {
  const {createStudioServer} = require('./serve-studio.cjs');
  const server = createStudioServer({directory,base});
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {server, origin:'http://127.0.0.1:' + server.address().port};
}
async function select(page, uiLibrary) {
  await page.evaluate(uiLibrary => PaletteCatalog.update({uiLibrary}), uiLibrary);
}
async function ready(page, id) {
  await page.locator(`[data-library-runtime="${id}"] [data-library-trigger="dialog"]`).first().waitFor();
  assert.equal(await page.locator(`[data-library-runtime="${id}"]`).count(), 2);
}
async function currentMainFeatures(page) {
  const before = await page.evaluate(() => PaletteCatalog.getConfig());
  assert.equal(await page.locator('[data-component]').count(),47,'all shipped component families');
  assert.equal(await page.locator('#project-stage [data-dashboard-demo="bar-chart"] svg').count(),2,'paired dashboard charts');
  await page.locator('#structure-options').evaluate(el=>el.open=true);
  await page.locator('[data-set="studio"]').click();
  await page.locator('[data-navigation-style="pill"]').click();
  assert.equal(await page.locator('[data-navigation-style="edge"] .preset-recommendation').count(),1);
  assert.equal(await page.locator('[data-navigation-style="pill"] .selection-status').innerText(),'선택됨');
  await page.locator('#components-options').evaluate(el=>el.open=true);
  await page.locator('[data-component="slider"]').click();
  const pane=page.locator('#detail-demo .preview-pane').first();
  await pane.locator('input[type=range]').fill('75');
  assert.equal(await pane.locator('output').textContent(),'75%');
  assert.equal(await page.locator('#detail-demo .preview-pane').nth(1).locator('output').textContent(),'40%');
  await page.keyboard.press('Escape');
  await page.locator('[data-component="dialog"]').click();
  assert(await pane.locator('.inline-sample .sample-box').isVisible(),'overlay sample visible before interaction');
  await page.locator('[data-variant="outline"]').click();
  assert.equal(await page.locator('[data-variant="soft"] .preset-recommendation').count(),1);
  assert.equal(await page.locator('[data-variant="outline"] .selection-status').innerText(),'선택됨');
  await pane.locator('[data-demo="dialog"]').click();
  assert(await page.locator('#demo-dialog').isVisible());
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
  await page.locator('[data-project-search]').first().fill('no matching project');
  assert.equal(await page.locator('[data-project-preview]').first().locator('.mock-projects tbody tr:visible').count(),0);
  assert.equal(await page.locator('[data-project-preview]').first().locator('.dashboard-data tbody tr[hidden]').count(),0,'project search preserves chart data');
  await page.locator('[data-project-search]').first().fill('');
  await page.evaluate(config => PaletteCatalog.update(config), before);
}
async function outputs(page) {
  return page.evaluate(() => {
    PaletteCatalog.update({palette:'warm-sage',scope:'dark-only',framework:'astro',target:'existing-app',uiLibrary:'radix',fonts:{source:'system'},icons:['house']});
    return PaletteWorkspace.outputs();
  });
}
async function downloadProfile(page) {
  await page.locator('#open-export').click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.locator('#download-config').click()]);
  const result = fs.readFileSync(await download.path(), 'utf8');
  await page.keyboard.press('Escape');
  return result;
}
async function verifyLocalLinks(page, origin, prefix) {
  // Follow the actual shell links and the README/docs link graph. Missing fonts,
  // notices, legacy pages and linked examples must fail under a subpath too.
  const pending = await page.locator('a[href],link[href],script[src]').evaluateAll(nodes => nodes.map(el => el.href || el.src));
  const seen = new Set();
  while (pending.length) {
    const url = new URL(pending.shift(), origin + prefix);
    if (url.origin !== origin || seen.has(url.pathname) || /^(blob|data):/.test(url.protocol)) continue;
    seen.add(url.pathname);
    assert(url.pathname.startsWith(prefix), 'local link escaped hosting prefix: ' + url);
    const response = await page.request.get(url.href);
    assert.equal(response.status(), 200, 'local resource: ' + url.pathname);
    if (/\.(md|html)$/.test(url.pathname)) {
      const body = await response.text();
      const matches = url.pathname.endsWith('.md') ? body.matchAll(/\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g) : body.matchAll(/(?:href|src)="([^"{}]+)"/g);
      for (const match of matches) {
        if (/^(#|https?:|mailto:|data:|blob:|\/)/.test(match[1])) continue;
        pending.push(new URL(match[1], url).href);
      }
    }
  }
  for (const font of JSON.parse(fs.readFileSync(path.join(root,'data/fonts.json'))).fonts) {
    for (const face of font.faces) {
      assert.equal((await page.request.get(origin + prefix + face.local)).status(), 200, 'bundled font: ' + face.local);
    }
  }
}
(async () => {
  assert(fs.existsSync(path.join(web,'index.html')), 'split out/web artifact must exist; run npm run build');
  assert(fs.existsSync(path.join(root,'scripts/serve-studio.cjs')), 'portable web server must exist');
  const {server, origin} = await startServer();
  const subpath = await startServer('/palette-studio/');
  const classicHttp = await startServer('/', root);
  const browser = await chromium.launch({headless:true});
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(),'palette-distributions-'));
  const errors = [], metrics = [];
  let reference, profile;
  async function context() {
    const ctx = await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
    await ctx.route('**/*', route => {
      const url = new URL(route.request().url());
      return url.protocol === 'file:' || [origin, subpath.origin, classicHttp.origin].includes(url.origin) ? route.continue() : route.abort();
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(20000);
    page.on('pageerror', error => errors.push(error.message));
    return {ctx, page};
  }
  try {
    for (const prefix of ['/', '/palette-studio/']) {
      const {ctx,page} = await context();
      const requests = [];
      page.on('request', request => requests.push(request.url()));
      const hostingOrigin = prefix === '/' ? origin : subpath.origin;
      await page.goto(hostingOrigin + prefix + '#fontSource=local-only');
      await page.locator('[data-project-preview]').first().waitFor();
      await page.evaluate(async()=>{await PaletteCatalog.readyFonts();await document.fonts.ready;});
      assert.equal(requests.filter(libraryRequest).length, 0, 'no adapter runtime requested at startup');
      const initial = [...requests];
      await currentMainFeatures(page);
      await verifyLocalLinks(page, hostingOrigin, prefix);
      for (const id of ids) {
        await select(page,id); await ready(page,id);
        assert(requests.some(url => url.includes('/library-'+id+'.js')), id+' loads a real adapter module on selection');
        await page.locator(`[data-library-runtime="${id}"] [data-library-trigger="dialog"]`).first().click();
        await page.locator(`[data-library-portal="${id}"] [data-library-component="dialog"]`).waitFor({state:'visible'});
        await page.keyboard.press('Escape');
      }
      const actual = await outputs(page);
      if (reference) assert.deepEqual(actual, reference, 'subpath exports byte-equal root exports');
      else reference = actual;
      const downloaded = await downloadProfile(page);
      if (profile) assert.equal(downloaded,profile); else profile=downloaded;
      metrics.push({distribution:'web',prefix,initialRequests:initial.length,initialScriptBytes:initial.filter(url=>new URL(url).pathname.endsWith('.js')).reduce((n,url)=>n+fs.statSync(path.join(web,new URL(url).pathname.slice(prefix.length))).size,0),initialScripts:initial.filter(url=>new URL(url).pathname.endsWith('.js')).map(url=>new URL(url).pathname.slice(prefix.length)),selectedAdapterRequests:requests.filter(libraryRequest).length});
      await ctx.close();
    }
    {
      const {ctx,page} = await context();
      await page.goto(classicHttp.origin+'/#fontSource=system');
      await currentMainFeatures(page);
      assert.deepEqual(await outputs(page),reference,'public root classic HTTP canonical exports match split web');
      await ready(page,'radix');
      assert.equal(await downloadProfile(page),profile,'classic HTTP profile download matches split web');
      await ctx.close();
    }
    {
      const {ctx,page} = await context();
      let failed = false;
      await ctx.route('**/library-radix.js*', route => {
        if (!failed) {failed=true;return route.abort('failed');}
        return route.continue();
      });
      await page.goto(origin+'/#fontSource=system');
      await select(page,'radix');
      await page.locator('#library-stage [role="alert"]').waitFor();
      assert.equal(await page.locator('[data-library-runtime]').count(),0,'failed adapter leaves no broken runtime');
      assert.deepEqual(await outputs(page),reference,'load failure preserves canonical exports');
      const retry = page.locator('[data-retry-library]');
      await retry.click();
      await ready(page,'radix');
      await ctx.close();
    }
    {
      const {ctx,page} = await context();
      let release;
      const held = new Promise(resolve=>release=resolve);
      let started;
      const requested = new Promise(resolve=>started=resolve);
      await ctx.route('**/library-base-ui.js*', async route=>{started();await held;await route.continue();});
      await page.goto(origin+'/#fontSource=system');
      await select(page,'base-ui'); await requested;
      await page.locator('#library-stage [role="status"]').waitFor();
      await select(page,'mantine'); await ready(page,'mantine');
      release();
      await page.waitForResponse(response=>response.url().includes('/library-base-ui.js'));
      await page.waitForLoadState('networkidle');
      assert.equal(await page.locator('[data-library-runtime="base-ui"]').count(),0,'late earlier import cannot replace current selection');
      await ready(page,'mantine');
      await select(page,'base-ui'); await ready(page,'base-ui');
      await ctx.close();
    }
    // A genuinely delayed web import must reveal the actual controls only after
    // mount, without moving the inspector or stealing its selection-button focus.
    for (const width of [1440,390]) {
      const {ctx,page} = await context();
      await page.setViewportSize({width,height:1000});
      let release, started;
      const held = new Promise(resolve=>release=resolve);
      const requested = new Promise(resolve=>started=resolve);
      await ctx.route('**/library-base-ui.js*',async route=>{started();await held;await route.continue();});
      await page.goto(origin+'/#fontSource=system');
      await page.locator('#library-options').evaluate(el=>el.open=true);
      const choose=page.locator('[data-choose-library="base-ui"]');
      await choose.evaluate(el=>el.scrollIntoView({block:'center'}));
      await page.evaluate(()=>document.querySelector('#library-grid').addEventListener('click',()=>window.selectionScrollAtClick=scrollY,{capture:true,once:true}));
      await choose.click(); await requested;
      await page.locator('#library-stage [role="status"]').waitFor();
      release(); await ready(page,'base-ui');
      const state=await page.evaluate(()=>{
        const trigger=document.querySelector('[data-library-runtime="base-ui"] [data-library-trigger="dialog"]'),r=trigger.getBoundingClientRect(),panel=document.querySelector('#preview-panel'),p=panel.getBoundingClientRect();
        return {shown:r.top>=Math.max(0,p.top)&&r.bottom<=Math.min(innerHeight,p.bottom)&&r.left>=p.left&&r.right<=p.right,focused:document.activeElement?.dataset.chooseLibrary,scroll:scrollY,clicked:window.selectionScrollAtClick};
      });
      assert(state.shown,'slow selected web demo visible at '+width+': '+JSON.stringify(state));
      assert.equal(state.focused,'base-ui'); assert.equal(state.scroll,state.clicked);
      await ctx.close();
    }
    fs.copyFileSync(path.join(root,'START-HERE.html'),path.join(temporary,'START-HERE.html'));
    for (const [distribution,file] of [['classic',path.join(root,'index.html')],['offline',path.join(temporary,'START-HERE.html')]]) {
      for (const source of ['system','local-only']) {
        const {ctx,page} = await context();
        const requests = [];
        page.on('request',req=>requests.push(req.url()));
        await page.goto(pathToFileURL(file).href+'#fontSource='+source);
        await page.locator('[data-project-preview]').first().waitFor();
        await page.evaluate(async()=>{await PaletteCatalog.readyFonts();await document.fonts.ready;});
        const initial=[...requests];
        await currentMainFeatures(page);
        for (const id of ids) {await select(page,id);await ready(page,id);}
        assert.deepEqual(await outputs(page),reference,distribution+' canonical exports match web');
        assert.equal(await downloadProfile(page),profile,distribution+' actual profile download matches web');
        if (distribution==='offline') {
          assert.deepEqual(requests.filter(url=>url!==pathToFileURL(file).href && !url.startsWith('data:') && !url.startsWith('blob:')),[], 'relocated offline has no dependent file or HTTP assets');
          assert.equal(await page.evaluate(()=>PALETTE_EMBEDDED_NOTICES),fs.readFileSync(path.join(root,'assets/library-preview-LICENSES.txt'),'utf8'));
        }
        if(source==='local-only')metrics.push({distribution,initialRequests:initial.length,initialScriptBytes:initial.filter(url=>new URL(url).pathname.endsWith('.js')).reduce((n,url)=>n+fs.statSync(new URL(url)).size,0),standaloneBytes:distribution==='offline'?fs.statSync(file).size:undefined});
        await ctx.close();
      }
    }
    assert.deepEqual(errors,[],'no uncaught errors (including rejected adapter imports)');
    const report = {browserVersion:browser.version(),viewport:{width:1440,height:1000},fontSource:'local-only',measurement:'Uncompressed file bytes; fresh contexts; local server with no compression/cache; no speed claim.',metrics};
    fs.writeFileSync(path.join(root,'out/studio-distribution-resources.json'),JSON.stringify(report,null,2)+'\n');
    console.log('PASS: root/subpath links/fonts and downloads, all five lazy real adapters, failure/retry, latest selection, classic and relocated offline parity');
    console.log(JSON.stringify(report,null,2));
  } finally {
    await browser.close(); await Promise.all([server,subpath.server,classicHttp.server].map(item=>new Promise(resolve=>item.close(resolve))));
    fs.rmSync(temporary,{recursive:true,force:true});
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
