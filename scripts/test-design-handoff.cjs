/* Offline, dependency-free contract and end-to-end generator tests. */
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const root = path.resolve(__dirname, "..");
const core = require("../data/handoff-core.js");
const catalog = JSON.parse(fs.readFileSync(path.join(root,"data/palettes.json"),"utf8"));
const fonts = JSON.parse(fs.readFileSync(path.join(root,"data/fonts.json"),"utf8"));
const icons = fs.readdirSync(path.join(root,"data/icon-parts")).filter((n)=>n.endsWith(".js"))
  .flatMap((file) => {
    const m=fs.readFileSync(path.join(root,"data/icon-parts",file),"utf8").match(/\.push\((\[[\s\S]*\])\);/);
    return JSON.parse(m[1]);
  });
const defaults = core.defaults(catalog, fonts, icons);
const testCases = [
  {fonts:{body:"inter",code:"jetbrains-mono",source:"local-only"},icons:["house"]},
  {target:"existing-app",scope:"dark-only",layout:"existing",fonts:{body:"system",code:"system",source:"system"},icons:["house","search"]},
  {target:"existing-app",scope:"light-only",layout:"workflow",fonts:{body:"system",code:"system",source:"system"},icons:["check"]},
  {target:"new-app",scope:"both",layout:"dashboard",fonts:{body:"pretendard",code:"d2coding",source:"local-only"},icons:["shield-check"]},
];
assert.equal(catalog.palettes.length,32);
assert.deepEqual(core.normalize({fonts:{source:"system",body:"pretendard",code:"d2coding"}},catalog,fonts,icons).fonts,
  {body:"system",code:"system",source:"system"});
assert.equal(icons.length,95);
assert.throws(() => core.normalize({palette:"not-a-palette"},catalog,fonts,icons),/Invalid palette/);
assert.throws(() => core.normalize({icons:["../../../secret"]},catalog,fonts,icons),/Invalid icon/);
assert.throws(() => core.normalize({scope:"all-modes"},catalog,fonts,icons),/Invalid scope/);
const english = core.normalize({fonts:{body:'inter',code:'jetbrains-mono',source:'local-only'}},catalog,fonts,icons);
assert(core.chosenFonts(english,fonts).some(f=>f?.id==='d2coding'),'English code font must ship its Korean fallback');
assert(core.fontCSS(english,fonts).includes('unicode-range:'),'Unicode subsets must retain their glyph ranges');
assert(core.fontCSS(english,fonts).includes('"JetBrains Mono", "D2Coding"'),'Export must match the preview Korean fallback stack');
const temp = fs.mkdtempSync(path.join(os.tmpdir(),"palette-handoff-test-"));
try {
  testCases.forEach((testCase, index) => {
    const chosen = core.normalize({...testCase,project:"Test App"},catalog,fonts,icons);
    const css = core.themeCSS(chosen,catalog);
    assert(css.includes("--color-accent:"));
    assert(!css.includes("color-mix("));
    assert(!/--color-accent:\s*var\(/.test(css));
    if (chosen.scope==="dark-only") assert(!css.includes(':root[data-theme="light"]'));
    if (chosen.scope==="light-only") assert(!css.includes(':root[data-theme="dark"]'));
    if (chosen.scope==="both") {
      assert(css.includes(':root[data-theme="light"]'));
      assert(css.includes(':root[data-theme="dark"]'));
    }
    const dir=path.join(temp,"case"+index);
    const arg=["scripts/create-design-handoff.cjs","--out",dir,"--project","Test App",
      "--target",chosen.target,"--scope",chosen.scope,"--layout",chosen.layout,
      "--font-source",chosen.fonts.source,"--body-font",chosen.fonts.body,
      "--code-font",chosen.fonts.code,"--icons",chosen.icons.join(",")];
    execFileSync(process.execPath,arg,{cwd:root,stdio:"pipe"});
    execFileSync(process.execPath,[...arg,"--check"],{cwd:root,stdio:"pipe"});
    const generated=JSON.parse(fs.readFileSync(path.join(dir,"design-profile.json"),"utf8"));
    assert.equal(generated.scope,chosen.scope);
    assert.equal(generated.icons.names.length,chosen.icons.length);
    assert(fs.existsSync(path.join(dir,"design.md")));
    assert(fs.existsSync(path.join(dir,"AGENT-TASK.md")));
    assert(fs.existsSync(path.join(dir,"QA-CHECKLIST.md")));
    assert(fs.existsSync(path.join(dir,"icons",chosen.icons[0]+".svg")));
    const cssFile=fs.readFileSync(path.join(dir,"selected-theme.css"),"utf8");
    assert.equal(cssFile,css);
    if (chosen.fonts.source==="local-only") {
      assert(fs.existsSync(path.join(dir,"fonts","pretendard","OFL.txt")));
      assert(fs.readdirSync(path.join(dir,"fonts","pretendard")).some(n=>n.endsWith(".woff2")));
      assert(!fs.readFileSync(path.join(dir,"selected-fonts.css"),"utf8").includes("https://"));
    }
    // Correctly reject drift and leave files unmodified.
    fs.appendFileSync(path.join(dir,"design.md"),"tampered");
    const drift=spawnSync(process.execPath,[...arg,"--check"],{cwd:root,encoding:"utf8"});
    assert.notEqual(drift.status,0);
    assert.match(drift.stderr,/drift/);
  });
  const configPath=path.join(temp,"browser-config.json");
  fs.writeFileSync(configPath,JSON.stringify({palette:"graphite-plum",layout:"content",scope:"dark-only",
    target:"existing-app",fonts:{body:"system",code:"system",source:"system"},icons:["book-open"]}));
  const configOut=path.join(temp,"from-config");
  execFileSync(process.execPath,["scripts/create-design-handoff.cjs","--config",configPath,"--out",configOut],{cwd:root});
  assert.equal(JSON.parse(fs.readFileSync(path.join(configOut,"design-profile.json"))).palette,"graphite-plum");
  console.log(JSON.stringify({palettes:32,icons:95,scopes:3,fontModes:2,driftDetection:true,pass:true}));
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}

// Catalog selections extend the same browser/CLI contract. Keep both in CI's existing entry point.
require('./test-design-catalog.cjs');

require("./test-navigation-designs.cjs");

require("./test-dashboard-components.cjs");
