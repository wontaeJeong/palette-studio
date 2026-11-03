/* Offline contract checks for the pinned Lucide SVG subset and icon browser. */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const read = function (f) { return fs.readFileSync(path.join(root, f), "utf8"); };
const html = read("icons.html");
const parts = Array.from(html.matchAll(/src="(data\/icon-parts\/[^"]+\.js)"/g), function (m) { return m[1]; });
assert.equal(parts.length, 8, "Expected eight static offline icon catalogs");
const sandbox = { window: {} };
for (const part of parts) vm.runInNewContext(read(part), sandbox, { filename: part });
const icons = sandbox.window.PALETTE_ICON_PARTS.flat();
assert.equal(icons.length, 95, "Unexpected pinned icon catalog count");
const names = new Set(), categories = new Set();
for (const icon of icons) {
  assert.match(icon.name, /^[a-z0-9-]+$/);
  assert(!names.has(icon.name), "Duplicate icon: " + icon.name);
  names.add(icon.name); categories.add(icon.category);
  assert(icon.label.trim().length > 0);
  const svg = read("assets/icons/" + icon.name + ".svg");
  assert(svg.startsWith("<svg"), "Missing SVG root: " + icon.name);
  assert(svg.includes('stroke="currentColor"'), "Fixed stroke color in " + icon.name);
  assert(!/<script|<foreignObject|<image|onload=|javascript:|#[0-9a-f]{6}/i.test(svg), "Untrusted SVG: " + icon.name);
  const match = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  assert(match, "Malformed svg: " + icon.name);
  const body = match[1].trim().replace(/\n\s*/g, "");
  assert.equal(body, icon.body, "Geometry source drift in " + icon.name);
}
assert.deepEqual(Array.from(categories).sort(), ["actions", "content", "data", "identity", "navigation", "system"]);
const css = read("css/icon-studio.css");
for (const token of ["--color-ink", "--color-accent", "--color-on-accent", "--color-raised", "--color-line"]) {
  assert(css.includes("var(" + token + ")"), "Missing theme token: " + token);
}
for (const id of ["icon-palette", "icon-mode", "icon-size", "icon-stroke", "icon-search", "icon-gallery", "copy-svg", "download-svg", "icon-detail", "icon-variant"]) {
  assert(html.includes('id="' + id + '"'), "Missing control: " + id);
}
assert(html.includes('src="icons.js"'), "Missing interaction script");
assert(html.includes('src="data/catalog.js"'), "Missing palette catalog");
assert(read("assets/icons/LICENSE-LUCIDE.txt").includes("ISC License"));
assert(read("docs/ICON-KIT.md").includes("currentColor"));
console.log(JSON.stringify({ iconCount: icons.length, categories: categories.size, parts: parts.length, geometrySynced: true, source: "Lucide pinned 4b203ec9" }, null, 2));
