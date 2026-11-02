/* Real browser contract: guided selection, persistent preview and independent font roles. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const root = path.resolve(__dirname, "..");
const standalone = path.join(
  os.tmpdir(),
  "palette-flow-" + process.pid + ".html",
);
const kit = require(path.join(root, "data/palettes.json"));
async function main() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PALETTE_CHROMIUM_PATH
      ? {
          executablePath: process.env.PALETTE_CHROMIUM_PATH,
          args: [
            "--no-sandbox",
            "--disable-gpu",
            "--disable-dev-shm-usage",
            "--no-zygote",
            "--single-process",
            "--disable-software-rasterizer",
          ],
        }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [],
    external = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => {
    if (/^https?:/.test(r.url())) external.push(r.url());
  });
  const go = (step) => page.locator(`[data-step="${step}"]`).click();
  try {
    await page.goto(
      "file://" + path.join(root, "index.html") + "#fontSource=local-only",
    );
    let profile = await page.evaluate(() => PaletteStudio.profile());
    assert.equal(
      profile.target,
      "new-app",
      "a fresh profile must apply to a common new app",
    );
    assert.equal(
      profile.scope,
      "both",
      "a fresh export must include both theme modes",
    );
    assert.equal(
      await page.locator("#export-css").isVisible(),
      false,
      "downloads must wait for the final step",
    );
    assert.equal(await page.locator(".palette-card").count(), 32);
    await page.selectOption("#mode", "compare");
    assert.notEqual(
      await page.locator('[data-demo="0"]').getAttribute("data-palette"),
      await page.locator('[data-demo="1"]').getAttribute("data-palette"),
      "the initial comparison should offer two different palettes",
    );
    await page.selectOption("#mode", "light");
    await page.click("#next-step");
    assert(await page.locator("#step-style").isVisible());
    await page.click("#previous-step");
    assert(await page.locator("#step-palette").isVisible());
    assert(
      !/Admission Gate|MCP Server|반입 검사/.test(
        await page.locator("#stage").innerText(),
      ),
    );
    await page.locator(".palette-card").last().click();
    let box = await page.locator("#preview-panel").boundingBox();
    assert(
      box.y >= 0 && box.y + box.height <= 1001,
      "preview must stay visible when the last palette is selected",
    );
    assert.equal(
      await page.locator(".palette-card").last().getAttribute("aria-pressed"),
      "true",
    );
    assert.equal(
      await page
        .locator(".palette-card")
        .last()
        .evaluate((el) => el === document.activeElement),
      true,
    );
    await go("style");
    await page.locator('[data-style-id="outline"]').click();
    assert.equal(await page.locator("#style").inputValue(), "outline");
    await go("fonts");
    assert.equal(
      await page.locator("#body-font-gallery .font-card").count(),
      15,
    );
    assert.equal(
      await page.locator("#code-font-gallery .font-card").count(),
      9,
    );
    const codeBefore = await page.locator("#code-font").inputValue();
    await page.locator('#body-font-gallery [data-apply-font="suit"]').click();
    assert.equal(await page.locator("#body-font").inputValue(), "suit");
    assert.equal(await page.locator("#code-font").inputValue(), codeBefore);
    await page
      .locator('#code-font-gallery [data-apply-font="jetbrains-mono"]')
      .click();
    assert.equal(await page.locator("#body-font").inputValue(), "suit");
    assert.equal(
      await page.locator("#code-font").inputValue(),
      "jetbrains-mono",
    );
    await page.fill("#body-font-search", "no-such-font");
    assert.equal(
      await page.locator("#body-font-gallery .font-card").count(),
      0,
    );
    assert.match(await page.locator("#body-font-gallery").innerText(), /없/);
    assert.equal(
      await page.locator("#code-font-gallery .font-card").count(),
      9,
    );
    await page.fill("#body-font-search", "");
    await go("export");
    assert.equal(await page.locator("#export-css").isVisible(), true);
    assert.match(await page.locator("#export-summary").innerText(), /SUIT/);
    await page.selectOption("#target", "existing-app");
    await page.selectOption("#scope", "dark-only");
    let css = await page.evaluate(() => PaletteStudio.selectedCSS());
    assert(!css.includes(":root:not("));
    assert(css.includes(':root[data-theme="dark"]'));
    const wait = page.waitForEvent("download");
    await page.click("#export-profile");
    const download = await wait;
    assert.equal(download.suggestedFilename(), "design-profile.json");
    await page.reload();
    assert.equal(await page.locator("#export-css").isVisible(), true);
    assert.equal(await page.locator("#body-font").inputValue(), "suit");
    assert.equal(
      await page.locator("#code-font").inputValue(),
      "jetbrains-mono",
    );
    assert.equal(await page.locator("#scope").inputValue(), "dark-only");
    await fs.writeFile(
      path.join(root, "data/qa-exported-profile.json"),
      JSON.stringify(
        await page.evaluate(() => PaletteStudio.profile()),
        null,
        2,
      ) + "\n",
    );
    await page.selectOption("#scope", "light-only");
    css = await page.evaluate(() => PaletteStudio.selectedCSS());
    assert(css.includes(":root:not("));
    assert(!css.includes(':root[data-theme="dark"]'));
    await page.selectOption("#scope", "both");
    css = await page.evaluate(() => PaletteStudio.selectedCSS());
    assert(
      css.includes(":root:not(") && css.includes(':root[data-theme="dark"]'),
    );
    await go("palette");
    for (const p of kit.palettes)
      for (const mode of ["light", "dark"]) {
        await page.selectOption("#palette", p.id);
        await page.selectOption("#mode", mode);
        const actual = await page.locator('[data-demo="0"]').evaluate((el) => {
          const css = getComputedStyle(el);
          return Object.fromEntries(
            window.PALETTE_KIT.tokens.map((t) => [
              t.token,
              css.getPropertyValue(t.token).trim().toUpperCase(),
            ]),
          );
        });
        assert.deepEqual(actual, p.modes[mode]);
      }
    await go("style");
    for (const s of kit.styles) {
      await page.selectOption("#style", s.id);
      assert.equal(
        await page
          .locator('[data-demo="0"]')
          .evaluate((el) =>
            getComputedStyle(el).getPropertyValue("--ui-height").trim(),
          ),
        s.height,
      );
    }
    await page.locator('[data-demo="0"] .ui-tab[data-filter="review"]').click();
    assert.equal(
      await page.locator('[data-demo="0"] tr[data-status]:visible').count(),
      1,
    );
    await page.locator('[data-demo="0"] .ui-tab[data-filter="all"]').click();
    await page.locator('[data-demo="0"] .row-search').fill("モバイル-no-match");
    assert.equal(
      await page.locator('[data-demo="0"] tr[data-status]:visible').count(),
      0,
    );
    await page.locator('[data-demo="0"] .row-search').fill("");
    await page.locator('[data-demo="0"] .open-demo-dialog').click();
    assert.equal(await page.locator("dialog[open]").count(), 1);
    await page.locator("dialog[open] button").click();
    for (const width of [360, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await go("palette");
      for (const mode of ["light", "split", "compare"]) {
        await page.selectOption("#mode", mode);
        await page.locator(".palette-card").last().click();
        const size = await page.evaluate(() => ({
          width: innerWidth,
          scroll: document.documentElement.scrollWidth,
        }));
        assert(
          size.scroll <= size.width,
          JSON.stringify({ width, mode, ...size }),
        );
        box = await page.locator("#preview-panel").boundingBox();
        assert(
          box.y >= 0 && box.y + box.height <= 1001,
          JSON.stringify({ width, box }),
        );
      }
      if (width < 1000) {
        await page.click("#toggle-preview");
        assert.equal(
          await page.locator("#toggle-preview").getAttribute("aria-expanded"),
          "true",
        );
        await page.click("#toggle-preview");
      }
      for (const step of ["style", "fonts", "export"]) {
        await go(step);
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        );
      }
    }
    await page.setViewportSize({ width: 844, height: 390 });
    const dock = await page.locator("#preview-panel").boundingBox();
    const content = await page.locator("#preview-content").boundingBox();
    assert(
      content.y + content.height <= dock.y + dock.height,
      "landscape preview content must not be clipped out of its dock",
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await go("fonts");
    await page.click("#toggle-preview");
    await page.locator("#body-font-search").focus();
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(resolve)),
    );
    const searchBox = await page.locator("#body-font-search").boundingBox();
    const expandedBox = await page.locator("#preview-panel").boundingBox();
    assert(
      searchBox.y >= 0 && searchBox.y + searchBox.height < expandedBox.y,
      "expanded preview must leave focused editor controls visible",
    );
    await page.click("#toggle-preview");
    await page.setViewportSize({ width: 1440, height: 1000 });
    await go("fonts");
    await page.screenshot({
      path: path.join(root, "previews/studio-flow-desktop.png"),
    });
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.screenshot({
      path: path.join(root, "previews/studio-flow-mobile.png"),
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(
      "file://" +
        path.join(root, "index.html") +
        "#step=palette&palette=slate-blue&style=operational&mode=light&fontSource=local-only&bodyFont=pretendard&codeFont=d2coding",
    );
    await page.reload();
    await page.evaluate(() => PaletteStudio.readyFonts());
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: path.join(root, "previews/studio-common-overview.png"),
    });
    await page.screenshot({
      path: path.join(root, "previews/studio-overview.png"),
    });
    await page.selectOption("#palette", "graphite-plum");
    await page.selectOption("#mode", "split");
    await page
      .locator("#preview-panel")
      .screenshot({ path: path.join(root, "previews/plum-light-dark.png") });
    await page.selectOption("#mode", "dark");
    await go("style");
    await page.locator(".studio-advanced").first().locator("summary").click();
    await page
      .locator("#specimens")
      .screenshot({ path: path.join(root, "previews/components-dark.png") });
    await page.setViewportSize({ width: 390, height: 1000 });
    await page.selectOption("#mode", "dark");
    await page.click("#toggle-preview");
    await page
      .locator("#preview-panel")
      .screenshot({ path: path.join(root, "previews/mobile-dark.png") });
    await fs.copyFile(path.join(root, "START-HERE.html"), standalone);
    await page.goto(
      "file://" +
        standalone +
        "#target=existing-gate&scope=dark-only&fontSource=local-only&palette=slate-blue&mode=light",
    );
    profile = await page.evaluate(() => PaletteStudio.profile());
    assert.equal(profile.target, "existing-app");
    assert.equal(profile.scope, "dark-only");
    assert.equal(
      await page
        .locator('[data-demo="0"]')
        .evaluate((el) =>
          getComputedStyle(el)
            .getPropertyValue("--color-canvas")
            .trim()
            .toUpperCase(),
        ),
      kit.palettes.find((p) => p.id === "slate-blue").modes.light[
        "--color-canvas"
      ],
      "standalone styles must work after moving the HTML away from CSS files",
    );
    await go("fonts");
    assert.equal(
      await page.locator("#body-font-gallery .font-card").count(),
      15,
    );
    assert.equal(
      await page.locator("#code-font-gallery .font-card").count(),
      9,
    );
    assert.equal(errors.length, 0, errors.join("\n"));
    assert.equal(external.length, 0);
    const report = {
      result: "pass",
      browser: await browser.version(),
      themes: 64,
      styles: 6,
      fonts: { body: 15, code: 9 },
      viewports: [360, 390, 768, 1440],
      checks: [
        "generic defaults",
        "downloads last",
        "sticky and docked preview",
        "independent font roles",
        "empty results",
        "keyboard focus retained",
        "profile download",
        "reload persistence",
        "legacy link migration",
        "standalone parity",
        "short landscape preview",
        "expanded preview focus visibility",
      ],
      errors,
      externalRequests: external.length,
    };
    await fs.writeFile(
      path.join(root, "data/studio-flow-check-results.json"),
      JSON.stringify(report, null, 2) + "\n",
    );
    await fs.writeFile(
      path.join(root, "data/browser-check-results.json"),
      JSON.stringify(report, null, 2) + "\n",
    );
    console.log(JSON.stringify(report));
  } finally {
    await browser.close();
    await fs.unlink(standalone).catch(() => {});
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
