# Task 3 report — live library metadata and final validation

Status: DONE for the primary offline distribution, with an intermittent optional localhost HTTP test limitation recorded below. Baseline: `82b376b7be58ea04b20511c9357ecafe7181f81f`. Worktree: `/Users/wt.jeong/.codex/worktrees/6124/palette-studio`; branch `feat/design-concepts-libraries`.

## Delivered

- `library-metrics.js` is a dependency-free UMD client with `createClient({fetch,storage,now,timeoutMs,ttlMs})`, `load(library,{force})`, and `peek(id)`. Source records independently contain value, successful query timestamp, exact source URL, fresh/cached/stale/unavailable state, error, latest failed-attempt time and exposed retry time.
- Exact credential-free GitHub repository/latest-release and percent-encoded npm last-week point endpoints. Zero is preserved only when returned. Negative/string/unsafe counts, invalid calendar dates, wrong inclusive seven-day spans, wrong package names, malformed release dates/unsafe release URLs and malformed cached records are rejected. Latest-release 404 is a valid no-published-release observation.
- Independent per-source successful cache records in localStorage; one-hour TTL; force refresh; same-library in-flight promise deduplication; at most three concurrent source requests. The eight-second default timeout starts after semaphore acquisition, covers response/body parsing, aborts the fetch and ignores late responses. One failing source cannot erase good cached values or manufacture zero. localStorage getter/read/write/quota failures leave memory rendering and future refresh functional.
- Existing actual-library registry/references feed the client. All seven external cards have enabled explicit refresh buttons, exact locale-formatted counts, each source's links/time/freshness/errors, npm dates, and latest repository release distinct from tested package versions. Vanilla has no external metrics. Monorepo stars, representative packages, Radix Dialog package and shadcn CLI are disclosed; no score, ranking or unique-user claim is generated.
- Zero metric requests on initial display, reload, or `peek`. Metrics are separately cached observations: refreshing leaves the canonical config, share URL and every exported file identical. Network/storage failure never disables the offline library comparison/export path.
- Selection visibility repair requested in final integration review: actual library selection now scrolls only the existing preview panel to the real library examples. Mobile reuses its existing expansion toggle. The inspector scroll at the actual click and selection focus are preserved; no layout rewrite.
- README, INTEGRATION, VERIFICATION and PROVENANCE document concepts, actual package ownership/runtime requirements, shared exports, sources, semantics, cache behavior, reproduction and limits. README's component family table now includes Popover.
- START-HERE regenerated from canonical sources, final size **38,995,671 bytes**. Library package/source inputs were unchanged, so its already-verified deterministic bundle was reused rather than rebuilt unnecessarily.
- 29 current offline PNG captures plus source/image hash manifest. New dependency fingerprints include authored/runtime metrics/library/concept code and CSS, library source/build/lock/generated assets/notices and the real metadata observation. A changed source correctly failed the old manifest before recapture.

## RED → GREEN evidence

1. Wrote `scripts/test-library-metrics.cjs` before client code. `node --test scripts/test-library-metrics.cjs` produced 11 expected failures: `createClient must provide the public metadata client`, actual undefined. Implemented the real client; all 11 tests passed.
2. Wrote the real client/UI browser check before wiring. `check-library-metrics-browser.cjs` failed `explicit refresh must be enabled` against the Task 2 disabled button. Wired the real client and UI; HTTP-boundary fixtures now pass success/partial/release404/rate/cache/storage/rerender scenarios and stable config/hash/exports.
3. Real browser CORS hid a synthetic Retry-After header in the first rate-limit fixture. Corrected the fixture to explicitly expose that response header, preserving actual browser CORS behavior. No product workaround or simulated UI state was added.
4. Source review of npm's official contract confirmed last-week is seven available days with inclusive endpoints. Added malformed same-day/month-span and partial/impossible release timestamp regressions. RED was the client's acceptance of same-day weekly range. Tightened value validation; 11/11 GREEN.
5. Wrote `check-library-selection.cjs` from the actual review reproduction, without auto-scrolling any demo trigger. RED: selecting Base UI at 1440px left the real dialog trigger outside the viewport. Minimal preview-container scroll/mobile expansion fix yielded GREEN for Base UI and Mantine at both 1440/390px. The test measures page scroll at the actual click so Playwright's pre-click target positioning is not attributed to production.
6. `node scripts/check-screenshot-freshness.cjs` correctly failed the stale old source hash. Rebuilt screenshots/manifest; 29 image hashes/dimensions/source fingerprint now pass.

