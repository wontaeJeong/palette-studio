"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const fs = require("node:fs/promises");
const os = require("node:os");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

const layouts = ["cards", "metric-strip", "status-distribution", "action-queue", "primary-stat", "exception-summary", "status-filters", "trend-rows", "target-progress"];

async function check() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    await page.route(/^https?:/, (r) => r.abort());
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve(__dirname, "../index.html")).href + "#fontSource=system");
    await page.locator('[data-set="studio"]').waitFor();
    assert.equal(await page.locator("#dashboard-layout-options").count(), 1, "dashboard presets have their own selector");
    await page.locator("#dashboard-layout-options > summary").click();
    await page.locator("#browse-dashboard-layouts").click();
    const gallery = page.locator("#dashboard-layout-dialog");
    assert(await gallery.isVisible());
    assert.equal(await gallery.locator("[data-dashboard-preset]").count(), layouts.length);
    for (const id of layouts) assert.equal(await gallery.locator(`[data-dashboard-preset="${id}"] [data-dashboard-layout="${id}"]`).count(), 1);
    await gallery.locator('[data-dashboard-gallery-mode="dark"]').click();
    assert.equal(await gallery.locator('.kpi-gallery-preview[data-theme="dark"]').count(), layouts.length);
    await gallery.locator('[data-dashboard-layout-choice="status-distribution"]').click();
    assert(!(await gallery.isVisible()));
    assert.equal(await page.locator("#dashboard-layout").inputValue(), "status-distribution");
    assert.equal(await page.locator("#project-stage [data-dashboard-layout=status-distribution]").count(), 2);
    const light = page.locator('[data-project-preview][data-theme="light"]');
    const dark = page.locator('[data-project-preview][data-theme="dark"]');
    const distribution = light.locator('[data-dashboard-layout="status-distribution"]');
    assert.match(await distribution.locator("[data-kpi-total]").innerText(), /12/);
    assert.equal(await distribution.locator('[data-segment="failed"]').count(), 0, "zero counts must not create a fake segment");
    assert.match(await distribution.locator('[data-status-count="failed"]').innerText(), /0/);
    const widthRatio = await distribution.locator('[data-segment="passed"]').evaluate((e) => e.getBoundingClientRect().width / e.parentElement.getBoundingClientRect().width);
    assert(Math.abs(widthRatio - 8 / 12) < 0.03, "completed segment represents the real fraction");
    await light.locator('.mock-form input[name="project"]').fill("새 프로젝트");
    await light.locator('.mock-form button[type="submit"]').click();
    assert.match(await distribution.locator("[data-kpi-total]").innerText(), /13/);
    assert.equal(await light.locator('[data-dashboard-demo="metric"]').count(), 0, "a non-card preset replaces the duplicate metric card");
    await page.selectOption("#dashboard-layout", "status-filters");
    await light.locator('[data-kpi-filter="review"]').click();
    assert.equal(await light.locator('[data-kpi-filter="review"]').getAttribute("aria-pressed"), "true");
    assert.equal(await light.locator('[data-kpi-filter-result] li').count(), 2, "review filter lists the real two items");
    assert.equal(await dark.locator('[data-kpi-filter="all"]').getAttribute("aria-pressed"), "true", "modes own separate filter interactions");
    await light.locator('[data-kpi-filter="failed"]').click();
    assert.match(await light.locator('[data-kpi-filter-result]').innerText(), /없습니다/);
    await page.selectOption("#dashboard-layout", "target-progress");
    const progress = light.locator('.kpi-summary [role="progressbar"]');
    assert.equal(await progress.getAttribute("aria-valuenow"), "8");
    assert.equal(await progress.getAttribute("aria-valuemax"), "10");
    await page.selectOption("#dashboard-layout", "status-filters");
    await page.locator('[data-set="console"]').click();
    assert.equal(await page.locator("#dashboard-layout").inputValue(), "status-filters");
    // Each layout must fit paired and single previews without clipping; gallery has no interactive sample controls.
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      if (width < 1000 && await page.locator("#toggle-preview").getAttribute("aria-expanded") === "false") await page.locator("#toggle-preview").click();
      for (const id of layouts) {
        await page.evaluate(id => PaletteCatalog.update({ designSelection: { dashboardLayout: id } }), id);
        const panes = page.locator(`#project-stage [data-dashboard-layout="${id}"]`);
        assert.equal(await panes.count(), 2);
        assert(await panes.evaluateAll(nodes => nodes.every(el => el.scrollWidth <= el.clientWidth + 1)), `${id} fits ${width}px paired preview`);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.selectOption("#dashboard-layout", "trend-rows");
    await page.reload();
    assert.equal(await page.locator("#dashboard-layout").inputValue(), "trend-rows");
    const out = await page.evaluate(() => PaletteWorkspace.outputs());
    assert.equal(JSON.parse(out["design-profile.json"]).designSelection.dashboardLayout, "trend-rows");
    assert.match(out["AGENT-TASK.md"], /Dashboard summary layout: .*\(trend-rows\)/);
    const shared = await page.evaluate(() => PaletteWorkspace.shareURL());
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "kpi-offline-"));
    try {
      const standalone = path.join(dir, "START-HERE.html");
      await fs.copyFile(path.resolve(__dirname, "../START-HERE.html"), standalone);
      await page.goto(pathToFileURL(standalone).href + new URL(shared).hash);
      assert.equal(await page.locator("#dashboard-layout").inputValue(), "trend-rows");
      assert.equal(await page.locator('#project-stage [data-dashboard-layout="trend-rows"] svg[role="img"]').count(), 4);
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
    assert.deepEqual(errors, []);
    console.log("PASS: gallery, selectable layout, honest status fractions, real filters, mobile fit, persistence and standalone export");
  } finally {
    await browser.close();
  }
}
if (require.main === module) check().catch(e => { console.error(e); process.exitCode = 1; });
module.exports = check;
