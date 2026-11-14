# Workspace Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Fix the four confirmed preview issues and simplify UI copy, then merge the reviewed PR.

**Architecture:** Keep canonical export normalization unchanged. Fix view-only state and independent preview controls in workspace.js, reuse existing treatment CSS, and keep shared-link generation routed through the workspace when present.

**Tech Stack:** Vanilla JavaScript, HTML/CSS, Playwright, Python bundle generator.

**Spec:** docs/superpowers/specs/2026-11-14-workspace-review-fixes-design.md

## Global Constraints

- Use an isolated worktree; preserve original main and existing .serena/.
- No new dependencies, palette values or export contracts.
- Preserve licenses, scope warnings, font roles and offline operation.
- User authorized implementation, PR and merge without another approval.

## Review Focus

- Button treatment must remain correct across all nine input/button combinations in both modes.
- Dark comparison must survive reload, legacy links and opening a shared link in a clean context.
- Both font roles and both selection methods must recover from system delivery without changing the other role.
- Left/top/hybrid nav buttons must expose names in the accessibility tree.
- Main and standalone pages plus START-HERE must use the simplified labels without breaking selectors or mobile layout.

### Task 1: Correct preview interactions

Files: workspace.js, catalog.js, index.html, css/workspace.css, scripts/check-workspace-review.cjs, scripts/check-workspace-browser.cjs.
- [x] Add browser regression cases covering the first four review-focus items; run them and confirm each fails for the recorded reason.
- [x] Isolate input treatment to its label and button treatment to its wrapper. Add explicit navigation aria-labels.
- [x] Add compare-mode control and validated saved/link state; include view state in workspace shareURL and delegate catalog share action to it.
- [x] Add one font-selection handler shared by dropdown/gallery; named font + system changes source to local-only, reports the change and refreshes open font galleries on source change.
- [x] Run regression cases and existing studio flow; commit.

### Task 2: Simplify UI copy

Files: index.html, workspace.js, catalog.html, catalog.js, icons.html, handoff.html, data/design-catalog.js as needed.
- [x] Replace promotional titles with functional labels and remove decorative English copy. Shorten instructions without losing limits or scope behavior. Inspect dynamic copy and all standalone UI pages.
- [x] Run browser flow, font, icon and handoff checks; inspect desktop/mobile screenshots. No tests mirroring prose.
- [x] Regenerate START-HERE and preview images/manifest; verify screenshot freshness and generation drift; commit.

### Task 3: Review and integrate

- [ ] Run handoff/schema, palette/font audits and relevant browser regressions.
- [ ] Request a fresh review of the whole diff; fix confirmed issues with covering checks.
- [ ] Push branch, create PR, wait for required CI success, squash merge with head SHA guard.
- [ ] Fast-forward original main, verify merge state and report PR link.

## Execution record

- Baseline: existing isolated worktree was clean; main fast-forward check passed; existing handoff/catalog tests passed. Reused the worktree on fix/workspace-review-and-copy at 880ee0d.
- Task 1: all four browser cases failed with the reported symptoms, then passed after fixes. Full studio flow passed. Commit 1eadd1b.
- Task 2: simplified main, standalone catalog/icons/handoff and sample copy; preserved instructions and licenses. Immediate reload of a legacy comparison link additionally reproduced a lost view; initial view persistence and parsing isolation fixed it. Regression covers null/malformed saved view.
- Verification: workspace flow, 24-font online-fixture/offline checks, catalog/handoff/icons browser checks, handoff/schema tests, 11,328 token contrast pairs and 918 font asset hashes/licenses passed. Rebuilt START-HERE and 18 screenshot assets; checked desktop/mobile screenshots and source freshness.
