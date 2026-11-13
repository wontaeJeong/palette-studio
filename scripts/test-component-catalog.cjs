const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const kit = require("../data/component-catalog.js");
const core = require("../data/handoff-core.js");
const palettes = require("../data/palettes.json");
const fonts = require("../data/fonts.json");
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync("data/catalog.js", "utf8"), ctx);
assert.equal(kit.components.length, 30);
assert.equal(kit.presets.length, 6);
for (const p of kit.presets) {
  const s = kit.normalize({ preset: p.id, overrides: {} });
  const recipes = kit.resolve(s);
  assert.equal(Object.keys(recipes).length, 30);
  assert(palettes.palettes.some((x) => x.id === p.palette));
  assert(palettes.styles.some((x) => x.id === p.style));
  for (const c of kit.components) {
    assert.equal(c.variants.length, 3);
    assert(recipes[c.id].behavior);
    assert(recipes[c.id].tokens.background);
  }
}
assert(
  kit.resolve({ preset: "compact", overrides: {} }).card.padding <
    kit.resolve({ preset: "calm", overrides: {} }).card.padding,
  "compact preset must change density",
);
const selection = kit.normalize({
  preset: kit.presets[0].id,
  overrides: { toast: "accent" },
});
assert.equal(kit.resolve(selection).toast.variant, "accent");
assert.throws(() => kit.normalize({ preset: "missing" }), /preset/i);
assert.throws(
  () =>
    kit.normalize({
      preset: selection.preset,
      overrides: { unknown: "accent" },
    }),
  /component/i,
);
assert.throws(
  () =>
    kit.normalize({
      preset: selection.preset,
      overrides: { toast: "missing" },
    }),
  /variant/i,
);
assert.equal(kit.normalize(undefined), undefined);
const config = core.normalize(
  { designSelection: selection },
  palettes,
  fonts,
  [],
);
assert.deepEqual(config.designSelection, selection);
assert.equal(
  core.profile(config, palettes).componentRecipes.toast.variant,
  "accent",
);
assert(core.agentTask(config).includes("Toast"));
assert(core.agentTask(config).includes("accent"));
assert(core.designMD(config, palettes).includes("Toast"));
assert.equal(
  core.normalize({}, palettes, fonts, []).designSelection,
  undefined,
);
console.log(
  "PASS: 30 component families, 90 recipes, 6 presets, overrides, validation, legacy and shared handoff",
);
// Full CLI export must keep the same selected recipe, not merely the theme.
const os = require("node:os"),
  path = require("node:path"),
  cp = require("node:child_process");
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-cli-"));
try {
  fs.writeFileSync(path.join(tmp, "config.json"), JSON.stringify(config));
  cp.execFileSync(process.execPath, [
    "scripts/create-design-handoff.cjs",
    "--config",
    path.join(tmp, "config.json"),
    "--out",
    path.join(tmp, "out"),
  ]);
  const profile = JSON.parse(
    fs.readFileSync(path.join(tmp, "out/design-profile.json")),
  );
  assert.deepEqual(profile.designSelection, selection);
  assert.equal(profile.componentRecipes.toast.variant, "accent");
  assert(
    fs
      .readFileSync(path.join(tmp, "out/AGENT-TASK.md"), "utf8")
      .includes("Toast"),
  );
  cp.execFileSync(process.execPath, [
    "scripts/create-design-handoff.cjs",
    "--config",
    path.join(tmp, "config.json"),
    "--out",
    path.join(tmp, "out"),
    "--check",
  ]);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
