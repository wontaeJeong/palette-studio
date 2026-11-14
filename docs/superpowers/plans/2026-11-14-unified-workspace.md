# Unified Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace fragmented feature pages with a single design workspace and open a verified PR.

**Architecture:** Extend catalog.js with a normalized update API and selection event. Add workspace.js for inspector libraries, persistent project preview and a single review/export dialog. Use the existing handoff core for every export.

**Tech Stack:** Offline HTML, CSS, vanilla JavaScript, Python bundler, Node and Playwright.

**Spec:** docs/superpowers/specs/2026-11-14-unified-workspace-design.md

## Global Constraints
- No production dependencies; file:// and relocated standalone must work.
- Separate body/code font roles; downloads only in review/export.
- Preserve semantic tokens, scope, keyboard behavior and reduced motion.
- Preserve old links and independent icons.html; open PR without merging.

## Review Focus
- Explicit share configuration must override stale/corrupt local storage.
- Preset replacement must preserve project identity, target and color scope.
- Re-rendering must preserve input focus and typed project names.
- A 24-icon limit must permit deselection and give visible feedback.
- Mobile preview must not obscure focused inspector controls.

### Task 1: Unified workspace and state
**Files:** index.html, catalog.js, workspace.js, css/workspace.css, scripts/check-studio-flow.cjs.
**Interfaces:** PaletteCatalog.getConfig(), update(patch), readyFonts(), demo(id,variant,preview,mode); palette-selection event carries normalized config.
- [x] Write an offline browser test for a single document, shared state, export parity, persistence, scope, comparison and responsive preview; run and observe failure.
- [x] Implement inspector, project preview and review dialog using existing catalog demos and core renderers.
- [x] Run browser flow and existing catalog/CLI regressions; inspect desktop/mobile screenshots.

### Task 2: Compatibility and delivery
**Files:** catalog.html, handoff.html, scripts/check-catalog-browser.cjs, scripts/check-fonts.cjs, scripts/capture-previews.cjs, scripts/bundle.py, START-HERE.html, README.md, docs/WORKFLOW.md, .github/workflows/validate.yml.
**Interfaces:** Existing selection/catalogConfig/plain fragments migrate to normalized config; standalone bundles index and dependencies.
- [x] Test legacy links, corrupt storage, icon limit, project input, relocated standalone, font source/fallback and independent roles.
- [x] Implement compatibility and update browser checks, documentation, source fingerprints and screenshots.
- [x] Run applicable static/browser checks, request branch review and fix substantive findings.
- PR delivery: commit and push the verified worktree branch, then open the requested PR against main.

## Execution notes
- User's updated mandatory worktree preference was applied as soon as received: all task edits were byte-verified and transferred to native worktree `/Users/wt.jeong/.codex/worktrees/6da3/palette-studio`; original checkout restored to latest main, pre-existing `.serena/` preserved.
- Browser RED/GREEN covered missing workspace, corrupt storage recovery and invalid project draft handling. Dependency-free RED/GREEN reproduced and repaired shared export generator's missing Korean font fallbacks and Unicode subset descriptors.
- CLI/browser renderer reuse exposed a pre-existing difference from the old palette exporter. Shared chosenFonts now includes the same Korean fallbacks as the preview, and CLI copies those WOFF2 and licenses automatically.
- Dedicated catalog/handoff/icon HTML tools remain compatible independent views; the primary workspace exposes no feature navigation and performs all editing/export in one document.

## Review and fixes
A separate reviewer found stale stored font values discarding explicit legacy links, and invalid project drafts being replaced while leaving exports disabled. Both were reproduced in offline Chromium before fixing. Persisted inputs are now normalized before URL overrides; project drafts and validation remain intact across unrelated changes. Preview fidelity for hybrid navigation and solid card headers was also repaired and regression-tested because matching the selected design is part of the unified experience.

## Final verification
- `node scripts/check-studio-flow.cjs`: PASS, including real search/create interactions, browser/CLI output parity, all 64 themes and 6 styles, invalid drafts, corrupt/stale saved types and mobile focus.
- `node scripts/check-fonts.cjs`: PASS, all 24 real font previews, CDN fixtures, embedded fallback after standalone relocation and system mode.
- `node scripts/check-handoff-browser.cjs`, `node scripts/check-icon-studio.cjs`: PASS, including the original catalog end-to-end journey.
- `node scripts/test-design-handoff.cjs`, `node scripts/check-handoff-schemas.cjs`: PASS; English font CLI cases include licensed Korean fallback assets.
- `node scripts/audit.mjs`: 11,328 declared contrast pairs, 0 failures. `python3 scripts/audit-fonts.py`: all pinned font hashes/licenses verified.
- `node scripts/check-screenshot-freshness.cjs`: 18 screenshots, source and image hashes verified. Generated START-HERE.html rebuilt from the current modular sources.
- Worktree is isolated on feat/unified-design-workspace; original checkout is latest main with the pre-existing .serena/ untouched.

## Delivery note
The GitHub OAuth credential cannot modify workflow files. The optional syntax-check additions to validate.yml were omitted; existing CI runs check-studio-flow.cjs (now the unified workspace suite), check-fonts.cjs and check-handoff-browser.cjs without any workflow change. No functional checks were removed to work around the permission limit.
