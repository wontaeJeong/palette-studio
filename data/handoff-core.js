/* Shared pure renderers for file:// Studio and dependency-free Node CLI. */
(function (root, createCore) {
  var designs = typeof module !== "undefined" && module.exports ? require("./design-catalog.js") : root.PaletteDesignCatalog;
  var api = createCore(designs);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.PaletteHandoff = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (designs) {
  "use strict";
  var layouts = {
    existing: "Preserve the existing application shell, information architecture and interaction conventions.",
    dashboard: "Prioritize data-density, navigable tables and explicit empty/loading/error states; retain filter and date-range controls.",
    content: "Prioritize readable hierarchy, content width, search, section navigation and long-form code blocks.",
    workflow: "Prioritize task progress, form validation, error recovery, pending actions and keyboard access.",
    marketing: "Prioritize content hierarchy, primary conversion action, responsive sections and trustworthy supporting details."
  };
  var frameworks = ["react", "vanilla", "astro"];
  var scopes = ["both", "dark-only", "light-only"];
  var targets = ["new-app", "existing-app"];
  var fontSources = ["cdn-first", "local-only", "system"];
  var iconPresets = {
    existing: ["house", "search", "settings", "circle-check"],
    dashboard: ["layout-dashboard", "search", "plus", "settings", "circle-check", "triangle-alert"],
    content: ["book-open", "file-text", "search", "bookmark", "external-link"],
    workflow: ["check", "circle-alert", "chevron-right", "upload", "clock"],
    marketing: ["arrow-right", "check", "sparkles", "external-link"]
  };
  function check(value, available, field) {
    if (!available.includes(value)) throw Error("Invalid " + field + ": " + value);
    return value;
  }
  function defaults(catalog, fontCatalog, iconCatalog) {
    var icons = iconCatalog || [];
    var ensure = function (name) { return icons.some(function (i) { return i.name === name; }); };
    var preset = iconPresets.dashboard.filter(ensure);
    return {
      project: "My Web App",
      palette: catalog.defaultPalette,
      style: catalog.defaultStyle,
      target: "new-app",
      scope: "both",
      layout: "dashboard",
      framework: "react",
      fonts: {
        body: fontCatalog.defaults.body,
        code: fontCatalog.defaults.code,
        source: fontCatalog.defaults.source
      },
      icons: preset
    };
  }
  function normalize(input, catalog, fontCatalog, iconCatalog) {
    var config = input || {}, icons = iconCatalog || [];
    var def = defaults(catalog, fontCatalog, icons);
    var result = {
      project: config.project === undefined ? def.project : String(config.project).trim(),
      palette: config.palette === undefined ? def.palette : config.palette,
      style: config.style === undefined ? def.style : config.style,
      target: config.target === undefined ? def.target : config.target,
      scope: config.scope === undefined ? def.scope : config.scope,
      layout: config.layout === undefined ? def.layout : config.layout,
      framework: config.framework === undefined ? def.framework : config.framework,
      fonts: Object.assign({}, def.fonts, config.fonts),
      icons: config.icons === undefined ? def.icons : config.icons
    };
    if (!/^[\p{L}\p{N}][\p{L}\p{N} _.-]{0,63}$/u.test(result.project))
      throw Error("Invalid project name (1-64 safe characters)");
    check(result.palette, catalog.palettes.map(function (p) { return p.id; }), "palette");
    check(result.style, catalog.styles.map(function (s) { return s.id; }), "style");
    check(result.target, targets, "target");
    check(result.scope, scopes, "scope");
    check(result.layout, Object.keys(layouts), "layout");
    check(result.framework, frameworks, "framework");
    check(result.fonts.source, fontSources, "font source");
    ["body", "code"].forEach(function (role) {
      check(result.fonts[role], ["system"].concat(fontCatalog.fonts.filter(function (f) {
        return f.role === role;
      }).map(function (f) { return f.id; })), role + " font");
    });
    // System-only means effective font roles are system, even if a stale config lists another family.
    if (result.fonts.source === "system") { result.fonts.body = "system"; result.fonts.code = "system"; }
    if (!Array.isArray(result.icons) || result.icons.length > 24)
      throw Error("Choose at most 24 icons");
    result.icons = Array.from(new Set(result.icons.map(String)));
    result.icons.forEach(function (name) {
      check(name, icons.map(function (i) { return i.name; }), "icon");
    });
    if (config.designSelection !== undefined) result.designSelection = designs.normalize(config.designSelection);
    return result;
  }
  function selected(config, catalog) {
    return {
      palette: catalog.palettes.find(function (p) { return p.id === config.palette; }),
      style: catalog.styles.find(function (s) { return s.id === config.style; })
    };
  }
  function profile(config, catalog) {
    var choice = selected(config, catalog);
    return {
      ...(config.designSelection ? {designSelection: designs.normalize(config.designSelection)} : {}),
      profileVersion: "2.0.0",
      kitVersion: catalog.version,
      project: config.project,
      palette: config.palette,
      style: config.style,
      target: config.target,
      scope: config.scope,
      framework: config.framework,
      layout: config.layout,
      icons: { names: config.icons, source: "palette-studio/assets/icons", strategy: "static-import" },
      fonts: config.fonts,
      fontScope: "global",
      tokenPolicy: "literal-hex-no-color-aliases",
      constraints: [
        "Preserve existing UI and semantics within scope; do not blindly replace components.",
        "Use a single canonical definition per mode and token.",
        "Do not mistake offline preview or static contrasts for full accessibility approval."
      ],
      reviewScreens: ["navigation", "real content", "empty/loading/error", "small viewport"],
      selectedStyle: { radius: choice.style.radius, card: choice.style.card,
        gap: choice.style.gap, padding: choice.style.padding, height: choice.style.height }
    };
  }
  function cssTokens(tokens) {
    return Object.keys(tokens).sort().map(function (name) {
      var value = tokens[name];
      if (!/^--color-[a-z0-9-]+$/.test(name) || !/^#[0-9a-fA-F]{6}$/.test(value))
        throw Error("Unexpected color token: " + name + " " + value);
      return "  " + name + ": " + value.toUpperCase() + ";";
    }).join("\n");
  }
  function themeCSS(config, catalog) {
    var p = selected(config, catalog).palette, chunks = [
      "/* Palette Studio: " + p.name + " | " + config.scope + " */",
      "/* Semantic token declarations are literal HEX; consume using var(--color-...). */"
    ];
    if (config.scope === "both" || config.scope === "light-only")
      chunks.push((config.scope === "both" ?
        ':root, :root[data-theme="light"]' : ':root[data-theme="light"]') +
        " {\n  color-scheme: light;\n" + cssTokens(p.modes.light) + "\n}");
    if (config.scope === "both" || config.scope === "dark-only")
      chunks.push(':root[data-theme="dark"] {\n  color-scheme: dark;\n' +
        cssTokens(p.modes.dark) + "\n}");
    return chunks.join("\n\n") + "\n";
  }
  function styleCSS(config, catalog) {
    var s = selected(config, catalog).style;
    return [
      "/* Palette Studio style " + s.id + " — optional values, not a UI replacement. */",
      ':root[data-style="' + s.id + '"] {',
      "  --ui-radius: " + s.radius + ";",
      "  --ui-card: " + s.card + ";",
      "  --ui-padding: " + s.padding + ";",
      "  --ui-height: " + s.height + ";",
      "  --ui-gap: " + s.gap + ";",
      "  --ui-font: " + s.font + ";",
      "  --ui-line: " + s.line + ";",
      "  --ui-border: " + s.border + ";",
      "  --ui-shadow: " + s.shadow + ";",
      "}",
      config.designSelection ? designs.navigationDesigns.css(designs.normalize(config.designSelection).navigationStyle, designs.normalize(config.designSelection).navigationStructure) : "",
      ""
    ].join("\n");
  }
  function chosenFonts(config, fontCatalog) {
    var selected = ["body", "code"].map(function (role) {
      var id = config.fonts[role];
      return id === "system" ? null : fontCatalog.fonts.find(function (f) {
        return f.id === id && f.role === role;
      });
    });
    if (config.fonts.source !== "system") selected.slice().forEach(function (font, index) {
      if (font && font.korean === false) {
        var fallback = fontCatalog.fonts.find(function (f) { return f.id === (index === 0 ? "pretendard" : "d2coding"); });
        if (fallback && !selected.some(function (f) { return f && f.id === fallback.id; })) selected.push(fallback);
      }
    });
    return selected;
  }
  function fontCSS(config, fontCatalog) {
    var faces = [], names = [];
    var fontList = chosenFonts(config, fontCatalog);
    fontList.forEach(function (font, index) {
      names[index] = font ? font.family : index === 0 ? "system-ui" : "ui-monospace";
      if (!font || config.fonts.source === "system") return;
      for (var face of font.faces) {
        var local = "./fonts/" + font.id + "/" + face.local.split("/").pop();
        var src = config.fonts.source === "cdn-first"
          ? ['url("' + face.cdn + '") format("woff2")', 'url("' + local + '") format("woff2")']
          : ['url("' + local + '") format("woff2")'];
        faces.push('@font-face {\n  font-family: "' +
          font.family.replace(/"/g, "") + '";\n  src: ' + src.join(", ") +
          ';\n  font-style: normal;\n  font-weight: ' + face.weight +
          ';\n  font-display: swap;\n' + (face.unicodeRange ? '  unicode-range: ' + face.unicodeRange + ';\n' : '') + '}');
      }
    });
    var body = config.fonts.source === "system" || !fontList[0] ?
      "system-ui, -apple-system, sans-serif" : '"' + names[0] + '", ' + (fontList[0].korean === false ? '"Pretendard Variable", ' : '') + 'system-ui, sans-serif';
    var code = config.fonts.source === "system" || !fontList[1] ?
      "ui-monospace, SFMono-Regular, monospace" : '"' + names[1] + '", ' + (fontList[1].korean === false ? '"D2Coding", ' : '') + 'ui-monospace, monospace';
    return ["/* Font CSS; local font assets are included by the CLI generator. */",
      ...faces, ":root {", "  --kit-font-sans: " + body + ";",
      "  --kit-font-mono: " + code + ";", "}", ""].join("\n\n");
  }
  function designMD(config, catalog) {
    var choice = selected(config, catalog), p = choice.palette, s = choice.style;
    var semantic = [
      "--color-canvas", "--color-raised", "--color-ink", "--color-ink-muted",
      "--color-accent", "--color-accent-strong", "--color-line-strong",
      "--color-focus", "--color-success", "--color-warning", "--color-danger", "--color-info"
    ];
    var rows = semantic.map(function (key) {
      return "| " + key + " | " + p.modes.light[key] + " | " + p.modes.dark[key] + " |";
    });
    var scope = config.scope === "dark-only" ? "Only dark colors may change; keep existing light untouched." :
      config.scope === "light-only" ? "Only light colors may change; keep existing dark untouched." :
      "Light and dark colors can both change within the chosen design scope.";
    return [
      "# design.md — " + config.project,
      "",
      "> Project-specific design contract for coding agents. This is a reference, not permission to rebuild the application's feature architecture.",
      "",
      "## Selection",
      "",
      "| Axis | Decision |",
      "|---|---|",
      "| Palette | " + p.name + " (" + config.palette + ") |",
      "| Style | " + s.name + " (" + config.style + ") |",
      "| Framework | " + config.framework + " |",
      "| Layout intent | " + config.layout + " |",
      "| Target | " + config.target + " |",
      "| Change scope | " + config.scope + " |",
      "| Body / code font | " + config.fonts.body + " / " + config.fonts.code + " (" + config.fonts.source + ") |",
      "| Icon source | " + (config.framework === "react" ? "@palette-studio/icons-react (local tarball)" : "vendored inline SVG") + " |",
      "",
      "## Layout and interaction",
      "",
      layouts[config.layout],
      "",
      "- Content hierarchy, density and interaction must match the *existing user task*, not a generic AI-generated dashboard.",
      "- Use navigation focus/selected state, predictable tabs, meaningful search/filters, readable long content and explicit feedback where needed.",
      "- Distinguish empty, loading, error, unauthorized, partial success and completed states; never rely on color alone.",
      "- A sidebar is optional; don't invent navigation or cards solely to imitate a sample mockup.",
      "- Avoid repetitively rounded cards, left-accent callout borders, large decorative gradients and meaningless status pills.",
      "- For controls: default, hover, focus-visible, pressed, disabled, loading, validation and mobile behavior need explicit treatments.",
      "",
      "## Layout measurements",
      "",
      "| Role | Value |",
      "|---|---|",
      "| General radius | " + s.radius + " |",
      "| Card radius | " + s.card + " |",
      "| Content spacing | " + s.gap + " |",
      "| Component padding | " + s.padding + " |",
      "| Control height reference | " + s.height + " (adjust for target accessibility) |",
      "| Base font size | " + s.font + " |",
      "",
      "## Semantic colors (reference)",
      "",
      "The exported selected-theme.css is canonical; do not copy this table into a second token source.",
      "",
      "| Token | Light | Dark |",
      "|---|---|---|",
      ...rows,
      "",
      "## Theme and typography",
      "",
      "- " + scope,
      "- Define each token as one direct HEX value per mode in the app's canonical token source; use var(--color-...) at component consumption sites.",
      "- When adapting an existing app, map the selected roles to its existing ThemeProvider and selectors. Do not introduce a second theme engine.",
      "- Use selected-fonts.css for role-specific font families; preserve SIL OFL licenses and CSP. If the app already loads fonts, merge rather than duplicate.",
      "- Color and typography are orthogonal: do not change font solely because light/dark toggled.",
      "",
      "## Iconography",
      "",
      "- Standard is 24px SVG viewBox with currentColor strokes; size typically 16/20/24 px at 1.5–2 stroke width.",
      "- Selected icons: " + (config.icons.length ? config.icons.join(", ") : "(choose per screen)") + ".",
      "- Prefer named, tree-shakeable React imports or inline SVG. Do not use SVG img src with the expectation of currentColor inheritance.",
      "- Accent, danger, warning, success and info remain semantic, not arbitrary decorative colors.",
      "- Icon-only controls need accessible labels; decorative icons should be aria-hidden. Do not communicate severity with icons alone.",
      "- Filled tile is a colored wrapper behind the original outline glyph, not a different solid icon shape.",
      "",
      designs.brief(config.designSelection),
      "## Components and data",
      "",
      "- Reuse existing UI components (e.g. Radix/shadcn), toast and chart packages where present; this kit is not a replacement component framework.",
      "- Show representative Korean/English text lengths, real table density, JSON, loading and failure conditions in reviews.",
      "- Charts must include axis/legend/units and accessible descriptions, not only colors; do not fabricate metrics.",
      "",
      "## Acceptance evidence",
      "",
      "- Implement only the requested feature/change; record exceptions when existing constraints block a detail.",
      "- Compare at least desktop + narrow viewport and Light + Dark where scoped.",
      "- Verify color pairs against the existing project's actual rendered DOM, keyboard/focus, state labels, responsive overflow and SSR/hydration.",
      "- Treat static token checks as supplemental; they are not a claim of WCAG compliance.",
      "- Keep profile JSON and design.md committed together so later agents can apply the same decisions.",
      "",
      "## References",
      "",
      "- design-profile.json — machine-readable selection (source of truth)",
      "- selected-theme.css — only the chosen palette and allowed scope",
      "- selected-style.css — optional style variables",
      "- selected-motion.css — scoped CSS animations and reduced-motion policy",
      "- selected-fonts.css — font families and offline/CDN policy",
      "- AGENT-TASK.md — concise implementation brief",
      "- QA-CHECKLIST.md — test evidence checklist",
      ""
    ].join("\n");
  }
  function motionCSS(config) { return designs.motionCSS(config.designSelection ? designs.normalize(config.designSelection).motion : "none"); }
  function agentTask(config, catalog) {
    return [
      "# Agent task — apply selected design",
      ...(config.designSelection && catalog ? [
        "", "## Inline handoff for a standalone prompt", "",
        "The following locked profile and CSS are included so this brief can be used on its own. Save the profile as design-profile.json and the CSS as the canonical selected-theme.css / selected-style.css sources, adapt existing selectors, and produce design.md and QA evidence from these decisions. Do not add a second theme engine.",
        "", "```json", JSON.stringify(profile(config, catalog), null, 2), "```", "",
        "```css", themeCSS(config, catalog), styleCSS(config, catalog), motionCSS(config), "```", ""
      ] : []),
      designs.brief(config.designSelection),
      "",
      "Use the repository's existing agent workflow (including Superpowers if enabled) rather than repeating generic planning boilerplate.",
      "",
      "Treat design-profile.json as the locked machine-readable selection and design.md as its design rationale. Inspect the target application's actual components and adapt only the requested scope.",
      "",
      "- Palette: " + config.palette + "; style: " + config.style + "; layout intent: " + config.layout + ".",
      "- Target: " + config.target + "; scope: " + config.scope + "; framework: " + config.framework + ".",
      "- Fonts: " + config.fonts.body + " / " + config.fonts.code + " (" + config.fonts.source + ").",
      "- Icons: " + config.icons.join(", ") + ".",
      "- Existing UX and app theme selector win over demo-only class names. Map tokens once; do not duplicate theme providers or CSS tokens.",
      "- If dark-only, do not import a whole two-mode palette and change light by accident.",
      "- Work with realistic content and errors; check components, navigation/focus and mobile overflow in the actual app.",
      "- Preserve accessibility labels and icon semantics; use static named React imports for bundle efficiency.",
      "- Document changed screens, code paths, evidence and unresolved conflicts concisely against QA-CHECKLIST.md.",
      "",
      "Deliver the requested screen/feature with appropriate evidence, not a wholesale redesign or a generic set of showcase cards.",
      ""
    ].join("\n");
  }
  function checklist(config) {
    return [
      "# QA-CHECKLIST.md",
      "",
      "Scope: " + config.scope + " / " + config.target + " / " + config.framework,
      "",
      "## Static contracts",
      "- [ ] Selected palette and style IDs match design-profile.json.",
      "- [ ] No additional global palette CSS or duplicate token definitions were introduced.",
      "- [ ] Colors use semantic tokens; status/severity remains distinct.",
      "- [ ] Selected source fonts have required OFL attribution and offline behavior.",
      "- [ ] Icons render via currentColor, no hardcoded SVG HEX and no accidental full-library runtime import.",
      "",
      "## Real interaction evidence",
      "- [ ] Default/hover/focus-visible/disabled/loading/invalid action states were exercised.",
      "- [ ] Keyboard navigation, tab order and icon-only accessible names were verified.",
      ...(config.designSelection ? ["- [ ] The selected navigation appearance and structure match the profile; current item, hover, focus, disabled and narrow-screen labels were verified."] : []),
      "- [ ] Empty, error, unauthorized, slow and long-content cases were rendered.",
      "- [ ] Relevant screen checked on desktop and narrow viewport without clipping.",
      "- [ ] Both color modes checked, except preserved modes explicitly out of change scope.",
      "- [ ] Tables, code blocks and charts keep legibility, contrast, units and labels.",
      "- [ ] Existing SSR/hydration, CSP and theme persistence were not regressed.",
      "",
      ...(config.designSelection ? designs.components.map(function(c) { return "- [ ] " + c.name + ": selected treatment, keyboard, states and responsive behavior verified where used."; }) : []),
      "## Evidence log",
      "- Changed UI/routes:",
      "- Tests and browser states verified:",
      "- Known exceptions:",
      "- Follow-up items:",
      ""
    ].join("\n");
  }
  return {layouts: layouts, frameworks: frameworks, scopes: scopes, targets: targets,
    fontSources: fontSources, iconPresets: iconPresets,
    motionCSS: motionCSS, defaults: defaults, normalize: normalize, profile: profile, themeCSS: themeCSS,
    styleCSS: styleCSS, fontCSS: fontCSS, designMD: designMD,
    agentTask: agentTask, checklist: checklist, chosenFonts: chosenFonts};
});
