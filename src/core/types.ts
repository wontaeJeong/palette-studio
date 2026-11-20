// Finite IDs follow data/handoff-config.schema.json and the canonical catalogs.
export type PaletteId = "graphite-plum" | "slate-indigo" | "slate-blue" | "navy-cyan" | "zinc-violet" | "gray-sky" | "slate-teal" | "stone-emerald" | "forest-mint" | "warm-sage" | "stone-olive" | "slate-lime" | "sand-amber" | "stone-orange" | "cream-terracotta" | "sand-copper" | "zinc-rose" | "charcoal-ruby" | "warm-burgundy" | "pearl-lavender" | "graphite-indigo-reference" | "slate-steel" | "slate-slate" | "zinc-zinc" | "stone-sand" | "neutral-monochrome" | "navy-blue" | "charcoal-gold" | "warm-coral" | "slate-turquoise" | "paper-ink" | "midnight-periwinkle";
export type StyleId = "operational" | "soft" | "outline" | "editorial" | "compact" | "contrast";
export type Target = "new-app" | "existing-app";
export type Scope = "both" | "dark-only" | "light-only";
export type Layout = "existing" | "dashboard" | "content" | "workflow" | "marketing";
export type Framework = "react" | "vanilla" | "astro";
export type UILibraryId = "vanilla" | "base-ui" | "radix" | "react-aria" | "mui" | "mantine";
export type BodyFontId = "system" | "pretendard" | "suit" | "noto-sans-kr" | "ibm-plex-sans-kr" | "gothic-a1" | "nanum-gothic" | "spoqa-han-sans-neo" | "wanted-sans" | "noto-serif-kr" | "inter" | "geist" | "roboto" | "ibm-plex-sans" | "source-sans-3" | "source-serif-4";
export type CodeFontId = "system" | "d2coding" | "jetbrains-mono" | "fira-code" | "ibm-plex-mono" | "source-code-pro" | "roboto-mono" | "geist-mono" | "inconsolata" | "space-mono";
export type FontSource = "cdn-first" | "local-only" | "system";
export type IconName = "activity" | "archive" | "arrow-left" | "arrow-right" | "bell" | "binary" | "book-open" | "bookmark" | "bot" | "boxes" | "calendar" | "chart-line" | "chart-no-axes-column" | "chart-pie" | "check" | "chevron-down" | "chevron-left" | "chevron-right" | "circle-alert" | "circle-check" | "circle-question-mark" | "circle-x" | "clipboard" | "clipboard-check" | "clock" | "cloud" | "cloud-upload" | "code" | "compass" | "copy" | "cpu" | "database" | "download" | "ellipsis" | "external-link" | "eye" | "eye-off" | "file" | "file-text" | "folder" | "folder-open" | "git-branch" | "git-pull-request" | "hard-drive" | "house" | "image" | "info" | "key-round" | "layers" | "layout-dashboard" | "layout-grid" | "link-2" | "list" | "list-filter" | "loader-circle" | "lock" | "lock-open" | "log-in" | "log-out" | "menu" | "minus" | "monitor" | "moon" | "network" | "panel-left" | "pencil" | "plus" | "refresh-cw" | "rotate-ccw" | "save" | "scan" | "search" | "server" | "settings" | "share-2" | "shield" | "shield-check" | "sliders-horizontal" | "sparkles" | "sun" | "table" | "tag" | "terminal" | "trash" | "trending-up" | "triangle-alert" | "upload" | "user" | "user-plus" | "user-round" | "users" | "wifi" | "workflow" | "x" | "zap";
export type SetId = "studio" | "bloom" | "precision" | "editorial" | "console" | "signal";
export type ComponentId = "button" | "input" | "select" | "switch" | "checkbox" | "toast" | "alert" | "dialog" | "drawer" | "tooltip" | "menu" | "tabs" | "breadcrumb" | "pagination" | "card" | "badge" | "accordion" | "empty" | "popover" | "bar-chart" | "stacked-bar" | "line-chart" | "area-chart" | "donut-chart" | "pie-chart" | "histogram" | "scatter-chart" | "heatmap" | "sparkline" | "metric" | "progress" | "circular-progress" | "stepper" | "skeleton" | "spinner" | "error-state" | "radio" | "textarea" | "slider" | "date-picker" | "file-upload" | "combobox" | "data-table" | "avatar" | "timeline" | "list" | "separator";
export type ComponentVariant = "soft" | "outline" | "solid";
export type ConceptId = "minimal" | "soft" | "editorial" | "compact" | "brutalist" | "glass" | "expressive" | "terminal" | "tactile";
export type MotionId = "none" | "quick" | "standard" | "extended";
export type NavigationId = "top" | "left" | "hybrid";
export type NavigationStyleId = "edge" | "underline" | "pill" | "fill" | "outline" | "dot";
export type NavigationStructureId = "list" | "grouped" | "rail";
export type DashboardLayoutId = "cards" | "metric-strip" | "status-distribution" | "action-queue" | "primary-stat" | "exception-summary" | "status-filters" | "trend-rows" | "target-progress";

