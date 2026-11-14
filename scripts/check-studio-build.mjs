/* Regenerate and fail on committed runtime drift or non-deterministic web output.
 * Like the canonical generator checks, this intentionally regenerates files. */
import {readFile,readdir} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const generated=['index.html','START-HERE.html','assets/studio.js','assets/library-preview-LICENSES.txt','css','data'];
async function fingerprint(entries) {
  const hashes={};
  async function visit(file) {
    const absolute=path.join(root,file);
    const data=await readFile(absolute);
    hashes[file]=createHash('sha256').update(data).digest('hex');
  }
  async function walk(directory) {
    for (const item of (await readdir(path.join(root,directory),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))) {
      const file=path.join(directory,item.name);
      if(item.isDirectory())await walk(file); else await visit(file);
    }
  }
  for(const entry of entries) {
    if(!existsSync(path.join(root,entry))) continue;
    if(path.extname(entry))await visit(entry);else await walk(entry);
  }
  return hashes;
}
const before=await fingerprint(generated);
const webBefore=await fingerprint(['out/web']);
const run=(mode='production')=>execFileSync(process.platform==='win32'?'npm.cmd':'npm',['run','build'],{cwd:root,stdio:'inherit',env:{...process.env,NODE_ENV:mode}});
run();
assert.deepEqual(await fingerprint(generated),before,'Generated classic/standalone sources drifted; commit npm run build outputs.');
const webAfter=await fingerprint(['out/web']);
if(Object.keys(webBefore).length)assert.deepEqual(webAfter,webBefore,'Web artifact drifted since previous build.');
else {run('development');assert.deepEqual(await fingerprint(['out/web']),webAfter,'Web output is not reproducible.');}
console.log('PASS: committed generated sources and deterministic web/offline output (production build environment)');
