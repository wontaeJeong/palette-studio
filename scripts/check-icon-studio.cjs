/* Playwright browser smoke test; run with installed Playwright and Chromium. */
const { chromium } = require("playwright");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const assert = require("node:assert/strict");
(async function () {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ acceptDownloads: true, viewport: { width: 1460, height: 1000 } });
  const errors = [];
  page.on("pageerror", function (error) { errors.push(String(error)); });
  await page.goto(pathToFileURL(path.resolve(__dirname, "../icons.html")).href, { waitUntil: "load" });
  assert.equal((await page.locator("#total-count").innerText()).trim(), "95");
  assert.equal(await page.locator("#icon-palette option").count(), 32);
  assert.equal(await page.locator("#icon-gallery .ic-theme-palette").count(), 2);
  await page.selectOption("#icon-palette", "slate-indigo");
  const colors = await page.locator("#icon-gallery .ic-theme-palette").evaluateAll(function (els) {
    return els.map(function (el) { return getComputedStyle(el).getPropertyValue("--color-accent").trim(); });
  });
  assert.equal(colors.length, 2);
  assert.notEqual(colors[0], colors[1], "Light and dark accent values should differ");
  await page.fill("#icon-search", "shield");
  assert((await page.locator("#icon-result-count").innerText()).includes("2개"), "Expected shield results");
  await page.locator('#icon-gallery [data-icon="shield-check"]').first().click();
  assert((await page.locator("#icon-detail").innerText()).includes("shield-check"));
  await page.selectOption("#icon-variant", "filled");
  assert((await page.locator(".ic-icon.icon-variant--filled").count()) > 0);
  await page.selectOption("#icon-variant", "duotone");
  assert((await page.locator(".icon-variant--duotone").count()) > 0);
  await page.selectOption("#icon-mode", "dark");
  assert.equal(await page.locator("#icon-gallery .ic-theme-palette").count(), 1);
  await page.selectOption("#icon-stroke", "2.5");
  assert.equal(await page.locator("#icon-gallery svg").first().getAttribute("stroke-width"), "2.5");
  await page.selectOption("#icon-code-kind", "react");
  assert((await page.locator("#icon-code").innerText()).includes("ShieldCheck"));
  const download = await Promise.all([
    page.waitForEvent("download"),
    page.click("#download-svg")
  ]).then(function (items) { return items[0]; });
  assert.equal(download.suggestedFilename(), "shield-check.svg");
  assert.deepEqual(errors, [], "Browser errors");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator("#icon-gallery .ic-theme-palette").count(), 1);
  console.log(JSON.stringify({ icons: 95, palettes: 32, modes: ["light", "dark"], download: true, smallViewport: true, pass: true }));
  await browser.close();
}()).catch(function (error) { console.error(error); process.exitCode = 1; });
