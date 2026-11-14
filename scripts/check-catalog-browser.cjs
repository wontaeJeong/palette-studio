const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      acceptDownloads: true,
    });
    await context.route(/^https?:/, (r) => r.abort());
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    const url = pathToFileURL(path.resolve(__dirname, "../catalog.html")).href;
    await page.goto(url);
    assert.equal(await page.locator("[data-set]").count(), 6);
    assert.equal(
      await page.locator(".set-card > .set-pair > .set-mini").count(),
      12,
      "two sibling theme previews per set",
    );
    assert.equal(
      await page.locator(".set-card > .set-caption").count(),
      6,
      "captions remain outside thumbnails",
    );
    assert.equal(await page.locator("[data-component]").count(), 18);
    assert.equal(await page.locator("h1").innerText(), "디자인 도감");
    assert(
      await page
        .locator("#catalog-search")
        .evaluate((el) => el.getBoundingClientRect().top < innerHeight),
    );
    await page.locator('[data-set="precision"]').click();
    await page.locator("#recommended-only").check();
    assert.equal(await page.locator("[data-component]").count(), 6);
    assert.equal(
      await page
        .locator('#catalog-palette optgroup[label="권장 팔레트"] option')
        .count(),
      3,
    );
    assert(
      (await page.locator("#recommendation-reason").innerText()).includes(
        "입력",
      ),
    );
    await page.locator("#recommended-only").uncheck();

    assert.equal(await page.locator("#catalog-style").inputValue(), "outline");
    await page.fill("#catalog-search", "잠깐");
    assert.equal(await page.locator("[data-component]").count(), 1);
    await page.locator('[data-component="toast"]').click();
    await page.locator('#component-dialog [data-variant="solid"]').click();
    await page
      .locator(
        '#component-dialog .preview-pane[data-theme="light"] [data-demo="toast"]',
      )
      .click();
    assert(await page.locator("#demo-toast").isVisible());
    await page.locator("#dismiss-toast").click({ timeout: 2000 });
    assert(!(await page.locator("#demo-toast").isVisible()));
    await page.keyboard.press("Escape");
    assert(!(await page.locator("#component-dialog").isVisible()));
    await page.waitForFunction(
      () => document.activeElement.dataset.component === "toast",
    );
    assert(
      (await page.locator("#agent-brief").inputValue()).includes(
        "toast: solid",
      ),
    );
    await page.fill("#catalog-search", "없는컴포넌트");
    assert(await page.locator("#no-results").isVisible());
    await page.fill("#catalog-search", "");
    await page.selectOption("#catalog-category", "오버레이");
    assert.equal(await page.locator("[data-component]").count(), 3);
    await page.locator('[data-component="dialog"]').click();
    await page.locator('#component-dialog [data-variant="solid"]').click();
    await page
      .locator(
        '#component-dialog .preview-pane[data-theme="light"] [data-demo="dialog"]',
      )
      .click();
    assert.equal(
      await page.locator("#demo-dialog").getAttribute("data-treatment"),
      "solid",
    );
    assert.equal(
      await page
        .locator("#demo-dialog h2")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      await page
        .locator("#demo-dialog .primary")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    );
    assert(await page.locator("#demo-dialog").isVisible());
    await page.keyboard.press("Escape");
    await page.keyboard.press("Escape");
    await page.selectOption("#catalog-category", "all");
    const designBeforeTheme = await page.evaluate(() =>
      PaletteCatalog.getConfig(),
    );
    await page.click("#ui-theme");
    assert.deepEqual(
      await page.evaluate(() => PaletteCatalog.getConfig()),
      designBeforeTheme,
    );
    assert.equal(
      await page
        .locator('[data-component="button"]')
        .evaluate(
          (el) =>
            el.closest("article").querySelectorAll(".preview-pane").length,
        ),
      2,
    );
    await page.selectOption("#catalog-navigation", "hybrid");
    assert.equal(
      await page.locator("#navigation-preview .shell-side").count(),
      2,
    );
    await page.selectOption("#catalog-motion", "extended");
    await page
      .locator('[data-motion-play="slide"][data-motion-mode="light"]')
      .click();
    assert.equal(
      await page
        .locator("#motion-light-slide")
        .evaluate((el) => getComputedStyle(el).animationName),
      "ps-enter-slide",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    assert.equal(
      await page
        .locator("#motion-light-slide")
        .evaluate((el) => getComputedStyle(el).animationName),
      "none",
    );
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.selectOption("#catalog-palette", "warm-sage");
    assert.equal(
      (await page.evaluate(() => PaletteCatalog.getConfig())).designSelection
        .components.toast,
      "solid",
    );
    const before = await page.evaluate(() => PaletteCatalog.getConfig());
    await page.reload();
    assert.deepEqual(
      await page.evaluate(() => PaletteCatalog.getConfig()),
      before,
    );
    await page.locator(".jump").click();
    await page.evaluate(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.copiedSelection = text;
          },
        },
      }),
    );
    await page.click("#share-selection");
    const shared = await page.evaluate(() => window.copiedSelection);
    assert(new URL(shared).hash.includes("selection="));
    const fresh = await browser.newPage();
    await fresh.goto(shared);
    assert.deepEqual(
      await fresh.evaluate(() => PaletteCatalog.getConfig()),
      before,
    );
    await fresh.evaluate(() =>
      localStorage.setItem("palette-studio-handoff-v1", "broken"),
    );
    await fresh.goto(shared);
    await fresh.reload();
    assert.deepEqual(
      await fresh.evaluate(() => PaletteCatalog.getConfig()),
      before,
      "valid share link must override corrupt local storage",
    );
    await fresh.goto(url + "#selection=invalid");
    await fresh.reload();
    assert.equal(
      (await fresh.evaluate(() => PaletteCatalog.getConfig())).designSelection
        .set,
      "studio",
    );
    await fresh.evaluate(
      (config) =>
        localStorage.setItem(
          "palette-studio-handoff-v1",
          JSON.stringify({ ...config, icons: ["house"] }),
        ),
      before,
    );
    await fresh.goto(url);
    await fresh.reload();
    assert.deepEqual(
      (await fresh.evaluate(() => PaletteCatalog.getConfig())).icons,
      ["house"],
    );
    await fresh.evaluate(
      (config) =>
        localStorage.setItem(
          "palette-studio-handoff-v1",
          JSON.stringify({
            ...config,
            designSelection: undefined,
            scope: "dark-only",
            target: "existing-app",
            project: "Existing Project",
          }),
        ),
      before,
    );
    await fresh.goto(url);
    await fresh.reload();
    assert.equal(
      (await fresh.evaluate(() => PaletteCatalog.getConfig())).scope,
      "dark-only",
    );
    assert.equal(
      (await fresh.evaluate(() => PaletteCatalog.getConfig())).project,
      "Existing Project",
    );
    for (const value of [{}, null, [], 42, "bad"]) {
      await fresh.goto(
        url + "#selection=" + encodeURIComponent(JSON.stringify(value)),
      );
      await fresh.reload();
      assert.equal(await fresh.locator("[data-set]").count(), 6);
    }
    await fresh.close();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("#download-config"),
    ]);
    assert.equal(download.suggestedFilename(), "handoff-config.json");
    await page.click("#open-handoff");
    await page.waitForURL(/handoff\.html/);
    await page.waitForFunction(() => Boolean(window.PaletteAgentHandoff));
    assert.equal(
      (await page.evaluate(() => PaletteAgentHandoff.getConfig()))
        .designSelection.components.toast,
      "solid",
    );
    assert(
      (
        await page.evaluate(
          () => PaletteAgentHandoff.outputs()["AGENT-TASK.md"],
        )
      ).includes("toast: solid"),
    );
    await page.goBack();
    await page.locator('[data-set="bloom"]').click();
    assert.equal(
      (await page.evaluate(() => PaletteCatalog.getConfig())).designSelection
        .components.toast,
      "soft",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.locator('[data-component="switch"]').click();
    const switchColors = [];
    for (const v of ["soft", "outline", "solid"]) {
      await page
        .locator('#component-dialog [data-variant="' + v + '"]')
        .click();
      switchColors.push(
        await page
          .locator(
            '#component-dialog .preview-pane[data-theme="light"] .sample-switch',
          )
          .evaluate((el) => getComputedStyle(el).backgroundColor),
      );
    }
    assert.equal(new Set(switchColors).size, 3);
    assert(
      await page
        .locator(
          '#component-dialog .preview-pane[data-theme="light"] .sample-switch',
        )
        .evaluate((el) => el.getBoundingClientRect().width >= 40),
    );
    await page.keyboard.press("Escape");
    await page.locator('[data-component="accordion"]').click();
    await page.locator("#component-dialog summary").first().click();
    assert(
      (await page
        .locator("#component-dialog details")
        .first()
        .getAttribute("open")) !== null,
    );
    await page.keyboard.press("Escape");
    assert.deepEqual(errors, []);
    console.log(
      "PASS: offline catalog, sets, search, variants, dialogs, persistence, share, download, handoff, mobile",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
