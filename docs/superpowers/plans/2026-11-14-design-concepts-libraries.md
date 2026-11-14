# Design concepts and library support implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make genuine style concepts, polished interaction modules, actual library previews and live adoption metadata selectable and exportable in the existing offline workspace.

**Architecture:** Keep canonical selection in the catalog and pure exports in handoff-core. Add isolated UMD concept/library metadata modules, a reproducible local React demo bundle, and a separate public-metadata client. The workspace consumes these modules without becoming a React application.

**Tech Stack:** Existing HTML/CSS/UMD JavaScript and Python bundle tooling; pinned React, Base UI, Radix, Sonner, React Aria, MUI and Mantine for demo bundles; esbuild; Node tests; Playwright.

**Spec:** docs/superpowers/specs/2026-11-14-design-concepts-libraries-design.md

## Global Constraints
- Color tokens remain literal #RRGGBB, one canonical definition per mode. Decorative glass uses separate layers with solid fallback; no transparent semantic tokens.
- Keep scope semantics, legacy URLs/config compatibility, separate body/code font choices, OFL and Lucide licenses, and downloads only in confirmation/export.
- All exports (UI and CLI) use data/handoff-core.js; library recipe output is generated from data/ui-libraries.js.
- Workbench, library demos and START-HERE.html work offline; no runtime library CDN requests.
- No merge, public deployment, or installation into a user's target app is authorized by this task.
- User delegated recommendations and explicitly requested no additional questions. Resolve routine choices and report concrete limits.

## Review Focus
- Old saved configs/URLs lack new fields: normalize defaults without erasing existing choices (Task 1/2).
- Nested modal/toast and Escape/reopen retain correct focus and visible overlays (Task 1).
- Library portal scopes retain dark-mode/concept tokens and small-screen fit (Task 2).
- Partial/late metadata responses, unavailable storage and rate limits preserve last successful source data (Task 3).
- Single-file offline build and exported integration recipe match actual rendered values and avoid React prescriptions for vanilla targets (Task 2/3).

### Task 1: Concepts and polished framework-neutral components

**Files:** Create data/design-concepts.js, css/concepts.css (generated from module), component-demos.js as needed for focused lifecycle ownership, scripts/test-design-concepts.cjs, scripts/check-component-concepts.cjs. Modify data/design-catalog.js, data/handoff-core.js, index.html, catalog.html, catalog.js, workspace.js, css/catalog.css, css/workspace.css, schemas and existing affected tests. Update shared contracts and integration docs for explicit concepts. Keep changes cohesive, avoid an unrelated restructuring.

**Interfaces:**
- Produces window.PaletteDesignConcepts / CommonJS with concepts array, get(id), css(id), brief(id). Each concept contains id, name, description, traits and tokens; css(id) emits scoped CSS for data-concept and shared numeric/shape/elevation tokens.
- designSelection.concept: minimal|soft|editorial|compact|brutalist|glass|expressive|terminal|tactile; missing defaults according to the legacy set. Preserve existing set IDs and treatments.
- core.styleCSS(config,catalog), core.profile, core.designMD, core.agentTask include concept values/rules. Use a single source of truth for preview/export CSS.
- All preview scopes and demo portals expose data-concept alongside existing theme/palette/style.

- [ ] Write focused failing normalization/export tests: old studio config normalizes minimal; new concept survives URL/config/CLI; invalid concept rejects; dark-only theme remains dark-only. Add browser regressions that demonstrate tooltip reopen/layout stability and toast hover+focus pause behavior before fixes.
- [ ] Run those tests and record expected failures in report.
- [ ] Implement nine visual concepts as a separate picker in the continuous workspace, with comparative same-content previews and meaningful surface/type/shape differences. Keep six task sets and existing font choice authoritative. Add popover to the catalog with real interactions.
- [ ] Refine all existing sample families and overlay lifecycle per spec. Reuse Lucide SVG data, ensure semantic success/review/rejected/failed remain distinct. Toast stack maximum three, status controls and undo; tooltips anchored and hoverable; dialog/drawer/menu/popover keyboard/focus and responsive layout.
- [ ] Run node scripts/test-design-catalog.cjs, node scripts/test-design-handoff.cjs, node scripts/test-design-concepts.cjs, node scripts/check-handoff-schemas.cjs, node scripts/audit.mjs and relevant existing/new browser scripts. Regenerate concepts CSS deterministically and START-HERE with scripts/bundle.py. Capture representative evidence to temporary files; final curated screenshots belong to Task 3.
- [ ] Self-review, commit scoped changes and report RED/GREEN evidence and any limits.

### Task 2: Real offline library previews and shared integration exports

