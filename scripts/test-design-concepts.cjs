const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const designs = require("../data/design-catalog.js");
const core = require("../data/handoff-core.js");
const palettes = require("../data/palettes.json");
const fonts = require("../data/fonts.json");
assert.equal(
  designs.normalize({ set: "studio" }).concept,
  "minimal",
  "legacy studio defaults to minimal",
);
const concepts = require("../data/design-concepts.js");
const ids = [
  "minimal",
  "soft",
  "editorial",
  "compact",
  "brutalist",
  "glass",
  "expressive",
  "terminal",
  "tactile",
];
assert.deepEqual(
  concepts.concepts.map((c) => c.id),
  ids,
);
assert.throws(
  () => designs.normalize({ set: "studio", concept: "unknown" }),
  /Invalid.*concept/,
);
for (const id of ids) {
  const config = core.normalize(
    { scope: "dark-only", designSelection: { set: "studio", concept: id } },
    palettes,
    fonts,
    [],
  );
  assert.equal(core.profile(config, palettes).designSelection.concept, id);
  assert(core.styleCSS(config, palettes).includes(concepts.css(id)));
  assert(core.designMD(config, palettes, fonts).includes(concepts.brief(id)));
  assert(core.agentTask(config, palettes).includes(concepts.brief(id)));
  assert(!core.themeCSS(config, palettes).includes('[data-theme="light"]'));
  assert(
    !/--color-[\w-]+\s*:/.test(concepts.css(id)),
    "concepts never redefine semantic color tokens",
  );
}
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "concept-cli-"));
try {
  const config = core.normalize(
    { designSelection: { set: "studio", concept: "tactile" } },
    palettes,
    fonts,
    [],
  );
  fs.writeFileSync(path.join(tmp, "config.json"), JSON.stringify(config));
  execFileSync(process.execPath, [
    path.resolve(__dirname, "create-design-handoff.cjs"),
    "--config",
    path.join(tmp, "config.json"),
    "--out",
    path.join(tmp, "out"),
  ]);
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(tmp, "out/design-profile.json")))
      .designSelection.concept,
    "tactile",
  );
  assert.equal(
    fs.readFileSync(path.join(tmp, "out/selected-style.css"), "utf8"),
    core.styleCSS(config, palettes),
  );
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
assert.equal(
  fs.readFileSync(path.resolve(__dirname, "../css/concepts.css"), "utf8"),
  concepts.concepts.map((c) => concepts.css(c.id)).join("\n"),
);
console.log(
  "PASS: concepts, legacy defaults, invalid rejection, scope, single-source CSS and CLI parity",
);
