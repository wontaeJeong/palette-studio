# Workspace review fixes

The user approved fixing all four post-merge findings and removing promotional UI copy, then committing, opening a PR and merging it.

- Button and input treatments are independent in the project preview, matching exported selections.
- Palette comparison supports light/dark, restores legacy compareMode links, persists the choice and includes view state in shared links.
- Choosing a named font while system-only is active switches delivery to local-only with a short visible status. Both dropdowns and gallery actions work; the other font role stays system. Explicit system-only selection still produces system-only exports.
- Every preview navigation button has an accessible name in left, top and hybrid layouts.
- UI labels and samples use short functional Korean terms. Remove promotional headlines, decorative English captions and redundant persuasion across main, catalog, icons and handoff pages. Preserve useful behavior guidance, technical identifiers and licenses.

Use existing vanilla HTML/CSS/JS, shared export core and semantic colors. Keep the original checkout on main and implement in the existing isolated worktree. No new product architecture or dependencies.
