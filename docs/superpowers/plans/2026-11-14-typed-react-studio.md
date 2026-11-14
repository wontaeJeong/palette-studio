# Typed React Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unified workbench's imperative rendering with typed state and React components, preserving the existing editor and offline/CLI contracts.

**Architecture:** Keep the existing handoff generator and catalogs canonical. A DOM-independent store owns normalized selection; React owns editor UI, with explicit boundaries for legacy interactive demos. Build the same source to classic offline assets and a split static web distribution.

**Tech Stack:** Existing pinned React/React DOM, TypeScript, esbuild; Node standard-library tests; Playwright/Chromium; existing Python palette and single-file packagers. No state framework or backend.

**Spec:** `docs/superpowers/specs/2026-11-14-typed-react-studio-design.md` (approved by user, 2026-11-14).

## Global Constraints

- Work only in `/Users/wt.jeong/.codex/worktrees/1c36/palette-studio` on `refactor/typed-react-studio`. Preserve other worktrees and main's `.serena/`.
- Keep current config/profile formats, legacy URLs, source font roles, scope semantics and defaults (new-app / both).
- `data/handoff-core.js` remains the canonical normalization/output generator; browser and dependency-free CLI share its outputs byte-for-byte. `--check` never writes.
- Root `index.html` supports file://. `START-HERE.html` runs after relocation with embedded fonts/licenses. Web output is `out/web/` and supports root/subpath HTTP hosting.
- Keep standalone catalog.html, handoff.html, icons.html. Keep one continuous editor, persistent preview and export-only downloads.
- Semantic color literals, canonical tokens, font/Icon licenses, existing Korean copy, keyboard focus, status cues and reduced motion remain intact.
- React must own editor DOM. Legacy mutable demo DOM is permitted only inside explicit lifecycle-managed boundaries, not an HTML wrapper around the whole editor.
- No deployment, merge or push is requested. Final result is committed in the isolated branch.

## Review Focus

- Storage getter/setter exceptions and malformed URL/config must leave a usable editor; Task 1 pins these failures.
- Deep partial config updates and rejected patches must not erase sibling fields or notify consumers with invalid state; Task 1 pins atomicity.
- Unrelated edits must retain focused input, search queries, active preview page and invalid export-name drafts; Task 2 browser coverage.
- React rerenders and pagehide/pageshow must not duplicate listeners, roots, toasts or pending async updates; Task 2 lifecycle coverage.
- Late/failed lazy-library loads, relocated HTML and subpath assets must preserve usable preview/export; Task 3 browser coverage.

## Task 1: Typed selection contracts and persistence

**Files:** Create `package.json`, `package-lock.json`, `tsconfig.json`, `src/core/types.ts`, `src/core/selection-store.ts`, `src/core/selection-persistence.ts`, `scripts/test-selection-state.cjs`, `scripts/run-studio-tests.mjs`; add focused type declarations beside canonical JS modules as needed. Existing runtime pages remain unchanged in this task.

**Interfaces:**
- Export typed `SelectionConfig`, `SelectionPatch`, `ViewSettings`, `SelectionDependencies` from `src/core/types.ts`. Infer finite IDs/unions from the existing schema/catalog; do not turn config fields into `any`.
- `createSelectionStore(dependencies, initialConfig)` exposes `getSnapshot()`, `getConfig()` (defensive copy), `update(patch)`, `selectSet(id)`, `subscribe(listener)`. A stable immutable snapshot feeds React useSyncExternalStore; update normalizes before committing and throws on invalid input. Nested fonts/designSelection/components patches preserve siblings. selectSet matches current chooseSet semantics exactly.
- `restoreSelection(dependencies, hash, storage)` returns normalized config, view and recovery message. `serializeSelectionURL(url, config, view)` preserves path/query and restores the same selection/view. `persistSelection(storage, config)` returns a save status without throwing for unavailable storage. Storage may be supplied by an accessor so getter failures can be tested.
- Root `npm run typecheck`, `npm run test:state`, `npm run test:contracts` are repeatable commands. Use pinned packages already in the library preview lock and the CI Playwright pin; share dependencies through a root workspace if useful. CLI remains runnable with no npm install.

- [ ] Add behavior tests before implementation. Assert nested font/style/component patches preserve all other config fields, invalid palette/project/variant leaves snapshot identity/value and notification count unchanged, subscriber fires once per committed update, and defensive reads cannot mutate store.
- [ ] Pin preset reset against current chooseSet behavior. Test full URL over storage, legacy `catalogConfig`, single-field links and `existing-gate`, corrupt/missing/nonobject storage, throwing getter/getItem/setItem, malformed fragments and view exclusions from export.
- [ ] Run `npm run test:state`; Expected: FAIL for missing store/persistence before implementation, not a broken dependency install.
- [ ] Implement typed state/persistence and root tooling. Avoid duplicating output generators or weakening strict checking with blanket any/ts-nocheck. Capture baseline browser resource sizes for Task 3 in a small JSON under this plan's scratch directory if useful.
- [ ] Run `npm run typecheck && npm run test:state && npm run test:contracts`; Expected: all PASS; old pages and CLI unchanged.
- [ ] Commit `refactor: add typed studio selection state` and report RED/GREEN commands and results.

## Task 2: React-owned unified editor and classic offline runtime

**Files:** Create focused modules under `src/studio/`: `main.tsx`, `App.tsx`, `context.tsx`, `data.ts`, `SelectionPanel.tsx`, `FontPanel.tsx`, `IconPanel.tsx`, `ComponentPanel.tsx`, `ProjectPreview.tsx`, `ExportDialog.tsx`, `LibraryPanel.tsx`, `DemoBoundary.tsx`, plus small related modules as appropriate. Create `src/studio/shell.html`, `scripts/build-studio.mjs`, `scripts/check-react-studio.cjs`. Modify `index.html` into generated shell, package scripts, `scripts/bundle.py` as needed. Extract reusable demo markup from catalog.js into one shared module if needed; legacy catalog uses the same extracted source. Reuse existing CSS, font-loader, library-metrics and library TSX sources.

