#!/usr/bin/env node
/* Deterministic React modules from vendored, pinned Lucide SVG assets. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const partsDir = path.join(root, "data", "icon-parts");
const sourceDir = path.join(root, "assets", "icons");
const destination = path.join(root, "packages", "icons-react", "src");
const isCheck = process.argv.includes("--check");
const read = (file) => fs.readFileSync(file, "utf8");
const pascal = (value) => value.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
const attributes = (source) => {
  const result = {};
  const attrRE = /([:\w-]+)="([^"]*)"/g;
  let match;
  while ((match = attrRE.exec(source))) {
    const key = match[1].replace(/[:-]([a-z])/g, (_, letter) => letter.toUpperCase());
    assert(!Object.hasOwn(result, key), "Duplicate SVG attribute: " + key);
    result[key] = match[2];
  }
  assert.equal(source.replace(attrRE, "").trim(), "", "Unexpected SVG attributes: " + source);
  return result;
};
const svgNodes = (file) => {
  const source = read(file);
  assert(source.includes('stroke="currentColor"'), "Missing theme-safe stroke: " + file);
  assert(!/<script|<foreignObject|<image|javascript:|onload=|#[0-9a-f]{6}/i.test(source), "Unsafe icon: " + file);
  const match = source.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>\s*$/);
  assert(match, "Invalid SVG: " + file);
  const body = match[1], nodes = [];
  const tagRE = /<([a-z][\w-]*)\b([^<>]*?)\/>/g;
  let item;
  while ((item = tagRE.exec(body))) {
    assert(["path", "circle", "rect", "line", "polyline", "polygon", "ellipse"].includes(item[1]),
      "Unsupported Lucide element: " + item[1]);
    nodes.push([item[1], attributes(item[2])]);
  }
  assert(nodes.length > 0, "SVG has no paths: " + file);
  assert.equal(body.replace(tagRE, "").trim(), "", "Unsupported SVG markup: " + file);
  return nodes;
};
const partFiles = fs.readdirSync(partsDir).filter((file) => file.endsWith(".js")).sort();
const icons = partFiles.flatMap((file) => {
  const script = read(path.join(partsDir, file));
  const match = script.match(/\.push\((\[[\s\S]*\])\);/);
  assert(match, "Unexpected catalog format: " + file);
  return JSON.parse(match[1]);
}).sort((a, b) => a.name.localeCompare(b.name));
assert.equal(icons.length, 95, "Icon catalog count changed: update expected count intentionally");
assert.equal(new Set(icons.map((i) => i.name)).size, icons.length, "Duplicate icon names");
const assetNames = fs.readdirSync(sourceDir).filter((file) => file.endsWith(".svg")).sort();
assert.deepEqual(icons.map((i) => i.name + ".svg").sort(), assetNames, "SVG/catalog drift");
let checked = 0;
function output(relative, content) {
  const file = path.join(destination, relative);
  if (isCheck) {
    assert(fs.existsSync(file), "Missing generated icon file: " + file);
    assert.equal(read(file), content, "Stale React icon output: " + file);
  } else {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (!fs.existsSync(file) || read(file) !== content) fs.writeFileSync(file, content);
  }
  checked++;
}
const names = [];
for (const item of icons) {
  assert(/^[a-z][a-z0-9-]*$/.test(item.name), "Unsupported icon name " + item.name);
  const component = pascal(item.name);
  const nodes = svgNodes(path.join(sourceDir, item.name + ".svg"));
  names.push([item, component]);
  const code = [
    "/* Generated from assets/icons/" + item.name + ".svg; do not edit. */",
    'import { createIcon } from "../createIcon.js";',
    "export const " + component + ' = createIcon("' + component + '", ' + JSON.stringify(nodes) + ");",
    ""
  ].join("\n");
  output(path.join("icons", component + ".ts"), code);
}
const index = [
  "/* Generated barrel. Tree-shaking: import named icons, not a runtime name registry. */",
  'export { Icon, IconTile } from "./Icon.js";',
  'export type { IconComponent, IconProps, IconVariant, IconTone } from "./createIcon.js";',
  'export type { IconSlotProps, IconTileProps } from "./Icon.js";',
  'export { iconCatalog } from "./catalog.js";',
  'export type { IconName } from "./catalog.js";',
  ...names.map(([, component]) => 'export { ' + component + ' } from "./icons/' + component + '.js";'),
  ""
].join("\n");
output("index.ts", index);
const catalog = [
  "/* Generated metadata; component modules are never dynamically imported here. */",
  "export const iconCatalog = " + JSON.stringify(names.map(([item, component]) =>
    ({ name: item.name, component, label: item.label, category: item.category })), null, 2) + " as const;",
  "export type IconName = (typeof iconCatalog)[number][\"name\"];",
  ""
].join("\n");
output("catalog.ts", catalog);
console.log((isCheck ? "Verified" : "Generated") + " " + icons.length + " React icon modules (" + checked + " files)");
