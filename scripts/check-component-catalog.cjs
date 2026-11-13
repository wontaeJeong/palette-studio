const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const path = require("node:path");
const os = require("node:os"),
  fs = require("node:fs");
const artifacts = fs.mkdtempSync(
  path.join(os.tmpdir(), "palette-catalog-check-"),
);
const { pathToFileURL } = require("node:url");
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(pathToFileURL(path.resolve("catalog.html")).href);
    assert.equal(await page.locator("[data-preset]").count(), 6);
    assert.equal(
      await page.locator("#preset-grid > *").count(),
      6,
      "preset thumbnails must not contain nested interactive buttons",
    );
    await page.locator('[data-preset="soft"]').click();
    assert.equal(await page.getByLabel("견본 상태").count(), 1);
    await page.getByLabel("견본 상태").selectOption("disabled");
    assert(await page.locator(".sample button").first().isDisabled());
    await page.getByLabel("견본 상태").selectOption("default");
    await page.getByLabel("요소 검색").fill("저장하면 잠깐");
    assert.equal(await page.locator(".component-card").count(), 1);
    assert(
      (await page.locator(".component-card").innerText()).includes("Toast"),
    );
    await page.locator('[data-choose="toast:accent"]').click();
    await page.locator('[data-demo="toast"]').last().click();
    assert(await page.locator("#live-toast").isVisible());
    await page.locator("#live-toast [data-dismiss-toast]").click();
    assert(!(await page.locator("#live-toast").isVisible()));
    assert.equal(
      await page.evaluate(() => PaletteCatalog.selection().overrides.toast),
      "accent",
    );
    await page.locator('[data-compare="toast:neutral"]').click();
    await page.locator('[data-compare="toast:soft"]').click();
    assert.equal(await page.locator("#comparison .recipe").count(), 2);
    await page.locator('[data-compare="toast:accent"]').click();
    assert.equal(await page.locator("#comparison .recipe").count(), 3);
    await page.getByLabel("요소 검색").fill("한 줄 입력");
    await page.getByLabel("견본 상태").selectOption("error");
    assert.equal(
      await page.locator(".sample input").first().getAttribute("aria-invalid"),
      "true",
    );
    await page.getByLabel("견본 상태").selectOption("default");
    await page.getByLabel("요소 검색").fill("마우스 올리면");
    await page.locator(".tooltip-trigger").first().focus();
    assert(await page.locator(".hint").first().isVisible());
    await page.keyboard.press("Escape");
    assert(
      !(await page.locator(".hint").first().isVisible()),
      "Escape must dismiss tooltip",
    );
    await page.getByLabel("요소 검색").fill("가운데 뜨는");
    await page.locator('[data-compare="dialog:neutral"]').click();
    assert.equal(await page.locator("#comparison .recipe").count(), 3);
    assert((await page.locator("#notice").innerText()).includes("최대 3개"));
    await page.locator('[data-demo="dialog"]').first().click();
    assert(await page.locator("#demo-dialog").isVisible());
    assert.equal(
      await page.locator("#demo-dialog").getAttribute("data-palette"),
      await page.evaluate(() => PaletteCatalog.state().palette),
      "dialog must inherit selected palette",
    );
    await page.keyboard.press("Escape");
    assert(!(await page.locator("#demo-dialog").isVisible()));
    await page.locator('[data-preset="brand"]').click();
    await page.locator("#undo").click();
    assert.equal(
      await page.evaluate(() => PaletteCatalog.selection().preset),
      "soft",
    );
    assert.equal(
      await page.evaluate(() => PaletteCatalog.selection().overrides.toast),
      "accent",
    );
    await page.locator("#reset").click();
    await page.locator('#reset-dialog button[value="cancel"]').click();
    assert.equal(
      await page.evaluate(() => PaletteCatalog.selection().overrides.toast),
      "accent",
    );
    await page.locator("#reset").click();
    await page.locator('#reset-dialog button[value="reset"]').click();
    await page.waitForFunction(
      () => Object.keys(PaletteCatalog.selection().overrides).length === 0,
    );
    assert.deepEqual(
      await page.evaluate(() => PaletteCatalog.selection().overrides),
      {},
    );
    await page.locator("#undo").click();
    await page.reload();
    assert.equal(
      await page.evaluate(() => PaletteCatalog.selection().overrides.toast),
      "accent",
    );
    await page.getByLabel("미리보기 테마").selectOption("dark");
    assert.equal(
      await page.locator("#screen").getAttribute("data-theme"),
      "dark",
    );
    await page.getByLabel("화면 종류").selectOption("settings");
    assert((await page.locator("#screen").innerText()).includes("설정"));
    await page.evaluate(() =>
      localStorage.setItem("palette-studio-handoff-v1", "null"),
    );
    await page.locator("#handoff-link").click();
    assert(
      (await page.locator("#ah-markdown-preview").innerText()).includes(
        "Toast",
      ),
    );
    assert.equal(
      await page.evaluate(() =>
        PaletteAgentHandoff.outputs()["AGENT-TASK.md"].includes("accent"),
      ),
      true,
    );
    await page.goBack();
    await page.evaluate(() => {
      localStorage.removeItem("palette-studio-handoff-v1");
      localStorage.setItem(
        "palette-studio-v1",
        JSON.stringify({ target: "existing-app", scope: "dark-only" }),
      );
    });
    await page.reload();
    await page.locator('[data-preset="brand"]').click();
    const link = await page.locator("#handoff-link").getAttribute("href");
    assert(
      link.includes("designSelection="),
      "copied links must retain design selection",
    );
    await page.locator("#handoff-link").click();
    await page.locator("#ah-markdown-preview").waitFor();
    assert.equal(
      await page.evaluate(() => PaletteAgentHandoff.getConfig().target),
      "existing-app",
    );
    assert.equal(
      await page.evaluate(() => PaletteAgentHandoff.getConfig().scope),
      "dark-only",
    );
    assert.equal(
      await page.evaluate(() => PaletteAgentHandoff.getConfig().layout),
      "existing",
    );
    await page.goBack();
    await page.setViewportSize({ width: 390, height: 844 });
    assert(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.screenshot({
      path: path.join(artifacts, "catalog-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: path.join(artifacts, "catalog-desktop.png"),
      fullPage: true,
    });
    assert.deepEqual(errors, []);
    console.log(
      "PASS: presets, Korean discovery, variants, comparison, native dialog, undo, persistence, themes, compositions, handoff, mobile",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