## Final relevant commands and results

Environment for browser tests: `NODE_PATH=/private/tmp/palette-studio-qa/node_modules PLAYWRIGHT_BROWSERS_PATH=/private/tmp/palette-studio-qa/browsers`. Playwright 1.56.1 / Chromium 141.0.7390.37. No root package.json/aggregate npm test exists.

- `node scripts/test-design-handoff.cjs`: PASS 32 palettes, 95 icons, three scopes, two font modes and drift; also invokes catalog pure checks (six sets, nineteen families, all variants, legacy/invalid input, CLI parity).
- `node scripts/test-design-concepts.cjs`: PASS concepts/defaults/rejection/scope/single-source CSS/CLI parity.
- `node scripts/test-ui-libraries.cjs`: PASS runtime defaults/validation/scope/real recipes/disclosure/CLI parity.
- `node scripts/check-handoff-schemas.cjs`: PASS schema versions 2, 32 palettes, six styles, 95 icons.
- `node --test scripts/test-library-metrics.cjs`: **11 passed, zero failed**. Exact endpoints/counts/dates, partial/no-release, 403/429 retry, independent TTL and retained stale successes, concurrency/dedup, timeout/late response/abort, blocked/malformed storage.
- `node scripts/audit.mjs`: **11,328 checks, zero failures**, minimum text ratio 4.6001; minimum UI ratio 3.9488. Declared opaque token pairs/CSS parity only, not full accessibility certification.
- `(cd examples/library-preview && npm test)`: PASS actual installed adapter typecheck plus all five exact generated TSX recipes; dependency versions match tested manifest.
- `python3 scripts/bundle.py`: PASS final single-file artifact, size above.
- `node scripts/check-component-concepts.cjs`: PASS all interaction/concept/overlay/keyboard/mobile/reduced-motion/forced-color groups.
- `node scripts/check-component-gallery.cjs`: PASS **19 families × nine concepts × two widths**, each with paired light/dark panes; zero horizontal overflow/runtime errors, including expanded new library cards in the workspace.
- `node scripts/check-library-selection.cjs`: PASS actual selection reveal at 1440/390px, mobile expansion, inspector focus/scroll preservation.
- `node scripts/check-workspace-browser.cjs`: PASS unified workspace, fonts/components/icons, scope/export parity, share/reload/comparison/mobile.
- `node scripts/check-handoff-browser.cjs`: PASS dark-only/small viewport/zero errors; also invokes catalog browser suite, which passed sets/search/variants/dialogs/persistence/share/download/handoff/mobile.
- `node scripts/check-studio-flow.cjs`: PASS; this primary entry currently delegates to `check-workspace-browser.cjs`.
- Final default `node scripts/check-library-browser.cjs`: PASS full five real runtimes × light/dark × 1440/390px, selected scoped canvas/portals/concept geometry, isolated notifications, keyboard/focus, unmount/pagehide/pageshow and five dialogs in offline START-HERE. Default now uses the primary file entry; `PALETTE_URL` override remains available.
- Final default `node scripts/check-library-metrics-browser.cjs`: PASS actual client/UI, zero initial API requests, success/partial503/release404/rate403429/retry/cache/stale/blocked storage, late response through real selection/concept rerender, unchanged config/hash/all files, 390px.
- `node scripts/capture-previews.cjs`: PASS 29 current offline captures and manifest.
- `node scripts/check-screenshot-freshness.cjs`: PASS all 29 hashes/dimensions and complete source fingerprint.
- `git diff --check`: PASS for Task 3 scoped changes. Previously documented inherited upstream blank lines inside generated runtime CSS strings remain outside this scoped diff.

All final relevant suites were run once after final production changes. Only failed localhost checks were repeated while diagnosing the optional server limitation; no unchanged broad suite was repeatedly run. Font/icon sources and binaries were unchanged; their unrelated standalone package/CDN tests were not rerun. The relevant existing workspace/flow checks cover their selection regression.

