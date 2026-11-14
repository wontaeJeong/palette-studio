import React, { useState, useRef, useLayoutEffect } from "react";
import { useStudio } from "./context";
import { designs } from "./data";
import { DemoBoundary } from "./DemoBoundary";
import type { ComponentId } from "../core/types";
export function ChoiceStatus({ selected, recommended }: { selected: boolean; recommended: boolean }) {
  return <span className="choice-statuses">
    {recommended && <span className="preset-recommendation">프리셋 추천</span>}
    {selected && <span className="selection-status">선택됨</span>}
  </span>;
}
export function PairedDemo({
  id,
  preview = false,
}: {
  id: ComponentId;
  preview?: boolean;
}) {
  const { config } = useStudio();
  return (
    <>
      {["light", "dark"].map((mode) => (
        <div
          key={mode}
          className="preview-pane"
          data-theme={mode}
          data-palette={config.palette}
          data-style={config.style}
          data-concept={config.designSelection.concept}
        >
          <span className="pane-label">
            {mode === "light" ? "라이트" : "다크"}
          </span>
          <DemoBoundary
            html={window.PaletteSampleMarkup.demo(
              id,
              config.designSelection.components[id],
              preview,
              mode,
            )}
          />
        </div>
      ))}
    </>
  );
}
export function ComponentPanel() {
  const { config, update } = useStudio(),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("all"),
    [recommendedOnly, setRecommendedOnly] = useState(false),
    [active, setActive] = useState<ComponentId | null>(null),
    dialog = useRef<HTMLDialogElement>(null),
    set = designs.sets.find((s) => s.id === config.designSelection.set)!,
    defaults = designs.selection(set.id).components,
    custom = Object.entries(config.designSelection.components).filter(
      ([id, v]) => v !== defaults[id as ComponentId],
    ).length;
  const recommended = set.recommendedComponents,
    matches = designs.components
      .filter(
        (c) =>
          (category === "all" || category === c.category) &&
          (!recommendedOnly || recommended.includes(c.id)) &&
          [c.name, c.label, c.purpose, c.keywords]
            .join(" ")
            .toLocaleLowerCase()
            .includes(query.trim().toLocaleLowerCase()),
      )
      .sort(
        (a, b) =>
          Number(recommended.includes(b.id)) -
          Number(recommended.includes(a.id)),
      );
  const c = designs.components.find((c) => c.id === active),
    variant = active ? config.designSelection.components[active] : null;
  useLayoutEffect(() => {
    if (active && !dialog.current!.open) dialog.current!.showModal();
  }, [active]);
  return (
    <>
      <details id="components-options" className="inspector-section">
        <summary>
          <span>컴포넌트</span>
          <small id="selection-label">
            {set.name} · {custom}개 요소 변경
          </small>
        </summary>
        <div className="details-content">
          <p className="help">세트를 다시 선택하면 개별 설정이 초기화됩니다.</p>
          <div className="field-pair">
            <label>
              컴포넌트 검색
              <input
                id="catalog-search"
                type="search"
                placeholder="알림, 버튼…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label>
              종류
              <select
                id="catalog-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="all">모든 요소</option>
                {[...new Set(designs.components.map((c) => c.category))].map(
                  (c) => (
                    <option key={c}>{c}</option>
                  ),
                )}
              </select>
            </label>
          </div>
          <label className="sample-check">
            <input
              id="recommended-only"
              type="checkbox"
              checked={recommendedOnly}
              onChange={(e) => setRecommendedOnly(e.target.checked)}
            />
            권장 요소만 표시
          </label>
          <div id="component-grid" className="component-grid">
            {matches.map((c) => (
              <article className="component-card" key={c.id}>
                <div className="component-preview" inert aria-hidden="true">
                  <PairedDemo id={c.id} preview />
                </div>
                <button
                  type="button"
                  className="component-caption"
                  data-component={c.id}
                  onClick={() => setActive(c.id)}
                >
                  <strong>
                    {c.label}
                    {recommended.includes(c.id) && (
                      <>
                        {" "}
                        <span className="recommend-badge">권장 요소</span>
                      </>
                    )}
                  </strong>
                  <small>
                    {c.name} · 선택됨: {" "}
                    {
                      designs.treatments[
                        config.designSelection.components[c.id]
                      ].name
                    }
                  </small>
                  <small>프리셋 추천: {designs.treatments[defaults[c.id]].name}</small>
                  <span>{c.purpose} ↗</span>
                </button>
              </article>
            ))}
          </div>
          <p id="no-results" className="help" hidden={matches.length !== 0}>
            검색 결과가 없습니다.
          </p>
        </div>
      </details>
      <dialog
        id="component-dialog"
        aria-labelledby="detail-title"
        ref={dialog}
        onClose={() => {
          window.PaletteComponentDemos.cleanup();
          const opener =
            document.querySelector<HTMLElement>(
              `[data-component="${active}"]`,
            ) || document.getElementById("catalog-search");
          setActive(null);
          opener?.focus({ preventScroll: true });
        }}
      >
        <div className="detail-top">
          <p id="detail-category" className="eyebrow">
            {c && c.category + " / " + c.name}
          </p>
          <button
            type="button"
            data-close="component-dialog"
            aria-label="요소 상세 닫기"
          >
            닫기 ×
          </button>
        </div>
        <h2 id="detail-title">{c?.label}</h2>
        <p id="detail-purpose">{c?.purpose}</p>
        <div
          id="variant-picker"
          className="variant-picker"
          role="group"
          aria-label="요소 표현 선택"
        >
          {c?.variants.map((v) => (
            <button
              key={v}
              type="button"
              data-variant={v}
              aria-pressed={v === variant}
              onClick={() =>
                update({ designSelection: { components: { [c.id]: v } } })
              }
            >
              {designs.treatments[v].name}
              <ChoiceStatus selected={v === variant} recommended={v === defaults[c.id]} />
            </button>
          ))}
        </div>
        <div id="detail-demo" className="detail-demo">
          {active && <PairedDemo id={active} />}
        </div>
        <p className="help">
          미리보기에서 동작을 확인할 수 있습니다. 아래 구현 기준은 작업지시에
          포함됩니다.
        </p>
        <h3>구현 기준</h3>
        <p id="detail-behavior" lang="en">
          {variant && designs.treatments[variant].rule + " " + c?.behavior}
        </p>
        <button className="primary" type="button" data-close="component-dialog">
          선택 적용
        </button>
      </dialog>
    </>
  );
}
