/* Preset recommendations stay independent of the user's current selection. */
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

async function checkPresetRecommendations(browser, file = "index.html") {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await context.route(/^https?:/, (route) => route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(pathToFileURL(path.resolve(__dirname, "../" + file)).href);
    await page.locator("#structure-options > summary").click();
    await page.locator("#components-options > summary").click();
    const fixtures = [
      ["studio", "left", "list", "edge", "standard", "button", "solid"],
      ["bloom", "top", "list", "pill", "standard", "switch", "solid"],
      ["precision", "left", "grouped", "outline", "quick", "alert", "soft"],
      ["editorial", "left", "grouped", "underline", "none", "badge", "soft"],
      ["console", "hybrid", "rail", "fill", "quick", "button", "outline"],
      ["signal", "top", "list", "dot", "standard", "dialog", "outline"],
    ];
    const names = { soft: "기본 배경", outline: "윤곽선", solid: "강조색" };
    for (const [
      set,
      navigation,
      structure,
      style,
      motion,
      component,
      treatment,
    ] of fixtures) {
      await page.locator(`[data-set="${set}"]`).click();
      assert.equal(
        await page
          .locator(`[data-navigation-style="${style}"] .preset-recommendation`)
          .count(),
        1,
        set + " recommended menu style",
      );
      assert.equal(
        await page
          .locator(`[data-navigation-style="${style}"] .selection-status`)
          .innerText(),
        "선택됨",
      );
      for (const [key, value] of [
        ["navigation", navigation],
        ["navigationStructure", structure],
        ["motion", motion],
      ]) {
        const select = page.locator("#catalog-" + key);
        assert.equal(await select.inputValue(), value);
        assert.match(
          await select.locator(`option[value="${value}"]`).textContent(),
          /프리셋 추천/,
        );
        const hint = page.locator("#" + key + "-recommendation");
        assert(
          await hint.isVisible(),
          key + " recommendation visible without opening select",
        );
        const before = await hint.innerText();
        const alternative = await select
          .locator("option")
          .evaluateAll(
            (options, value) =>
              options.find((option) => option.value !== value).value,
            value,
          );
        await select.selectOption(alternative);
        assert.equal(
          await hint.innerText(),
          before,
          "customizing preserves preset recommendation",
        );
        assert.equal(await select.inputValue(), alternative);
      }
      const caption = page.locator(`[data-component="${component}"]`);
      assert.match(
        await caption.innerText(),
        new RegExp("프리셋 추천: " + names[treatment]),
      );
      await caption.click();
      assert.equal(
        await page
          .locator(
            `#variant-picker [data-variant="${treatment}"] .preset-recommendation`,
          )
          .count(),
        1,
        set + " respects component override",
      );
      const alternative = treatment === "solid" ? "outline" : "solid";
      await page
        .locator(`#variant-picker [data-variant="${alternative}"]`)
        .click();
      assert.equal(
        await page
          .locator(
            `#variant-picker [data-variant="${treatment}"] .preset-recommendation`,
          )
          .count(),
        1,
      );
      assert.equal(
        await page
          .locator(`#variant-picker [data-variant="${treatment}"]`)
          .getAttribute("aria-pressed"),
        "false",
      );
      assert.equal(
        await page
          .locator(
            `#variant-picker [data-variant="${alternative}"] .selection-status`,
          )
          .innerText(),
        "선택됨",
      );
      assert.equal(
        await page.evaluate(() => document.activeElement.dataset.variant),
        alternative,
      );
      await page.keyboard.press("Escape");
      assert.match(
        await caption.innerText(),
        new RegExp("선택됨: " + names[alternative]),
      );
      assert.match(
        await caption.innerText(),
        new RegExp("프리셋 추천: " + names[treatment]),
      );
    }
    await page.locator('[data-navigation-style="pill"]').click();
    assert.equal(
      await page
        .locator('[data-navigation-style="dot"] .preset-recommendation')
        .count(),
      1,
    );
    assert.equal(
      await page
        .locator('[data-navigation-style="pill"] .selection-status')
        .innerText(),
      "선택됨",
    );
    await page.selectOption("#catalog-palette", "slate-blue");
    assert.equal(
      await page
        .locator('[data-navigation-style="dot"] .preset-recommendation')
        .count(),
      1,
      "palette does not change recommendation",
    );
    await page.locator("#recommended-only").check();
    assert.equal(
      await page.locator("[data-component]").count(),
      5,
      "recommended elements filter preserved",
    );
    assert.equal(
      await page
        .locator("[data-component] .recommend-badge")
        .first()
        .innerText(),
      "권장 요소",
    );
    const shared = await page.evaluate(() => PaletteWorkspace.shareURL());
    await page.goto("about:blank");
    await page.goto(shared);
    await page.reload();
    await page.locator("#structure-options > summary").click();
    assert.equal(
      await page
        .locator('[data-navigation-style="pill"]')
        .getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await page
        .locator('[data-navigation-style="dot"] .preset-recommendation')
        .count(),
      1,
      "restore derives recommendation from preset",
    );
    const exported = await page.evaluate(() => PaletteWorkspace.outputs());
    assert.match(exported["AGENT-TASK.md"], /dialog: solid/);
    assert.match(exported["AGENT-TASK.md"], /pill/);
    for (const width of [360, 390]) {
      await page.setViewportSize({ width, height: 844 });
      for (const theme of ["light", "dark"]) {
        if ((await page.locator("html").getAttribute("data-theme")) !== theme)
          await page.locator("#ui-theme").click();
        assert(
          await page
            .locator('[data-navigation-style="dot"] .preset-recommendation')
            .isVisible(),
        );
        assert(await page.locator("#motion-recommendation").isVisible());
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          "no page overflow",
        );
        assert(
          await page
            .locator(".navigation-choice")
            .evaluateAll((elements) =>
              elements.every((el) => el.scrollWidth <= el.clientWidth + 1),
            ),
          "no menu card clipping",
        );
      }
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: preset recommendations, custom selections, restore/export and mobile — " +
        file,
    );
  } finally {
    await context.close();
  }
}
module.exports = checkPresetRecommendations;
if (require.main === module) {
  (async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      await checkPresetRecommendations(browser);
      await checkPresetRecommendations(browser, "START-HERE.html");
    } finally {
      await browser.close();
    }
  })().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
