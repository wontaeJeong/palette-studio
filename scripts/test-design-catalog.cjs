const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const os = require("node:os");
const designs = require("../data/design-catalog.js");
const core = require("../data/handoff-core.js");
const catalog = require("../data/palettes.json");
const fonts = require("../data/fonts.json");
assert.equal(designs.sets.length, 6);
assert.equal(designs.navigationPresets.length, 3);
assert.equal(designs.motionPresets.length, 4);
for (const motion of designs.motionPresets) {
  const config = core.normalize(
    {
      designSelection: { set: "studio", motion: motion.id, navigation: "top" },
    },
    catalog,
    fonts,
    [],
  );
  assert(core.motionCSS(config).includes(motion.duration + "ms"));
  assert(core.motionCSS(config).includes("prefers-reduced-motion: reduce"));
  assert(core.agentTask(config, catalog).includes("Navigation layout:"));
}
assert.throws(
  () => designs.normalize({ set: "studio", motion: "spin" }),
  /Invalid design selection motion/,
);
assert.throws(
  () => designs.normalize({ set: "studio", navigation: "bottom" }),
  /Invalid design selection navigation/,
);
assert.equal(designs.components.length, 19);
for (const set of designs.sets) {
  assert(set.recommendedPalettes.includes(set.palette));
  assert(
    set.recommendedPalettes.every((id) =>
      catalog.palettes.some((p) => p.id === id),
    ),
  );
  assert(set.recommendedComponents.length >= 4);
  assert(
    set.recommendedComponents.every((id) =>
      designs.components.some((c) => c.id === id),
    ),
  );
  assert(set.recommendationReason.length > 10);
  const selection = designs.selection(set.id);
  const config = core.normalize(
    { ...set.config, designSelection: selection },
    catalog,
    fonts,
    [],
  );
  assert.deepEqual(core.profile(config, catalog).designSelection, selection);
  for (const item of designs.components) {
    assert(item.variants.includes(selection.components[item.id]));
    for (const variant of item.variants) {
      const changed = {
        ...selection,
        components: { ...selection.components, [item.id]: variant },
      };
      const normalized = core.normalize(
        { ...config, designSelection: changed },
        catalog,
        fonts,
        [],
      );
      assert(core.agentTask(normalized).includes(item.name));
      assert(core.designMD(normalized, catalog).includes(item.name));
      assert(core.checklist(normalized).includes(item.name));
    }
  }
}
for (const invalid of [
  { set: "bad" },
  { set: "studio", components: { unknown: "soft" } },
  { set: "studio", components: { toast: "bad" } },
  [],
  null,
]) {
  assert.throws(
    () => core.normalize({ designSelection: invalid }, catalog, fonts, []),
    /design selection/i,
  );
}
assert.equal(
  new Set(designs.sets.map((s) => s.recommendedComponents.join(","))).size,
  6,
);
assert.equal(designs.selection("precision").components.button, "solid");
const legacy = core.normalize({}, catalog, fonts, []);
assert(!Object.hasOwn(core.profile(legacy, catalog), "designSelection"));
const selection = designs.selection("studio");
const normalized = core.normalize(
  { designSelection: { set: "studio", components: { toast: "outline" } } },
  catalog,
  fonts,
  [],
);
assert.equal(normalized.designSelection.components.toast, "outline");
assert.equal(Object.keys(normalized.designSelection.components).length, 19);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-test-"));
try {
  const input = {
    ...designs.sets[0].config,
    icons: [],
    designSelection: selection,
    fonts: { source: "system", body: "system", code: "system" },
  };
  fs.writeFileSync(path.join(temp, "input.json"), JSON.stringify(input));
  const args = [
    path.resolve(__dirname, "create-design-handoff.cjs"),
    "--config",
    path.join(temp, "input.json"),
    "--out",
    path.join(temp, "out"),
  ];
  execFileSync(process.execPath, args);
  execFileSync(process.execPath, [...args, "--check"]);
  const config = core.normalize(input, catalog, fonts, []);
  assert.equal(
    fs.readFileSync(path.join(temp, "out/AGENT-TASK.md"), "utf8"),
    core.agentTask(config, catalog),
  );
  assert(core.agentTask(config, catalog).includes("--color-accent:"));
  assert(core.agentTask(config, catalog).includes("--ui-radius:"));
  assert.equal(
    fs.readFileSync(path.join(temp, "out/selected-motion.css"), "utf8"),
    core.motionCSS(config),
  );
  const dark = { ...config, scope: "dark-only" };
  assert(!core.agentTask(dark, catalog).includes(':root[data-theme="light"]'));
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(temp, "out/design-profile.json")))
      .designSelection,
    selection,
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log(
  "PASS: six sets, 19 components, all variants, legacy/invalid input, CLI parity and drift",
);
