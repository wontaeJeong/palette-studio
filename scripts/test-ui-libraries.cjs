#!/usr/bin/env node
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '..');
const core = require('../data/handoff-core.js');
const catalog = require('../data/palettes.json');
const fonts = require('../data/fonts.json');
const icons = fs.readdirSync(path.join(root,'data/icon-parts')).flatMap(f => JSON.parse(fs.readFileSync(path.join(root,'data/icon-parts',f),'utf8').match(/\.push\((\[[\s\S]*\])\);/)[1]));
// Removing normalization or the shared recipe/export path must fail these contracts.
assert.equal(core.normalize({},catalog,fonts,icons).uiLibrary, 'vanilla', 'legacy config must explicitly default to vanilla');
assert.throws(()=>core.normalize({uiLibrary:'shadcn'},catalog,fonts,icons), /uiLibrary/);
const libraries = require('../data/ui-libraries.js');
assert.deepEqual(libraries.libraries.map(l=>l.id), ['vanilla','base-ui','radix','react-aria','mui','mantine']);
assert.equal(libraries.normalize(), 'vanilla');
assert.throws(()=>libraries.normalize('unknown'), /uiLibrary/);
assert.equal(libraries.get('radix').npmPackage, '@radix-ui/react-dialog');
const existing=core.normalize({uiLibrary:'mui',target:'existing-app',designSelection:require('../data/design-catalog.js').selection('studio')},catalog,fonts,icons);
const task=core.agentTask(existing,catalog);
assert(task.indexOf('Preserve the existing component library')>0&&task.indexOf('Preserve the existing component library')<task.indexOf('Inline handoff'),'existing library preservation is the first existing-app instruction');
for (const id of libraries.libraries.map(l=>l.id)) {
 const config=core.normalize({uiLibrary:id,palette:'forest-mint',scope:'dark-only',framework:'astro',fonts:{source:'system'}},catalog,fonts,icons);
 assert.equal(core.profile(config,catalog).uiLibrary,id);
 const recipe=libraries.recipe(config,catalog);
 assert.deepEqual(core.libraryFiles(config,catalog), recipe.files);
 assert(recipe.files['library-README.md'].includes('existing'), 'existing library preservation is required');
 if(id==='vanilla') continue;
 const theme=recipe.files['library-theme.ts'];
 assert.deepEqual(Object.keys(JSON.parse(theme.match(/export const modes = ([\s\S]*?) as const;/)[1])),['dark']);
 const light=libraries.recipe({...config,scope:'light-only',framework:'vanilla'},catalog);
 assert.deepEqual(Object.keys(JSON.parse(light.files['library-theme.ts'].match(/export const modes = ([\s\S]*?) as const;/)[1])),['light']);
 assert.match(light.files['library-README.md'],/vanilla HTML target.*React root\/runtime/);
 assert(theme.includes(catalog.palettes.find(p=>p.id===config.palette).modes.dark['--color-accent']), 'real selected HEX');
 assert(!theme.includes(catalog.palettes.find(p=>p.id===config.palette).modes.light['--color-canvas']), 'dark-only must exclude light colors');
 assert(theme.includes('return existing'), 'excluded color branch preserves existing theme');
 assert.match(recipe.files['library-README.md'], /React.*island|React.*runtime/);
 assert.match(recipe.files['library-README.md'], /Astro/);
 assert.match(recipe.files['library-components.tsx'], /import.*from/);
 assert.match(recipe.files['library.css'], /focus-visible/);
 assert.match(recipe.files['library-README.md'], /portal/i);
 if(['radix','base-ui'].includes(id)) {
  const css=recipe.files['shadcn-tokens.css'],tokens=catalog.palettes.find(p=>p.id===config.palette).modes.dark;
  assert(css.includes('--background: '+tokens['--color-canvas']));
  assert(css.includes('--muted: '+tokens['--color-surface-soft']));
  assert(css.includes('--accent: '+tokens['--color-accent-subtle']));
  assert(!css.includes('undefined'));
  for(const declaration of css.matchAll(/--[a-z-]+: ([^;]+);/g)) assert(/^#[0-9a-fA-F]{6}$/.test(declaration[1])||declaration[0].startsWith('--radius:'),'literal mapped token '+declaration[0]);
 }
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'palette-library-'));
 try {
  const configFile=path.join(out,'input.json');fs.writeFileSync(configFile,JSON.stringify(config));
  cp.execFileSync(process.execPath,[path.join(root,'scripts/create-design-handoff.cjs'),'--config',configFile,'--out',path.join(out,'export')]);
  for(const [file,body] of Object.entries(recipe.files)) assert.equal(fs.readFileSync(path.join(out,'export',file),'utf8'),body, 'CLI/shared UI recipe parity '+file);
 } finally {fs.rmSync(out,{recursive:true,force:true});}
}
assert(fs.readFileSync(path.join(root,'START-HERE.html'),'utf8').includes('id="library-third-party-notices"'),'standalone HTML preserves full third-party notices');
console.log('UI library contracts: PASS (legacy, validation, scope, recipes, runtime disclosure and CLI parity)');
