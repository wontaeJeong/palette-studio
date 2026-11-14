/* Real client tests: only public HTTP and storage boundaries are controlled. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const apiPath=require('node:path').resolve(__dirname,'../library-metrics.js');
const library={id:'base-ui',repo:'mui/base-ui',npmPackage:'@base-ui/react'};
const epoch=1794614400000;
const repoURL='https://api.github.com/repos/mui/base-ui';
const npmURL='https://api.npmjs.org/downloads/point/last-week/%40base-ui%2Freact';
const github={id:879536680,name:'base-ui',full_name:'mui/base-ui',stargazers_count:123456,html_url:'https://github.com/mui/base-ui'};
const release={id:1,tag_name:'v1.9.0',name:'v1.9.0',published_at:'2026-11-10T12:00:00Z',html_url:'https://github.com/mui/base-ui/releases/tag/v1.9.0'};
const npm={downloads:2345678,start:'2026-11-07',end:'2026-11-13',package:'@base-ui/react'};
const response=(body,status=200,headers={})=>({ok:status>=200&&status<300,status,headers:{get:key=>headers[key.toLowerCase()]??null},json:async()=>body});
function moduleAPI(){if(!fs.existsSync(apiPath))return {};return require(apiPath);}
function fixtures(overrides={},seen=[]){return async(url)=>{seen.push(url);return overrides[url]||response(url===repoURL?github:url===repoURL+'/releases/latest'?release:npm);};}
function memory(){const map=new Map();return {map,getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};}
function client(options={}){const api=moduleAPI();assert.equal(typeof api.createClient,'function','createClient must provide the public metadata client');return api.createClient({fetch:fixtures(),storage:memory(),now:()=>epoch,...options});}
test('uses exact public endpoints; returns exact stars/downloads and npm dates, preserves zero',async()=>{
 const seen=[];const c=client({fetch:fixtures({},seen)});assert.equal(c.peek(library.id).github.state,'unavailable');assert.equal(seen.length,0);
 const r=await c.load(library);assert.deepEqual(seen.sort(),[repoURL,repoURL+'/releases/latest',npmURL].sort());
 assert.equal(r.github.value.stars,123456);assert.equal(r.npm.value.downloads,2345678);assert.equal(r.npm.value.start,'2026-11-07');assert.equal(r.npm.value.end,'2026-11-13');assert.equal(r.npm.value.package,'@base-ui/react');assert.equal(r.release.value.tag,'v1.9.0');
 for(const source of ['github','release','npm']){assert.equal(r[source].state,'fresh');assert.equal(r[source].fetchedAt,epoch);assert.ok(r[source].sourceUrl.startsWith('https://'));}
 const zero=await client({fetch:fixtures({[repoURL]:response({...github,stargazers_count:0}),[npmURL]:response({...npm,downloads:0})})}).load(library);assert.equal(zero.github.value.stars,0);assert.equal(zero.npm.value.downloads,0);
});
test('rejects negative, nonnumeric and unsafe counts without inventing zero',async()=>{
 for(const invalid of [-1,'12',NaN,Number.MAX_SAFE_INTEGER+1]){const r=await client({fetch:fixtures({[repoURL]:response({...github,stargazers_count:invalid}),[npmURL]:response({...npm,downloads:invalid})})}).load(library);assert.equal(r.github.value,null);assert.equal(r.npm.state,'unavailable');assert.match(r.github.error,/invalid/i);}
});
test('rejects invalid npm dates and package mismatch, and malformed releases',async()=>{
 for(const delta of [{start:'2026-02-30'},{end:'2026-11-01'},{start:'2026-11-13'},{start:'2026-10-14'},{package:'another-package'},{downloads:null}]){const r=await client({fetch:fixtures({[npmURL]:response({...npm,...delta})})}).load(library);assert.equal(r.npm.value,null);assert.equal(r.github.value.stars,123456);}
 for(const delta of [{tag_name:''},{published_at:'bad'},{published_at:'2026'},{published_at:'2026-02-30T12:00:00Z'},{html_url:'javascript:alert(1)'}]){const r=await client({fetch:fixtures({[repoURL+'/releases/latest']:response({...release,...delta})})}).load(library);assert.equal(r.release.value,null);}
});
test('keeps independent successful sources on partial failure; release 404 means no latest published non-prerelease release',async()=>{
 const r=await client({fetch:fixtures({[npmURL]:response({},503),[repoURL+'/releases/latest']:response({},404)})}).load(library);
 assert.equal(r.github.state,'fresh');assert.equal(r.npm.value,null);assert.match(r.npm.error,/503/);assert.equal(r.release.state,'fresh');assert.equal(r.release.value.noRelease,true);
});
test('reports rate limits and retry times per source without credential requirement',async()=>{
 const r=await client({fetch:fixtures({[repoURL]:response({},403,{'x-ratelimit-reset':String(epoch/1000+60)}),[npmURL]:response({},429,{'retry-after':'120'})})}).load(library);
 assert.match(r.github.error,/403/);assert.equal(r.github.retryAt,epoch+60000);assert.match(r.npm.error,/429/);assert.equal(r.npm.retryAt,epoch+120000);assert.equal(r.release.state,'fresh');
});
test('TTL caches each source independently and failures retain last success as stale',async()=>{
 let time=epoch,calls=0,fail=false;const storage=memory();const c=client({storage,now:()=>time,fetch:async(url)=>{calls++;return fail&&url===npmURL?response({},500):fixtures()(url);}});
 await c.load(library);assert.equal(calls,3);time+=1000;const cached=await c.load(library);assert.equal(calls,3);assert.equal(cached.github.state,'cached');
 time+=3600000;fail=true;const stale=await c.load(library);assert.equal(stale.npm.state,'stale');assert.equal(stale.npm.value.downloads,2345678);assert.equal(stale.npm.fetchedAt,epoch);assert.match(stale.npm.error,/500/);assert.equal(stale.github.state,'fresh');
 const freshClient=client({storage,now:()=>time,fetch:async(url)=>{calls++;return fixtures()(url);}});const restored=freshClient.peek(library.id);assert.equal(restored.npm.value.downloads,2345678);assert.equal(restored.npm.state,'stale');
 calls=0;await freshClient.load(library);assert.equal(calls,1,'only stale npm source is requested');
});
test('force refresh deduplicates in-flight loads, caps source concurrency at three',async()=>{
 let active=0,max=0,calls=0;const c=client({fetch:async(url)=>{active++;max=Math.max(max,active);calls++;await new Promise(r=>setTimeout(r,10));active--;return fixtures()(url);}});
 const first=c.load(library,{force:true});assert.strictEqual(c.load(library,{force:true}),first);
 const other={...library,id:'second'};await Promise.all([first,c.load(other,{force:true})]);assert.equal(calls,6);assert.equal(max,3);assert.equal(c.peek('second').npm.value.downloads,2345678);
});
test('timeouts and external abort errors settle; a late ignored response cannot overwrite cache',async()=>{
 let aborted=0;const c=client({timeoutMs:10,fetch:(url,{signal})=>new Promise(resolve=>{signal.addEventListener('abort',()=>aborted++);setTimeout(()=>resolve(response(url===repoURL?github:url===repoURL+'/releases/latest'?release:npm)),40);})});
 const r=await c.load(library);assert.equal(r.github.value,null);assert.match(r.npm.error,/timeout/i);assert.equal(aborted,3);await new Promise(r=>setTimeout(r,50));assert.equal(c.peek(library.id).github.value,null);
 const abortedClient=client({fetch:async()=>{throw Object.assign(Error('aborted'),{name:'AbortError'});}});assert.match((await abortedClient.load(library)).github.error,/abort/i);
});
test('queued requests receive their timeout only after a concurrency slot is acquired',async()=>{
 const c=client({timeoutMs:60,fetch:async(url)=>{await new Promise(r=>setTimeout(r,40));return fixtures()(url);}});
 const results=await Promise.all([c.load(library),c.load({...library,id:'queued'})]);for(const r of results)assert.equal(r.npm.state,'fresh');
});
test('blocked storage methods and localStorage getter do not block display or later refresh',async()=>{
 for(const storage of [{getItem(){throw Error('blocked');},setItem(){throw Error('quota');}}, {getItem(){return '{broken';},setItem(){throw Error('quota');}}]){const c=client({storage});assert.equal((await c.load(library)).github.value.stars,123456);assert.equal((await c.load(library,{force:true})).npm.value.downloads,2345678);}
 const context={module:{exports:{}},setTimeout,clearTimeout,AbortController};Object.defineProperty(context,'localStorage',{get(){throw Error('blocked getter');}});vm.runInNewContext(fs.readFileSync(apiPath,'utf8'),context);const c=context.module.exports.createClient({fetch:fixtures(),now:()=>epoch});assert.equal((await c.load(library)).github.state,'fresh');
});
test('malformed cache records cannot masquerade as successful metrics',async()=>{
 const storage=memory();await client({storage}).load(library);for(const [key,value] of storage.map){const record=JSON.parse(value);record.value={stars:-10,downloads:'bad',tag:'x'};storage.map.set(key,JSON.stringify(record));}
 const c=client({storage});assert.equal(c.peek(library.id).github.value,null);assert.equal(c.peek(library.id).npm.value,null);assert.equal((await c.load(library)).github.value.stars,123456);
});
