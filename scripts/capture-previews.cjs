/* Real Chromium captures of Palette Studio, Icon Studio and Agent Handoff.
 * Run: NODE_PATH=/path/to/playwright node scripts/capture-previews.cjs
 * Captures are intentionally deterministic: offline, same Chromium, fixed
 * viewport, local fonts. Metrics replay the checked-in real observation as cache;
 * its actual query timestamps remain visible (not current live counts).
 */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { pathToFileURL } = require("node:url");
const root = path.resolve(__dirname, "..");
const previewDir = path.join(root, "previews");
const sha = (data) => crypto.createHash("sha256").update(data).digest("hex");
const pathsToHash = [
  "index.html",
  "app.js",
  "css/studio.css",
  "css/foundation.css",
  "css/styles.css",
  "css/utilities.css",
  "css/palettes.css",
  "font-loader.js",
  "data/catalog.js",
  "data/font-catalog.js",
  "data/fonts.json",
  "icons.html",
  "icons.js",
  "css/icon-studio.css",
  "handoff.html",
  "handoff.js",
  "css/handoff.css",
  "data/handoff-core.js",
  "ui-theme.js",
  "css/tool-theme.css",
  "catalog.html",
  "catalog.js",
  "css/catalog.css",
  "data/design-catalog.js",
  "data/ui-presets.js",
  "workspace.js",
  "css/workspace.css",
  "component-demos.js",
  "data/design-concepts.js",
  "css/concepts.css",
  "library-workspace.js",
  "library-metrics.js",
  "css/library-workspace.css",
  "data/ui-libraries.js",
  "data/library-sources.js",
  "assets/library-preview.js",
  "assets/library-preview.css",
  "assets/library-preview-LICENSES.txt",
  "examples/library-preview/package.json",
  "examples/library-preview/package-lock.json",
  "examples/library-preview/build.mjs",
  ...fs.readdirSync(path.join(root, "examples/library-preview/src")).sort().map(file => "examples/library-preview/src/" + file),
  "previews/library-metrics-observation.json",
  "scripts/capture-previews.cjs",
  ...fs
    .readdirSync(path.join(root, "data/icon-parts"))
    .filter((file) => file.endsWith(".js"))
    .sort()
    .map((file) => "data/icon-parts/" + file),
];
const screenshots = [
  "studio-overview-light.png",
  "studio-overview-dark.png",
  "studio-fonts-desktop.png",
  "studio-mobile-light.png",
  "studio-mobile-dark.png",
  "icon-studio-desktop.png",
  "icon-studio-dark.png",
  "icon-studio-mobile.png",
  "agent-handoff-desktop.png",
  "agent-handoff-dark.png",
  "agent-handoff-mobile.png",
  "design-catalog-desktop.png",
  "design-catalog-components.png",
  "design-catalog-detail.png",
  "design-catalog-mobile.png",
  "design-catalog-layout.png",
  "design-catalog-motion.png",
  "design-catalog-ui-dark.png",
  "studio-concepts-desktop.png",
  "studio-toast-desktop.png",
  "studio-popover-mobile.png",
  ...["base-ui", "radix", "react-aria", "mui", "mantine"].map(id => "studio-library-" + id + ".png"),
  "studio-library-metrics-light.png",
  "studio-library-metrics-dark.png",
  "studio-library-metrics-mobile.png",
];
function sourceHash() {
  return sha(
    pathsToHash
      .map((file) => file + "\0" + sha(fs.readFileSync(path.join(root, file))))
      .join("\n"),
  );
}
async function main() {
  const { chromium } = require("playwright");
  fs.mkdirSync(previewDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const captured = [];
  let pageErrors = [];
  async function open(file, hash, width, height) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      locale: "ko-KR",
      colorScheme: "light",
      reducedMotion: "reduce",
      serviceWorkers: "block",
    });
    // Only repository-local, offline assets influence the screenshot.
    await context.route(/^https?:\/\//, (route) =>
      route.abort("blockedbyclient"),
    );
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.on("pageerror", (e) => pageErrors.push(file + ": " + e.message));
    await page.goto(
      pathToFileURL(path.join(root, file)).href + (hash ? "#" + hash : ""),
      { waitUntil: "load" },
    );
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    return { page, context };
  }
  async function shoot(page, filename, opts = {}) {
    if (!opts.keepScroll) await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: path.join(previewDir, filename),
      animations: "disabled",
      caret: "hide",
      fullPage: Boolean(opts.fullPage),
    });
    const file = fs.readFileSync(path.join(previewDir, filename));
    if (
      file.length < 8000 ||
      file.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a"
    )
      throw Error("Empty/invalid PNG: " + filename);
    const width = file.readUInt32BE(16),
      height = file.readUInt32BE(20);
    if (width < 360 || height < 500)
      throw Error(
        "Unrealistic PNG dimensions " + filename + " " + width + "x" + height,
      );
    captured.push({
      path: filename,
      width,
      height,
      bytes: file.length,
      sha256: sha(file),
    });
    console.log(
      "captured",
      filename,
      width + "x" + height,
      file.length + " bytes",
    );
  }
  try {
    // Main palette selector: actual application UI in desktop Light and Dark.
    {
      const { page, context } = await open(
        "index.html",
        "step=palette&palette=slate-blue&style=operational&mode=light&fontSource=local-only&bodyFont=pretendard&codeFont=d2coding",
        1440,
        980,
      );
      await page.locator("[data-project-preview]").first().waitFor();
      await shoot(page, "studio-overview-light.png");
      await page.selectOption("#preview-mode", "dark");
      await shoot(page, "studio-overview-dark.png");
      await page.locator("#typography-options > summary").click();
      await page.locator(".font-library > summary").click();
      await page.locator("#body-font-gallery").scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () =>
          [...document.querySelectorAll(".font-card")].length === 24 &&
          [...document.querySelectorAll(".font-card")].every(
            (el) => el.dataset.previewSource,
          ),
      );
      await shoot(page, "studio-fonts-desktop.png", { keepScroll: true });
      await context.close();
    }
    // Mobile showcase uses expandable real preview dock, not a scaled desktop image.
    {
      const { page, context } = await open(
        "index.html",
        "step=palette&palette=slate-blue&style=operational&mode=light&fontSource=local-only&bodyFont=pretendard&codeFont=d2coding",
        390,
        844,
      );
      await page.locator("#toggle-preview").click();
      await shoot(page, "studio-mobile-light.png");
      await page.selectOption("#preview-mode", "dark");
      await shoot(page, "studio-mobile-dark.png");
      await context.close();
    }
    // Icon Studio: selected category reduces vertical noise, both themes visible.
    {
      const { page, context } = await open(
        "icons.html",
        "palette=slate-indigo&mode=split&variant=accent&size=24&stroke=2",
        1460,
        990,
      );
      await page.locator('[data-category="identity"]').click();
      await page.locator('[data-icon="shield-check"]').first().click();
      await shoot(page, "icon-studio-desktop.png");
      await page.selectOption("#icon-palette", "graphite-plum");
      await page.selectOption("#icon-mode", "dark");
      await page.selectOption("#icon-variant", "duotone");
      await shoot(page, "icon-studio-dark.png");
      await context.close();
    }
    {
      const { page, context } = await open(
        "icons.html",
        "palette=slate-indigo&mode=light&variant=accent",
        390,
        844,
      );
      await page.locator('[data-category="identity"]').click();
      await page.locator('[data-icon="shield-check"]').first().click();
      await shoot(page, "icon-studio-mobile.png", { fullPage: true });
      await context.close();
    }
    // Agent Handoff: generated design rationale and live UI beside the settings.
    {
      const { page, context } = await open(
        "handoff.html",
        "palette=slate-teal&style=operational&target=new-app&scope=both&layout=dashboard&framework=react&fontSource=system&bodyFont=system&codeFont=system",
        1460,
        990,
      );
      await page.locator("#ah-preview-grid .ah-mock").first().waitFor();
      await shoot(page, "agent-handoff-desktop.png");
      await page.locator('[data-mode="dark"]').click();
      await shoot(page, "agent-handoff-dark.png");
      await context.close();
    }
    {
      const { page, context } = await open(
        "handoff.html",
        "palette=slate-teal&style=operational&target=new-app&scope=both&layout=workflow&framework=react&fontSource=system&bodyFont=system&codeFont=system",
        390,
        844,
      );
      await page.locator("#ah-preview-grid .ah-mock").first().waitFor();
      await shoot(page, "agent-handoff-mobile.png", { fullPage: true });
      await context.close();
    }
    // Set-first library and real interactive component detail.
    {
      const { page, context } = await open("catalog.html", "", 1440, 1200);
      await page.locator('[data-set="studio"]').waitFor();
      await shoot(page, "design-catalog-desktop.png");
      await page.locator("#component-grid").scrollIntoViewIfNeeded();
      await shoot(page, "design-catalog-components.png", { keepScroll: true });
      await page.locator('[data-component="dialog"]').click();
      await shoot(page, "design-catalog-detail.png");
      await page.keyboard.press("Escape");
      await page.selectOption("#catalog-navigation", "hybrid");
      await page.locator("#layout-options").scrollIntoViewIfNeeded();
      await shoot(page, "design-catalog-layout.png", { keepScroll: true });
      await page.selectOption("#catalog-motion", "extended");
      await page.locator("#motion-options").scrollIntoViewIfNeeded();
      await shoot(page, "design-catalog-motion.png", { keepScroll: true });
      await page.click("#ui-theme");
      await shoot(page, "design-catalog-ui-dark.png");
      await context.close();
    }
    {
      const { page, context } = await open("catalog.html", "", 390, 844);
      await page.locator('[data-set="studio"]').waitFor();
      await shoot(page, "design-catalog-mobile.png", { fullPage: true });
      await context.close();
    }
    // New vocabulary, polished real overlays and actual locally bundled libraries.
    {
      const {page,context}=await open("index.html","fontSource=system&bodyFont=system&codeFont=system",1440,1100);
      await page.locator(".concept-section").scrollIntoViewIfNeeded();
      await shoot(page,"studio-concepts-desktop.png",{keepScroll:true});
      await page.evaluate(()=>{const c=PaletteCatalog.getConfig();PaletteCatalog.update({designSelection:{...c.designSelection,concept:"soft"}});document.querySelector("#components-options").open=true;});
      await page.locator('[data-component="toast"]').click();
      await page.locator('#detail-demo [data-theme="dark"] [data-toast-status="success"]').first().click();
      await page.locator('#detail-demo [data-theme="dark"] [data-toast-status="warning"]').click();
      await page.locator('.toast-item').first().hover();
      await shoot(page,"studio-toast-desktop.png");
      await context.close();
    }
    {
      const {page,context}=await open("index.html","fontSource=system&bodyFont=system&codeFont=system",390,1000);
      await page.evaluate(()=>{const c=PaletteCatalog.getConfig();PaletteCatalog.update({designSelection:{...c.designSelection,concept:"tactile"}});document.querySelector("#components-options").open=true;});
      await page.locator('[data-component="popover"]').click();
      await page.locator('#detail-demo [data-theme="dark"] [data-demo="popover"]').click();
      await shoot(page,"studio-popover-mobile.png");
      await context.close();
    }
    for(const id of ["base-ui","radix","react-aria","mui","mantine"]){
      const {page,context}=await open("index.html","fontSource=system&bodyFont=system&codeFont=system",1440,1100);
      await page.evaluate(id=>{const c=PaletteCatalog.getConfig();PaletteCatalog.update({uiLibrary:id,designSelection:{...c.designSelection,concept:"soft"}});document.querySelector("#library-options").open=true;},id);
      await page.locator(`[data-library-card="${id}"]`).scrollIntoViewIfNeeded();
      await page.locator('.library-preview').scrollIntoViewIfNeeded();
      await shoot(page,"studio-library-"+id+".png",{keepScroll:true});
      await context.close();
    }
    // Actual one-card source snapshot collected by smoke-library-metrics.cjs.
    // No fixtures or live requests during capture; cache labels/times are real.
    const observation=JSON.parse(fs.readFileSync(path.join(previewDir,"library-metrics-observation.json"),"utf8"));
    if(observation.responses.length!==3||observation.responses.some(r=>r.status!==200)||Object.keys(observation.records).length!==3)throw Error("Metrics observation is not a successful live snapshot");
    for(const width of [1440,390]){
      const {page,context}=await open("index.html","fontSource=system&bodyFont=system&codeFont=system",width,1100);
      await page.evaluate(records=>{for(const [key,value] of Object.entries(records))localStorage.setItem(key,JSON.stringify(value));},observation.records);
      await page.reload();await page.locator("#library-options").evaluate(el=>el.open=true);
      await page.locator('[data-library-card="base-ui"]').scrollIntoViewIfNeeded();
      await shoot(page,width===390?"studio-library-metrics-mobile.png":"studio-library-metrics-light.png",{keepScroll:true});
      if(width===1440){await page.click("#ui-theme");await page.locator('[data-library-card="base-ui"]').scrollIntoViewIfNeeded();await shoot(page,"studio-library-metrics-dark.png",{keepScroll:true});}
      if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1))throw Error("Metrics capture page overflow "+width);
      await context.close();
    }
    if (pageErrors.length)
      throw Error("Page errors:\n" + pageErrors.join("\n"));
    if (
      captured
        .map((x) => x.path)
        .sort()
        .join() !== screenshots.slice().sort().join()
    )
      throw Error("Screenshot list drift");
    const manifest = {
      schemaVersion: 1,
      engine: "Chromium (Playwright)",
      browserVersion: browser.version(),
      deviceScaleFactor: 1,
      network: "offline",
      metricsEvidence: {path:"library-metrics-observation.json",kind:"actual public API observation replayed as cache",capturedAt:observation.capturedAt},
      sourceFiles: pathsToHash,
      sourceHash: sourceHash(),
      screenshots: captured,
    };
    fs.writeFileSync(
      path.join(previewDir, "screenshots.json"),
      JSON.stringify(manifest, null, 2) + "\n",
    );
    console.log(
      "Wrote previews/screenshots.json (" + captured.length + " screenshots)",
    );
  } finally {
    await browser.close();
  }
}
if (require.main === module)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
module.exports = { sourceHash, screenshots, pathsToHash };
