# Design Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Choose complete design sets, explore components visually and export reproducible agent instructions.
**Architecture:** Static catalog page, shared UMD definitions, existing handoff core extended with an optional selection. No production dependencies.
**Tech Stack:** Vanilla HTML/CSS/JS, Node assertions, Playwright.
**Spec:** docs/superpowers/specs/2026-11-14-design-catalog-design.md

## Global Constraints
file:// support; no new production dependencies; retain legacy config and scope semantics; browser and CLI use the same generation core.

## Review Focus
- Malformed stored or URL selection must recover without losing the page.
- Selecting a set resets all component variants coherently.
- Changing palette/style preserves component choices and scope.
- Empty search and long Korean names remain usable on narrow screens.
- Handoff and CLI retain the exact component selection and instructions.

### Task 1: Shared selection and handoff contract
Files: data/design-catalog.js, data/handoff-core.js, data/handoff-{config,profile}.schema.json, scripts/test-design-catalog.cjs.
Interface: catalog.sets/components, selection(setId), normalize(selection), brief(selection); optional config.designSelection.
- [x] Write and run failing assertions for valid and invalid selections and generated handoff contract.
- [x] Implement definitions, normalization, schema and output integration.
- [x] Verify catalog and existing handoff tests; commit contract.

### Task 2: Set-first catalog and encyclopedia
Files: catalog.html, catalog.js, css/catalog.css, handoff.html, handoff.js, index.html, icons.html, scripts/check-catalog-browser.cjs.
Interface: persisted config under existing handoff storage; selection fields in URL fragments; shared core for all exports.
- [x] Add failing browser journey covering presets, search, variants, interactions, restoration and handoff.
- [x] Implement page, component previews, accessible details, themes, exports and navigation.
- [x] Run browser journey and existing browser regressions.

### Task 3: Publication evidence and integration
Files: README.md, scripts/test-design-handoff.cjs, scripts/check-handoff-browser.cjs, scripts/capture-previews.cjs, previews, START-HERE.html.
- [x] Wire tests to CI, document catalog and include actual screenshots.
- [x] Regenerate bundle/screenshots and run source consistency checks.
- [ ] Push PR and merge after successful checks.

## Execution notes
- Implemented in an isolated sibling worktree to preserve the original checkout and its untracked files.
- Preserved legacy project, scope, framework and icon choices when entering the catalog; choosing a new set changes only its visual recipe.
- Added a self-contained profile and scoped CSS to catalog-generated task briefs so copy alone is useful.
- Independent review identified six material issues: legacy scope loss, malformed fragment shape, share after section navigation, toast top-layer interaction, functional treatment mismatch, and focus restoration. Each is covered by browser regression checks and fixed.
- Minor review findings (switch size, tooltip/tab associations) were also corrected alongside those interaction fixes.

- CI wiring uses the existing handoff test entry points because the GitHub OAuth connection cannot modify workflow files without workflow scope. New catalog checks still run in both existing CI jobs.
