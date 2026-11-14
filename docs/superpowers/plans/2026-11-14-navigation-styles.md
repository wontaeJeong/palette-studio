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
- [ ] Add tests for defaults, invalid input, all 18 style/structure combinations, CLI/profile/brief/style CSS parity and legacy absence. Confirm RED.
- [ ] Implement six style recipes and three structures with shared CSS/markup/guidance; integrate normalize/defaults and selected-style.css; synchronize schemas and checklist.
- [ ] Run contract tests and commit.

### Task 2: Interactive selection and preview
Files: index.html, catalog.html, handoff.html, catalog.js, workspace.js, handoff.js, css/catalog.css, css/workspace.css, scripts/check-navigation-browser.cjs.
- [ ] Add browser tests for switching styles/structures, actual computed selected shapes, project/settings click, role/name/focus, share/reload and mobile. Confirm RED.
- [ ] Add visual style picker and structure field in existing menu controls; render preset/menu/real preview from shared definitions. Preserve active preview page on style edits.
- [ ] Integrate selected menu into handoff preview, config and CSS exports; run new and existing browser tests.
- [ ] Regenerate offline bundle, screenshots and docs; inspect desktop/mobile and commit.

### Task 3: Review and integration
- [ ] Run generation/schema/contrast/font and browser checks, request fresh read-only review, fix verified findings.
- [ ] Push PR and validate CI; integrate according to the user's existing authorized workflow; keep original main current.
