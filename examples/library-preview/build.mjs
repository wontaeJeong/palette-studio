import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';
import postcss from 'postcss';
import selectorParser from 'postcss-selector-parser';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..');
const resolve=p=>path.join(here,p);
const result=await build({entryPoints:[resolve('src/index.tsx')],bundle:true,format:'iife',globalName:'PaletteLibraryPreview',outfile:path.join(root,'assets/library-preview.js'),platform:'browser',target:['es2020'],minify:true,define:{'process.env.NODE_ENV':'"production"'},metafile:true,legalComments:'external'});
// Mantine ships a global reset. Scope its parsed selectors, including root/color-scheme selectors.
const scopePlugin={postcssPlugin:'palette-library-scope',Rule(rule){
 if(rule.parent?.type==='atrule'&&/keyframes$/.test(rule.parent.name))return;
 rule.selector=selectorParser(selectors=>selectors.each(selector=>{
  let scopedRoot=false;
  selector.walkPseudos(node=>{if(node.value===':root'||node.value===':host'){node.replaceWith(selectorParser.className({value:'ps-library'}));scopedRoot=true;}});
  selector.walkTags(node=>{if(node.value==='body'){node.replaceWith(selectorParser.className({value:'ps-library'}));scopedRoot=true;}});
  if(!scopedRoot){selector.prepend(selectorParser.combinator({value:' '}));selector.prepend(selectorParser.className({value:'ps-library'}));}
 })).processSync(rule.selector);
}};
let vendor='';
for(const pkg of ['@mantine/core','@mantine/notifications']){
 const css=fs.readFileSync(resolve('node_modules/'+pkg+'/styles.css'),'utf8');
 vendor+=(await postcss([scopePlugin]).process(css,{from:undefined})).css+'\n';
}
const css=(vendor+fs.readFileSync(resolve('src/preview.css'),'utf8')).split('\n').map(line=>line.trimEnd()).join('\n');
fs.writeFileSync(path.join(root,'assets/library-preview.css'),css);
const sources={shared:fs.readFileSync(resolve('src/shared.tsx'),'utf8'),css};
for(const id of ['base-ui','radix','react-aria','mui','mantine'])sources[id]=fs.readFileSync(resolve('src/'+id+'.tsx'),'utf8');
fs.writeFileSync(path.join(root,'data/library-sources.js'),'/* Generated from examples/library-preview/src by build.mjs. */\n(function(root){const sources='+JSON.stringify(sources)+';if(typeof module==="object"&&module.exports)module.exports=sources;else root.PaletteLibrarySources=sources;})(globalThis);\n');
// Preserve full licenses for every bundled package, including transitives.
const packages=new Map();
const shipped=new Set(Object.values(result.metafile.outputs).flatMap(output=>Object.entries(output.inputs).filter(([,info])=>info.bytesInOutput>0).map(([file])=>file)));
for(const file of shipped){
 if(!file.includes('node_modules/'))continue;
 let directory=path.dirname(path.resolve(here,file));
 while(directory.startsWith(here)){
  const manifest=path.join(directory,'package.json');
  if(fs.existsSync(manifest)){
   const data=JSON.parse(fs.readFileSync(manifest,'utf8'));
   if(data.name&&data.version){packages.set(data.name,{directory,data});break;}
  }
  directory=path.dirname(directory);
 }
}
let notices='Palette Studio offline library preview — third-party notices\nGenerated from the pinned package-lock.json; retain when redistributing the bundle.\n';
for(const [name,{directory,data}]of [...packages].sort((a,b)=>a[0].localeCompare(b[0]))){
 const licenses=fs.readdirSync(directory).filter(f=>/^(licen[sc]e|notice|copying)(\.|$|-)/i.test(f)&&fs.statSync(path.join(directory,f)).isFile());
 const fallback=resolve('licenses/'+name.replaceAll('/','-')+'-'+data.version+'-LICENSE.txt');
 if(!licenses.length&&!fs.existsSync(fallback))throw Error('Missing full license for bundled package '+name);
 notices+='\n\n'+'='.repeat(72)+'\n'+name+'@'+data.version+' ('+data.license+')\n';
 if(!licenses.length)notices+='\nPreserved upstream license (see examples/library-preview/licenses/README.md)\n'+fs.readFileSync(fallback,'utf8');
 for(const file of licenses)notices+='\n'+file+'\n'+fs.readFileSync(path.join(directory,file),'utf8')+'\n';
}
fs.writeFileSync(path.join(root,'assets/library-preview-LICENSES.txt'),notices.split('\n').map(line=>line.trimEnd()).join('\n'));
console.log('Built classic offline bundle, scoped CSS, shared recipe sources and '+packages.size+' full package notices.');
