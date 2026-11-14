const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.route(/^https?:/, (r) => r.abort());
    await page.goto(
      pathToFileURL(path.resolve(__dirname, "../index.html")).href,
    );
    const only = process.argv[2];
    async function open(id) {
      await page
        .locator("#components-options")
        .evaluate((el) => (el.open = true));
      await page.locator(`[data-component="${id}"]`).click();
    }
    if (!only || only === "tooltip") {
      await open("tooltip");
      const trigger = page.locator(
        '#detail-demo [data-theme="light"] [data-demo="tooltip"]',
      );
      const pane = page.locator("#detail-demo");
      const before = await pane.boundingBox();
      await trigger.hover();
      assert.equal(
        (await pane.boundingBox()).height,
        before.height,
        "tooltip must not shift layout",
      );
      assert(await page.locator("#detail-tooltip-light").isVisible());
      await page.keyboard.press("Escape");
      assert(!(await page.locator("#detail-tooltip-light").isVisible()));
      assert(
        await page.locator("#component-dialog").isVisible(),
        "Escape dismisses tooltip before its containing dialog",
      );
      await page.mouse.move(0, 0);
      await trigger.hover();
      assert(
        await page.locator("#detail-tooltip-light").isVisible(),
        "tooltip reopens after Escape",
      );
      await page.locator("#detail-tooltip-light").hover();
      assert(
        await page.locator("#detail-tooltip-light").isVisible(),
        "tooltip hover remains open",
      );
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    }
    if (!only || only === "toast") {
      await page.clock.install();
      await open("toast");
      await page
        .locator('#detail-demo [data-theme="light"] [data-demo="toast"]')
        .first()
        .click();
      const toast = page.locator("#demo-toast");
      await page.clock.runFor(3000);
      await toast.hover();
      await toast.locator("button").first().focus();
      await page.mouse.move(0, 0);
      await page.clock.runFor(6000);
      assert(
        await toast.isVisible(),
        "focus keeps toast paused after hover leaves",
      );
      await page.locator("#detail-title").evaluate((el) => {
        el.tabIndex = -1;
        el.focus();
      });
      await page.clock.runFor(2100);
      assert(
        !(await toast.isVisible()),
        "remaining time is preserved, not reset",
      );
      await page.keyboard.press("Escape");
    }
    if (!only || only === "concepts") {
      assert.equal(
        await page.locator("[data-choose-concept]").count(),
        9,
        "nine concepts have independent controls",
      );
      assert(
        await page
          .locator(".concept-mini")
          .evaluateAll((nodes) =>
            nodes.every((el) => el.scrollWidth <= el.clientWidth + 1),
          ),
        "concept thumbnails do not clip their content",
      );
      const signatures = new Set();
      for (const id of [
        "minimal",
        "soft",
        "editorial",
        "compact",
        "brutalist",
        "glass",
        "expressive",
        "terminal",
        "tactile",
      ]) {
        await page.locator(`[data-choose-concept="${id}"]`).click();
        assert.equal(
          (await page.evaluate(() => PaletteCatalog.getConfig()))
            .designSelection.concept,
          id,
        );
        assert.equal(
          await page
            .locator(".project-pane")
            .first()
            .getAttribute("data-concept"),
          id,
        );
        signatures.add(
          await page
            .locator(".project-pane")
            .first()
            .evaluate((el) => {
              const card = getComputedStyle(el.querySelector(".sample-box")),
                title = getComputedStyle(el.querySelector("h3"));
              return [
                card.borderRadius,
                card.borderWidth,
                card.boxShadow,
                card.padding,
                title.fontSize,
                title.fontWeight,
                title.letterSpacing,
              ].join("|");
            }),
        );
      }
      assert.equal(
        signatures.size,
        9,
        "all concepts produce different component geometry/type/elevation",
      );
      await page.reload();
      assert.equal(
        (await page.evaluate(() => PaletteCatalog.getConfig())).designSelection
          .concept,
        "tactile",
      );
    }
    if (!only || only === "popover") {
      await open("popover");
      const trigger = page.locator(
        '#detail-demo [data-theme="light"] [data-demo="popover"]',
      );
      await trigger.click();
      assert(await page.locator("#demo-popover").isVisible());
      await page.locator("#demo-popover input").first().uncheck();
      await page.keyboard.press("Escape");
      assert(!(await page.locator("#demo-popover").count()));
      assert(await trigger.evaluate((el) => el === document.activeElement));
      await trigger.click();
      await page.locator("#demo-popover input").first().uncheck();
      await page.locator("[data-popup-apply]").click();
      assert((await trigger.innerText()).includes("적용됨"));
      await trigger.click();
      assert(
        !(await page.locator("#demo-popover input").first().isChecked()),
        "applied popover settings survive reopening",
      );
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
      await open("menu");
      await page
        .locator('#detail-demo [data-theme="dark"] [data-demo="menu"]')
        .click();
      await page.keyboard.press("End");
      assert.equal(
        await page.evaluate(() => document.activeElement.dataset.popupAction),
        "archive",
      );
      await page.keyboard.press("Home");
      assert.equal(
        await page.evaluate(() => document.activeElement.dataset.popupAction),
        "rename",
      );
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    }
    if (!only || only === "glass") {
      await page.evaluate(() =>
        PaletteCatalog.update({
          designSelection: {
            ...PaletteCatalog.getConfig().designSelection,
            concept: "glass",
          },
        }),
      );
      assert(
        await page
          .locator(".project-pane .mock-top")
          .first()
          .evaluate(
            (el) => getComputedStyle(el, "::before").backgroundImage !== "none",
          ),
        "glass uses a separate material layer on functional chrome",
      );
      assert.equal(
        await page
          .locator(".project-pane .sample-box")
          .first()
          .evaluate((el) => getComputedStyle(el).backgroundImage),
        "none",
        "reading surfaces stay opaque and undecorated",
      );
    }
    if (!only || only === "toast-focus") {
      await page.clock.install();
      await open("toast");
      const trigger = page
        .locator(
          '#detail-demo [data-theme="light"] [data-toast-status="success"]',
        )
        .first();
      await trigger.click();
      await trigger.click();
      assert.equal(await page.locator(".toast-item").count(), 2);
      await page.locator(".toast-item [data-toast-dismiss]").first().focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator(".toast-item").count(), 1);
      assert(
        await trigger.evaluate((el) => el === document.activeElement),
        "keyboard dismissal restores the originating trigger while another toast remains",
      );
      assert(
        await page
          .locator("#component-dialog")
          .evaluate((el) => el.contains(document.activeElement)),
        "focus stays inside the open dialog",
      );
      await page.locator(".toast-item [data-toast-dismiss]").focus();
      await page.keyboard.press("Enter");
      assert.equal(await page.locator(".toast-item").count(), 0);
      assert(
        await trigger.evaluate((el) => el === document.activeElement),
        "final toast dismissal also restores trigger focus",
      );
      await page.keyboard.press("Escape");
    }
    if (!only || only === "stack") {
      await page.clock.install();
      await open("toast");
      const light = page.locator('#detail-demo [data-theme="light"]'),
        dark = page.locator('#detail-demo [data-theme="dark"]');
      await light.locator('[data-toast-status="success"]').first().click();
      await dark.locator('[data-toast-status="error"]').click();
      assert.equal(
        await page.locator(".toast-item").first().getAttribute("data-theme"),
        "light",
        "notices keep their original preview scope",
      );
      assert(await dark.locator(".persistent-error").isVisible());
      await light.locator('[data-toast-status="info"]').click();
      await light.locator('[data-toast-status="warning"]').click();
      assert.equal(await page.locator(".toast-item").count(), 3);
      await dark.locator('.persistent-error [data-demo="toast"]').click();
      assert(
        !(await dark.locator(".persistent-error").isVisible()),
        "successful retry clears the persistent failure",
      );
      const last = page.locator(".toast-item").last();
      await last.locator("[data-toast-undo]").click();
      assert((await last.innerText()).includes("되돌렸습니다"));
      assert(
        (await dark.locator("[data-save-state]").innerText()).includes("복원"),
      );
      await page.keyboard.press("Escape");
    }
    if (!only || only === "responsive") {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      for (const id of [
        "minimal",
        "soft",
        "editorial",
        "compact",
        "brutalist",
        "glass",
        "expressive",
        "terminal",
        "tactile",
      ]) {
        await page.evaluate(
          (id) =>
            PaletteCatalog.update({
              designSelection: {
                ...PaletteCatalog.getConfig().designSelection,
                concept: id,
              },
            }),
          id,
        );
        assert(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth + 1,
          ),
          "no mobile page overflow: " + id,
        );
        assert.equal(
          await page
            .locator(".project-pane")
            .first()
            .evaluate((el) =>
              getComputedStyle(el)
                .getPropertyValue("--concept-duration")
                .trim(),
            ),
          "0ms",
        );
      }
      for (const kind of ["popover", "menu", "tooltip", "dialog", "drawer"]) {
        await open(kind);
        const trigger = page.locator(
          `#detail-demo [data-theme="dark"] [data-demo="${kind}"]`,
        );
        await trigger.click();
        const overlay = page.locator(
          kind === "tooltip" ? "#detail-tooltip-dark" : "#demo-" + kind,
        );
        if (["dialog", "drawer"].includes(kind))
          assert(
            await overlay
              .locator(".sample-box")
              .evaluate(
                (el) =>
                  getComputedStyle(el).backgroundColor !== "rgba(0, 0, 0, 0)" &&
                  getComputedStyle(el).borderTopWidth !== "0px",
              ),
            "modal content has an intentional opaque surface and border",
          );
        const r = await overlay.boundingBox();
        assert(
          r &&
            r.x >= -1 &&
            r.y >= -1 &&
            r.x + r.width <= 391 &&
            r.y + r.height <= 845,
          "overlay stays within mobile viewport: " + kind,
        );
        assert.equal(await overlay.getAttribute("data-concept"), "tactile");
        await page.keyboard.press("Escape");
        assert(await page.locator("#component-dialog").isVisible());
        await page.keyboard.press("Escape");
      }
      await page.emulateMedia({ forcedColors: "active" });
      await open("popover");
      await page.locator('#detail-demo [data-demo="popover"]').first().click();
      assert.equal(
        await page
          .locator("#demo-popover")
          .evaluate((el) => getComputedStyle(el).boxShadow),
        "none",
      );
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
    }
    if (!only || only === "mobile-stack") {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ forcedColors: "none" });
      await page.clock.install();
      await open("toast");
      for (const status of ["success", "info", "warning"])
        await page
          .locator(
            `#detail-demo [data-theme="dark"] [data-toast-status="${status}"]`,
          )
          .first()
          .click();
      const rects = await page.locator(".toast-item").evaluateAll((nodes) =>
        nodes.map((el) => {
          const r = el.getBoundingClientRect();
          return { top: r.top, bottom: r.bottom, left: r.left, right: r.right };
        }),
      );
      assert.equal(rects.length, 3);
      rects.forEach((r, i) => {
        assert(r.left >= 0 && r.right <= 390 && r.top >= 0 && r.bottom <= 844);
        if (i)
          assert(
            r.top >= rects[i - 1].bottom + 6,
            "mobile toast content never overlaps adjacent notices",
          );
      });
      await page.screenshot({
        path: "/private/tmp/task1-three-toasts-mobile.png",
      });
      await page.keyboard.press("Escape");
    }
    if (!only || only === "empty") {
      await open("empty");
      assert(
        await page
          .locator("#detail-demo .empty-symbol svg")
          .evaluateAll((nodes) =>
            nodes.every((el) => el.childElementCount > 0),
          ),
        "empty-state illustration uses vendored Lucide geometry",
      );
      await page.keyboard.press("Escape");
    }
    assert.deepEqual(errors, []);
    console.log("PASS: component concepts " + (only || "all"));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
