/* Regression checks for the post-merge workspace review. */
const assert = require("node:assert/strict");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { chromium } = require("playwright");

async function checkWorkspaceReview(browser) {
  const failures = [];
  const url = pathToFileURL(path.resolve(__dirname, "../index.html")).href;
  async function check(name, run) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    await context.route(/^https?:/, (r) => r.abort());
    const page = await context.newPage();
    try {
      await page.goto(url + "#fontSource=local-only");
      await run(page, context);
      console.log("PASS:", name);
    } catch (error) {
      failures.push(name + ": " + error.message);
      console.error("FAIL:", name, error.message);
    } finally {
      await context.close();
    }
  }
  await check("independent button and input treatments", async (page) => {
    for (const button of ["soft", "outline", "solid"]) {
      for (const input of ["soft", "outline", "solid"]) {
        await page.evaluate(
          ({ button, input }) => {
            const c = PaletteCatalog.getConfig();
            PaletteCatalog.update({
              designSelection: {
                ...c.designSelection,
                components: { ...c.designSelection.components, button, input },
              },
            });
          },
          { button, input },
        );
        const samples = await page
          .locator("[data-project-preview]")
          .evaluateAll((panes) =>
            panes.map((pane) => {
              const button = pane.querySelector(
                '.mock-form button[type="submit"]',
              );
              const input = pane.querySelector(".mock-form input");
              const colors = getComputedStyle(pane);
              const rgb = (token) => {
                const probe = document.createElement("i");
                probe.style.color = colors.getPropertyValue(token);
                pane.append(probe);
                const value = getComputedStyle(probe).color;
                probe.remove();
                return value;
              };
              return {
                button: {
                  bg: getComputedStyle(button).backgroundColor,
                  border: getComputedStyle(button).borderTopColor,
                  ink: getComputedStyle(button).color,
                },
                input: getComputedStyle(input).backgroundColor,
                raised: rgb("--color-raised"),
                canvas: rgb("--color-canvas"),
                line: rgb("--color-line"),
                strong: rgb("--color-line-strong"),
                accent: rgb("--color-accent"),
                ink: rgb("--color-ink"),
                onAccent: rgb("--color-on-accent"),
              };
            }),
          );
        for (const s of samples) {
          assert.deepEqual(
            s.button,
            {
              bg:
                button === "solid"
                  ? s.accent
                  : button === "outline"
                    ? s.canvas
                    : s.raised,
              border:
                button === "solid"
                  ? s.accent
                  : button === "outline"
                    ? s.strong
                    : s.line,
              ink: button === "solid" ? s.onAccent : s.ink,
            },
            `button=${button}, input=${input}`,
          );
          assert.equal(
            s.input,
            input === "solid"
              ? s.accent
              : input === "outline"
                ? s.canvas
                : s.raised,
          );
        }
      }
    }
  });
  await check(
    "dark comparison links, controls and persistence",
    async (page, context) => {
      await page.goto("about:blank");
      await page.goto(
        url +
          "#palette=navy-cyan&mode=compare&compare=slate-blue&compareMode=dark",
      );
      const themes = () =>
        page
          .locator("[data-project-preview]")
          .evaluateAll((es) => es.map((e) => e.dataset.theme));
      assert.deepEqual(
        await themes(),
        ["dark", "dark"],
        "legacy dark comparison",
      );
      await page.selectOption("#compare-mode", "light");
      assert.deepEqual(await themes(), ["light", "light"]);
      await page.selectOption("#compare-mode", "dark");
      // Read the URL from the actual copy button without relying on OS clipboard permissions.
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
      await page.locator("#share-selection").click();
      const shared = await page.evaluate(() => window.copiedSelection);
      assert.equal(
        new URLSearchParams(new URL(shared).hash.slice(1)).get("compareMode"),
        "dark",
      );
      await page.goto("about:blank");
      await page.goto(url);
      assert.deepEqual(await themes(), ["dark", "dark"], "saved comparison");
      const fresh = await browser.newContext();
      try {
        await fresh.route(/^https?:/, (r) => r.abort());
        const other = await fresh.newPage();
        await other.goto(shared);
        assert.deepEqual(
          await other
            .locator("[data-project-preview]")
            .evaluateAll((es) =>
              es.map((e) => [e.dataset.palette, e.dataset.theme]),
            ),
          [
            ["navy-cyan", "dark"],
            ["slate-blue", "dark"],
          ],
        );
      } finally {
        await fresh.close();
      }
      await page.goto("about:blank");
      await page.goto(url + "#mode=compare&compareMode=invalid");
      assert.deepEqual(
        await themes(),
        ["light", "light"],
        "invalid mode uses light",
      );
    },
  );
  await check("font choices recover from system delivery", async (page) => {
    await page.locator("#typography-options > summary").click();
    for (const role of ["body", "code"]) {
      const id = role === "body" ? "suit" : "jetbrains-mono";
      for (const viaGallery of [false, true]) {
        await page.locator("#open-export").click();
        await page.selectOption("#font-source", "system");
        await page.keyboard.press("Escape");
        if (viaGallery) {
          await page.locator(".font-library").evaluate((el) => {
            el.open = true;
          });
          await page
            .locator(`[data-font-role="${role}"][data-apply-font="${id}"]`)
            .click();
        } else await page.selectOption(`#${role}-font`, id);
        const c = await page.evaluate(() => PaletteCatalog.getConfig());
        assert.equal(c.fonts[role], id, role + " selection");
        assert.equal(c.fonts.source, "local-only");
        assert.equal(c.fonts[role === "body" ? "code" : "body"], "system");
        await page.evaluate(() => PaletteCatalog.readyFonts());
        assert(
          (
            await page.evaluate(
              () => PaletteWorkspace.outputs()["selected-fonts.css"],
            )
          ).includes("@font-face"),
        );
      }
    }
    await page.locator("#open-export").click();
    await page.selectOption("#font-source", "system");
    await page.keyboard.press("Escape");
    assert(
      !(
        await page.evaluate(
          () => PaletteWorkspace.outputs()["selected-fonts.css"],
        )
      ).includes("@font-face"),
    );
    await page.waitForFunction(() =>
      [...document.querySelectorAll(".font-card")].every(
        (c) => c.dataset.previewSource === "system",
      ),
    );
  });
  await check("navigation buttons have accessible names", async (page) => {
    for (const navigation of ["left", "top", "hybrid"]) {
      await page.evaluate((navigation) => {
        const c = PaletteCatalog.getConfig();
        PaletteCatalog.update({
          designSelection: { ...c.designSelection, navigation },
        });
      }, navigation);
      const navs = page.locator("#project-stage .mock-nav");
      for (const nav of await navs.all()) {
        assert.equal(
          await nav
            .getByRole("button", { name: "프로젝트", exact: true })
            .count(),
          1,
          navigation + " projects",
        );
        assert.equal(
          await nav.getByRole("button", { name: "설정", exact: true }).count(),
          1,
          navigation + " settings",
        );
      }
    }
  });
  assert.deepEqual(failures, [], failures.join("\n"));
}
module.exports = checkWorkspaceReview;
if (require.main === module)
  (async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      await checkWorkspaceReview(browser);
    } finally {
      await browser.close();
    }
  })().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
