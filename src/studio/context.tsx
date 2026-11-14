import React, {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";
import { flushSync } from "react-dom";
import { createSelectionStore } from "../core/selection-store";
import {
  restoreSelection,
  persistSelection,
  serializeSelectionURL,
} from "../core/selection-persistence";
import type { SelectionPatch, ViewSettings } from "../core/types";
import {
  dependencies,
  core,
  kit,
  fontCatalog,
  fontLoader,
  outputs,
} from "./data";
const restored = restoreSelection(
  dependencies,
  location.hash,
  () => localStorage,
);
export const store = createSelectionStore(dependencies, restored.config);
type ContextValue = {
  config: ReturnType<typeof store.getSnapshot>;
  update: (p: SelectionPatch) => void;
  view: ViewSettings;
  setView: React.Dispatch<React.SetStateAction<ViewSettings>>;
  theme: "light" | "dark";
  setTheme: React.Dispatch<React.SetStateAction<"light" | "dark">>;
  status: string;
  notice: (s: string) => void;
  saveStatus: string;
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
};
const Context = createContext<ContextValue | null>(null);
export function useStudio() {
  const c = useContext(Context);
  if (!c) throw Error("Missing StudioProvider");
  return c;
}
let fontsReady: ReturnType<typeof fontLoader.apply>;
export function StudioProvider({ children }: { children: React.ReactNode }) {
  const config = useSyncExternalStore(store.subscribe, store.getSnapshot),
    [view, setView] = useState(restored.view),
    [theme, setTheme] = useState<"light" | "dark">(() => {
      try {
        const value = localStorage.getItem("palette-studio-ui-theme");
        if (value === "dark" || value === "light") return value;
      } catch {}
      return matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }),
    [status, setStatus] = useState(""),
    [saveStatus, setSaveStatus] = useState(""),
    [expanded, setExpanded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const notice = useCallback((s: string) => {
    clearTimeout(timer.current);
    setStatus(s);
    timer.current = setTimeout(() => setStatus(""), 2800);
  }, []);
  useLayoutEffect(() => () => clearTimeout(timer.current), []);
  const update = useCallback(
    (patch: SelectionPatch) => store.update(patch),
    [],
  );
  const fontKey = JSON.stringify(config.fonts);
  useLayoutEffect(() => {
    fontsReady = fontLoader.apply({
      bodyFont: config.fonts.body,
      codeFont: config.fonts.code,
      fontSource: config.fonts.source,
    });
  }, [fontKey]);
  useLayoutEffect(() => {
    Object.assign(document.documentElement.dataset, {
      palette: config.palette,
      style: config.style,
      theme,
    });
    try {
      localStorage.setItem("palette-studio-ui-theme", theme);
    } catch {}
  }, [config.palette, config.style, theme]);
  useLayoutEffect(() => {
    const saved = persistSelection(() => localStorage, store.getConfig());
    setSaveStatus(
      saved.saved ? restored.recovery || "자동 저장됨" : saved.message,
    );
    try {
      localStorage.setItem("palette-studio-view-v1", JSON.stringify(view));
      history.replaceState(
        null,
        "",
        serializeSelectionURL(location.href, store.getConfig(), view),
      );
    } catch {}
    window.dispatchEvent(
      new CustomEvent("palette-selection", { detail: store.getConfig() }),
    );
  }, [config, view]);
  // External compatibility calls flush at the boundary; React events use the store normally.
  window.PaletteCatalog = {
    getConfig: store.getConfig,
    update: (patch) => flushSync(() => store.update(patch)),
    readyFonts: () => fontsReady,
    demo: window.PaletteSampleMarkup.demo,
    libraryFiles: () => core.libraryFiles(store.getSnapshot(), kit),
  };
  window.PaletteWorkspace = {
    outputs: () => outputs(store.getSnapshot()),
    shareURL: () =>
      serializeSelectionURL(location.href, store.getConfig(), view),
  };
  window.PaletteStudio = {
    profile: () => core.profile(store.getSnapshot(), kit),
    selectedCSS: () => core.themeCSS(store.getSnapshot(), kit),
    fontCSS: () => core.fontCSS(store.getSnapshot(), fontCatalog),
    readyFonts: () => fontsReady,
  };
  return (
    <Context.Provider
      value={{
        config,
        update,
        view,
        setView,
        theme,
        setTheme,
        status,
        notice,
        saveStatus,
        expanded,
        setExpanded,
      }}
    >
      {children}
    </Context.Provider>
  );
}
