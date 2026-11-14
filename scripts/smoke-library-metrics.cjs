#!/usr/bin/env node
/* Optional live smoke, deliberately separate from deterministic CI.
 * Refreshes exactly one card (Base UI), recording actual public responses/cache.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve(__dirname,'..'),browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1100},locale:'ko-KR'}),responses=[];
  page.on('response',response=>{if(/^https:\/\/(api.github.com|api.npmjs.org)\//.test(response.url()))responses.push({url:response.url(),status:response.status()});});
  await page.goto(pathToFileURL(path.join(root,'index.html')).href+'#fontSource=system&bodyFont=system&codeFont=system');
  await page.locator('#library-options').evaluate(el=>el.open=true);assert.equal(responses.length,0);
  await page.locator('[data-refresh-library="base-ui"]').click();
  await page.waitForFunction(()=>!document.querySelector('[data-refresh-library="base-ui"]').disabled,{},{timeout:15000});
  const observation=await page.evaluate(()=>({schemaVersion:1,capturedAt:new Date().toISOString(),pageOrigin:'file://index.html',network:'live public APIs; one explicit Base UI refresh',library:PaletteUILibraries.get('base-ui'),records:Object.fromEntries(Object.keys(localStorage).filter(key=>key.startsWith('palette-library-metrics:v1:base-ui:')).map(key=>[key,JSON.parse(localStorage.getItem(key))])),renderedText:document.querySelector('[data-library-metrics="base-ui"]').innerText}));
  observation.responses=responses;
  fs.writeFileSync(path.join(root,'previews/library-metrics-observation.json'),JSON.stringify(observation,null,2)+'\n');
  await page.locator('[data-library-card="base-ui"]').scrollIntoViewIfNeeded();await page.screenshot({path:'/private/tmp/task3-live-metrics.png'});
  assert.equal(responses.length,3);assert(responses.every(r=>r.status===200),'live source not successful; see saved observation');assert.equal(Object.keys(observation.records).length,3);
  console.log(JSON.stringify({status:'PASS',capturedAt:observation.capturedAt,responses,values:Object.values(observation.records).map(r=>({sourceUrl:r.sourceUrl,value:r.value,fetchedAt:r.fetchedAt})),screenshot:'/private/tmp/task3-live-metrics.png'},null,2));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
