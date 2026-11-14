const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const { execFileSync } = require("node:child_process");
const designs = require("../data/design-catalog.js");
const core = require("../data/handoff-core.js");
const kit = require("../data/palettes.json");
const fonts = require("../data/fonts.json");
assert.equal(designs.navigationDesigns.styles.length, 6);
assert.equal(designs.navigationDesigns.structures.length, 3);
assert.equal(
  new Set(designs.sets.map((s) => designs.selection(s.id).navigationStyle))
    .size,
  6,
);
for (const field of ["navigationStyle", "navigationStructure"]) {
  assert.throws(
    () => designs.normalize({ set: "studio", [field]: "bad" }),
    new RegExp("Invalid design selection " + field),
  );
  assert.equal(
    designs.normalize({ set: "studio" })[field],
    designs.selection("studio")[field],
  );
}
for (const style of designs.navigationDesigns.styles)
  for (const structure of designs.navigationDesigns.structures) {
    const config = core.normalize(
      {
        fonts: { source: "system" },
        designSelection: {
          set: "studio",
          navigationStyle: style.id,
          navigationStructure: structure.id,
        },
      },
      kit,
      fonts,
      [],
    );
    const selection = core.profile(config, kit).designSelection;
    assert.equal(selection.navigationStyle, style.id);
    assert.equal(selection.navigationStructure, structure.id);
    assert(core.styleCSS(config, kit).includes(`data-nav-style="${style.id}"`));
    assert(
      core
        .styleCSS(config, kit)
        .includes(`data-nav-structure="${structure.id}"`),
    );
    for (const text of [
      core.agentTask(config, kit),
      core.designMD(config, kit),
    ]) {
      assert(text.includes("Navigation appearance: " + style.name));
      assert(text.includes("Navigation structure: " + structure.name));
      assert(text.includes("ps-nav-item"));
    }
    assert(core.checklist(config).includes("selected navigation"));
    for (const file of [
      "handoff-config.schema.json",
      "handoff-profile.schema.json",
    ]) {
      const props = require("../data/" + file).properties.designSelection
        .properties;
      assert(props.navigationStyle.enum.includes(style.id));
      assert(props.navigationStructure.enum.includes(structure.id));
    }
  }
const config = core.normalize(
  {
    fonts: { source: "system" },
    designSelection: {
      set: "bloom",
      navigationStyle: "edge",
      navigationStructure: "grouped",
    },
  },
  kit,
  fonts,
  [],
);
const temp = fs.mkdtempSync(path.join(os.tmpdir(), "navigation-export-"));
try {
  fs.writeFileSync(path.join(temp, "config.json"), JSON.stringify(config));
  const args = [
    path.resolve(__dirname, "create-design-handoff.cjs"),
    "--config",
    path.join(temp, "config.json"),
    "--out",
    path.join(temp, "out"),
  ];
  execFileSync(process.execPath, args);
  execFileSync(process.execPath, [...args, "--check"]);
  for (const [file, text] of Object.entries({
    "selected-style.css": core.styleCSS(config, kit),
    "design.md": core.designMD(config, kit),
    "AGENT-TASK.md": core.agentTask(config, kit),
  }))
    assert.equal(fs.readFileSync(path.join(temp, "out", file), "utf8"), text);
  assert.deepEqual(
    JSON.parse(fs.readFileSync(path.join(temp, "out/design-profile.json")))
      .designSelection,
    config.designSelection,
  );
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
for (const navigation of ["top", "left", "hybrid"]) {
  const config = core.normalize(
    { designSelection: { set: "studio", navigation } },
    kit,
    fonts,
    [],
  );
  const brief = core.agentTask(config, kit);
  assert(
    !brief.includes("accessible navigation drawer") &&
      !brief.includes("accessible drawer"),
    "responsive contract follows wrapping menu",
  );
  assert(brief.includes("wrapping horizontal"));
  assert(
    brief
      .match(/<nav class="ps-navigation[^>]+>/)[0]
      .includes(
        `data-nav-orientation="${navigation === "top" ? "horizontal" : "vertical"}"`,
      ),
    "exported example preserves placement",
  );
}
const legacy = core.normalize({}, kit, fonts, []);
assert(!core.styleCSS(legacy, kit).includes("ps-navigation"));
console.log(
  "PASS: navigation defaults, validation, 18 recipes, schemas, guidance and CLI parity",
);
