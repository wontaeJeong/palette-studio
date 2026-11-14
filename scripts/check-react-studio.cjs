/* React editor ownership and state retention contract. */
const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const fs = require("node:fs/promises");
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.route(/^https?:/, (r) => r.abort());
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(
      pathToFileURL(path.resolve(__dirname, "../index.html")).href +
        "#fontSource=system",
    );
    assert.equal(
      await page.locator("#studio-root[data-react-studio]").count(),
      1,
      "unified editor must be owned by React",
    );
    assert.equal(
      await page
        .locator(
          'script[src="catalog.js"],script[src="workspace.js"],script[src="library-workspace.js"],script[src="assets/library-preview.js"]',
        )
        .count(),
      0,
      "main must not load legacy editor runtimes",
    );
    assert(
      await page
        .locator(
          "#catalog-palette, #body-font, #project-name, .mock-form, .mock-nav [data-nav-page]",
        )
        .evaluateAll((nodes) =>
          nodes.every((el) =>
            Object.keys(el).some((key) => key.startsWith("__reactFiber$")),
          ),
        ),
      "editor fields, project form and navigation are React host nodes",
    );
    await page.locator('[data-set="precision"]').click();
    await page.selectOption("#catalog-palette", "warm-sage");
    await page.locator("#typography-options").evaluate((e) => (e.open = true));
    await page.selectOption("#body-font", "suit");
    await page.locator(".font-library").evaluate((e) => (e.open = true));
    await page.fill("#body-font-search", "suit");
    await page.fill("#code-font-search", "mono");
    await page.locator("#icons-options").evaluate((e) => (e.open = true));
    await page.fill("#workspace-icon-search", "house");
    await page.locator('[data-select-icon="house"]').check();
    await page.locator("#components-options").evaluate((e) => (e.open = true));
    await page.fill("#catalog-search", "toast");
    await page.locator('[data-component="toast"]').click();
    await page.locator('[data-variant="solid"]').click();
    await page.keyboard.press("Escape");
    await page
      .locator("[data-project-preview]")
      .first()
      .locator('[data-nav-page="settings"]')
      .click();
    await page.locator("#open-export").click();
    await page.fill("#project-name", "Invalid!");
    await page.selectOption("#scope", "dark-only");
    assert.equal(await page.locator("#project-name").inputValue(), "Invalid!");
    assert(await page.locator("#download-config").isDisabled());
    await page.fill("#project-name", "React Project");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#body-font-search").inputValue(), "suit");
    assert.equal(await page.locator("#code-font-search").inputValue(), "mono");
    assert.equal(await page.locator("#catalog-search").inputValue(), "toast");
    assert.equal(
      await page.locator("[data-preview-settings]:visible").count(),
      2,
    );
    assert(
      await page.evaluate(() => {
        const c = PaletteCatalog.getConfig(),
          o = PaletteWorkspace.outputs();
        return (
          c.icons.includes("house") &&
          c.fonts.body === "suit" &&
          o["selected-theme.css"] === PaletteHandoff.themeCSS(c, PALETTE_KIT) &&
          o["AGENT-TASK.md"] === PaletteHandoff.agentTask(c, PALETTE_KIT)
        );
      }),
    );
    const dir = await fs.mkdtemp("/tmp/react-studio-offline-");
    try {
      await fs.copyFile(
        path.resolve(__dirname, "../START-HERE.html"),
        path.join(dir, "START-HERE.html"),
      );
      await page.goto(
        pathToFileURL(path.join(dir, "START-HERE.html")).href +
          "#fontSource=system",
      );
      assert.equal(
        await page
          .locator("#studio-root[data-react-studio] [data-set]")
          .count(),
        6,
      );
      await page.locator("#open-export").click();
      assert(await page.locator("#agent-brief").inputValue());
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
    assert.equal(
      await page.evaluate(() => window.PALETTE_EMBEDDED_NOTICES),
      await fs.readFile(
        path.resolve(__dirname, "../assets/library-preview-LICENSES.txt"),
        "utf8",
      ),
      "relocated standalone preserves the exact complete library notices",
    );
    assert(
      (
        await page.locator("#library-third-party-notices").textContent()
      ).includes("MIT"),
    );
    assert.equal(
      await page.locator("[data-library-license-link]").count(),
      0,
      "standalone never links to an unavailable adjacent notice file",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: React ownership, editing, retained drafts/search/page, canonical outputs and relocated standalone",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
