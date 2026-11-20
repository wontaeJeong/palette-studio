"use strict";
const assert = require("node:assert/strict");
const designs = require("../data/design-catalog.js");
const core = require("../data/handoff-core.js");
const kit = require("../data/palettes.json");
const fonts = require("../data/fonts.json");

// Old links and configurations must continue to render their original layout.
assert.equal(designs.normalize({ set: "studio" }).dashboardLayout, "cards");
assert.equal(designs.normalize({ set: "console" }).dashboardLayout, "cards");
assert.throws(() => designs.normalize({ set: "studio", dashboardLayout: "unknown" }), /Invalid design selection dashboardLayout/);
assert.throws(() => designs.normalize({ set: "studio", dashboardLayout: null }), /Invalid design selection dashboardLayout/);

const expected = {
  cards: /independent metrics/i,
  "metric-strip": /separator/i,
  "status-distribution": /mutually exclusive/i,
  "action-queue": /actionable/i,
  "primary-stat": /hierarchy/i,
  "exception-summary": /exception/i,
  "status-filters": /filter the actual list/i,
  "trend-rows": /time series/i,
  "target-progress": /target and denominator/i,
};
assert.deepEqual(designs.dashboardLayouts.map((p) => p.id), Object.keys(expected));
for (const [id, instruction] of Object.entries(expected)) {
  const config = core.normalize({ designSelection: { set: "studio", dashboardLayout: id } }, kit, fonts, []);
  assert.equal(core.profile(config, kit).designSelection.dashboardLayout, id);
  const preset = designs.dashboardLayouts.find((p) => p.id === id);
  const brief = designs.dashboardLayoutBrief(id);
  assert(brief.includes(preset.rule));
  for (const output of [core.agentTask(config, kit), core.designMD(config, kit)]) {
    assert(output.includes(`Dashboard summary layout: ${preset.name} (${id})`));
    assert.match(output, instruction, `${id} has an actionable implementation contract`);
    assert(output.includes(preset.rule), `${id} includes its complete layout guidance`);
    assert(output.includes(brief), `${id} direct copy and full handoff share one recipe`);
  }
  assert.match(core.checklist(config), /selected dashboard summary layout/i);
}
for (const file of ["handoff-config", "handoff-profile"]) {
  const schema = require(`../data/${file}.schema.json`);
  assert.deepEqual(schema.properties.designSelection.properties.dashboardLayout.enum, Object.keys(expected));
  assert(!schema.properties.designSelection.required.includes("dashboardLayout"), "legacy configs remain valid");
}
const legacy = core.normalize({}, kit, fonts, []);
assert(!Object.hasOwn(core.profile(legacy, kit), "designSelection"));
assert(!core.agentTask(legacy, kit).includes("Dashboard summary layout:"));
console.log("PASS: nine dashboard layout presets, legacy defaults, validation, schema and handoff contracts");