**Files:** Create data/ui-libraries.js; examples/library-preview/package.json and lockfile, src adapters and build script; generated assets/library-preview.js plus CSS/licenses; library-workspace.js and css/library-workspace.css; scripts/test-ui-libraries.cjs and scripts/check-library-browser.cjs. Modify index.html, workspace.js, data/handoff-core.js, scripts/create-design-handoff.cjs, schemas, scripts/bundle.py and docs/INTEGRATION.md as required. Also wire independently maintained catalog/handoff exports to the same functions.

**Interfaces:**
- data/ui-libraries.js UMD window.PaletteUILibraries/CommonJS: libraries array with id/name/description/repo/npmPackage/docs/runtime/version, get(id), normalize(id), recipe(config,catalog) returns {files: {[filename]: string}, notes: string[]}.
- IDs vanilla, base-ui, radix, react-aria, mui, mantine. shadcn is a documented Base UI/Radix recipe, not a fake runtime package.
- Config/profile uiLibrary default vanilla. Shared core.libraryFiles(config,catalog) returns export file map from recipe. Include generated files in UI and CLI with exact parity.
- window.PaletteLibraryPreview.mount(element,{library,theme,palette,concept,style,fonts,tokens}) returns {update(options),unmount()}; React roots and portal containers are owned and cleaned up. It consumes concept CSS/tokens from Task 1.
- Library cards have data-library-card=ID plus a data-library-metrics=ID slot and button data-refresh-library=ID for Task 3. Metadata module uses those exact IDs and repo/npmPackage fields.

- [ ] Write failing tests for legacy uiLibrary default, invalid values, selected HEX/theme recipes, dark-only scope safety, UI/CLI export parity and React requirement disclosure for vanilla/Astro targets. Browser test requires actual library-marked triggers and theme-aware portals under blocked network.
- [ ] Run focused tests and record expected failures.
- [ ] Verify installed package APIs using official docs/local source; choose compatible current stable pinned versions, install with a lockfile and build a local classic-script bundle. Include third-party notices. Existing workbench remains buildless for users.
- [ ] Implement real Button, Tooltip, Dialog, Popover and Toast demos for all five targets (Sonner where explicitly disclosed). Add library choice, source/package/version labels and plain-language pros/fit. Offer shadcn mapping recipe without runtime identity confusion. Preserve current app library first in existing-app handoffs.
- [ ] Implement complete usable theme/recipe exports with real selected HEX, shape/density/font and portal instructions. Avoid generated placeholders and duplicate output strings. React runtime requirements must be visible. Preserve dark-only/light-only by merging only permitted color branches.
- [ ] Run source build/typecheck, pure tests, library browser test in both modes plus 390px, offline START-HERE, and impacted existing tests. Ensure reduced motion and portal CSS work. No external network needed by default runtime.
- [ ] Self-review, commit and report concise evidence.

### Task 3: Live library adoption metadata and final validation

**Files:** Create library-metrics.js UMD or pure client module; scripts/test-library-metrics.cjs and browser coverage; modify library-workspace.js/CSS to render metrics; update README.md, docs/VERIFICATION.md, docs/PROVENANCE.md, relevant previews and capture script; regenerate START-HERE.

**Interfaces:**
- Consume PaletteUILibraries.libraries repo/npmPackage metadata from Task 2.
- PaletteLibraryMetrics.createClient({fetch,storage,now,timeoutMs,ttlMs}) returns {load(library,{force}),peek(id)}. Default timeout 8000ms, TTL 3600000ms, maximum three concurrent source requests, deduplicate repeated in-flight loads.
- Result has independent github/release/npm source records with value, fetchedAt, sourceUrl, state (fresh|cached|stale|unavailable) and error message. npm value includes downloads,start,end,package. Storage failures cannot prevent rendering or future refresh.

- [ ] Write failing tests for real response shapes at fetch boundary: exact GitHub/npm endpoints, valid zero, invalid negatives/non-numeric values, npm date range and package mismatch, partial failure, 403/429, timeout, cached stale retention, concurrent refresh, storage exceptions. Assert real client output/state, not a mock UI.
- [ ] Run focused tests and record expected failures.
- [ ] Implement public API retrieval and safe response parsing, source-specific cache merge, no token requirement, deduplication, concurrency cap and explicit refresh. Never load remote metrics automatically on initial offline view.
- [ ] Render exact counts with locale formatting, source links, individual fetch time, last-week date range, loading/errors/stale labels and last release. Explain downloads include CI and stars represent repository attention; no invented adoption score or unique user counts. Add a shadcn reference card (metrics only) labeled CLI downloads if not already present.
- [ ] Browser-test refresh success/partial failure/rate-limit/cache/blocked-storage and page switching without stale-response races. Perform one live public API smoke check and record whether it succeeded without relying on it as deterministic CI.
- [ ] Run complete relevant Node/browser suite once on final code, build library assets, regenerate single-file bundle, update representative screenshots and freshness manifest. Review desktop/mobile/light/dark visually. Update docs with exact tested scope and references. Preserve root main and unrelated worktrees.
- [ ] Self-review, commit and report evidence, final diff and remaining limits.
