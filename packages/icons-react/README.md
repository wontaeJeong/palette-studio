# @palette-studio/icons-react

React 18–19 SVG components generated from Palette Studio's 95 pinned Lucide icons. **This package is not published on npm**; build it and install the tarball locally.

## Build & install

```bash
cd packages/icons-react
npm install
npm test
npm pack
# In your target app, install the produced .tgz:
npm install /path/to/palette-studio/packages/icons-react/palette-studio-icons-react-0.1.0.tgz
```

## React usage

```tsx
import { ShieldCheck, Activity, Icon, IconTile } from "@palette-studio/icons-react";

<ShieldCheck size={20} variant="accent" aria-hidden />
<ShieldCheck size={24} title="검토 완료" variant="success" />
<Icon icon={Activity} size={20} tone="duotone" aria-hidden />
<IconTile icon={ShieldCheck} size={20} title="보안 검증" />
```

Named ESM exports permit bundler tree-shaking; a runtime lookup registry of every component does not. Generic `Icon` accepts a statically imported component rather than a string name.

Props: React SVG attributes, forwardRef, size, strokeWidth, className, color, semantic variant (default/muted/accent/success/warning/danger/info), tone (single/duotone).

Unlabeled icons are decorative by default (`aria-hidden`), and a `title`, `aria-label`, or `aria-labelledby` makes the SVG meaningful with role `img`. IconTile fills a tile **behind** the outline glyph; it is not a separate filled glyph pack. Duotone alternates strokes; it does not invent native icon fills.

CSS variables use exactly the parent Palette Studio semantic palette tokens and fall back to inherited currentColor if absent. Package works with server rendering and requires no network access or icon font. No global stylesheet injection.

Source of truth: `../../assets/icons/*.svg` and `../../data/icon-parts/*.js`. Generated files live in src/icons, index.ts, catalog.ts. Regenerate using `npm run generate` and check for drift with `npm run check`.

Attribution: bundled LICENSE and LICENSE-LUCIDE.txt; Lucide ISC with Feather-derived shapes under MIT. See docs/ICON-KIT.md in the parent repository.
