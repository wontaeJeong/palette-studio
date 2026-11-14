const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
async function checkNavigation(browser, file = "index.html") {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
  });
  await context.route(/^https?:/, (r) => r.abort());
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const url = pathToFileURL(path.resolve(__dirname, "../" + file)).href;
  try {
    await page.goto(url + "#fontSource=local-only");
    assert.equal(
      await page.locator("[data-navigation-style]").count(),
      6,
      "six visual menu style choices",
    );
    await page.locator("#structure-options > summary").click();
    for (const navigation of ["left", "top", "hybrid"]) {
      await page.selectOption("#catalog-navigation", navigation);
      for (const structure of ["list", "grouped", "rail"]) {
        await page.selectOption("#catalog-navigationStructure", structure);
        const signatures = [];
        for (const style of [
          "edge",
          "underline",
          "pill",
          "fill",
          "outline",
          "dot",
        ]) {
          await page.locator(`[data-navigation-style="${style}"]`).click();
          const c = await page.evaluate(() => PaletteCatalog.getConfig());
          assert.equal(c.designSelection.navigationStyle, style);
          assert.equal(c.designSelection.navigationStructure, structure);
          const states = await page
            .locator('#project-stage .mock-nav [aria-current="page"]')
            .evaluateAll((es) =>
              es.map((e) => {
                const c = getComputedStyle(e),
                  n = getComputedStyle(e.closest(".ps-navigation"));
                return {
                  bg: c.backgroundColor,
                  nav: n.backgroundColor,
                  left: parseFloat(c.borderInlineStartWidth),
                  bottom: parseFloat(c.borderBottomWidth),
                  radius: c.borderRadius,
                  border: c.borderColor,
                  dot: getComputedStyle(e, "::before").content,
                };
              }),
            );
          assert.equal(states.length, 2, "one current item per theme");
          for (const s of states) {
            if (style === "edge") {
              assert.equal(s.bg, s.nav);
              assert.equal(s.left, 3);
            }
            if (style === "underline") {
              assert.equal(s.bg, s.nav);
              assert.equal(s.bottom, 3);
            }
            if (style === "pill") assert.equal(s.radius, "999px");
            if (style === "fill") assert.notEqual(s.bg, s.nav);
            if (style === "outline") {
              assert.equal(s.bg, s.nav);
              assert.equal(s.left, 2);
              assert(!s.border.includes("rgba"));
            }
            if (style === "dot") assert.equal(s.dot, '""');
          }
          signatures.push(JSON.stringify(states[0]));
        }
        assert.equal(
          new Set(signatures).size,
          6,
          "six distinct selected shapes with fixed palette",
        );
      }
    }
    const settings = page
      .locator("#project-stage .mock-nav")
      .first()
      .getByRole("button", { name: "설정", exact: true });
    await settings.focus();
    await page.keyboard.press("Enter");
    assert.equal(
      await page
        .locator('#project-stage .mock-nav button[aria-current="page"]')
        .first()
        .getAttribute("data-nav-page"),
      "settings",
    );
    assert(await page.locator("[data-preview-settings]").first().isVisible());
    assert.equal(
      await page.evaluate(() => document.activeElement.dataset.navPage),
      "settings",
      "keyboard focus restored after page switch",
    );
    await page.locator('[data-navigation-style="edge"]').click();
    assert(
      await page.locator("[data-preview-settings]").first().isVisible(),
      "preserve active page on appearance edits",
    );
    await page
      .locator("#project-stage .mock-nav")
      .first()
      .getByRole("button", { name: "프로젝트", exact: true })
      .click();
    assert(await page.locator(".mock-projects").first().isVisible());
    await page.selectOption("#preview-mode", "light");
    await page.selectOption("#catalog-navigation", "left");
    await page.selectOption("#catalog-navigationStructure", "grouped");
    await page.locator('[data-navigation-style="outline"]').click();
    await page.locator("#structure-options").scrollIntoViewIfNeeded();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-navigation-style="pill"]').click();
    assert.equal(
      (await page.evaluate(() => PaletteCatalog.getConfig())).designSelection
        .navigationStyle,
      "pill",
      "mobile pointer applies style on first click",
    );
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.locator('[data-navigation-style="edge"]').click();
    await page.selectOption("#catalog-navigationStructure", "rail");
    const shared = await page.evaluate(() => PaletteWorkspace.shareURL());
    await page.goto("about:blank");
    await page.goto(shared);
    assert.equal(
      (await page.evaluate(() => PaletteCatalog.getConfig())).designSelection
        .navigationStyle,
      "edge",
    );
    await page.reload();
    assert.equal(
      (await page.evaluate(() => PaletteCatalog.getConfig())).designSelection
        .navigationStructure,
      "rail",
    );
    for (const width of [360, 390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator("#toggle-preview").click();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
        true,
        "no page overflow at " + width,
      );
      const nav = page.locator("#project-stage .mock-nav").first();
      assert.equal(
        await nav.getByRole("button", { name: "설정", exact: true }).count(),
        1,
      );
      assert(
        await nav.evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
        "no nav clipping at " + width,
      );
      await page.locator("#toggle-preview").click();
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: six navigation shapes × three structures × three layouts, selection, sharing, keyboard and mobile: " +
        file,
    );
  } finally {
    await context.close();
  }
}
module.exports = checkNavigation;
if (require.main === module)
  (async () => {
    const b = await chromium.launch({ headless: true });
    try {
      await checkNavigation(b, process.argv[2] || "index.html");
    } finally {
      await b.close();
    }
  })().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
