# One design workspace

## Intent and authorization
The user identified feature-by-feature tabs/pages as the problem, explicitly delegated design decisions and requested a PR. Proceed without additional design approval or execution-choice questions.

## Experience
`index.html` becomes one workspace: a continuous inspector on the left and a persistent, interactive project preview on the right. A preset provides a starting point; palette, shape, separate body/code fonts, navigation, motion, component treatments and icons refine the same design. Secondary libraries expand in place. No feature tabs or links to separate editors in the main header. Desktop preview stays visible; mobile has an expandable preview dock that leaves editing controls usable.

One review dialog contains project/application scope, framework, output previews and all download actions. Palette comparison and Light/Dark preview are view settings, separate from application scope and tool theme. A single normalized handoff config is the canonical selected design, shared by every control and all generated files. Export renderers remain in `data/handoff-core.js`.

## Approaches and builder decisions
Chosen by the implementer under delegated authority: extend the existing catalog renderer and add a workspace controller. This reuses real component demos and export contracts without introducing a framework. A shared navigation bar alone would retain the fragmented task; embedding entire tools in iframes would retain competing state and nested navigation. Neither meets the request.

## Constraints
- Keep file:// support and a self-contained START-HERE.html with embedded licensed fonts.
- Keep existing shared links readable, including palette links and catalog selection fragments.
- Keep icons.html independently usable; legacy catalog/handoff routes remain compatible entry points.
- Keep semantic color literals, application scope, status text/icons, keyboard focus and reduced motion.
- Reuse the 32 palettes, 6 styles, 24 OFL fonts, 95 Lucide icons and existing generators.
- No production dependencies; no merge or deployment requested.

## Acceptance
Choose a preset, change palette/font/component/icon in one document and export matching CSS/profile/task without navigating. Restore this selection on reload and in a fresh shared link, even when local storage is corrupt. Honor dark-only export. Verify keyboard dialog return, real component interaction, font fallback, comparison, 360–1440px layouts, standalone relocation and existing CLI regressions. Refresh screenshots and open a PR.