**Interfaces:**
- Consume Task 1 store and persistence. `StudioProvider`/hooks expose one store, config and view state; no second canonical config.
- Main app mounts once, applies font changes, exposes compatibility globals `PaletteCatalog`, `PaletteWorkspace`, `PaletteStudio` with existing methods and dispatches compatible `palette-selection`. Ready-fonts resolves the current font application.
- Keep `PaletteCatalog.demo` usable by existing tests/legacy runtime through a shared markup helper. DemoBoundary owns only its isolated sample DOM and disposes its runtime effects. Editor form fields and layout use JSX; no whole-app dangerouslySetInnerHTML.
- Share real library React components/runtimes within the app. Introduce a `src/studio/library-loader.ts` interface `loadLibrary(id): Promise<ComponentType>` so Task 3 can split adapters without redesigning the UI. Retain existing standalone preview bundle for independent pages.
- `npm run build:studio` builds classic `assets/studio.js` plus root shell; existing bundle.py creates START-HERE. Task 3 adds web output.

- [ ] Add `check-react-studio.cjs` before implementation. Assert main page has React-owned app without loading catalog.js/workspace.js/library-workspace.js or the old React preview bundle, then exercise palette/font/icon/component selection, exact output parity, invalid name drafts, search retention and active preview page. Expected: FAIL on old runtime ownership.
- [ ] Build React panels with existing selectors and layout. Derive set thumbnails, concepts, navigation/motion previews, component search/details, recipe summary and export controls from catalogs. Reuse immutable data and pure generator; maintain all existing working behavior, including project sample form/search.
- [ ] Manage external demo/font/metrics lifecycles explicitly; no competing writes into React-owned nodes. Keep focus return, native dialogs, independent body/code filtering, limit 24 icons, tool theme exclusion and view sharing.
- [ ] Build classic assets and standalone HTML. Run `npm run typecheck && npm run build:studio && python3 scripts/bundle.py && node scripts/check-react-studio.cjs`; Expected: PASS including relocated standalone smoke. Avoid auto-updating screenshot evidence until Task 3 final validation.
- [ ] Run existing relevant browser contracts: check-studio-flow, check-fonts, check-handoff-browser, check-icon-studio, check-component-concepts, check-component-gallery, check-library-browser for all five libraries, check-library-selection, check-navigation-library-integration, check-library-export-summary, check-library-metrics-browser. Keep behavioral assertions; only adjust waiting/transport plumbing where React scheduling requires it. Expected: all PASS.
- [ ] Run state/contracts suite and commit `refactor: migrate unified studio to React` with report of exact browser scope and any limitations.

## Task 3: Split web distribution and final delivery validation

**Files:** Extend `scripts/build-studio.mjs`, root package scripts, CI validation, `src/studio/library-loader.ts`, `scripts/bundle.py`, `scripts/capture-previews.cjs`, `scripts/check-screenshot-freshness.cjs` as needed. Create `scripts/check-studio-distributions.cjs`, a portable local static-server/dev command, and update README/docs/VERIFICATION. Regenerate committed runtime/standalone/screenshot artifacts.

**Interfaces:**
- Consume the same React entry and shell from Task 2. `npm run build` produces the committed classic runtime/root index/START-HERE and independent `out/web/` assets. `npm run dev` serves the web artifact locally, rebuild behavior documented explicitly.
- Web uses split ESM and lazy real-library adapters; offline uses an inlined IIFE with no chunk dependencies. Both preserve local font and relative document/license links; copy every required linked resource or rewrite correctly for the web output.
- Loading/error/retry state is explicit and latest-choice-wins. Retry must actually retry failed imports rather than keeping a rejected cached promise.
- Include all transitive shipped package licenses in distributable artifacts. Add build drift verification with deterministic outputs; screenshot hashes cover TS/TSX sources, config and lock.

- [ ] Add distribution browser tests before implementation. Assert root and subpath HTTP runs/export, selected library runtime absent from initial network until selection, failures show retry and recover, slow earlier selection cannot replace later one, relocated START-HERE has no dependent HTTP/file assets in local/system mode. Expected: FAIL until split artifact exists.
- [ ] Implement dual output and development scripts using existing pinned esbuild. Retain root Pages behavior and no npm dependency for CLI.
- [ ] Run `npm run typecheck && npm run test:state && npm run test:contracts && npm run build && node scripts/check-studio-distributions.cjs`; Expected: PASS, deterministic web/offline outputs and byte-equal common export outputs.
- [ ] Integrate required checks into CI without changing public deployment configuration. Verify canonical generator regeneration, schema checks, contrast audit, all Task 2 browser regressions, existing React icon npm test/pack dry run if the root workspace changes its resolution, and library source type/export checks.
- [ ] Refresh actual Chromium previews, inspect desktop/mobile light/dark captures, run freshness checks. Record before/after initial JS bytes and request behavior under the same browser environment; no unsupported speed claims.
- [ ] Run build twice and verify no generated tracked diff on second build; run `git diff --check`. Document exact verification commands, remaining environment limits, root/classic vs web artifact distinction. Commit `build: produce web and offline studio distributions`.

## Final integration

After all task reviews pass, request whole-branch independent review against this plan and approved spec. Fix material findings with failing regression tests, re-run affected checks, and preserve a clean committed branch. Keep main current without touching unrelated files; do not merge/deploy. Report three-step completion only after every acceptance gate has evidence.
