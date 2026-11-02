/* Optional build checks. Dependencies: tailwindcss@4 @tailwindcss/node@4 typescript@5.9.3 @types/react@19 ajv@8 */
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {compile}=require('@tailwindcss/node'),ts=require('typescript'),Ajv=require('ajv/dist/2020');
const root=path.resolve(__dirname,'..');
async function main(){
 const json=async p=>JSON.parse(await fs.readFile(path.join(root,p),'utf8'));
 const palette=await fs.readFile(path.join(root,'css/palettes/graphite-plum.css'),'utf8'),utilities=await fs.readFile(path.join(root,'css/tailwind-v4.css'),'utf8');
 const twRoot=path.dirname(require.resolve('tailwindcss/package.json'));
 const fonts=await fs.readFile(path.join(root,'css/fonts-cdn.css'),'utf8');
 const compiled=await compile(`@import "${twRoot.replaceAll('\\','/')}/index.css";\n${fonts}\n${palette}\n${utilities}`,{base:root,onDependency:()=>{}});
 const all=(await json('data/tokens.json')).flatMap(t=>Object.values(t.classes));
 const variants=['hover:cp-bg-accent-hover','focus-visible:cp-border-focus','active:cp-bg-accent-active','disabled:cp-text-disabled-fg'];
 const output=compiled.build([...all,...variants,'focus-visible:outline-3']);
 for(const c of all)assert(output.includes('.'+c),'Missing utility: '+c);
 for(const c of variants)assert(output.includes(c.replace(':','\\:')),'Missing variant: '+c);
 const reactRoot=path.dirname(require.resolve('@types/react/package.json'));
 const files=['examples/react/ThemeProvider.tsx','examples/react/ScanPanel.tsx','examples/react/ProjectPanel.tsx','examples/tailwind/Button.tsx'].map(p=>path.join(root,p));
 const options={noEmit:true,strict:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX,lib:['lib.es2022.d.ts','lib.dom.d.ts'],baseUrl:root,paths:{react:[path.join(reactRoot,'index.d.ts')],'react/jsx-runtime':[path.join(reactRoot,'jsx-runtime.d.ts')]}};
 const program=ts.createProgram(files,options),diagnostics=ts.getPreEmitDiagnostics(program);
 if(diagnostics.length){const message=ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCanonicalFileName:x=>x,getCurrentDirectory:()=>root,getNewLine:()=> '\n'});throw new Error(message);}
 const schema=await json('data/profile.schema.json'),validate=new Ajv({strict:false}).compile(schema);
 for(const p of ['examples/design-profile.example.json','data/qa-exported-profile.json']){assert(validate(await json(p)),JSON.stringify(validate.errors));}
 const result={tailwind:{version:require('tailwindcss/package.json').version,utilities:all.length,variants:variants.length,pass:true},reactTypes:{version:require('@types/react/package.json').version,files:files.length,strictTypeCheck:true,pass:true},typescript:{version:ts.version},profileSchema:{validatedInstances:2,pass:true},scope:'Source/build contracts only; no React runtime application test.'};
 await fs.writeFile(path.join(root,'data/integration-check-results.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
