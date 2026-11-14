"use strict";
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
async function checkDashboard({ checkBundle = false } = {}) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
        viewport: { width: 1440, height: 1000 },
        reducedMotion: "reduce",
      }),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.route(/^https?:/, (r) => r.abort());
    const url =
      pathToFileURL(path.resolve(__dirname, "../index.html")).href +
      "#fontSource=system&bodyFont=system&codeFont=system";
    await page.goto(url);
    await page.locator("#components-options").evaluate((e) => (e.open = true));
    async function open(id) {
      await page.locator(`[data-component="${id}"]`).click();
      return page.locator("#detail-demo .preview-pane").first();
    }
    async function close() {
      await page.locator("#component-dialog [data-close]").first().click();
    }
    for (const id of [
      "bar-chart",
      "stacked-bar",
      "line-chart",
      "area-chart",
      "donut-chart",
      "pie-chart",
      "histogram",
      "scatter-chart",
      "heatmap",
      "sparkline",
    ]) {
      const pane = await open(id);
      assert.equal(
        await pane.locator(`[data-dashboard-demo="${id}"] svg`).count(),
        1,
        `${id} chart shown`,
      );
      assert.equal(
        await pane.locator("details table caption").count(),
        1,
        `${id} data alternative`,
      );
      await pane.locator("details summary").click();
      assert(await pane.locator("details table").isVisible());
      assert((await pane.locator("details tbody tr").count()) >= 3);
      await close();
    }
    let pane = await open("slider");
    await pane.locator("input[type=range]").fill("75");
    assert.equal(await pane.locator("output").textContent(), "75%");
    assert.equal(
      await page
        .locator("#detail-demo .preview-pane")
        .nth(1)
        .locator("output")
        .textContent(),
      "40%",
    );
    await close();
    pane = await open("file-upload");
    await pane
      .locator("input[type=file]")
      .setInputFiles({
        name: "report.csv",
        mimeType: "text/csv",
        buffer: Buffer.from("name,value\na,1"),
      });
    assert(
      (await pane.locator("[data-file-status]").textContent()).includes(
        "report.csv",
      ),
    );
    await close();
    pane = await open("data-table");
    await pane.locator("[data-table-sort]").click();
    assert.equal(
      await pane.locator("tbody tr").first().locator("th").textContent(),
      "모바일 프로젝트",
    );
    assert.equal(
      await pane.locator("[aria-sort]").getAttribute("aria-sort"),
      "ascending",
    );
    await pane.locator("input[type=search]").fill("디자인");
    assert.equal(await pane.locator("tbody tr:visible").count(), 1);
    await pane.locator("input[type=search]").fill("없는 이름");
    assert(await pane.locator("[data-table-empty]").isVisible());
    await close();
    pane = await open("stepper");
    assert.equal(
      await pane.locator("[aria-current=step]").textContent(),
      "1. 준비 · 현재",
    );
    await pane.locator("[data-step-next]").click();
    assert.equal(
      await pane.locator("[aria-current=step]").textContent(),
      "2. 검토 · 현재",
    );
    await pane.locator("[data-step-next]").click();
    assert(await pane.locator("[data-step-next]").isDisabled());
    await pane.locator("[data-step-prev]").click();
    assert.equal(
      await pane.locator("[aria-current=step]").textContent(),
      "2. 검토 · 현재",
    );
    await close();
    pane = await open("error-state");
    await pane.locator("[data-retry]").click();
    assert.equal(
      await pane.locator("[data-retry-status]").textContent(),
      "샘플 데이터를 불러왔습니다.",
    );
    await close();
    pane = await open("radio");
    await pane.getByLabel("매주").check();
    assert(
      await page
        .locator("#detail-demo .preview-pane")
        .nth(1)
        .getByLabel("매일")
        .isChecked(),
    );
    await close();
    pane = await open("progress");
    assert.equal(
      await pane.getByRole("progressbar").getAttribute("aria-valuenow"),
      "68",
    );
    await close();
    pane = await open("spinner");
    assert.equal(
      await pane
        .locator(".dashboard-spinner")
        .evaluate((e) => getComputedStyle(e).animationName),
      "none",
    );
    await close();
    await open("bar-chart");
    await page.locator("[data-variant=outline]").click();
    await close();
    await page.reload();
    assert.equal(
      await page.evaluate(
        () =>
          PaletteCatalog.getConfig().designSelection.components["bar-chart"],
      ),
      "outline",
    );
    const out = await page.evaluate(() => PaletteWorkspace.outputs());
    assert.equal(
      JSON.parse(out["design-profile.json"]).designSelection.components[
        "bar-chart"
      ],
      "outline",
    );
    assert(out["AGENT-TASK.md"].includes("Bar chart"));
    for (const id of [
      "metric",
      "bar-chart",
      "line-chart",
      "donut-chart",
      "progress",
    ])
      assert.equal(
        await page
          .locator(`#project-stage [data-dashboard-demo="${id}"]`)
          .count(),
        2,
        `${id} dashboard in both modes`,
      );
    const series = page
      .locator('#project-stage [data-dashboard-demo="bar-chart"] svg rect')
      .first();
    const before = await series.evaluate((e) => getComputedStyle(e).fill);
    await page.selectOption("#catalog-palette", "stone-emerald");
    assert.notEqual(
      await series.evaluate((e) => getComputedStyle(e).fill),
      before,
    );
    await page.selectOption("#preview-mode", "compare");
    await page.selectOption("#compare-palette", "zinc-rose");
    const colors = await page
      .locator('#project-stage [data-dashboard-demo="bar-chart"]')
      .evaluateAll((es) =>
        es.map((e) => getComputedStyle(e.querySelector("rect")).fill),
      );
    assert.notEqual(colors[0], colors[1]);
    for (const width of [1440, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page
        .locator("#preview-panel")
        .evaluate((e) => e.classList.add("expanded"));
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        "page fits " + width,
      );
      const overflow = await page
        .locator("#project-stage .dashboard-sample")
        .evaluateAll((es) =>
          es
            .filter((e) => e.scrollWidth > e.clientWidth + 1)
            .map((e) => e.parentElement.dataset.dashboardDemo),
        );
      assert.deepEqual(overflow, [], "dashboard fits " + width);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#components-options").evaluate((e) => (e.open = true));
    pane = await open("bar-chart");
    assert(
      (await pane.locator("svg").boundingBox()).width >= 220,
      "mobile chart labels remain readable",
    );
    await close();
    if (checkBundle) {
      await page.goto(
        pathToFileURL(path.resolve(__dirname, "../START-HERE.html")).href +
          "#fontSource=system&bodyFont=system&codeFont=system",
      );
      assert.equal(
        await page
          .locator('#project-stage [data-dashboard-demo="bar-chart"]')
          .count(),
        2,
      );
      await page
        .locator("#components-options")
        .evaluate((e) => (e.open = true));
      await page.locator("#catalog-search").fill("히트맵");
      await page.locator('[data-component="heatmap"]').click();
      assert.equal(await page.locator("#detail-demo svg").count(), 2);
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: charts/data alternatives, native controls, sorting/filtering, steps/retry, mode isolation and saved/exported selections",
    );
  } finally {
    await browser.close();
  }
}
module.exports = checkDashboard;
if (require.main === module) checkDashboard({ checkBundle: Boolean(process.env.CHECK_BUNDLE) }).catch((e) => {
  console.error(e);
  process.exit(1);
});
