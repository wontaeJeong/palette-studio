/* Overlay samples are visible before running the optional interaction demo. */
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");
async function checkInlinePreviews(browser, file = "index.html") {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await context.route(/^https?:/, (route) => route.abort());
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  try {
    await page.goto(pathToFileURL(path.resolve(__dirname, "../" + file)).href);
    if (await page.locator("#components-options").count())
      await page.locator("#components-options > summary").click();
    for (const [id, selector, text] of [
      ["dialog", ".sample-box", "변경 내용을 저장할까요?"],
      ["drawer", ".sample-box", "프로젝트 상세"],
      ["toast", ".sample-box", "변경 내용을 저장했습니다"],
      ["tooltip", ".tip", "프로젝트 설정을 표시합니다."],
      ["menu", ".sample-box", "이름 바꾸기"],
      ["popover", ".sample-box", "표시 설정"],
    ]) {
      await page.locator(`[data-component="${id}"]`).click();
      for (const variant of ["soft", "outline", "solid"]) {
        await page
          .locator(`#variant-picker [data-variant="${variant}"]`)
          .click();
        for (const mode of ["light", "dark"]) {
          const pane = page.locator(`#detail-demo [data-theme="${mode}"]`);
          const sample = pane.locator(".inline-sample " + selector);
          assert.equal(
            await sample.count(),
            1,
            id + " has a directly visible sample",
          );
          assert(
            await sample.isVisible(),
            id + " sample visible without triggering it",
          );
          assert((await sample.innerText()).includes(text));
          assert.equal(await pane.locator(".treatment." + variant).count(), 1);
          assert(
            await pane.evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
            id + " fits mobile pane",
          );
        }
        assert.equal(
          await page.locator("#demo-dialog").isVisible(),
          false,
          "sample does not open modal automatically",
        );
        assert.equal(await page.locator("#demo-drawer").isVisible(), false);
      }
      if (["dialog", "drawer", "toast"].includes(id)) {
        await page
          .locator(`#detail-demo [data-theme="light"] [data-demo="${id}"]`)
          .first()
          .click();
        assert(
          await page.locator("#demo-" + id).isVisible(),
          "optional interaction retained",
        );
        if (id === "toast") await page.locator("#dismiss-toast").click();
        else await page.keyboard.press("Escape");
        assert(
          await page
            .locator("#detail-demo " + selector)
            .first()
            .isVisible(),
          "static sample survives demo close",
        );
      }
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#component-dialog").isVisible(), false);
      await page.waitForFunction(
        (id) => document.activeElement.dataset.component === id,
        id,
      );
      if (file === "catalog.html")
        assert(
          await page
            .locator('[data-component="tooltip"]')
            .locator("..")
            .locator(".tip")
            .first()
            .isVisible(),
          "closing a demo keeps the inline tooltip sample visible",
        );
    }
    assert.deepEqual(errors, []);
    console.log(
      "PASS: visible overlay samples, variants, optional interaction and mobile — " +
        file,
    );
  } finally {
    await context.close();
  }
}
module.exports = checkInlinePreviews;
if (require.main === module) {
  (async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      for (const file of ["index.html", "catalog.html", "START-HERE.html"])
        await checkInlinePreviews(browser, file);
    } finally {
      await browser.close();
    }
  })().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
