import React, { useRef, useLayoutEffect } from "react";
import { flushSync } from "react-dom";
import { useStudio, store } from "./context";
import { kit, designs, style, core } from "./data";
import { Shell, Navigation } from "./navigation";
import { FontPanel } from "./FontPanel";
import { IconPanel } from "./IconPanel";
import { ComponentPanel, ChoiceStatus } from "./ComponentPanel";
import { LibraryPanel } from "./LibraryPanel";
import type {
  PaletteId,
  StyleId,
  NavigationId,
  NavigationStructureId,
  MotionId,
} from "../core/types";
export function SelectionPanel() {
  const { config, update, theme, notice, setExpanded } = useStudio(),
    set = designs.sets.find((s) => s.id === config.designSelection.set)!,
    selection = config.designSelection,
    recommended = designs.selection(selection.set),
    layout = useRef<HTMLDetailsElement>(null),
    motion = useRef<HTMLDetailsElement>(null),
    pointerFocus = useRef(false);
  useLayoutEffect(() => {
    const controller = new AbortController();
    const options = { capture: true, signal: controller.signal };
    document.addEventListener(
      "pointerdown",
      () => {
        pointerFocus.current = true;
      },
      options,
    );
    for (const event of ["pointerup", "pointercancel", "keydown"])
      document.addEventListener(
        event,
        () => {
          pointerFocus.current = false;
        },
        options,
      );
    return () => controller.abort();
  }, []);
  return (
    <div
      id="selection-panel"
      className="inspector"
      onFocusCapture={(e) => {
        if (innerWidth >= 1000 || e.target.closest("dialog")) return;
        // Focus visibility requires the collapsed dock geometry before scrolling.
        flushSync(() => setExpanded(false));
        if (!pointerFocus.current && e.target.matches(":focus-visible"))
          e.target.scrollIntoView({ block: "nearest", behavior: "instant" });
      }}
    >
      <div className="workspace-intro">
        <h1>디자인 설정</h1>
        <p className="help">변경한 내용은 미리보기에 반영됩니다.</p>
      </div>
      <section id="sets" aria-labelledby="sets-heading">
        <div className="section-head">
          <div>
            <h2 id="sets-heading">디자인 세트</h2>
          </div>
          <small>6종</small>
        </div>
        <div id="set-grid" className="set-grid">
          {designs.sets.map((s) => (
            <button
              key={s.id}
              type="button"
              className="set-card"
              data-set={s.id}
              aria-pressed={selection.set === s.id}
              onClick={() => {
                store.selectSet(s.id);
                notice(s.name + " 프리셋을 선택했습니다.");
              }}
            >
              <span className="set-pair">
                {(["light", "dark"] as const).map((mode) => (
                  <span
                    key={mode}
                    className="set-mini"
                    data-theme={mode}
                    data-palette={s.palette}
                    data-style={s.style}
                    data-concept={designs.selection(s.id).concept}
                  >
                    <span className="pane-label">
                      {mode === "light" ? "라이트" : "다크"}
                    </span>
                    <Shell selection={designs.selection(s.id)} />
                  </span>
                ))}
              </span>
              <span className="set-caption">
                <strong>{s.name}</strong>
                <small>{s.description}</small>
                <small>
                  {
                    designs.navigationPresets.find(
                      (n) => n.id === s.defaultNavigation,
                    )!.name
                  }{" "}
                  ·{" "}
                  {
                    designs.motionPresets.find((m) => m.id === s.defaultMotion)!
                      .name
                  }
                </small>
              </span>
            </button>
          ))}
        </div>
        <p id="recommendation-reason" className="help">
          {set.recommendationReason}
        </p>
      </section>
      <section
        className="inspector-section concept-section"
        aria-labelledby="concept-heading"
      >
        <div className="section-head">
          <div>
            <h2 id="concept-heading">디자인 콘셉트</h2>
          </div>
          <small>9가지 콘셉트</small>
        </div>
        <p className="help">
          같은 내용으로 형태와 깊이를 비교하세요. 색상과 글꼴은 선택한 그대로
          유지됩니다.
        </p>
        <div id="concept-grid" className="concept-grid">
          {designs.concepts.concepts.map((c) => (
            <button
              type="button"
              key={c.id}
              className="concept-card"
              data-choose-concept={c.id}
              aria-pressed={c.id === selection.concept}
              onClick={() => update({ designSelection: { concept: c.id } })}
            >
              <span
                className="concept-mini"
                data-concept={c.id}
                data-palette={config.palette}
                data-theme={theme}
              >
                <span className="concept-surface">
                  <span className="concept-kicker">프로젝트 03</span>
                  <strong className="concept-title">샘플 프로젝트</strong>
                  <span className="concept-lines">
                    <i />
                    <i />
                  </span>
                  <span className="mini-action">프로젝트 열기</span>
                </span>
              </span>
              <span className="concept-caption">
                <strong>{c.name}</strong>
                <small>{c.traits.slice(0, 2).join(" · ")}</small>
              </span>
            </button>
          ))}
        </div>
        <p id="concept-description" className="help" aria-live="polite">
          {designs.concepts.get(selection.concept).description}
        </p>
      </section>
      <section
        className="inspector-section"
        aria-labelledby="appearance-heading"
      >
        <div className="section-head">
          <div>
            <h2 id="appearance-heading">색상 · 형태</h2>
          </div>
        </div>
        <div className="field-pair">
          <label>
            팔레트
            <select
              id="catalog-palette"
              value={config.palette}
              onChange={(e) => update({ palette: e.target.value as PaletteId })}
            >
              {[
                [
                  "권장 팔레트",
                  kit.palettes.filter((p) =>
                    set.recommendedPalettes.includes(p.id),
                  ),
                ],
                [
                  "전체 팔레트",
                  kit.palettes.filter(
                    (p) => !set.recommendedPalettes.includes(p.id),
                  ),
                ],
              ].map(([label, rows]) => (
                <optgroup key={String(label)} label={String(label)}>
                  {(rows as typeof kit.palettes).map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label>
            스타일
            <select
              id="catalog-style"
              value={config.style}
              onChange={(e) => update({ style: e.target.value as StyleId })}
            >
              {kit.styles.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div
          id="palette-swatches"
          className="palette-swatches"
          aria-label="팔레트 빠른 선택"
        >
          {kit.palettes.map((p) => (
            <button
              key={p.id}
              type="button"
              className="palette-chip"
              data-palette-choice={p.id}
              aria-label={p.name}
              title={p.name}
              aria-pressed={p.id === config.palette}
              onClick={() => update({ palette: p.id })}
            >
              {["--color-canvas", "--color-surface", "--color-accent"].map(
                (t) => (
                  <i key={t} style={{ background: p.modes.light[t] }} />
                ),
              )}
            </button>
          ))}
        </div>
        <p id="appearance-summary" className="help">
          {style(config.style).description}
        </p>
      </section>
      <LibraryPanel />
      <FontPanel />
      <details id="structure-options" className="inspector-section">
        <summary>
          <span>메뉴 · 전환</span>
          <small id="structure-summary">
            {
              designs.navigationPresets.find(
                (n) => n.id === selection.navigation,
              )!.name
            }{" "}
            ·{" "}
            {
              designs.navigationDesigns.styles.find(
                (n) => n.id === selection.navigationStyle,
              )!.name
            }{" "}
            ·{" "}
            {designs.motionPresets.find((n) => n.id === selection.motion)!.name}
          </small>
        </summary>
        <div className="details-content">
          <div className="field-pair">
            <div className="recommended-field">
              <label>
                메뉴 배치
                <select
                  id="catalog-navigation"
                  aria-describedby="navigation-recommendation"
                  value={selection.navigation}
                  onChange={(e) => {
                    update({
                      designSelection: {
                        navigation: e.target.value as NavigationId,
                      },
                    });
                    layout.current!.open = true;
                  }}
                >
                  {designs.navigationPresets.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}{n.id === recommended.navigation ? " · 프리셋 추천" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <p id="navigation-recommendation" className="preset-hint">
                프리셋 추천: {designs.navigationPresets.find(n => n.id === recommended.navigation)!.name}
              </p>
            </div>
            <div className="recommended-field">
              <label>
                전환 속도
                <select
                  id="catalog-motion"
                  aria-describedby="motion-recommendation"
                  value={selection.motion}
                  onChange={(e) => {
                    update({
                      designSelection: { motion: e.target.value as MotionId },
                    });
                    motion.current!.open = true;
                  }}
                >
                  {designs.motionPresets.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name}{n.id === recommended.motion ? " · 프리셋 추천" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <p id="motion-recommendation" className="preset-hint">
                프리셋 추천: {designs.motionPresets.find(n => n.id === recommended.motion)!.name}
              </p>
            </div>
          </div>
          <div className="recommended-field">
            <label>
              메뉴 구성
              <select
                id="catalog-navigationStructure"
                aria-describedby="navigationStructure-recommendation"
                value={selection.navigationStructure}
                onChange={(e) => {
                  update({
                    designSelection: {
                      navigationStructure: e.target
                        .value as NavigationStructureId,
                    },
                  });
                  layout.current!.open = true;
                }}
              >
                {designs.navigationDesigns.structures.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}{n.id === recommended.navigationStructure ? " · 프리셋 추천" : ""}
                  </option>
                ))}
              </select>
            </label>
            <p id="navigationStructure-recommendation" className="preset-hint">
              프리셋 추천: {designs.navigationDesigns.structures.find(n => n.id === recommended.navigationStructure)!.name}
            </p>
          </div>
          <p className="field-label">선택 표시</p>
          <div
            id="navigation-style-picker"
            className="navigation-style-picker"
            role="group"
            aria-label="메뉴 선택 표시"
          >
            {designs.navigationDesigns.styles.map((s) => (
              <button
                key={s.id}
                type="button"
                className="navigation-choice"
                data-navigation-style={s.id}
                aria-pressed={s.id === selection.navigationStyle}
                onClick={() =>
                  update({ designSelection: { navigationStyle: s.id } })
                }
              >
                <span className="navigation-choice-label">{s.name}</span>
                <ChoiceStatus selected={s.id === selection.navigationStyle} recommended={s.id === recommended.navigationStyle} />
                <span className="navigation-choice-demo" aria-hidden="true">
                  <Navigation
                    selection={{
                      navigationStyle: s.id,
                      navigationStructure: "list",
                    }}
                  />
                </span>
                <small>{s.description}</small>
              </button>
            ))}
          </div>
          <style id="navigation-design-css">
            {designs.navigationDesigns.allCSS()}
          </style>
          <details id="layout-options" ref={layout}>
            <summary>메뉴 미리보기</summary>
            <div id="navigation-preview" className="paired-layout">
              {["light", "dark"].map((mode) => (
                <div
                  key={mode}
                  className="preview-pane"
                  data-theme={mode}
                  data-palette={config.palette}
                  data-style={config.style}
                  data-concept={selection.concept}
                >
                  <span className="pane-label">
                    {mode === "light" ? "라이트" : "다크"}
                  </span>
                  <Shell selection={selection} />
                </div>
              ))}
            </div>
            <p id="navigation-description" className="help">
              {
                designs.navigationPresets.find(
                  (n) => n.id === selection.navigation,
                )!.description
              }{" "}
              ·{" "}
              {
                designs.navigationDesigns.structures.find(
                  (n) => n.id === selection.navigationStructure,
                )!.description
              }
            </p>
          </details>
          <details id="motion-options" ref={motion}>
            <summary>전환 미리보기</summary>
            <div id="motion-preview">
              {["light", "dark"].map((mode) => (
                <div
                  key={mode}
                  className="preview-pane"
                  data-theme={mode}
                  data-palette={config.palette}
                  data-style={config.style}
                  data-concept={selection.concept}
                >
                  <span className="pane-label">
                    {mode === "light" ? "라이트" : "다크"}
                  </span>
                  <div
                    className="motion-effects"
                    data-ps-motion={selection.motion}
                  >
                    {[
                      ["fade", "페이드"],
                      ["slide", "이동"],
                      ["scale", "확대"],
                      ["expand", "펼치기"],
                    ].map(([id, label]) => (
                      <div key={id}>
                        <span>{label}</span>
                        <div className="motion-stage">
                          <div
                            className="motion-tile"
                            id={"motion-" + mode + "-" + id}
                          >
                            예시
                          </div>
                        </div>
                        <button
                          type="button"
                          data-motion-play={id}
                          data-motion-mode={mode}
                          onClick={() => {
                            const tile = document.getElementById(
                              "motion-" + mode + "-" + id,
                            )!;
                            tile.className = "motion-tile";
                            void tile.offsetWidth;
                            tile.classList.add("ps-motion-" + id);
                          }}
                        >
                          재생
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
          <style id="selected-motion-preview">{core.motionCSS(config)}</style>
        </div>
      </details>
      <ComponentPanel />
      <IconPanel />
      <div className="inspector-footer">
        <p className="help">선택은 자동 저장됩니다.</p>
        <a href="README.md">사용 가이드 ↗</a>
        <small>Lucide 아이콘 · OFL 라이선스 폰트</small>
      </div>
    </div>
  );
}
