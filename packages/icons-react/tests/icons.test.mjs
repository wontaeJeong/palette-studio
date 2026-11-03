import test from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import path from "node:path";
import * as icons from "../dist/index.js";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("all 95 exported components correspond to catalog", () => {
  assert.equal(icons.iconCatalog.length, 95);
  for (const item of icons.iconCatalog) {
    assert.equal(typeof icons[item.component], "object");
    assert.equal(icons[item.component].displayName, item.component);
  }
  assert.equal(icons.iconCatalog.filter((x) => x.name === "shield-check").length, 1);
});
test("SSR: palette tokens, currentColor, refs and accessible name defaults", () => {
  const decorative = renderToStaticMarkup(createElement(icons.ShieldCheck));
  assert.match(decorative, /aria-hidden="true"/);
  assert.match(decorative, /stroke="currentColor"/);
  assert.match(decorative, /var\(--color-ink, currentColor\)/);
  const meaningful = renderToStaticMarkup(createElement(icons.ShieldCheck, {
    title: "Secure", variant: "success", size: 32, strokeWidth: 1.5,
  }));
  assert.match(meaningful, /<title>Secure<\/title>/);
  assert.match(meaningful, /role="img"/);
  assert.doesNotMatch(meaningful, /aria-hidden=/);
  assert.match(meaningful, /var\(--color-success, currentColor\)/);
  assert.match(meaningful, /width="32"/);
  assert.match(meaningful, /stroke-width="1.5"/);
  const slot = renderToStaticMarkup(createElement(icons.Icon, {
    icon: icons.ShieldCheck, "aria-label": "Verified", variant: "accent",
  }));
  assert.match(slot, /aria-label="Verified"/);
  assert.match(slot, /var\(--color-accent, currentColor\)/);
  const tile = renderToStaticMarkup(createElement(icons.IconTile, {
    icon: icons.ShieldCheck, "aria-label": "Verified",
  }));
  assert.match(tile, /background:var\(--color-accent, currentColor\)/);
  assert.match(tile, /var\(--color-on-accent, #fff\)/);
  const duo = renderToStaticMarkup(createElement(icons.House, { tone: "duotone" }));
  assert.match(duo, /stroke="var\(--color-accent, currentColor\)"/);
});
test("bundlers can tree-shake named imports", async () => {
  const opts = { bundle: true, platform: "browser", format: "esm", minify: true,
    write: false, external: ["react"], absWorkingDir: root };
  const lean = await build({ ...opts, stdin: { contents:
    'import { ShieldCheck } from "./dist/index.js"; console.log(ShieldCheck);',
    resolveDir: root, sourcefile: "lean.js" } });
  const all = await build({ ...opts, stdin: { contents:
    'import * as Icons from "./dist/index.js"; console.log(Icons);',
    resolveDir: root, sourcefile: "all.js" } });
  assert(lean.outputFiles[0].contents.length < all.outputFiles[0].contents.length / 3,
    "Single-icon bundle should be much smaller than full library");
});
