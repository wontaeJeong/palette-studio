# Task 2 report — real offline UI libraries

Status: DONE. Worktree: `/Users/wt.jeong/.codex/worktrees/6124/palette-studio`; branch `feat/design-concepts-libraries`; starting commit `6baa8f1d121b16c95799257a330228fb9dc26405`.

## Delivered

- `data/ui-libraries.js`: pure UMD runtime registry, six selectable IDs (`vanilla`, `base-ui`, `radix`, `react-aria`, `mui`, `mantine`), separate metrics/reference records for shadcn and Sonner, package/repo/docs/tested-version metadata, normalization and one integration recipe.
- Additive `uiLibrary` config/profile field defaults legacy configs to `vanilla`, rejects invalid IDs; schemas and legacy hash handling updated. Existing-app agent briefs lead with preservation of the current library/ThemeProvider.
- `core.libraryFiles` is the common UI/CLI route. Workspace confirmation, independent handoff exports and CLI include exact same generated files. Catalog preserves/forwards the selection and exposes the same library-file function. CLI supports `--ui-library` and lists IDs.
- Five real React adapters implement Button/Tooltip/Dialog/Popover/notification using installed package components. Base UI uses its Toast, MUI Snackbar/Alert, Mantine Notifications; Radix/React Aria explicitly disclose Sonner. Radix's Button is native through actual primitive triggers, not an invented styled Button.
- The actual-library pane is visibly distinct from the generic framework-neutral project/catalog previews. Runtime, package, tested version, source/docs and plain-language fit are shown. Selection keeps the target framework and visibly discloses required React islands/runtime for Astro/Vanilla.
- `library-workspace.js`, scoped workspace CSS and pinned local classic bundle retain continuous-workspace interaction. Downloads are in confirmation/export; library reference links/license reading do not download design files while selecting. Exact metrics slots/buttons are present; refresh fetching remains Task 3.
- Public `PaletteLibraryPreview.mount` owns React roots/portal DOM. Update retains the same portal and changes mode/tokens; unmount is idempotent. Per-pane Provider/state/Sonner IDs/Mantine stores avoid duplicate toasts. Pagehide cleans roots; pageshow restores them after page cache navigation.
- Semantic colors/fonts/concept variables follow portals. Mantine reset is parsed/scoped to `.ps-library`; MUI does not inject CssBaseline. Selected canvas explicitly overrides vendor body defaults. Tooltip keyboard events are explicitly enabled for Mantine. `classNames.tooltip` avoids its className cloning onto the trigger.
- Exports contain actual selected HEX and only permitted light/dark branches, selected shape/density/font settings, actual compilable adapter/shared TSX and scoped CSS, exact package versions and portal/runtime/merge instructions. Excluded mode returns existing tokens unchanged; standalone sample renders nothing for an excluded mode. Base UI/Radix additionally export literal selected-token shadcn CSS; copied-component ownership and modern direct-variable mapping are documented.
- `examples/library-preview` contains actual sources, pinned manifest/lock, esbuild/PostCSS build, exact-export compilation check and README. Generated bundle/CSS/recipe sources are checked in. Full license/NOTICE texts for 72 shipped packages (including Apache-2.0) are preserved. START-HERE embeds full readable notices as well as the bundle.

## RED evidence

1. `node scripts/test-ui-libraries.cjs` initially failed the real legacy behavior: expected `uiLibrary === "vanilla"`, actual undefined.
2. `NODE_PATH=/private/tmp/palette-studio-qa/node_modules PLAYWRIGHT_BROWSERS_PATH=/private/tmp/palette-studio-qa/browsers node scripts/check-library-browser.cjs` failed the missing library card assertion (0 vs 8) after dependency order was established. An earlier invocation timed out before new script dependencies were wired; this was corrected before meaningful RED.
3. The real browser matrix exposed Mantine keyboard Tooltip default `focus:false`; local types/source confirmed the opt-in, then the same keyboard test passed after enabling focus.
4. Added selected-canvas assertion reproduced vendor reset leakage: white `rgb(255,255,255)` vs selected `rgb(248,247,250)`. The scoped root now explicitly consumes `--color-canvas`; all five modes passed. Parent independently spotted the dark white strip and reviewed the correction.
5. Screenshot inspection exposed Mantine Tooltip cloning `className` onto its trigger. A browser regression failed `tooltip surface styling must not leak onto the trigger`; targeted `classNames.tooltip` fixed it.
6. Explicit existing-app-first pure test failed until the preservation instruction preceded inline profile/CSS in AGENT-TASK.
7. Single-file notice preservation assertion failed before bundler embedded the full notice file, then passed.
8. Bounded pagehide/pageshow regression failed (0 restored portals vs 2); cleanup/render invalidation and pageshow restoration fixed it.

React Aria focus restoration occurs in `requestAnimationFrame` in the installed FocusScope source; an initial immediate assertion raced that intentional lifecycle. Replaced it with a condition wait for actual trigger focus. Keyboard modality is established before focus tests, rather than assuming programmatic focus after a pointer click opens focus-visible tooltips.

