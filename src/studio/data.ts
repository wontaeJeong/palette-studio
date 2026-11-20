import type {
  SelectionCore,
  DesignCatalog,
  PaletteCatalog,
  FontCatalog,
  IconEntry,
  SelectionSnapshot,
  SelectionConfig,
  SelectionPatch,
  SetId,
  ComponentId,
  ComponentVariant,
  ConceptId,
  NavigationStyleId,
  NavigationStructureId,
  DashboardLayoutId,
  NavigationId,
  MotionId,
  PaletteId,
  StyleId,
  IconName,
  BodyFontId,
  CodeFontId,
  FontSource,
  UILibraryId,
} from "../core/types";
interface Named<T extends string = string> {
  id: T;
  name: string;
  description: string;
}
export interface Palette extends Named<PaletteId> {
  modes: Record<"light" | "dark", Record<string, string>>;
}
export interface Style extends Named<StyleId> {
  radius: string;
  card: string;
  padding: string;
  height: string;
  gap: string;
  font: string;
}
export interface Font {
  id: BodyFontId | CodeFontId;
  role: "body" | "code";
  name: string;
  group: string;
  korean?: boolean;
  version: string;
  license: string;
  upstream: string;
  licenseText?: string;
  family: string;
}
export interface Icon extends IconEntry {
  name: IconName;
  label: string;
  category: string;
  body: string;
}
export interface Library {
  id: string;
  name: string;
  description: string;
  repo: string | null;
  npmPackage: string | null;
  docs: string;
  runtime: string;
  version?: string | null;
  packageLabel?: string;
  monorepo?: boolean;
}
export interface MetricValue {
  stars?: number;
  downloads?: number;
  noRelease?: boolean;
  tag?: string;
  url?: string;
  start?: string;
  end?: string;
  publishedAt?: string;
}
export interface MetricRecord {
  value: MetricValue | null;
  sourceUrl?: string;
  state: string;
  fetchedAt: number | null;
  attemptedAt: number | null;
  retryAt: number | null;
  error?: string;
}
export type MetricResult = Record<"github" | "release" | "npm", MetricRecord>;
export interface MetricClient {
  peek(id: string): MetricResult;
  load(library: Library, options: { force: boolean }): Promise<MetricResult>;
}
export interface FontStatus {
  body: { name?: string; source: string };
  code: { name?: string; source: string };
}
export type Kit = Omit<PaletteCatalog, "palettes" | "styles"> & {
  palettes: Palette[];
  styles: Style[];
  tokens: { token: string }[];
};
interface Designs extends DesignCatalog {
  sets: {
    id: SetId;
    name: string;
    description: string;
    recommendationReason: string;
    recommendedPalettes: PaletteId[];
    recommendedComponents: ComponentId[];
    palette: PaletteId;
    style: StyleId;
    defaultNavigation: NavigationId;
    defaultMotion: MotionId;
    config: SelectionPatch;
  }[];
  components: {
    id: ComponentId;
    name: string;
    label: string;
    purpose: string;
    category: string;
    keywords: string;
    behavior: string;
    variants: ComponentVariant[];
  }[];
  treatments: Record<ComponentVariant, { name: string; rule: string }>;
  dashboardLayouts: (Named<DashboardLayoutId> & { englishName: string; when: string; avoid: string; rule: string })[];
  dashboardLayoutBrief(id: DashboardLayoutId): string;
  concepts: {
    concepts: (Named<ConceptId> & {
      traits: string[];
      tokens: Record<string, string | number>;
    })[];
    get(
      id: ConceptId,
    ): Named<ConceptId> & { tokens: Record<string, string | number> };
  };
  navigationPresets: Named<NavigationId>[];
  motionPresets: Named<MotionId>[];
  navigationDesigns: {
    styles: Named<NavigationStyleId>[];
    structures: Named<NavigationStructureId>[];
    allCSS(): string;
  };
}
interface Core extends SelectionCore {
  designMD(c: SelectionSnapshot, k: Kit): string;
  profile(c: SelectionSnapshot, k: Kit): unknown;
  themeCSS(c: SelectionSnapshot, k: Kit): string;
  styleCSS(c: SelectionSnapshot, k: Kit): string;
  motionCSS(c: SelectionSnapshot): string;
  fontCSS(c: SelectionSnapshot, f: FontCatalog): string;
  agentTask(c: SelectionSnapshot, k: Kit): string;
  checklist(c: SelectionSnapshot): string;
  libraryFiles(c: SelectionSnapshot, k: Kit): Record<string, string>;
}
declare global {
  interface Window {
    PALETTE_KIT: Kit;
    PALETTE_FONT_CATALOG: Omit<FontCatalog, "fonts"> & { fonts: Font[] };
    PALETTE_ICON_PARTS: Icon[][];
    PaletteHandoff: Core;
    PaletteDesignCatalog: Designs;
    PaletteFonts: {
      choices(role: "body" | "code"): Font[];
      resolve(id: string, role: "body" | "code"): Font;
      apply(c: {
        bodyFont: string;
        codeFont: string;
        fontSource: string;
      }): Promise<FontStatus>;
      preview(
        font: Font,
        source: string,
        text: string,
      ): Promise<{ source: string; family: string }>;
      getStatus(): FontStatus;
    };
    PaletteSampleMarkup: {
      demo(
        id: string,
        variant: string,
        preview?: boolean | "inline",
        pane?: string,
      ): string;
    };
    PaletteDashboardDemos: {
      render(id: string, variant: string, options?: {uid?: string; preview?: boolean | "inline"}): string | null;
      bind(root: HTMLElement | Document): () => void;
    };
    PaletteComponentDemos: {
      init(get: () => SelectionConfig): () => void;
      handle(el: HTMLElement): boolean;
      cleanup(): void;
      icon(name: string): string;
    };
    PaletteUILibraries: {
      libraries: Library[];
      references: Library[];
      get(id: string): Library;
      summary(c: SelectionSnapshot): string;
    };
    PaletteLibraryMetrics: { createClient(): MetricClient };
    PALETTE_EMBEDDED_NOTICES?: string;
    PaletteCatalog: {
      getConfig(): SelectionConfig;
      update(patch: SelectionPatch): void;
      readyFonts(): Promise<FontStatus>;
      demo: Window["PaletteSampleMarkup"]["demo"];
      libraryFiles(): Record<string, string>;
    };
    PaletteWorkspace: { outputs(): Record<string, string>; shareURL(): string };
    PaletteStudio: {
      profile(): unknown;
      selectedCSS(): string;
      fontCSS(): string;
      readyFonts(): Promise<FontStatus>;
    };
    PaletteLibraryWorkspace: { render(): void; unmount(): void };
  }
}
export const kit = window.PALETTE_KIT,
  designs = window.PaletteDesignCatalog,
  core = window.PaletteHandoff,
  fontCatalog = window.PALETTE_FONT_CATALOG,
  fontLoader = window.PaletteFonts,
  icons = window.PALETTE_ICON_PARTS.flat(),
  libraries = window.PaletteUILibraries;
export const dependencies = {
  core,
  designs,
  palettes: kit,
  fonts: fontCatalog,
  icons,
};
export const outputs = (c: SelectionSnapshot): Record<string, string> => ({
  "design.md": core.designMD(c, kit),
  "design-profile.json": JSON.stringify(core.profile(c, kit), null, 2) + "\n",
  "selected-theme.css": core.themeCSS(c, kit),
  "selected-style.css": core.styleCSS(c, kit),
  "selected-motion.css": core.motionCSS(c),
  "selected-fonts.css": core.fontCSS(c, fontCatalog),
  "AGENT-TASK.md": core.agentTask(c, kit),
  "QA-CHECKLIST.md": core.checklist(c),
  ...core.libraryFiles(c, kit),
});
export const palette = (id: PaletteId) =>
  kit.palettes.find((p) => p.id === id)!;
export const style = (id: StyleId) => kit.styles.find((s) => s.id === id)!;
