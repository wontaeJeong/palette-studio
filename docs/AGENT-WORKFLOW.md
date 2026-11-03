# Coding agent workflow: Palette Studio

This guide treats AI agents as implementers of explicit design decisions, not generators of generic-looking demos. Supported tools include OpenCode, Claude Code, and any agent that can read local Markdown/JSON/CSS.

## 1. Select from real constraints

1. Open `START-HERE.html` to compare 32 palettes, 6 shapes/densities and 24 fonts. Choose the actual palette for a real screen, not an imagined product.
2. Open `icons.html` to inspect the pinned SVG library and Light/Dark behavior. Avoid making new, inconsistent SVG copies.
3. Open `handoff.html` to choose **target** (new/existing), **scope** (both/light-only/dark-only), **layout intent**, **framework**, body/code fonts and the small icon subset.
4. Export `handoff-config.json`. The standalone handoff UI can also download `design.md`, CSS and the QA checklist directly; it cannot bundle local WOFF2 binary files in a ZIP.

## 2. Make a reproducible, offline implementation handoff

```bash
node scripts/create-design-handoff.cjs --config handoff-config.json --out ./design/handoff
node scripts/create-design-handoff.cjs --config handoff-config.json --out ./design/handoff --check
```

Or use flags:

```bash
node scripts/create-design-handoff.cjs --project 'Example Admin' --palette slate-blue --style operational --target existing-app --scope dark-only --layout existing --framework react --font-source local-only --out ./design/handoff
```

The CLI also exports `handoff-config.json` and two versioned JSON Schemas (`handoff-config.schema.json`, `design-profile.schema.json`) for editor/agent validation. Local WOFF2 contents are checked against the catalog SHA-256 before copying.

The CLI does not need npm, a network connection, credentials or API keys. It produces design-profile.json, a **project-specific** design.md, semantic CSS scoped to the selected modes, optional style CSS, font CSS, selected font WOFF2 binaries with OFL notices, selected SVG originals with Lucide license, AGENT-TASK.md and QA-CHECKLIST.md. The `--check` command detects drift without writing.

Only the selected fonts and SVGs are copied. The code generator is deterministic; there is no random design injection or dependency on the latest web trend.

## 3. Apply with an agent

Pass the target application source along with the generated handoff directory, or commit its output to the target repository. Ask the agent to work within the selected project scope. The agent should:

- Preserve existing components, routing, APIs, forms, charting and theme provider unless the task truly requires changes.
- Treat design-profile.json as the machine-readable decision and design.md as the binding design interpretation.
- Map selected color values to the existing app's one canonical token definition per mode.
- Respect dark-only/light-only and avoid importing the whole two-mode palette for one-mode changes.
- Avoid assuming a particular component library. Reuse Radix, shadcn, Sonner, chart packages or existing primitives if already present. Choose new dependencies only if justified.
- Adopt icons via named React components or inline SVG. Validate bundle size and accessibility rather than importing all icons to resolve names dynamically.
- Use realistic Korean/English content, data density, empty/loading/errors and two viewport widths before claiming completion.

Agent-ready prompt: `agents/APPLY-HANDOFF.md` or generated `AGENT-TASK.md`. Do not repeat generic planning/test boilerplate if the agent already has a skills-driven workflow such as Superpowers.

## 4. React icon package

```bash
cd packages/icons-react
npm install
npm test
npm pack
```

Install the generated tarball in the target app, not the unpublished name from the npm registry. Example:

```tsx
import { ShieldCheck, Icon, IconTile } from "@palette-studio/icons-react";
<ShieldCheck variant="success" title="검증 완료" size={20} />
<Icon icon={ShieldCheck} variant="accent" aria-hidden />
<IconTile icon={ShieldCheck} title="보안" size={24} />
```

The npm package is ESM with type declarations, forwardRef and SSR support. It depends on React as a peer, not as a bundled copy. Generated icons are checked against the original SVG catalog. If an app already uses lucide-react, retaining it may be preferable to duplicating a dependency.

## 5. Quality evidence and exceptions

QA-CHECKLIST.md is deliberately about **observable behavior**, not the presence of tests alone. Verify focus, keyboard, state feedback, semantic contrast, overflow, long text, icons, SSR and real charts. Static audit tools only check the pairs that they know about.

When a product cannot follow a chosen style due to its existing constraints, record the exact component/behavior and reason instead of silently inventing a new design. The design contract should evolve by explicit review, not incidental AI output.

## Files and compatibility

- Original `START-HERE.html` and its offline bundler remain unchanged.
- `handoff.html` is another offline standalone page with the same palette catalogue.
- `data/handoff-core.js` is used by both the browser and CLI to avoid inconsistent outputs.
- Project handoff uses dedicated `data/handoff-config.schema.json` and `data/handoff-profile.schema.json` contracts; generated profiles preserve legacy palette/style/scope fields while adding explicit layout/framework/icon metadata.
- `npm pack` is local only. No publishing or login is performed.
