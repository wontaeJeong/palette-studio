/* Font integration checks. Requires Playwright; CDN responses are deterministic fixtures. */
const { chromium } = require("playwright");
const fs = require("node:fs/promises"),
  path = require("node:path"),
  assert = require("node:assert/strict"),
  http = require("node:http"),
  os = require("node:os");
const root = path.resolve(__dirname, ".."),
  catalog = require(path.join(root, "data/fonts.json"));
const options = {
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
};
async function main() {
  let browser = await chromium.launch(options);
  const report = {
    families: catalog.fonts.length,
    passed: [],
    fontPreviews: [],
    errors: [],
    cdnTest:
      "Intercepted responses use bundled, source-verified WOFF2 bytes; no live availability guarantee.",
  };
  const server = http.createServer(async (req, res) => {
    try {
      const clean = decodeURIComponent(
          new URL(req.url, "http://localhost").pathname,
        ),
        target = path.resolve(root, "." + clean);
      if (!target.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end();
        return;
      }
      const data = await fs.readFile(target);
      res.setHeader(
        "Content-Type",
        target.endsWith(".woff2")
          ? "font/woff2"
          : target.endsWith(".js")
            ? "text/javascript"
            : target.endsWith(".css")
              ? "text/css"
              : "text/html",
      );
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const base = "http://127.0.0.1:" + server.address().port;
  try {
    const cdn = new Map(
      catalog.fonts.flatMap((font) =>
        font.faces.map((face) => [face.cdn, face.local]),
      ),
    );
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1200 },
    });
    await context.route("https://cdn.jsdelivr.net/**", async (route) => {
      const file = cdn.get(route.request().url());
      if (!file) return route.abort();
      await route.fulfill({
        status: 200,
        contentType: "font/woff2",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: await fs.readFile(path.join(root, file)),
      });
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => report.errors.push(e.message));
    await page.goto(base + "/index.html#fontSource=cdn-first");
    await page.click('[data-step="fonts"]');
    await page.evaluate(() => PaletteStudio.readyFonts());
    let status = await page.evaluate(() => PaletteFonts.getStatus());
    assert.equal(status.body.source, "cdn");
    assert.equal(status.code.source, "cdn");
    assert.equal(await page.locator(".font-card").count(), 24);
    report.passed.push("default CDN source loading + 24-card catalog");
    await page.selectOption("#font-combo", "enterprise");
    await page.evaluate(() => PaletteStudio.readyFonts());
    assert.equal(
      await page.locator("#body-font").inputValue(),
      "ibm-plex-sans-kr",
    );
    assert.equal(
      await page.locator("#code-font").inputValue(),
      "ibm-plex-mono",
    );
    let profile = await page.evaluate(() => PaletteStudio.profile());
    assert(profile.fonts.fonts.some((f) => f.id === "d2coding"));
    assert.equal(profile.fonts.source, "cdn-first");
    assert(
      (await page.evaluate(() => PaletteStudio.fontCSS())).includes(
        "unicode-range:",
      ),
    );
    report.passed.push(
      "suggested pair + Unicode ranges + Korean code fallback in CSS/profile",
    );
    assert.equal(
      await page.locator("#code-font-gallery .font-card").count(),
      9,
    );
    await page.click('[data-apply-font="fira-code"]');
    await page.evaluate(() => PaletteStudio.readyFonts());
    assert.equal(await page.locator("#code-font").inputValue(), "fira-code");
    report.passed.push("separate role catalog + apply from font card");
    await page.click('[data-font-filter="all"]');
    await page.locator("#body-font-search").fill("Noto Serif");
    assert.equal(
      await page.locator("#body-font-gallery .font-card").count(),
      1,
    );
    assert.equal(
      await page.locator("#code-font-gallery .font-card").count(),
      9,
    );
    await page.locator("#body-font-search").fill("");
    await page.selectOption("#body-font", "suit");
    await page.selectOption("#code-font", "jetbrains-mono");
    await page.evaluate(() => PaletteStudio.readyFonts());
    assert.equal(
      (await page.evaluate(() => PaletteFonts.getStatus())).body.source,
      "cdn",
    );
    await page.reload();
    await page.evaluate(() => PaletteStudio.readyFonts());
    assert.equal(await page.locator("#body-font").inputValue(), "suit");
    assert.equal(
      await page.locator("#code-font").inputValue(),
      "jetbrains-mono",
    );
    report.passed.push("font settings persist in selection link + storage");
    await page.selectOption("#font-source", "system");
    await page.evaluate(() => PaletteStudio.readyFonts());
    assert(
      !(await page.evaluate(() => PaletteStudio.fontCSS())).includes(
        "@font-face",
      ),
    );
    report.passed.push("system export has no downloadable font declarations");
    // Native FontFace caches can survive document navigation and bypass new routes.
    // Test an uncached offline client in a fresh browser process.
    await browser.close();
    browser = await chromium.launch(options);
    const offlineContext = await browser.newContext({
      viewport: { width: 1440, height: 1200 },
    });
    let blockedRequests = 0;
    await offlineContext.route(/^https:\/\//, (route) => {
      blockedRequests++;
      return route.abort("blockedbyclient");
    });
    const offline = await offlineContext.newPage();
    offline.on("pageerror", (e) => report.errors.push(e.message));
    report.offlineIsolation = "fresh browser process";
    const solo = path.join(
      os.tmpdir(),
      "palette-standalone-" + process.pid + ".html",
    );
    await fs.copyFile(path.join(root, "START-HERE.html"), solo);
    await offline.goto("file://" + solo + "#fontSource=cdn-first");
    await offline.click('[data-step="fonts"]');
    await offline.evaluate(() => PaletteStudio.readyFonts());
    status = await offline.evaluate(() => PaletteFonts.getStatus());
    assert(
      blockedRequests > 0,
      "the offline CDN blocker must match actual font requests",
    );
    report.offlineCDNBlockerObserved = true;
    assert.equal(status.body.source, "embedded");
    assert.equal(status.code.source, "embedded");
    report.passed.push(
      "blocked CDN -> embedded fallback after standalone HTML is moved",
    );
    await offline.selectOption("#font-source", "local-only");
    await offline.evaluate(() => PaletteStudio.readyFonts());
    for (const font of catalog.fonts) {
      const result = await offline.evaluate(async (id) => {
        const f = PALETTE_FONT_CATALOG.fonts.find((x) => x.id === id),
          text = f.korean
            ? "빠르고 명확한 화면 가나다 Aa 012345"
            : "Readable software 0O 1lI 012345";
        return PaletteFonts.preview(f, "local-only", text);
      }, font.id);
      assert.equal(result.source, "embedded", font.id);
      report.fontPreviews.push(font.id);
    }
    report.passed.push(
      "all 24 font previews decode as real WOFF2 from standalone embedded assets",
    );
    await offline.selectOption("#body-font", "noto-serif-kr");
    await offline.evaluate(() => PaletteStudio.readyFonts());
    assert.equal(
      (await offline.evaluate(() => PaletteFonts.getStatus())).body.source,
      "embedded",
    );
    report.passed.push("full Korean variable subset family loads");
    await offline.selectOption("#body-font", "pretendard");
    await offline.selectOption("#code-font", "d2coding");
    await offline.evaluate(() => PaletteStudio.readyFonts());
    await offline
      .locator(".studio-font-details")
      .first()
      .locator("summary")
      .click();
    await offline.evaluate(() => scrollTo(0, 0));
    await offline.screenshot({
      path: path.join(root, "previews/typography-picker.png"),
    });
    await offline.locator("#body-gallery-heading").scrollIntoViewIfNeeded();
    await offline.locator(".font-card").first().waitFor();
    for (const card of await offline.locator(".font-card").all()) {
      await card.scrollIntoViewIfNeeded();
      await card.evaluate(
        (el) =>
          new Promise((resolve) => {
            const poll = () =>
              el.dataset.previewSource ? resolve() : setTimeout(poll, 30);
            poll();
          }),
      );
    }
    await offline
      .locator("#font-gallery")
      .screenshot({ path: path.join(root, "previews/font-catalog.png") });
    const net = [];
    offline.on("request", (r) => {
      if (/^https?:/.test(r.url())) net.push(r.url());
    });
    await offline.selectOption("#font-source", "system");
    await offline.evaluate(() => PaletteStudio.readyFonts());
    assert.equal(net.length, 0);
    report.passed.push("system switch makes no CDN requests");
    for (const width of [360, 768, 1440]) {
      await offline.setViewportSize({ width, height: 1000 });
      const overflow = await offline.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      assert(!overflow, "font layout overflow at " + width);
    }
    report.passed.push("font controls and cards fit mobile/tablet/desktop");
    assert.equal(report.errors.length, 0);
  } finally {
    await browser.close();
    await new Promise((r) => server.close(r));
  }
  report.result = "pass";
  await fs.writeFile(
    path.join(root, "data/font-browser-check-results.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(JSON.stringify(report, null, 2));
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