export interface FontSelection { body: BodyFontId; code: CodeFontId; source: FontSource }
export interface DesignSelection {
  set: SetId;
  concept: ConceptId;
  motion: MotionId;
  navigation: NavigationId;
  navigationStyle: NavigationStyleId;
  navigationStructure: NavigationStructureId;
  dashboardLayout: DashboardLayoutId;
  components: Record<ComponentId, ComponentVariant>;
}
export interface SelectionConfig {
  project: string;
  palette: PaletteId;
  style: StyleId;
  target: Target;
  scope: Scope;
  layout: Layout;
  framework: Framework;
  uiLibrary: UILibraryId;
  fonts: FontSelection;
  icons: IconName[];
  designSelection: DesignSelection;
}
export type SelectionPatch = Partial<Omit<SelectionConfig, 'fonts' | 'designSelection'>> & {
  fonts?: Partial<FontSelection>;
  designSelection?: Partial<Omit<DesignSelection, 'components'>> & { components?: Partial<DesignSelection['components']> };
};
export interface ViewSettings { mode: 'split' | 'light' | 'dark' | 'compare'; compare: PaletteId; compareMode: 'light' | 'dark' }
export type DeepReadonly<T> = T extends object ? { readonly [K in keyof T]: DeepReadonly<T[K]> } : T;
export type SelectionSnapshot = DeepReadonly<SelectionConfig>;
export interface PaletteCatalog {
  defaultPalette: string;
  defaultStyle: string;
  palettes: readonly { id: string }[];
  styles: readonly { id: string }[];
}
export interface FontCatalog { defaults: { body: string; code: string; source: string }; fonts: readonly { id: string; role: string }[] }
export interface IconEntry { name: string }
export type CanonicalConfig = Omit<SelectionConfig, 'designSelection'> & { designSelection?: DesignSelection };
export interface SelectionCore {
  normalize(input: unknown, palettes: PaletteCatalog, fonts: FontCatalog, icons: readonly IconEntry[]): CanonicalConfig;
  defaults(palettes: PaletteCatalog, fonts: FontCatalog, icons: readonly IconEntry[]): CanonicalConfig;
}
export interface DesignCatalog {
  sets: readonly { id: SetId; config: SelectionPatch }[];
  selection(id: SetId): DesignSelection;
  normalize(input: unknown): DesignSelection;
}
export interface SelectionDependencies {
  core: SelectionCore;
  designs: DesignCatalog;
  palettes: PaletteCatalog;
  fonts: FontCatalog;
  icons: readonly IconEntry[];
}
export interface SelectionStorage { getItem(key: string): string | null; setItem(key: string, value: string): void }
export type StorageSource = SelectionStorage | null | undefined | (() => SelectionStorage | null | undefined);
