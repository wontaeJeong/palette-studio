# APPLY-HANDOFF · coding agent task

The project's selected design is described in `design/handoff/design-profile.json` and `design/handoff/design.md`. Treat those files as decisions, not suggestions to regenerate. The existing Superpowers/OpenCode/Claude Code workflow may already be enabled; do not restate generic discovery or tests.

Implement the requested UI/workflow using the existing application's components and architecture while preserving the chosen **target/scope**, especially when mode is `dark-only` or `light-only`. Use the supplied CSS for semantic token roles rather than duplicating the theme system.

Focus specifically on hierarchy, realistic content, intentional component shape, active navigation and tabs, keyboard focus, status language+color, error/empty/loading/permission states, responsive overflow, icon names and typography. Do not replace existing components just to make the result look like a starter template. Accent-border callouts, excessive roundness and nested cards need a reason, not repetition.

Use statically imported React icons, or inline SVG for non-React apps; keep `currentColor` and accessible names. Respect pinned font licenses and offline/CSP constraints.

Document what changed, which actual screen states were verified and remaining exceptions against `design/handoff/QA-CHECKLIST.md`. Keep design-profile.json and design.md synchronized.
