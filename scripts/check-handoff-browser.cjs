/* Playwright end-to-end check for handoff browser vs CLI contract. */
const { chromium } = require("playwright");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const assert = require("node:assert/strict");
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ acceptDownloads: true, viewport: {width: 1460, height: 960} });
  const errors=[];
  page.on("pageerror",(e)=>errors.push(String(e)));
  await page.goto(pathToFileURL(path.resolve(__dirname, "../handoff.html")).href);
  assert.equal(await page.locator("#ah-palette option").count(),32);
  assert((await page.locator("#ah-markdown-preview").textContent()).includes("# design.md"));
  await page.selectOption("#ah-palette","graphite-plum");
  await page.selectOption("#ah-target","existing-app");
  await page.selectOption("#ah-scope","dark-only");
  await page.selectOption("#ah-layout","content");
  await page.selectOption("#ah-framework","react");
  await page.selectOption("#ah-font-source","system");
  await page.selectOption("#ah-body-font","system");
  await page.selectOption("#ah-code-font","system");
  assert.equal(await page.locator("#ah-preview-grid .ah-mock").count(),2);
  const colors=await page.locator("#ah-preview-grid .ah-mock").evaluateAll((els)=>
    els.map((el)=>getComputedStyle(el).getPropertyValue("--color-accent").trim()));
  assert.notEqual(colors[0],colors[1]);
  const browserOutput=await page.evaluate(()=>window.PaletteAgentHandoff.outputs());
  assert(browserOutput["selected-theme.css"].includes(':root[data-theme="dark"]'));
  assert(!browserOutput["selected-theme.css"].includes(':root[data-theme="light"]'));
  assert(browserOutput["design.md"].includes("graphite-plum"));
  const download=await Promise.all([page.waitForEvent("download"),page.click("#ah-config-download")]);
  assert.equal(download[0].suggestedFilename(),"handoff-config.json");
  await page.selectOption("#ah-framework","astro");
  assert((await page.locator("#ah-markdown-preview").innerText()).includes("astro"));
  await page.setViewportSize({width:390,height:840});
  assert(await page.locator("#ah-config-download").isVisible());
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({palettes:32,modeContrast:true,selectedScope:"dark-only",
    exported:true,smallViewport:true,jsErrors:0,pass:true}));
  await browser.close();
  // Exercise the catalog-to-handoff journey through the existing CI browser entry point.
  require('./check-catalog-browser.cjs');
})().catch((e)=>{console.error(e);process.exitCode=1});