## GREEN commands and observed results

- `node scripts/test-ui-libraries.cjs`: PASS legacy/default/rejection, real selected HEX, scoped mode branch presence, shadcn mappings/no undefined values, existing-app first, React/Astro/Vanilla disclosure, profile field and all five CLI/shared recipe byte parity; standalone full notices preserved.
- `cd examples/library-preview && npm test`: PASS actual adapter `tsc --noEmit` plus all five exact generated TSX recipes compile. All exported dependency versions match tested manifest.
- `npm run build`: PASS classic local bundle, scoped CSS, shared recipe source generation and 72 full package notices. Two successive builds compared SHA-256 of bundle/CSS/sources/notices: byte-identical (PASS).
- Full `check-library-browser.cjs`: PASS five actual runtimes × light/dark × 1440px/390px under blocked external network; actual marked library triggers; keyboard tooltips, Escape, viewport-contained popovers/dialogs, selected portal/canvas colors, per-pane notification ownership/dismiss, restored dialog trigger focus, no document horizontal overflow, no runtime JS errors. All five dialogs also execute from inline `file://START-HERE.html` with network blocked.
- Same browser check also passes real brutalist button border/radius + dialog border/shadow and expressive asymmetric dialog radius for each of five adapters, proving concept geometry survives actual library styling.
- Final bounded `LIBRARY_ID=mantine ... node scripts/check-library-browser.cjs`: PASS after final lifecycle/notice updates; retains the all-five START-HERE loop. Mount/update/unmount and pagehide/pageshow ownership assertions passed.
- Existing `node scripts/test-design-handoff.cjs`, `test-design-catalog.cjs`, `test-design-concepts.cjs`, `check-handoff-schemas.cjs`: PASS. Handoff test also checked generation drift.
- Existing browser `check-workspace-browser.cjs`, `check-catalog-browser.cjs`, `check-handoff-browser.cjs`, `check-studio-flow.cjs`: PASS; workspace/catalog interactions, fonts/icons, export scope/parity, persistence/share and mobile.
- `node scripts/audit.mjs`: PASS 11,328 declared token pair/CSS parity checks, 0 failures. This is not a full-app accessibility claim.
- `python3 scripts/bundle.py`: rebuilt final single-file HTML (38,983,190 bytes) with locally embedded assets/fonts and complete notices.

## Visual inspection

Captured current actual-library panes for every runtime at both widths:
`/private/tmp/palette-library-{base-ui,radix,react-aria,mui,mantine}-{1440,390}.png`.
Implementer inspected Base UI/MUI desktop and Mantine mobile; parent independently inspected MUI desktop/Mantine mobile and confirmed coherent modes, removal of white canvas strip, mobile wrapping and visible focus. Full screenshots/freshness for the complete product remain the final integration task, as directed by parent.

## API/source verification and licensing

Verified installed official package types/source, rather than relying on recalled APIs: Base UI Toast manager/Provider/Portal and Trigger types; React Aria portal-container types and FocusScope deferred restore; MUI slotProps/container types; Mantine Portal target, provider selector/variables, Tooltip event defaults/cloning, Notifications per-store API. Full source and recipe TypeScript compiles validate these boundaries.

Pinned: React/react-dom 19.3.1; Base UI 1.9.0; Radix Dialog/Popover 1.3.1 and Tooltip 1.4.1; RAC 1.22.1; MUI 9.5.0 + Emotion 11.14.0/11.14.1; Mantine core/hooks/notifications 9.8.0; Sonner 2.0.8. Build versions are pinned too. Exact transitive integrity is in package-lock.json.

`react-remove-scroll-bar@2.3.8` declares MIT but omits LICENSE in its npm tarball. The published gitHead and v2.3.8 tag returned 404. Preserved the complete official upstream MIT notice (copyright Anton Korzunov) from https://raw.githubusercontent.com/theKashey/react-remove-scroll-bar/master/LICENSE, with the source limitation explicitly recorded in `examples/library-preview/licenses/README.md`. Rebuilds use the checked-in notice and require no license network call. This is not represented as a recovered exact historical commit license.

## Boundaries / self-review

- Metrics fetching/cache/rate limits remain Task 3; no initial metric network request was added. Its refresh buttons are intentionally disabled until that integration.
- Library recipes are usable comparison/integration samples; an existing app must merge into its own provider/selectors and retain current components. Astro/Vanilla do not silently become React apps.
- No root checkout changes, app installation, merge, push or deployment. No modification to fonts/icons/.serena. Work was entirely inside the delegated isolated worktree.
- No functional failures remain. `git diff --check` flags only five upstream whitespace-only lines inside bundled runtime CSS template strings (also copied into START-HERE); original runtime output is preserved. No authored-source whitespace warnings.
- Self-review checked ownership/unmount, selected mode scope, exact export parity, shape/style precedence, license inclusion, default compatibility and immutable source/generated separation. Parent independent review follows this scoped commit.
