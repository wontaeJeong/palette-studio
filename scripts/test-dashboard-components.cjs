"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const designs = require("../data/design-catalog.js");
const core = require("../data/handoff-core.js");
const palettes = require("../data/palettes.json");
const fonts = require("../data/fonts.json");
const added = [
  "bar-chart",
  "stacked-bar",
  "line-chart",
  "area-chart",
  "donut-chart",
  "pie-chart",
  "histogram",
  "scatter-chart",
  "heatmap",
  "sparkline",
  "metric",
  "progress",
  "circular-progress",
  "stepper",
  "skeleton",
  "spinner",
  "error-state",
  "radio",
  "textarea",
  "slider",
  "date-picker",
  "file-upload",
  "combobox",
  "data-table",
  "avatar",
  "timeline",
  "list",
  "separator",
];
const old = designs.normalize({
  set: "studio",
  components: { toast: "outline" },
});
for (const id of added) {
  assert.equal(old.components[id], "soft", `legacy selection gains ${id}`);
  for (const treatment of ["soft", "outline", "solid"]) {
    const config = core.normalize(
      {
        scope: "dark-only",
        designSelection: { set: "studio", components: { [id]: treatment } },
      },
      palettes,
      fonts,
      [],
    );
    assert.equal(
      core.profile(config, palettes).designSelection.components[id],
      treatment,
    );
    assert(core.agentTask(config, palettes).includes(`${id}: ${treatment}`));
    assert(core.designMD(config, palettes).includes(`${id}: ${treatment}`));
    assert(!core.themeCSS(config, palettes).includes(":root:not("));
  }
}
assert.equal(old.components.toast, "outline");
assert.throws(() =>
  designs.normalize({ set: "studio", components: { "bar-chart": "unknown" } }),
);
for (const file of ["handoff-config", "handoff-profile"]) {
  const schema = JSON.parse(
    fs.readFileSync(require.resolve(`../data/${file}.schema.json`)),
  );
  for (const id of added)
    assert.deepEqual(
      schema.properties.designSelection.properties.components.properties[id]
        .enum,
      ["soft", "outline", "solid"],
    );
}
function luminance(hex) {
  const c = hex
    .slice(1)
    .match(/../g)
    .map((x) => parseInt(x, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (x + 0.05) / (y + 0.05);
}
for (const mode of ["light", "dark"]) {
  assert.notEqual(
    palettes.palettes[0].modes[mode]["--color-chart-1"],
    palettes.palettes[1].modes[mode]["--color-chart-1"],
    "chart series follows palette",
  );
  for (const palette of palettes.palettes) {
    const t = palette.modes[mode];
    for (let i = 1; i <= 5; i++) {
      assert.match(t[`--color-heatmap-${i}`], /^#[0-9A-F]{6}$/);
      assert(
        contrast(t[`--color-heatmap-${i}`], t[`--color-on-heatmap-${i}`]) >=
          4.5,
        `${palette.id}/${mode}/heatmap ${i} label contrast`,
      );
    }
    assert(
      new Set(
        Array.from({ length: 5 }, (_, i) => t[`--color-heatmap-${i + 1}`]),
      ).size === 5,
    );
  }
}
console.log(
  "PASS: 28 added components, legacy normalization, selectable/exported variants, schemas, palette-aware series and heatmap contrast",
);
