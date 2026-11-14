# Navigation Styles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users select meaningful menu styles and structures and carry them through previews and exports.
**Architecture:** A pure navigation-designs module defines six styles, three structures, scoped CSS and guidance. Existing catalog selection and handoff renderers share it. UI remains one workspace.
**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node CLI, Playwright.
**Spec:** docs/superpowers/specs/2026-11-14-navigation-styles-design.md

## Global Constraints
- Work only in isolated worktree; preserve main and unrelated design-concepts-libraries worktree.
- Reuse semantic colors and Lucide assets; no new dependencies.
- Preserve offline mode, existing presets, explicit overrides, font roles and output parity.
- Simple functional copy, no promotional copy.

## Review Focus
- Missing legacy fields migrate to set defaults; invalid explicit fields fail rather than disappearing.
- All style/structure/layout combinations visibly differ and remain usable in light/dark and mobile.
- Active navigation and keyboard focus survive design changes; icon-only items retain names and visible focus labels.
- Actual exported CSS matches preview, including edge-only no-fill and selected geometry.
- Browser/CLI profiles and guidance preserve the same navigation choices without changing preserved color modes.

### Task 1: Shared selection and exports
Files: data/navigation-designs.js, data/design-catalog.js, data/handoff-core.js, both handoff schemas, scripts/test-navigation-designs.cjs, scripts/check-handoff-schemas.cjs.
- [x] Add tests for defaults, invalid input, all 18 style/structure combinations, CLI/profile/brief/style CSS parity and legacy absence. Confirm RED.
- [x] Implement six style recipes and three structures with shared CSS/markup/guidance; integrate normalize/defaults and selected-style.css; synchronize schemas and checklist.
- [x] Run contract tests and commit.

### Task 2: Interactive selection and preview
Files: index.html, catalog.html, handoff.html, catalog.js, workspace.js, handoff.js, css/catalog.css, css/workspace.css, scripts/check-navigation-browser.cjs.
- [x] Add browser tests for switching styles/structures, actual computed selected shapes, project/settings click, role/name/focus, share/reload and mobile. Confirm RED.
- [x] Add visual style picker and structure field in existing menu controls; render preset/menu/real preview from shared definitions. Preserve active preview page on style edits.
- [x] Integrate selected menu into handoff preview, config and CSS exports; run new and existing browser tests.
- [x] Regenerate offline bundle, screenshots and docs; inspect desktop/mobile and commit.

### Task 3: Review and integration
- [ ] Run generation/schema/contrast/font and browser checks, request fresh read-only review, fix verified findings.
- [ ] Push PR and validate CI; integrate according to the user's existing authorized workflow; keep original main current.

## Execution record

- Reused clean managed worktree 6da3 on feat/navigation-styles from d69a80c. Original main current; unrelated worktree 6124 untouched.
- Task 1: contract tests failed before navigation definitions existed, then passed across 18 style/structure recipes, schemas, legacy defaults and CLI parity. Commit a260724.
- Task 2: visual picker test failed before UI implementation; six styles × three structures × three placements pass in light/dark. Actual menu selection, keyboard activation/focus, shared links and mobile fit pass for index.html and START-HERE.html.
- Found and fixed a missing miniature-shell closing span through the existing catalog first-screen check; added explicit sibling-theme and caption DOM assertions. Found mobile pointer selection cancelled by focus-triggered scrolling; captured RED then GREEN with a first-click regression.
- Existing workspace regression groups, catalog/handoff browsers and 24-font offline checks pass. Declared contrast pairs expanded for edge-only navigation: 11,392 checks, zero failures. Generated offline file and 20 screenshot/source fingerprints verified; desktop/mobile screenshots inspected.

- Final review found two P2 inconsistencies: legacy mobile drawer guidance and lost placement in handoff/example markup. Both reproduced RED, then fixed by shared responsive CSS/guidance, placement-aware example generation and a matching handoff layout. Isolated exported-CSS browser checks cover all three placements and mobile, and passed GREEN. No deferred findings or rulings.
