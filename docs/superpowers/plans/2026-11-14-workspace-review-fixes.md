# Workspace Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

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
- [ ] Add browser regression cases covering the first four review-focus items; run them and confirm each fails for the recorded reason.
- [ ] Isolate input treatment to its label and button treatment to its wrapper. Add explicit navigation aria-labels.
- [ ] Add compare-mode control and validated saved/link state; include view state in workspace shareURL and delegate catalog share action to it.
- [ ] Add one font-selection handler shared by dropdown/gallery; named font + system changes source to local-only, reports the change and refreshes open font galleries on source change.
- [ ] Run regression cases and existing studio flow; commit.

### Task 2: Simplify UI copy

Files: index.html, workspace.js, catalog.html, catalog.js, icons.html, handoff.html, data/design-catalog.js as needed.
- [ ] Replace promotional titles with functional labels and remove decorative English copy. Shorten instructions without losing limits or scope behavior. Inspect dynamic copy and all standalone UI pages.
- [ ] Run browser flow, font, icon and handoff checks; inspect desktop/mobile screenshots. No tests mirroring prose.
- [ ] Regenerate START-HERE and preview images/manifest; verify screenshot freshness and generation drift; commit.

### Task 3: Review and integrate

- [ ] Run handoff/schema, palette/font audits and relevant browser regressions.
- [ ] Request a fresh review of the whole diff; fix confirmed issues with covering checks.
- [ ] Push branch, create PR, wait for required CI success, squash merge with head SHA guard.
- [ ] Fast-forward original main, verify merge state and report PR link.
