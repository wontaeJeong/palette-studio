#!/usr/bin/env node
/* No network or npm dependencies. Produces a deterministic agent handoff. */
"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const os = require("node:os");
const handoff = require("../data/handoff-core.js");
const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(file, "utf8");
const catalog = JSON.parse(read(path.join(root, "data/palettes.json")));
const fonts = JSON.parse(read(path.join(root, "data/fonts.json")));
const iconDir = path.join(root, "data/icon-parts");
const iconCatalog = fs.readdirSync(iconDir).filter((f) => f.endsWith(".js")).sort()
  .flatMap((file) => {
    const match = read(path.join(iconDir, file)).match(/\.push\((\[[\s\S]*\])\);/);
    if (!match) throw Error("Invalid icon catalog " + file);
    return JSON.parse(match[1]);
  });
const help = [
  "Palette Studio agent handoff generator (no package install needed)",
  "",
  "node scripts/create-design-handoff.cjs [options]",
  "",
  "  --config <file>          JSON config exported by handoff.html",
  "  --out <directory>       output directory (default: out/design-handoff)",
  "  --project <name>        descriptive project name",
  "  --palette <id>          one of 32 palette ids",
  "  --style <id>            operational|soft|outline|editorial|compact|contrast",
  "  --target <name>         new-app|existing-app",
  "  --scope <name>          both|light-only|dark-only",
  "  --layout <name>         existing|dashboard|content|workflow|marketing",
  "  --framework <name>      react|vanilla|astro",
  "  --body-font <id>        from data/fonts.json",
  "  --code-font <id>        from data/fonts.json",
  "  --font-source <name>    cdn-first|local-only|system",
  "  --icons <csv>           icon ids (e.g. house,search,shield-check)",
  "  --check                 verify existing output byte-for-byte; no writes",
  "  --list                  list palette/style IDs and icon categories",
  "  --help                  show help",
  "",
  "Example:",
  "node scripts/create-design-handoff.cjs --palette slate-blue --scope dark-only --target existing-app --layout existing --out design/",
  ""
].join("\n");
function parse(argv) {
  const result = {};
  const flags = new Set(["check", "list", "help"]);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) throw Error("Unexpected argument " + arg + "\n" + help);
    const key = arg.slice(2);
    if (flags.has(key)) { result[key] = true; continue; }
    if (!["config", "out", "project", "palette", "style", "target", "scope", "layout",
      "framework", "body-font", "code-font", "font-source", "icons"].includes(key))
      throw Error("Unknown option " + arg);
    if (!argv[i + 1] || argv[i + 1].startsWith("--")) throw Error("Missing value for " + arg);
    result[key] = argv[++i];
  }
  return result;
}
function main() {
  const flags = parse(process.argv.slice(2));
  if (flags.help) { process.stdout.write(help); return; }
  if (flags.list) {
    console.log(JSON.stringify({
      palettes: catalog.palettes.map((p) => p.id),
      styles: catalog.styles.map((s) => s.id),
      layouts: Object.keys(handoff.layouts), frameworks: handoff.frameworks,
      icons: iconCatalog.map((i) => i.name),
    }, null, 2));
    return;
  }
  let input = flags.config ? JSON.parse(read(path.resolve(flags.config))) : {};
  for (const [flag, field] of Object.entries({
    project: "project", palette: "palette", style: "style", target: "target",
    scope: "scope", layout: "layout", framework: "framework",
  })) if (flags[flag]) input[field] = flags[flag];
  input.fonts = { ...(input.fonts || {}) };
  if (flags["body-font"]) input.fonts.body = flags["body-font"];
  if (flags["code-font"]) input.fonts.code = flags["code-font"];
  if (flags["font-source"]) input.fonts.source = flags["font-source"];
  if (flags.icons !== undefined) input.icons = flags.icons.split(",").map((s) => s.trim()).filter(Boolean);
  const config = handoff.normalize(input, catalog, fonts, iconCatalog);
  const output = path.resolve(flags.out || "out/design-handoff");
  const checking = Boolean(flags.check);
  let files = 0;
  function save(name, value) {
    const target = path.join(output, name);
    if (!target.startsWith(output + path.sep)) throw Error("Unsafe output file " + name);
    const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value, "utf8");
    if (checking) {
      if (!fs.existsSync(target)) throw Error("Missing output: " + target);
      const actual = fs.readFileSync(target);
      if (crypto.createHash("sha256").update(buffer).digest("hex") !==
          crypto.createHash("sha256").update(actual).digest("hex"))
        throw Error("Generated output drift: " + target);
    } else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      if (!fs.existsSync(target) || !fs.readFileSync(target).equals(buffer))
        fs.writeFileSync(target, buffer);
    }
    files++;
  }
  const profile = handoff.profile(config, catalog);
  save("handoff-config.json", JSON.stringify(config, null, 2) + "\n");
  save("handoff-config.schema.json", read(path.join(root, "data/handoff-config.schema.json")));
  save("design-profile.json", JSON.stringify(profile, null, 2) + "\n");
  save("design-profile.schema.json", read(path.join(root, "data/handoff-profile.schema.json")));
  save("design.md", handoff.designMD(config, catalog));
  save("selected-theme.css", handoff.themeCSS(config, catalog));
  save("selected-style.css", handoff.styleCSS(config, catalog));
  save("selected-fonts.css", handoff.fontCSS(config, fonts));
  save("AGENT-TASK.md", handoff.agentTask(config));
  save("QA-CHECKLIST.md", handoff.checklist(config));
  save("README.md", [
    "# Palette Studio project handoff",
    "",
    "These files describe an explicit, reusable design decision. They are not a new component framework.",
    "",
    "1. Commit design-profile.json and design.md to your target project.",
    "2. Use AGENT-TASK.md to give OpenCode/Claude Code the specific implementation constraints.",
    "3. Merge the allowed color scope from selected-theme.css into the project's canonical theme.",
    "4. Apply typography and optional selected-style.css only after mapping existing components.",
    "5. Use only the icons in icons/ as SVG sources, or the separately built React icon tarball.",
    "6. Record actual browser and accessibility evidence in QA-CHECKLIST.md.",
    "",
    "Selected font WOFF2 binaries and their OFL licenses are under fonts/. No CDN is required",
    "when font-source=local-only; cdn-first tries a pinned CDN source before bundled fallback.",
    "Do not alter component architecture solely to match a generic dashboard sample.",
    ""
  ].join("\n"));
  // Copy selected SVG originals only, plus the full third-party license.
  for (const icon of config.icons) save("icons/" + icon + ".svg",
    fs.readFileSync(path.join(root, "assets/icons", icon + ".svg")));
  if (config.icons.length) save("icons/LICENSE-LUCIDE.txt",
    fs.readFileSync(path.join(root, "assets/icons/LICENSE-LUCIDE.txt")));
  if (config.fonts.source !== "system") {
    const selectedFonts = handoff.chosenFonts(config, fonts);
    const unique = Array.from(new Map(selectedFonts.filter(Boolean).map((f) => [f.id, f])).values());
    for (const font of unique) {
      for (const face of font.faces) {
        const source = path.join(root, face.local);
        const bytes = fs.readFileSync(source);
        if (face.sha256 && crypto.createHash("sha256").update(bytes).digest("hex") !== face.sha256)
          throw Error("Font integrity check failed: " + face.local);
        save("fonts/" + font.id + "/" + path.basename(face.local), bytes);
      }
      save("fonts/" + font.id + "/OFL.txt", fs.readFileSync(
        path.join(root, "assets/fonts", font.id, "OFL.txt")));
    }
  }
  console.log((checking ? "Verified" : "Wrote") + " " + files +
    " handoff files; palette=" + config.palette + " scope=" + config.scope +
    " icons=" + config.icons.length + " path=" + output);
}
try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