## Actual public API smoke and source evidence

Ran `node scripts/smoke-library-metrics.cjs` exactly once through the actual `file://index.html` card refresh. At **2026-11-14 05:56:57 UTC**, Base UI's three public requests all returned HTTP 200 without authentication/backend:

- `https://api.github.com/repos/mui/base-ui`: **11,410** stars.
- `https://api.github.com/repos/mui/base-ui/releases/latest`: **v1.9.0**, published 2026-10-09T08:50:49Z.
- `https://api.npmjs.org/downloads/point/last-week/%40base-ui%2Freact`: **29,705,480** downloads, inclusive **2026-11-06 ~ 2026-11-12**, package `@base-ui/react`.

Full real per-source timestamps/URLs/values/status evidence: `previews/library-metrics-observation.json`; immediate real UI image `/private/tmp/task3-live-metrics.png`. Captures replay that actual snapshot through the real cache under blocked network; images show source times and cache/expiry labels. They are neither synthetic popularity fixtures nor a claim that these are current counts.

Earlier parent-verified source evidence, consumed without repeating quota-heavy research: `/private/tmp/palette-studio-{github,npm,release}-smoke.json` (six registry/reference targets; Radix latest-release 404), `/private/tmp/palette-metrics-browser-smoke.json` (actual file-browser CORS). Sonner is supported by the same endpoints/client and its disclosed metadata, but only the Base UI card received this Task 3 final live refresh. Deterministic tests replace external HTTP only; actual client and UI run throughout.

Official source contracts reread: https://github.com/npm/registry/blob/main/docs/download-counts.md (seven available days, inclusive start/end), https://docs.github.com/en/rest/releases/releases#get-the-latest-release. Remaining design/library references are linked in docs/PROVENANCE.md and the approved spec.

## Visual review and screenshot freshness

Inspected current overview light/dark, mobile overview, nine-concept picker, desktop dark success+warning notifications above their dialog, mobile tactile dark popover, actual Base UI/React Aria/Mantine paired panes, and metadata light/dark/mobile. Counts/date rows wrap cleanly, controls and links remain visible, notification content separates without overlap, and actual library canvases respect selected light/dark colors. Parent separately inspected final metadata mobile/dark and accepted the minimal selection reveal fix.

New curated files: `studio-concepts-desktop.png`, `studio-toast-desktop.png`, `studio-popover-mobile.png`, `studio-library-{base-ui,radix,react-aria,mui,mantine}.png`, `studio-library-metrics-{light,dark,mobile}.png`, plus the 18 refreshed prior screenshots. Manifest: `previews/screenshots.json`, Chromium 141.0.7390.37, network offline. No manifest hashes were hand-adjusted to bypass stale sources.

## Optional localhost HTTP limitation and failed attempts

The initial implementation HTTP metrics browser run passed. During the final batch, scripts using the long-lived `http://127.0.0.1:8766/index.html` intermittently lost shared catalog/library globals on initial load or reload: library matrix timed out awaiting PaletteCatalog; metrics timed out awaiting refresh/card nodes. A repeated metrics run passed once, another showed `Cannot read properties of undefined (reading 'sets'/'getConfig')`. All file-based suites/captures stayed green.

Bounded diagnosis found classic parser-blocking script order sound, no async/defer, and no source changes by test fixtures. Plain HTTP diagnostics loaded all globals and eight cards without runtime/network errors. The parent identified heavy old-server log output as a possible backpressure cause and supplied a fresh quiet server on 8768. One focused HTTP metrics attempt there failed initial globals (`normalize`/`getConfig`/`libraries` undefined); two subsequent bounded diagnostics (plain and same API routing) loaded all globals/eight cards and server logs showed 200 responses. This does **not** establish backpressure as the sole cause, and the intermittent optional HTTP initialization remains unexplained.

To make deterministic CI exercise the actual offline deliverable without an optional server dependency, the two library checks now default to `file://index.html`, retaining `PALETTE_URL` overrides and immediate initialization error assertions. Their final full runs passed. No product initialization fallback or silent retries were added. The actual API/CORS smoke also used file URLs and succeeded. Parent final branch review may independently examine HTTP serving; this report does not claim that optional path is consistently green.

