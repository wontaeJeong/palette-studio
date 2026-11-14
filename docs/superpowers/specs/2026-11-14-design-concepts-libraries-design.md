# Design concepts, polished components, and real library previews

## Intent and authorization
The user wants style concepts beyond filled/outlined recoloring, refined tooltip/toast/popup modules, real UI library previews and application settings, plus live popularity information. They selected actual library examples/previews and explicitly delegated all recommended decisions without further questions. Preserve this offline, framework-neutral decision tool and its existing unified workspace.

## Audit
The current six sets are task recipes, six styles mainly set radius/spacing/size, and all eighteen components share soft/outline/solid treatments. Tooltip is an in-flow box, toast is a one-line message, and library guidance is prose only. There is no library usage metadata. The new work is an additional design vocabulary and implementation layer, not a replacement app framework.

## Approaches and choice
1. Chosen: keep the offline workbench, add independent concept presets and locally bundled real React library examples with generated integration settings. This preserves saved selections and demonstrates genuine library behavior.
2. Considered: vanilla previews plus mapping guides only. Smaller, but would not satisfy the user's selected actual-library preview scope.
A rewrite of the workbench is unnecessary. Existing projects keep their component libraries.

## Product behavior
- Keep six task-oriented sets, existing palette/style/font controls and one continuous workspace.
- Add nine independently selectable concepts: minimal, soft, editorial, compact, brutalist, glass, expressive, terminal, tactile. Names are plain Korean plus recognizable English names. Every concept has a rationale, appropriate use, meaningful differences in shape, typography hierarchy, border, elevation, spacing and motion guidance. Do not claim exhaustive coverage of every trend.
- Same project and component content remains comparable in light/dark. Concept changes visibly affect actual components, not only a thumbnail. Existing styles remain a density/size adjustment; explicit fonts remain authoritative.
- Refine all eighteen existing component examples, especially tooltip, toast, dialog, drawer, menu and alert. Add a popover example for interactive supplementary content. Reuse vendored Lucide icons. Use clear title/description/action hierarchy, well-aligned controls and intentional borders/elevation.
- Tooltips anchor without layout shifts, work on hover/focus, remain hoverable, dismiss with Escape, reopen on later hover/focus and stay within the viewport. No interactive elements inside tooltip.
- Toast supports success/info/warning/error examples, title/description, dismiss and meaningful undo action, maximum three visible notices, paused remaining-time countdown while hovered/focused, and appropriate live semantics. Persistent essential errors remain inline. Toasts must be visible above a modal when opened from it.
- Modal/dialog/drawer/popover/menu interactions preserve focus, support keyboard and escape, avoid clipping on small screens, and restore trigger focus. Respect prefers-reduced-motion and forced colors.

## Library support
Offer vanilla plus five real bundled library targets: base-ui, radix, react-aria, mui, mantine. Treat shadcn/ui as an additional integration recipe for Base UI or Radix rather than falsely claiming it is a single installed runtime package. Provide a shadcn token/CSS recipe with clear ownership of copied components. Radix notifications use Sonner. Other targets use their actual library's feedback component or a clearly disclosed Sonner integration where needed.
Each of the five targets has real Tooltip, Dialog, Popover and Toast/notification demos plus its Button (a native button used through the library trigger is appropriate for Radix Primitives, which has no styled Button) in the workspace with light/dark selection and concept appearance; other component samples may remain framework-neutral and must be labeled accordingly. Pin dependency versions, build a local classic-script bundle (no runtime CDN), include licenses and reproducible source/build scripts. The workbench, library demo and START-HERE.html work offline after checkout/build. Keep production runtime source separate from generated bundle; no new paid services.
Add uiLibrary to shared normalized config/profile and generated handoff, with an explicit default of vanilla to retain old selections. Incompatible vanilla/Astro selections must not silently prescribe React dependencies: retain preview choice but explain the React island/runtime requirement in exports or reject incompatible output clearly. Prefer changing target framework intentionally in UI when selecting a React library, with clear visible labeling.
All exports (UI and CLI) use data/handoff-core.js; library recipe output is generated from data/ui-libraries.js. Include literal selected color values, radius/spacing/font, portal scope, package names and tested pinned versions. No fake package named shadcn/ui; no placeholder theme values. Existing library preservation remains the first existing-app instruction.

## Live adoption metadata
Each external library card shows GitHub stars, latest release, and last-week npm downloads for an explicitly named representative package. shadcn uses CLI downloads labeled CLI, not installed component usage. Repository stars may belong to a monorepo; identify that. Counts are signals, never unique users or quality rankings.
Fetch public GitHub REST and npm downloads APIs on an explicit refresh, no credentials or backend. Show source links, query timestamp and npm date range. Keep last successful value per source in localStorage with a one-hour freshness period, deduplicate in-flight requests and limit concurrency. Handle partial failures, rate limits, no release, timeout, malformed responses, blocked storage and offline. Never turn missing into zero; never replace good cached data with a failed response. A failure must show stale/cached status. No network requests on initial offline load except the existing explicitly selected font source.

## Constraints
- Main remains untouched except safe fast-forward updates; all development uses the managed isolated worktree.
- Preserve .serena and unrelated existing worktrees.
- Color tokens remain literal #RRGGBB, one canonical definition per mode. Decorative glass uses separate layers with solid fallback; no transparent semantic tokens.
- Keep scope semantics, legacy URLs/config compatibility, separate body/code font choices, OFL and Lucide licenses, and downloads only in confirmation/export.
- Source color/style generation stays in scripts/build.py when changing generated styles/palettes; standalone concept definitions may have their own single-source generator.
- Style rules excluding decoration are defaults. Explicit selected concepts may authorize purposeful elevation/material effects; update contracts to explain this without weakening legibility.
- No merge, public deployment, or installation into a user's target app is authorized by this task.

## Acceptance and verification
Pure tests cover normalization, old configs, exports/UI-CLI parity and scope. Browser tests cover nine distinguishable concepts, overlay lifecycles, keyboard/focus, both modes, 390px layout, reduced motion, offline libraries, metadata network success/partial failure/rate-limit/cache. Compile the actual library source and execute its interactions. Regenerate START-HERE and relevant screenshots; run existing regressions and color audit. Record supported scope and limitations honestly.

## Sources checked 2026-11-14
- https://design.google/library/material-design-eras — shape, type and motion are design dimensions.
- https://developer.apple.com/design/human-interface-guidelines/materials — glass for functional layers, not every content surface.
- https://fluent2.microsoft.design/material — material purpose and fallback constraints.
- https://floating-ui.com/docs/tooltip — anchoring, collision, interaction, dismissal.
- https://base-ui.com/react/components/tooltip and /toast — real component APIs.
- https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default — Base UI default, Radix supported.
- https://react-aria.adobe.com/styling — state-based styling for unstyled primitives.
- https://mui.com/material-ui/customization/theming/ and https://mantine.dev/theming/theme-object/ — theme integration.
- https://docs.github.com/en/rest/repos/repos and https://github.com/npm/registry/blob/main/docs/download-counts.md — public metadata sources.
