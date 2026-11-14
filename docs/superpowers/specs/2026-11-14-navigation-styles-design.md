# Menu styles

The user wants presets with distinct navigation design and interaction, including selection indicated only by a left edge, rather than identical menus recolored. Existing autonomy preference applies; use the current vanilla stack and shared handoff pipeline.

Provide six independent navigationStyle values: edge (옆선, no selected background fill), underline (밑줄), pill (알약), fill (채움), outline (테두리), dot (점). Provide navigationStructure list (목록), grouped (그룹), rail (아이콘). Keep existing top/left/hybrid placement independent. Each of the six sets has a distinct default style and a fitting structure. Old selections lacking these fields resolve to their set defaults; explicit invalid values fail normalization.

Show style choices as small menu samples in the existing inspector, with a structure selector, and apply them to set thumbnails, layout comparison, real project preview and standalone handoff preview. Navigation clicks change the active item and show project/settings content; selecting colors or styles retains the active preview page. Rail items retain accessible names and keyboard-visible labels. Keep plain Korean labels and no promotional copy.

One pure module owns navigation style definitions, scoped CSS and implementation guidance. Append selected navigation CSS to selected-style.css and carry values through config/profile/schema/share/CLI/design.md/task/checklist. The exported example markup and CSS use the same selectors as preview. No new semantic color definitions, dependencies or framework. Retain theme scope, offline operation, existing app authority and licenses.

At narrow widths, wrap top/grouped navigation and collapse left placement into an accessible horizontal menu while retaining active shape and labels. All styles have keyboard focus, hover, disabled and non-color active cues.
