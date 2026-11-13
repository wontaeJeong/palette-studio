# Functional catalog and GitHub Pages release

User requirements: remove promotional/emotional text across all UI, present a tool rather than a landing page, choose an appropriate preset count, tailor palette/component recommendations, include CSS animation presets and menu arrangements, show design light/dark together, provide a separate viewer UI theme, and deploy to GitHub Pages. PR and merge were explicitly authorized earlier in this session.

Implementation calls:
- Six task-oriented presets: general projects, settings/personalization, input/approval, documents/content, operations/data, status/notifications. Preserve stable preset IDs for saved selection compatibility.
- Each has three palette recommendations, five or six component recommendations, per-component treatments, default navigation and motion. Recommendations reorder options; all components/palettes remain available.
- Three navigation arrangements: top, left, hybrid. Include 56px top/232px side reference sizes and below-768px accessible drawer behavior in instructions. Preview diagrams compare both themes.
- Four motion timings: none/0ms, quick/120ms, standard/180ms, extended/260ms. Preview fade/translate/scale/reveal effects; shared scoped CSS export honors reduced motion. Effects are examples to map to real component state transitions, not an animation framework.
- Catalog presets/components/layout/motion are permanently paired Light/Dark. Other existing tools start with paired preview and retain single-mode inspection controls.
- Viewer UI theme is persisted separately and excluded from exported profiles. Tool styles and sample themes remain independent.
- Retain old project scope/framework/icon settings; new design selections default to both modes. Navigation reference does not authorize an existing-app architecture rewrite.
- Replace slogans, decorative hero blocks and emotional preset names with functional labels and compact controls. Preserve actual samples and accessibility.
- Publish repository root from main with .nojekyll using branch-based GitHub Pages (existing OAuth token lacks workflow scope). Public repository; admin permission verified. Enable only after feature tests, review and merge. Verify HTTPS, resource responses and a real browser flow on the deployed subpath.

Validation: Node normalization/all choices/CLI parity, Playwright recommendations/pairs/viewer theme/layout/motion/reduced motion/storage/export, existing browser regressions, generation and screenshot hash checks, independent review, GitHub CI and deployed checks.

## Verification and review
- Node selection/normalization, all motion profiles, navigation values, invalid inputs, schema compatibility, scoped CSS and CLI parity pass.
- Existing palette flow (64 themes, six styles, mobile/tablet/desktop), 24 font families/fallbacks, icon picker, handoff and catalog journeys pass in Chromium.
- Independent review found dark tool-chrome contrast regressions; mapped remaining foreground/background pairs together and added rendered 4.5:1 text checks across all three older tools. Checks pass. Fixed summary swatches to show both design modes independently of viewer theme.
- Found and corrected a thumbnail class collision for top navigation; paired preset diagrams now show all three arrangements.
- Deployment remains gated on PR CI and merge; public availability and real HTTPS browser behavior will be verified after enabling Pages.
