/* Compile the exact pure recipe outputs, not a handwritten facsimile. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const here=path.dirname(fileURLToPath(import.meta.url)),require=createRequire(import.meta.url);
const core=require('../../data/handoff-core.js'),catalog=require('../../data/palettes.json'),fonts=require('../../data/fonts.json');
const manifest=JSON.parse(fs.readFileSync(path.join(here,'package.json'),'utf8'));
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'palette-recipe-types-'));
try{
 fs.symlinkSync(path.join(here,'node_modules'),path.join(temp,'node_modules'),'dir');
 for(const uiLibrary of ['base-ui','radix','react-aria','mui','mantine']){
  const config=core.normalize({uiLibrary,fonts:{source:'system'}},catalog,fonts,[]);
  const files=core.libraryFiles(config,catalog),directory=path.join(temp,uiLibrary);fs.mkdirSync(directory);
  for(const [file,body]of Object.entries(files))fs.writeFileSync(path.join(directory,file),body);
  for(const [name,version]of Object.entries(JSON.parse(files['library-packages.json']).dependencies))assert.equal(manifest.dependencies[name],version,'tested/recipe version parity '+name);
 }
 fs.writeFileSync(path.join(temp,'tsconfig.json'),JSON.stringify({compilerOptions:{target:'ES2020',module:'ESNext',moduleResolution:'Bundler',jsx:'react-jsx',strict:true,skipLibCheck:true,esModuleInterop:true,noEmit:true},include:['**/*.tsx','**/*.ts']}));
 execFileSync(process.execPath,[path.join(here,'node_modules/typescript/bin/tsc'),'--project',path.join(temp,'tsconfig.json')],{stdio:'inherit'});
 console.log('All five generated recipes compile; dependency versions match the tested manifest.');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
