# Palette Studio — design.md

> Framework-neutral design engineering contract for AI-assisted web development. The selected project's exported design-profile.json and design.md supersede these defaults.

## Purpose

Palette Studio is a reusable decision and validation kit, **not** a full component framework and not a shortcut to making every website look like the same generated SaaS dashboard.

Use this project to *choose and lock* a design vocabulary (color, typography, density, icon treatment, layout intent), then apply it to an actual product while preserving its UX and existing component architecture.

## The design contract

| Dimension | Reference | Rule |
|---|---|---|
| Color | 32 palettes × 2 modes | Semantic roles; select one, respect mode scope |
| Concept | 9 independent presets | Shape, hierarchy and purposeful material/elevation; explicit fonts stay authoritative |
| Shape & density | 6 style presets | Independent of color, responsive to app density |
| Typography | 24 OFL fonts | Separate body/code roles, explicit fallback and license |
| Iconography | 95 pinned Lucide SVGs | currentColor, accessible names, fixed source and tests |
| Layout intent | existing/dashboard/content/workflow/marketing | Suggests constraints, never blindly rewrites information architecture |
| Interaction | actual component states | Focus, keyboard, disabled, loading, error, empty, permission and responsive cases |
| Delivery | design-profile.json + design.md + CSS + AGENT-TASK + QA | Machine-readable reproducibility, human rationale and observable acceptance |

## Visual principles

- **Hierarchy over decoration:** primary action and current selection should be obvious; decorative accent everywhere weakens focus.
- **Shape with purpose:** use cards for genuinely bounded entities, tables/lists for scan-friendly data and text flows for documentation.
- **Explicit concepts:** `designSelection.concept` authorizes its documented shape and material choices. Glass belongs to functional navigation/overlay layers with an opaque fallback; reading surfaces stay solid. Concept decoration never redefines semantic colors or removes focus, reduced-motion or forced-colors support.
- **Anti-patterns:** no obligatory colored left borders on every callout, no redundant nested cards, no arbitrary giant radii, needless glow, gradient or pill badges.
- **State clarity:** running, queued, success, review, rejected, failed and severity are different meanings; preserve text as well as symbol/color.
- **Density-aware:** compact operating consoles can be dense without losing touch targets, focus outlines or readable rows.
- **Two modes are actual designs:** test foreground/background, borders, hover and code blocks in each selected mode; do not only invert light.
- **Accessibility:** target keyboard navigation, labeled controls, semantics, WCAG 2.2 AA relevant contrast; a passing palette token audit is *not* a WCAG certification.
- **Internationalization:** allow long Korean/English text, date/number variations and empty strings without breaking layout.
- **Charts:** data and axis labels, units, legends and accessible explanation. Keep tooltips legible and never invent data to fit a design.

## Token rules

- `data/palettes.json` and generated `css/palettes/*.css` define the canonical color values.
- One direct HEX value per token and mode, consumed at component sites through `var(--color-...)`. Do not introduce token aliases or color-mix drift in token declarations.
- `--color-ink`/`--color-ink-muted`, `--color-accent`/`--color-on-accent`, `--color-focus`, status, severity and code tokens serve different roles.
- Only merge colors for the selected scope; dark-only MUST NOT change light, and vice versa.
- Existing app's ThemeProvider and component library should be reused; this kit is not authority to add a second theme engine.

## React icon contract

- SVG source: `assets/icons/*.svg` (pinned Lucide, original license in `assets/icons/LICENSE-LUCIDE.txt`).
- React package: `packages/icons-react` provides statically named ESM exports plus `<Icon icon={NamedIcon} />` and `<IconTile />` helpers.
- Build React sources deterministically with `node scripts/build-icons-react.mjs`; package is **not** assumed to be published to npm.
- Prefer tree-shakeable named imports and small local tarballs. Do not build a name-to-every-icon runtime registry in the target bundle.
- Unlabeled icons are decorative; icon-only actions need an accessible name. Filled tile ≠ a separate filled icon.

## Agent workflow

1. Explore 2–3 combinations with the same *actual* UI state, text and data.
2. Lock one design selection. Generate the project handoff from `handoff.html` or `scripts/create-design-handoff.cjs`.
3. Commit the generated design-profile.json, design.md and AGENT-TASK.md together in the target repo.
4. Let the coding agent map tokens to current components, preserving scope. Implement functional interactions rather than cosmetic-only mocks.
5. Use QA-CHECKLIST.md to record actual browser, accessibility, failure and responsive evidence; document unresolvable conflicts.

See `docs/AGENT-WORKFLOW.md` and `agents/APPLY-HANDOFF.md` for the short agent workflow. The project-specific design.md in an exported handoff should be used instead of this general reference.