## Self-review and boundaries

Checked independent source merging, credential omission, response/cache validation, queue/timeout order, late-response handling, optional storage, exact values and meanings, escaped source content/links, UI busy/error state, shared output immutability and real selection visibility. No fake metrics enter profiles/exports; no unnecessary target-app dependency was added.

All implementation, validation and commit work stayed in the delegated isolated feature worktree. Root main was only read; its existing untracked `.serena/` and unrelated worktrees were preserved. Parent reports root main==origin/main at `d69a80c`; Task 3 baseline remains 82b376b. No merge/push/deployment/app installation was performed. Main integration, scoped independent review and final whole-branch review remain with the parent. This Task 3 report does not claim the feature branch already incorporates newly advanced main.

Browser evidence is Chromium only, not Safari/Firefox/iOS or comprehensive assistive-technology certification. API availability/quotas/CORS and retained local storage are external constraints. The live smoke is optional and excluded from deterministic CI. No unresolved deterministic primary-offline suite failures remain.

## Exact HTTP failure transcript retained from tool output

Implementation/capture commit: `932ece9334476be5e47abbf0f307f0803c1373e7`. The following are exact relevant stderr excerpts (paths preserved). Original listeners stored `pageerror.message`, not browser source-frame stacks; those source-frame stacks were not captured and are not fabricated here. Subsequent bounded diagnostics subscribed to `e.stack`, `requestfailed` and non-200 responses but produced no failures.

Old 8766 final full library matrix:

```text
page.waitForFunction: Timeout 30000ms exceeded.
    at /Users/wt.jeong/.codex/worktrees/6124/palette-studio/scripts/check-library-browser.cjs:13:13 {
  name: 'TimeoutError'
}
```

Old 8766 initial metrics attempt:

```text
locator.isEnabled: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('[data-refresh-library="base-ui"]')

    at /Users/wt.jeong/.codex/worktrees/6124/palette-studio/scripts/check-library-metrics-browser.cjs:26:24 {
  name: 'TimeoutError'
}
```

A later old-server metrics attempt reached the final runtime-errors assertion with these actual recorded pageerror messages:

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
+ actual - expected

+ [
+   "Cannot read properties of undefined (reading 'sets')",
+   "Cannot read properties of undefined (reading 'getConfig')",
+   "Cannot read properties of undefined (reading 'getConfig')",
+   "Cannot read properties of undefined (reading 'getConfig')"
+ ]
- []

    at /Users/wt.jeong/.codex/worktrees/6124/palette-studio/scripts/check-library-metrics-browser.cjs:57:10
```

A further old-server attempt loaded eight initial cards and later lost the card on reload:

```text
locator.innerText: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('[data-library-metrics="base-ui"]')

    at /Users/wt.jeong/.codex/worktrees/6124/palette-studio/scripts/check-library-metrics-browser.cjs:33:138 {
  name: 'TimeoutError'
}
```

Fresh quiet 8768 focused metrics attempt (command included `PALETTE_URL=http://127.0.0.1:8768/index.html`):

```text
AssertionError [ERR_ASSERTION]: initial document initialization
+ actual - expected

+ [
+   "Cannot read properties of undefined (reading 'normalize')",
+   "Cannot read properties of undefined (reading 'getConfig')",
+   "Cannot read properties of undefined (reading 'libraries')"
+ ]
- []

    at /Users/wt.jeong/.codex/worktrees/6124/palette-studio/scripts/check-library-metrics-browser.cjs:25:31
```

Quiet-server diagnostic listeners were `page.on('pageerror', e => console.log('pageerror', e.stack))`, `page.on('requestfailed', ...)`, and a response listener that printed non-200 status/URL. Plain load and two loads with the same API-boundary routing all reported `presets:true, concepts:true, libraries:true, catalog:true, cards:8`; no browser stack/requestfailed/non-200 event was printed in those diagnostics. Server evidence path supplied by parent: `/private/tmp/palette-studio-final-http.log`; observed requests were 200. No exact network failure URL was captured because none fired during those diagnostics. The fresh-server failure means old-server logging/backpressure is only a hypothesis, **not** an established root cause. Focused HTTP diagnosis remains an explicit handoff to parent branch review/integration.
