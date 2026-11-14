/* Public, credential-free metadata. Importing/peeking never starts a request. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PaletteLibraryMetrics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
 'use strict';
 const sources=['github','release','npm'];
 const count=n=>Number.isSafeInteger(n)&&n>=0;
 const date=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 const timestamp=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(s)&&date(s.slice(0,10))&&Number.isFinite(Date.parse(s));
 function describe(library){
  if(!library||!/^[-\w]+$/.test(library.id)||!/^[-\w.]+\/[-\w.]+$/.test(library.repo)||typeof library.npmPackage!=='string'||!/^(@[-\w.]+\/)?[-\w.]+$/.test(library.npmPackage))throw Error('Invalid library metadata');
  const github='https://api.github.com/repos/'+library.repo;
  return {github,release:github+'/releases/latest',npm:'https://api.npmjs.org/downloads/point/last-week/'+encodeURIComponent(library.npmPackage)};
 }
 function validValue(source,value,library){
  if(!value||typeof value!=='object')return false;
  if(source==='github')return count(value.stars)&&value.repo===library.repo;
  if(source==='npm')return count(value.downloads)&&date(value.start)&&date(value.end)&&Date.parse(value.end)-Date.parse(value.start)===6*86400000&&value.package===library.npmPackage;
  return value.noRelease===true||value.noRelease===false&&typeof value.tag==='string'&&value.tag.trim().length>0&&timestamp(value.publishedAt)&&typeof value.url==='string'&&value.url.startsWith('https://github.com/'+library.repo+'/releases/');
 }
 function parse(source,body,library){
  const value=source==='github'?{stars:body?.stargazers_count,repo:library.repo}:source==='npm'?{downloads:body?.downloads,start:body?.start,end:body?.end,package:body?.package}:{noRelease:false,tag:body?.tag_name,name:typeof body?.name==='string'?body.name:'',publishedAt:body?.published_at,url:body?.html_url};
  if(!validValue(source,value,library))throw Error('Invalid '+source+' response');
  return value;
 }
 function createClient(options={}){
  const fetcher=options.fetch||((...args)=>root.fetch(...args)),now=options.now||Date.now;
  const ttl=options.ttlMs??3600000,timeout=options.timeoutMs??8000;
  let storage=options.storage;
  if(storage===undefined){try{storage=root.localStorage;}catch(_){storage=null;}}
  const cache=new Map(),inflight=new Map(),queue=[];
  let active=0;
  const key=(id,source)=>'palette-library-metrics:v1:'+id+':'+source;
  function hydrate(id,library){
   let records=cache.get(id);
   if(!records){records={};cache.set(id,records);
    for(const source of sources){try{
     const raw=JSON.parse(storage?.getItem(key(id,source))||'null'),saved=raw?.library;
     if(saved?.id!==id)continue;
     const urls=describe(saved);
     if(raw.sourceUrl!==urls[source]||!Number.isFinite(raw.fetchedAt)||raw.fetchedAt<0||raw.fetchedAt>now()||!validValue(source,raw.value,saved))continue;
     records[source]={value:raw.value,fetchedAt:raw.fetchedAt,sourceUrl:raw.sourceUrl,library:saved};
    }catch(_){/* Corrupt/blocked storage is optional; memory still works. */}}
   }
   if(library){const urls=describe(library);for(const source of sources)if(records[source]?.sourceUrl!==urls[source])delete records[source];}
   return records;
  }
  function snapshot(id,library,freshSources=[]){
   const records=hydrate(id,library),urls=library?describe(library):{};
   return Object.fromEntries(sources.map(source=>{
    const record=records[source],value=record?.value?{...record.value}:null;
    const state=!value?'unavailable':record.error||now()-record.fetchedAt>=ttl?'stale':freshSources.includes(source)?'fresh':'cached';
    return [source,{value,fetchedAt:record?.fetchedAt??null,sourceUrl:record?.sourceUrl||urls[source]||null,state,error:record?.error||null,attemptedAt:record?.attemptedAt??null,retryAt:record?.retryAt??null}];
   }));
  }
  function acquire(){if(active<3){active++;return Promise.resolve();}return new Promise(resolve=>queue.push(resolve));}
  function release(){const next=queue.shift();if(next)next();else active--;}
  function retryTime(response){
   const retry=response.headers?.get('retry-after'),reset=response.headers?.get('x-ratelimit-reset');
   if(retry!==null&&retry!==undefined){const seconds=Number(retry);const result=Number.isFinite(seconds)&&seconds>=0?now()+seconds*1000:Date.parse(retry);if(Number.isFinite(result))return result;}
   if(reset!==null&&reset!==undefined&&Number.isFinite(Number(reset)))return Number(reset)*1000;
   return null;
  }
  async function request(source,url,library){
   await acquire(); // Waiting in the queue must not consume the request timeout.
   const controller=new AbortController();let timer;
   try{
    const work=(async()=>{
     const response=await fetcher(url,{signal:controller.signal,credentials:'omit',headers:{Accept:'application/json'}});
     if(source==='release'&&response.status===404)return {noRelease:true};
     if(!response.ok){const error=Error('HTTP '+response.status+(response.status===403||response.status===429?' · rate limit / access denied':''));error.retryAt=retryTime(response);throw error;}
     return parse(source,await response.json(),library);
    })();
    const deadline=new Promise((_,reject)=>{timer=setTimeout(()=>{reject(Error('Request timeout'));controller.abort();},timeout);});
    return await Promise.race([work,deadline]);
   }finally{clearTimeout(timer);release();}
  }
  function load(library,{force=false}={}){
   const urls=describe(library),id=library.id;
   if(inflight.has(id))return inflight.get(id);
   const records=hydrate(id,library),fresh=[];
   const promise=Promise.all(sources.map(async source=>{
    const previous=records[source];
    if(!force&&previous?.value&&!previous.error&&now()-previous.fetchedAt<ttl)return;
    try{
     const value=await request(source,urls[source],library);
     const record={value,fetchedAt:now(),sourceUrl:urls[source],library:{id,repo:library.repo,npmPackage:library.npmPackage}};
     records[source]=record;fresh.push(source);
     try{storage?.setItem(key(id,source),JSON.stringify(record));}catch(_){/* Keep the good in-memory value. */}
    }catch(error){records[source]={...previous,value:previous?.value||null,fetchedAt:previous?.fetchedAt??null,sourceUrl:urls[source],error:error?.name==='AbortError'?'Request aborted':String(error?.message||error),attemptedAt:now(),retryAt:error?.retryAt??null};}
   })).then(()=>snapshot(id,library,fresh)).finally(()=>inflight.delete(id));
   inflight.set(id,promise);return promise;
  }
  return {load,peek:id=>snapshot(id)};
 }
 return {createClient};
});
