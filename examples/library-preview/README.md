# Real offline UI library island

Pinned React adapters for Base UI, Radix Primitives + Sonner, React Aria + Sonner, MUI and Mantine. The generic project/catalog samples are framework-neutral; this island alone demonstrates these actual packages.

Run `npm ci`, `npm test`, `npm run build` here. From the repository root run `python3 scripts/bundle.py` after changing generated assets to refresh the offline single-file workbench. Build output is committed; end users need no package install or CDN. `npm test` compiles real sources and all five exact integration exports, with dependency version parity.

`build.mjs` uses esbuild to create a classic IIFE, scopes Mantine's parsed CSS selectors to `.ps-library` (no workbench-wide reset), serializes actual adapter source for the shared pure recipe, and preserves full bundled-package license/NOTICE texts. See `licenses/README.md` for one upstream tarball's omitted license. No license network fetch is required when rebuilding.

Each `ScopedPreview` owns its portal DOM, selected HEX/concept/typography scope and React lifecycle. Toasts use per-preview Provider/state/store/toaster IDs. Keyboard focus, collisions, Escape and restore focus are library behaviors; Mantine Tooltip opts into focus events. Respect reduced motion and keep actual app providers/components when adapting an existing application.
