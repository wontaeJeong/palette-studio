/* End-to-end contract for one selection, one workspace and one export boundary. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    await require("./check-dashboard-browser.cjs")({checkBundle:true});
    await require("./check-component-gallery.cjs")();
    await require("./check-preset-recommendations.cjs")(browser);
    await require("./check-preset-recommendations.cjs")(
      browser,
      "START-HERE.html",
    );
    await require("./check-inline-previews.cjs")(browser);
    await require("./check-inline-previews.cjs")(browser, "catalog.html");
    await require("./check-inline-previews.cjs")(browser, "START-HERE.html");
    await require("./check-workspace-review.cjs")(browser);
    await require("./check-navigation-browser.cjs")(browser);
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      acceptDownloads: true,
    });
    await context.route(/^https?:/, (r) => r.abort());
    const page = await context.newPage(),
      errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const url = pathToFileURL(path.resolve(__dirname, "../index.html")).href;
    await page.goto(url + "#fontSource=local-only");
    assert.equal(
      await page.locator("#workspace").count(),
      1,
      "one continuous workspace",
    );
    assert.equal(
      await page.locator("[data-step], header nav a").count(),
      0,
      "no feature tabs or tool navigation",
    );
    assert.equal(await page.locator("#export-dialog").isVisible(), false);
    assert.equal(await page.locator("[data-set]").count(), 6);
    await page
      .locator("[data-project-search]")
      .first()
      .fill("no matching project");
    assert.equal(
      await page
        .locator("[data-project-preview]")
        .first()
        .locator(".mock-projects tbody tr:visible")
        .count(),
      0,
    );
    assert.equal(await page.locator('[data-project-preview]').first().locator('.dashboard-data tbody tr[hidden]').count(),0,'project search leaves chart data intact');
    await page.locator("[data-project-search]").first().fill("");
    await page
      .locator('.mock-form [name="project"]')
      .first()
      .fill("새로운 작업");
    await page.locator('.mock-form button[type="submit"]').first().click();
    assert.equal(
      await page
        .locator("[data-project-preview]")
        .first()
        .locator(".mock-projects tbody tr")
        .count(),
      4,
    );
    await page.evaluate(() => {
      const c = PaletteCatalog.getConfig();
      PaletteCatalog.update({
        designSelection: {
          ...c.designSelection,
          navigation: "hybrid",
          components: {
            ...c.designSelection.components,
            card: "solid",
            button: "solid",
          },
        },
      });
    });
    assert.equal(
      await page.locator("[data-project-preview] .mock-secondary-nav").count(),
      2,
      "hybrid includes top and side navigation",
    );
    assert.equal(
      await page
        .locator(".mock-projects h4")
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      await page
        .locator(".mock-form button")
        .first()
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      "solid card has accent header",
    );
    await page.locator('[data-set="precision"]').click();
    await page.selectOption("#catalog-palette", "warm-sage");
    await page.locator("#typography-options > summary").click();
    await page.selectOption("#body-font", "suit");
    await page.selectOption("#code-font", "jetbrains-mono");
    let c = await page.evaluate(() => PaletteCatalog.getConfig());
    assert.equal(c.fonts.body, "suit");
    assert.equal(c.fonts.code, "jetbrains-mono");
    await page.locator("#components-options > summary").click();
    await page.locator('[data-component="toast"]').click();
    await page.locator('#variant-picker [data-variant="solid"]').click();
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      () => document.activeElement.dataset.component === "toast",
    );
    assert.equal(
      await page
        .locator('[data-component="toast"]')
        .evaluate((e) => e === document.activeElement),
      true,
    );
    await page.locator("#icons-options summary").click();
    await page.fill("#workspace-icon-search", "house");
    await page.locator('[data-select-icon="house"]').check();
    assert.equal(
      new URL(page.url()).pathname,
      new URL(url).pathname,
      "all edits happen in one document",
    );
    c = await page.evaluate(() => PaletteCatalog.getConfig());
    assert(c.icons.includes("house"));
    assert.equal(c.designSelection.components.toast, "solid");
    assert.equal(
      await page.locator("#preview-panel [data-project-preview]").count(),
      2,
    );
    await page.selectOption("#preview-mode", "compare");
    await page.selectOption("#compare-palette", "slate-blue");
    const pp = await page
      .locator("[data-project-preview]")
      .evaluateAll((es) => es.map((e) => e.dataset.palette));
    assert.deepEqual(pp, ["warm-sage", "slate-blue"]);
    await page.locator("#open-export").click();
    await page.fill("#project-name", "My App!");
    await page.locator("#scope").focus();
    await page.selectOption("#scope", "dark-only");
    assert.equal(
      await page.locator("#project-name").inputValue(),
      "My App!",
      "invalid draft survives unrelated setting edits",
    );
    assert(await page.locator("#export-error").isVisible());
    assert(await page.locator("#download-config").isDisabled());
    await page.fill("#project-name", "Unified Project");
    await page.selectOption("#target", "existing-app");
    await page.selectOption("#scope", "dark-only");
    const outputs = await page.evaluate(() => PaletteWorkspace.outputs());
    assert(outputs["AGENT-TASK.md"].includes("toast: solid"));
    assert.equal(JSON.parse(outputs["design-profile.json"]).fonts.body, "suit");
    assert(!outputs["selected-theme.css"].includes(":root:not("));
    assert(outputs["selected-theme.css"].includes('[data-theme="dark"]'));
    await page
      .locator("#export-dialog details")
      .first()
      .locator("summary")
      .click();
    const cliDir = await fs.mkdtemp(
      path.join(require("node:os").tmpdir(), "workspace-cli-"),
    );
    try {
      const input = path.join(cliDir, "input.json");
      await fs.writeFile(
        input,
        JSON.stringify(await page.evaluate(() => PaletteCatalog.getConfig())),
      );
      require("node:child_process").execFileSync(process.execPath, [
        path.resolve(__dirname, "create-design-handoff.cjs"),
        "--config",
        input,
        "--out",
        path.join(cliDir, "out"),
      ]);
      for (const [name, expected] of Object.entries(outputs))
        assert.equal(
          await fs.readFile(path.join(cliDir, "out", name), "utf8"),
          expected,
          "browser/CLI parity: " + name,
        );
    } finally {
      await fs.rm(cliDir, { recursive: true, force: true });
    }
    const wait = page.waitForEvent("download");
    await page.locator('[data-export="design-profile.json"]').click();
    const download = await wait;
    assert.equal(download.suggestedFilename(), "design-profile.json");
    const actual = JSON.parse(await fs.readFile(await download.path(), "utf8"));
    assert.equal(actual.project, "Unified Project");
    await page.keyboard.press("Escape");
    assert.equal(
      await page
        .locator("#open-export")
        .evaluate((e) => e === document.activeElement),
      true,
    );
    const shared = await page.evaluate(() => PaletteWorkspace.shareURL());
    const fresh = await context.newPage();
    await fresh.goto(shared);
    assert.deepEqual(
      await fresh.evaluate(() => PaletteCatalog.getConfig()),
      await page.evaluate(() => PaletteCatalog.getConfig()),
    );
    await fresh.close();
    await page.reload();
    assert.equal(
      (await page.evaluate(() => PaletteCatalog.getConfig())).project,
      "Unified Project",
    );
    await page.locator('[data-set="bloom"]').click();
    c = await page.evaluate(() => PaletteCatalog.getConfig());
    assert.equal(c.scope, "dark-only");
    assert.equal(c.target, "existing-app");
    assert.equal(c.project, "Unified Project");
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "overflow at " + width,
      );
      if (width < 1000) {
        await page.locator("#toggle-preview").click();
        await page
          .locator("#typography-options")
          .evaluate((e) => (e.open = true));
        await page.locator("#body-font").focus();
        const control = await page.locator("#body-font").boundingBox(),
          dock = await page.locator("#preview-panel").boundingBox();
        assert(
          control.y + control.height <= dock.y,
          "focused editor remains above dock",
        );
      }
    }
    // Legacy links and corrupt browser storage must not override explicit choices.
    await page.evaluate(() =>
      localStorage.setItem("palette-studio-handoff-v1", "broken"),
    );
    await page.goto(
      url + "#palette=warm-sage&fontSource=local-only&target=existing-gate",
    );
    await page.reload();
    assert.equal(
      (await page.evaluate(() => PaletteCatalog.getConfig())).palette,
      "warm-sage",
    );
    assert.equal(
      (await page.evaluate(() => PaletteCatalog.getConfig())).scope,
      "dark-only",
    );
    await page.evaluate(() =>
      localStorage.setItem(
        "palette-studio-handoff-v1",
        JSON.stringify({ fonts: { body: "obsolete-font" } }),
      ),
    );
    await page.goto(
      url + "#palette=warm-sage&fontSource=local-only&target=existing-gate",
    );
    await page.reload();
    const recovered = await page.evaluate(() => PaletteCatalog.getConfig());
    assert.equal(
      recovered.palette,
      "warm-sage",
      "explicit palette survives stale font setting",
    );
    assert.equal(
      recovered.scope,
      "dark-only",
      "explicit scope survives stale font setting",
    );
    for (const stale of [[], 42, "old-format"]) {
      await page.evaluate(
        (value) =>
          localStorage.setItem(
            "palette-studio-handoff-v1",
            JSON.stringify(value),
          ),
        stale,
      );
      await page.goto(
        url + "#palette=warm-sage&fontSource=local-only&target=existing-gate",
      );
      await page.reload();
      assert.equal(
        (await page.evaluate(() => PaletteCatalog.getConfig())).palette,
        "warm-sage",
        "explicit link survives non-object saved data",
      );
    }
    await page.goto(shared.replace("#selection=", "#catalogConfig="));
    await page.reload();
    assert.equal(
      (await page.evaluate(() => PaletteCatalog.getConfig())).project,
      "Unified Project",
    );
    await page.locator("#open-export").click();
    await page.fill("#project-name", "");
    assert.equal(await page.locator("#download-config").isDisabled(), true);
    await page.keyboard.press("Escape");
    await page.locator("#open-export").click();
    assert.equal(
      await page.locator("#download-config").isDisabled(),
      false,
      "reopening review discards invalid project draft",
    );
    await page.keyboard.press("Escape");
    // At the limit, selection can still be removed and replaced.
    await page.evaluate(() =>
      PaletteCatalog.update({
        icons: PALETTE_ICON_PARTS.flat()
          .slice(0, 24)
          .map((i) => i.name),
      }),
    );
    await page.locator("#icons-options").evaluate((e) => (e.open = true));
    assert(await page.locator("#icon-selection-status").innerText());
    const firstIcon = await page
      .locator("[data-select-icon]:checked")
      .first()
      .getAttribute("data-select-icon");
    await page.locator(`[data-select-icon="${firstIcon}"]`).uncheck();
    assert.equal(
      (await page.evaluate(() => PaletteCatalog.getConfig())).icons.length,
      23,
    );
    // The selected token and style values reach real project scopes in both modes.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.selectOption("#preview-mode", "split");
    for (const p of require("../data/palettes.json").palettes) {
      await page.selectOption("#catalog-palette", p.id);
      for (const mode of ["light", "dark"]) {
        const actual = await page
          .locator(`[data-project-preview][data-theme="${mode}"]`)
          .evaluate((el) =>
            Object.fromEntries(
              PALETTE_KIT.tokens.map((t) => [
                t.token,
                getComputedStyle(el)
                  .getPropertyValue(t.token)
                  .trim()
                  .toUpperCase(),
              ]),
            ),
          );
        assert.deepEqual(actual, p.modes[mode]);
      }
    }
    for (const style of require("../data/palettes.json").styles) {
      await page.selectOption("#catalog-style", style.id);
      assert.equal(
        await page
          .locator("[data-project-preview]")
          .first()
          .evaluate((el) =>
            getComputedStyle(el).getPropertyValue("--ui-height").trim(),
          ),
        style.height,
      );
    }
    assert.deepEqual(errors, []);
    const report = {
      result: "pass",
      browser: browser.version(),
      themes: 64,
      styles: 6,
      viewports: [360, 390, 768, 1440],
      checks: [
        "single workspace without feature tabs",
        "live search and project creation",
        "independent fonts",
        "interactive component treatments",
        "24-icon selection limit",
        "browser and CLI output parity",
        "dark-only export",
        "share and reload",
        "legacy and corrupt storage recovery",
        "invalid project draft preserved",
        "hybrid navigation and card preview fidelity",
        "mobile focus visibility",
      ],
      errors,
    };
    for (const name of [
      "studio-flow-check-results.json",
      "browser-check-results.json",
    ])
      await fs.writeFile(
        path.resolve(__dirname, "../data", name),
        JSON.stringify(report, null, 2) + "\n",
      );
    console.log(
      "PASS: unified workspace, fonts/components/icons, export parity, scope, share, reload, comparison and mobile",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
