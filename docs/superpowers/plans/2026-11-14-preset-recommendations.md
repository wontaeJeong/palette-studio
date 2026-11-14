# Preset Recommendation Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show preset recommendations independently from the actual selection across component and navigation/motion options.

**Architecture:** Derive recommendations from the existing catalog selection function. Add presentation labels and native select hints without changing config, persistence or exports.

**Tech Stack:** Vanilla JavaScript, HTML/CSS, existing Playwright browser checks and Python bundler.

**Spec:** `docs/superpowers/specs/2026-11-14-preset-recommendations-design.md`

## Global Constraints
- Implement only in the isolated worktree; preserve main checkout and existing untracked work.
- Reuse `PaletteDesignCatalog.selection(setId)`; no new recommendation or persisted data.
- Exact visible labels: `프리셋 추천`, `선택됨`, `권장 요소`.
- Preserve existing palette tokens, native selects, focus behavior and export contracts.
- Web and `START-HERE.html` must agree.

## Review Focus
- Component overrides (button/alert/dialog) must win over the set-wide variant.
- User customization must not move the recommendation or alter exported selection.
- Switching preset, sharing and reload must not leave stale labels.
- Mobile wrapping and dark theme must keep both status labels readable.
- Existing recommended-element filtering must retain its meaning.

### Task 1: Recommendation presentation and browser regression

**Files:** Modify `catalog.js`, `index.html`, `catalog.html`, `css/catalog.css`, `scripts/check-workspace-browser.cjs`, `docs/INTEGRATION.md`; create `scripts/check-preset-recommendations.cjs`; regenerate `START-HERE.html` and current previews.

**Interfaces:** Consumes `designs.selection(id)`, `config.designSelection`, `designs.treatments`; produces presentation only and exported `checkPresetRecommendations(browser, file = "index.html")` for browser QA.

- [x] Write browser checks proving recommendation remains on preset defaults after alternative selections, preset changes, reload and share; verify component exceptions and export selection. Check both entry files, mobile, and light/dark.
- [x] Run `NODE_PATH=/private/tmp/palette-workspace-qa/node_modules node scripts/check-preset-recommendations.cjs` and observe missing recommendation failure.
- [x] Add shared choice-status markup in `catalog.js`, derive each recommendation from the preset, decorate select options and hints, and render component list/detail labels. Add wrapping neutral badge styles and concise guidance.
- [x] Run focused test, regenerate offline bundle, then run `node scripts/check-studio-flow.cjs` with the same NODE_PATH. Expected: PASS, no browser errors, actual export values preserved.
- [x] Run catalog/navigation/handoff contract tests, color audit, capture previews and screenshot freshness. Expected: all PASS and generated sources current.
- [ ] Commit the change, run final fresh-context review, address blocking findings, continue Task 2, then push PR and merge after CI passes. Update original main by fast-forward while preserving `.serena/`.

### Task 2: Immediately visible overlay samples

**Files:** Modify `catalog.js`, `css/catalog.css`, `index.html`, `catalog.html`, `scripts/check-workspace-browser.cjs`; create `scripts/check-inline-previews.cjs`; regenerate offline bundle and previews.

**Interfaces:** Reuses `demo(id, variant, preview, pane)` and existing `data-demo` handlers. Exports `checkInlinePreviews(browser, file = "index.html")` for QA.

- [x] Write and run browser check expecting visible dialog/drawer/toast/tooltip/menu content before triggers; expected RED on missing dialog sample.
- [x] Reuse compact sample markup in detail previews with secondary interaction buttons. Open tooltip/menu samples by default and keep samples after closing interactive demos.
- [x] Run focused checks on index, catalog, and bundled HTML; assert all three treatments, two themes, mobile fit, Escape and focus restoration. Expected PASS.
- [ ] Run selection flow and catalog browser suites, regenerate bundle and preview screenshots, run freshness guard; commit and include both tasks in final review/CI/merge.
