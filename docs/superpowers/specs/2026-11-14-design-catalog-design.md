# Visual design catalog

Users choose a complete screen preset, refine components visually without knowing UI terminology, and export reproducible agent instructions. Preserve the static/offline JavaScript architecture and existing theme scope, fonts, icons and handoff generator.

## Approach
Extend the existing kit with a dedicated catalog entry point and a shared pure component registry consumed by the browser and handoff core. A replacement framework would discard the existing offline workflow; expanding only the existing settings panel would bury visual discovery. The user authorized direct implementation and PR/merge without further design approval.

## Experience
Six curated starting points: calm workspace, soft product, clear outlines, editorial content, dense operations, expressive brand. These are useful contemporary patterns, not empirically ranked trends. Start with full screen thumbnails; allow dashboard, settings, content and landing compositions. Keep an independent searchable visual encyclopedia, Korean descriptions/aliases and English terms, three genuinely different visual treatments per component, light/dark, functional examples, up to three comparison candidates, selection and reset with confirmation, local persistence and export. Preset replacement must be explicit and recoverable by undo. Include 30 core component families and use shared selected recipes in screen previews and prompt/JSON output.

## Contract
Registry defines names, purposes, keywords, variants, spacing/radius/color roles and behavior. Selected preset plus component overrides are validated, serialized and rendered through one contract. Older handoffs without component selections stay valid. Invalid identifiers must fail instead of silently selecting a different recipe. Scope and existing app behavior win over preset convenience. Native dialog keyboard/focus handling, labeled controls, visible focus, reduced motion and narrow viewport support are required.

## Validation
Contract tests cover registry counts, preset completeness, overrides, legacy inputs, invalid IDs, prompt/profile/CLI parity. Real Chromium tests cover search by description, preset/override preservation, comparison limits, dialogs, persistence, themes, mobile overflow and handoff round trips. Existing browser and CLI regressions remain required.
