import React, { useRef, useState } from "react";
import { useStudio } from "./context";
import { designs } from "./data";
import { DashboardSummary } from "./DashboardSummary";
import type { DashboardLayoutId } from "../core/types";

export function DashboardLayoutPanel({ copy }: { copy: (text: string) => void }) {
  const { config, update, theme } = useStudio();
  const selection = config.designSelection;
  const selected = designs.dashboardLayouts.find(p => p.id === selection.dashboardLayout)!;
  const [mode, setMode] = useState<"light" | "dark">("light");
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const choose = (id: DashboardLayoutId) => update({ designSelection: { dashboardLayout: id } });

  return <>
    <details id="dashboard-layout-options" className="inspector-section">
      <summary><span>대시보드 요약 프리셋</span><small>{selected.name}</small></summary>
      <div className="details-content kpi-layout-settings">
        <p className="help">지표를 읽는 목적에 맞춰 카드 대신 요약, 분포, 목록 등의 구성을 선택하세요. 색상·콘셉트와 별도로 적용됩니다.</p>
        <label>요약 레이아웃
          <select id="dashboard-layout" value={selected.id} onChange={e => choose(e.target.value as DashboardLayoutId)}>
            {designs.dashboardLayouts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <p className="kpi-layout-description">{selected.description}</p>
        <dl className="kpi-usage-guide">
          <div><dt>적합한 화면</dt><dd>{selected.when}</dd></div>
          <div><dt>피할 경우</dt><dd>{selected.avoid}</dd></div>
        </dl>
        <div className="kpi-layout-actions">
          <button type="button" id="browse-dashboard-layouts" ref={opener} onClick={() => {
            setMode(theme === "dark" ? "dark" : "light");
            dialog.current!.showModal();
          }}>9가지 레이아웃 비교 ↗</button>
          <button type="button" id="copy-dashboard-layout-brief" onClick={() => copy(designs.dashboardLayoutBrief(selected.id))}>패턴 작업지시 복사</button>
        </div>
        <p className="help">선택은 디자인 프로필과 작업지시에도 들어갑니다.</p>
      </div>
    </details>
    <dialog id="dashboard-layout-dialog" ref={dialog} aria-labelledby="dashboard-layout-heading" onClose={() => opener.current?.focus({ preventScroll: true })}>
      <div className="detail-top"><p className="eyebrow">Dashboard summary patterns</p><button type="button" onClick={() => dialog.current!.close()} aria-label="대시보드 프리셋 비교 닫기">닫기 ×</button></div>
      <h2 id="dashboard-layout-heading">대시보드 요약 프리셋</h2>
      <div className="kpi-gallery-intro">
        <p className="help">같은 프로젝트 샘플을 서로 다른 구조로 비교합니다. 추세형은 일별 예시입니다. 선택하면 오른쪽 미리보기와 내보내기에 반영됩니다.</p>
        <div className="kpi-gallery-modes" role="group" aria-label="비교 미리보기 테마">
          {(["light", "dark"] as const).map(m => <button key={m} type="button" data-dashboard-gallery-mode={m} aria-pressed={mode === m} onClick={() => setMode(m)}>{m === "light" ? "라이트" : "다크"}</button>)}
        </div>
      </div>
      <div className="kpi-gallery-grid">
        {designs.dashboardLayouts.map(p => <article className="kpi-gallery-card" key={p.id} data-dashboard-preset={p.id}>
          <div className="kpi-gallery-title"><h3>{p.name}</h3><small lang="en">{p.englishName}</small></div>
          <div className="kpi-gallery-preview" data-theme={mode} data-palette={config.palette} data-style={config.style} data-concept={selection.concept} inert aria-hidden="true">
            <DashboardSummary layout={p.id} treatment={selection.components.card} />
          </div>
          <p>{p.description}</p>
          <dl className="kpi-usage-guide"><div><dt>적합</dt><dd>{p.when}</dd></div><div><dt>피하기</dt><dd>{p.avoid}</dd></div></dl>
          <button type="button" data-dashboard-layout-choice={p.id} aria-pressed={p.id === selected.id} onClick={() => { choose(p.id); dialog.current!.close(); }}>
            {p.id === selected.id ? "✓ 선택됨" : "이 레이아웃 적용"}
            <span className="kpi-visually-hidden">: {p.name}</span>
          </button>
        </article>)}
      </div>
    </dialog>
  </>;
}
