# Set-first design catalog

## Intent
Help vibe coders choose a coherent design without knowing UI vocabulary, explore an illustrated component encyclopedia, customize individual treatments and export precise instructions to an agent. The user chose complete sets first, followed by an encyclopedia, and authorized implementation through PR and merge.

## Approach
Extend the existing offline, framework-neutral kit with a dedicated `catalog.html`. Reuse palette/style tokens and the shared handoff core. Alternatives considered: embedding a large new step into the palette selector (crowds its current focused flow), or building a component framework (adds runtime and migration obligations). A separate linked catalog keeps the existing tools usable and adds a set-first entry point.

## Experience
Six coordinated sets preview actual components. Selecting a set applies its palette, style, fonts and default component variants. An 18-entry encyclopedia supports Korean plain-language/name/English search and category filters. Every entry has a rendered preview, purpose, variants and implementation behavior. A detail dialog lets users try controls and select a variant; light/dark, palette and style controls preview the result. The selected collection persists locally and in a shareable fragment. Users can copy or download the generated agent brief, export CLI config, or continue to Agent Handoff.

## Contract
Optional `designSelection: {set, components: {componentId: variantId}}` is validated by one UMD catalog module consumed in Node and the browser. Old configurations remain valid. Profile, design.md, AGENT-TASK and QA all include resolved component instructions with semantic color roles, dimensions, states and interaction requirements. The CLI and browser share those renderers. A changed palette/style is an explicit override, with the set retained as the starting point.

## Constraints and builder calls
No new production dependencies; file:// support; no remote assets required. Reuse existing component architecture in target apps. No drag-and-drop page builder or framework-specific component package. Preview controls demonstrate behavior using native HTML where feasible; each entry documents additional production requirements. Keep existing scope semantics and do not bundle every palette into target apps.

## Validation
Node tests cover every set/variant, invalid and stale selections, legacy input, output parity and CLI drift detection. Real Chromium covers selection, filtering, interaction, persistence, handoff, exports and mobile overflow. Run existing regressions, regenerate standalone navigation bundle and screenshot sources, inspect screenshots, review branch, open PR, wait for CI and merge.
