# Visual Design Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Choose complete screen presets and refine through a visual component encyclopedia, with identical JSON and agent instructions.
**Architecture:** Offline UMD registry shared by catalog renderer and existing handoff core; no new production dependencies.
**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node contract tests, Playwright.
**Spec:** docs/superpowers/specs/2026-11-14-design-catalog-design.md

## Global Constraints
Preserve existing app scope, canonical HEX tokens, font roles and licenses. Use current checkout without a worktree. User requested direct execution, PR and merge. No invented trend popularity claims.

## Review Focus
- Corrupt/stale local storage must not break discovery.
- Switching presets after customization must be reversible.
- Existing handoff URLs and CLI configs remain compatible.
- Keyboard users can dismiss dialogs and recover focus.
- Narrow screens and long Korean text must not overflow.

### Task 1: Shared registry and handoff contract
Files: data/component-catalog.js, data/handoff-core.js, data/handoff-*.schema.json, scripts/test-component-catalog.cjs.
Produces: normalize(selection), resolve(selection), markdown(selection), presets, components; handoff config.designSelection and profile.designSelection.
- [x] Write contract tests and observe missing module/behavior failure.
- [x] Implement 30 component families, three variants and six complete presets; validate identifiers and expand recipes into prompt/profile.
- [x] Run contract and existing CLI/schema tests.

### Task 2: Visual catalog and discovery
Files: catalog.html, catalog.js, css/catalog.css, handoff.html, handoff.js, index.html, scripts/bundle.py, scripts/check-component-catalog.cjs.
Consumes registry selection; produces persisted handoff config and native interactive specimens.
- [x] Add failing real browser tests for search, preset/override, comparison, undo, persistence and export.
- [x] Build preset-first screen, independent encyclopedia, actual component examples, screen compositions, theme control and handoff.
- [x] Run browser tests and inspect desktop/mobile renders.

### Task 3: Integration, environment and delivery
Files: README.md, scripts/capture-previews.cjs, .github/workflows/validate.yml when applicable.
- [x] Wire entry points, update screenshots and CI coverage.
- [x] Run existing required tests and complete branch review; fix material findings with tests.
- [ ] Save verified install/start instructions; commit, push, create PR and merge when access permits. Installation/start instructions are saved. PR and merge remain subject to GitHub API network access.

## Execution evidence and review

- Registry and browser tests were written and observed failing before the new modules/pages existed, then passed. Additional failing regressions covered nested preset buttons, compact density, modal palette context, corrupt saved handoff state and real toast triggering.
- Independent review found modal theme inheritance, JSON-null handoff storage, existing-app layout preservation, missing documentation and copied handoff links. All were addressed; the final browser test covers existing-app dark-only round trips, restored overrides, reset cancellation/confirmation and a three-candidate comparison limit.
- Contract and CLI drift checks pass with legacy configs and component selections. Existing browser suites pass: 64 themes, 6 styles, 24 fonts, 95 icons, handoff and four narrow/desktop viewports. Font audit verifies 918 WOFF2 files and OFL copies; static contrast audit passes 11,328 declared pairs.
- Ruling: retain the current static architecture and existing isolated checkout; the user requested direct execution. Cost: catalog screen compositions are representative static demonstrations, not application templates or running backends.
- Ruling: describe presets as curated contemporary patterns, not verified trend rankings; official shadcn/ui and Radix references are documented. Cost: no market-popularity score is provided.
- QA uses the installed system Chromium over temporary loopback HTTP because managed browser policy rejects file://. No TLS, integrity or network-policy checks were disabled.
- No deferred review findings remain. Optional React icon package builds/tests were not rerun because package source is unchanged; generated-icon consistency passed.
