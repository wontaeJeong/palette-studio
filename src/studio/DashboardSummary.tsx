import React, { useState } from "react";
import type { ComponentVariant, DashboardLayoutId } from "../core/types";

type Status = "needs-action" | "review" | "running" | "passed" | "failed";
export interface SampleProject {
  name: string;
  team: string;
  status: Status;
  label: string;
}
const statuses: { id: Status; label: string; hint: string }[] = [
  { id: "needs-action", label: "처리 필요", hint: "담당자 조치" },
  { id: "review", label: "검토 필요", hint: "승인 대기" },
  { id: "running", label: "진행 중", hint: "작업 진행" },
  { id: "passed", label: "완료", hint: "처리 완료" },
  { id: "failed", label: "실패", hint: "재확인 필요" },
];
export const initialRecentProjects: SampleProject[] = [
  { name: "웹사이트 리뉴얼", team: "제품팀", status: "review", label: "! 검토 필요" },
  { name: "디자인 가이드", team: "디자인팀", status: "passed", label: "✓ 완료" },
  { name: "모바일 프로젝트", team: "개발팀", status: "running", label: "◷ 진행 중" },
];
// The preview table shows recent projects; the weekly summary also includes
// these nine existing sample projects. Counts and status-filter rows share this data.
const earlierProjects: readonly SampleProject[] = [
  { name: "접근성 점검", team: "개발팀", status: "needs-action", label: "! 처리 필요" },
  { name: "온보딩 개선", team: "제품팀", status: "review", label: "! 검토 필요" },
  ...["문서 정리", "컴포넌트 개선", "테스트 보완", "검색 개선", "색상 검토", "배포 준비", "설정 정리"].map((name): SampleProject =>
    ({ name, team: "제품팀", status: "passed", label: "✓ 완료" })),
];

const count = (n: number) => n.toLocaleString("ko-KR");
function Metric({ label, value, total = false, state }: { label: string; value: number; total?: boolean; state?: Status }) {
  return <div className="kpi-metric" data-state={state}>
    <dt>{label}</dt>
    <dd data-kpi-total={total ? "" : undefined}>{count(value)}<small>건</small></dd>
  </div>;
}
function Sparkline({ values, label }: { values: readonly number[]; label: string }) {
  // All example rows use the same six-day unit/scale (0–8 projects per day).
  const points = values.map((value, i) => `${2 + i * 19.2},${30 - value / 8 * 26}`).join(" ");
  return <svg className="kpi-sparkline" role="img" aria-label={`${label}, 최근 6일 순서: ${values.join(", ")}건`} viewBox="0 0 100 32">
    <path d="M2 30 H98" className="kpi-sparkline-axis" />
    <polyline points={points} className="kpi-sparkline-line" />
    <circle cx="98" cy={30 - values[values.length - 1] / 8 * 26} r="2" className="kpi-sparkline-point" />
  </svg>;
}
const trendRows = [
  { label: "완료", values: [0, 1, 1, 2, 1, 3] },
  { label: "등록", values: [1, 2, 1, 3, 3, 2] },
];

/** Dashboard summary patterns share the same sample data; no production metrics. */
export function DashboardSummary({ layout, recent = initialRecentProjects, treatment = "soft" }: {
  layout: DashboardLayoutId;
  recent?: readonly SampleProject[];
  treatment?: ComponentVariant;
}) {
  const projects = [...recent, ...earlierProjects];
  const total = projects.length;
  const counts = Object.fromEntries(statuses.map(s => [s.id, projects.filter(p => p.status === s.id).length])) as Record<Status, number>;
  const [filter, setFilter] = useState<Status | "all">("all");
  const filtered = filter === "all" ? projects : projects.filter(p => p.status === filter);
  const shown = filtered.slice(0, 3);
  const target = 10;
  const exceptions = counts["needs-action"] + counts.failed;
  const context = layout === "trend-rows" ? "최근 6일 · 일별 샘플" : "이번 주 · 샘플 프로젝트";
  return <section className={`kpi-summary kpi-${layout}`} data-dashboard-layout={layout} aria-label="대시보드 요약 예시">
    <div className="kpi-context">{context}</div>
    {layout === "cards" && <div className="mock-metrics kpi-card-grid">
      {[["전체 프로젝트", total], ["이번 주 완료", counts.passed]].map(([label, value]) => <article key={label} className={"treatment " + treatment}>
        <div className="sample-box"><small>{label}</small><strong>{value}<span>건</span></strong></div>
      </article>)}
    </div>}
    {layout === "metric-strip" && <dl className="kpi-strip">
      <Metric label="전체" value={total} total />
      <Metric label="완료" value={counts.passed} />
      <Metric label="진행 중" value={counts.running} />
      <Metric label="검토 필요" value={counts.review} />
      <Metric label="처리 필요" value={counts["needs-action"]} />
    </dl>}
    {layout === "status-distribution" && <>
      <div className="kpi-total-line"><span>전체 프로젝트</span><strong data-kpi-total>{count(total)}<small>건</small></strong></div>
      {total > 0 ? <div className="kpi-segments" aria-hidden="true">
        {statuses.filter(s => counts[s.id] > 0).map(s => <span className="kpi-segment" key={s.id} data-state={s.id} data-segment={s.id} style={{ width: `${counts[s.id] / total * 100}%` }} />)}
      </div> : <p className="kpi-muted">표시할 프로젝트가 없습니다.</p>}
      <ul className="kpi-legend">
        {statuses.map(s => <li key={s.id} data-status-count={s.id}>
          <i data-state={s.id} aria-hidden="true" /> <span>{s.label}</span>
          <strong>{count(counts[s.id])}건</strong><small>{total > 0 ? `${Math.round(counts[s.id] / total * 100)}%` : "—"}</small>
        </li>)}
      </ul>
    </>}
    {layout === "action-queue" && <>
      <dl className="kpi-action-list">
        {(["needs-action", "review", "failed"] as const).map(id => {
          const s = statuses.find(item => item.id === id)!;
          return <div key={id} className="kpi-action-row" data-state={id} data-zero={counts[id] === 0 ? "true" : undefined}>
            <dt>{s.label}<small>{counts[id] ? s.hint : "해당 없음"}</small></dt>
            <dd>{count(counts[id])}<small>건</small></dd>
          </div>;
        })}
      </dl>
      <p className="kpi-secondary-line">전체 {count(total)} · 완료 {count(counts.passed)} · 진행 중 {count(counts.running)}</p>
    </>}
    {layout === "primary-stat" && <div className="kpi-primary-group">
      <div className="kpi-primary-value"><span>전체 프로젝트</span><strong data-kpi-total>{count(total)}<small>건</small></strong></div>
      <dl className="kpi-supporting">
        <Metric label="완료" value={counts.passed} />
        <Metric label="진행 중" value={counts.running} />
        <Metric label="검토 필요" value={counts.review} />
        <Metric label="처리 필요" value={counts["needs-action"]} />
      </dl>
    </div>}
    {layout === "exception-summary" && <>
      {exceptions ? <div className="kpi-exception">
        <span className="kpi-exception-label">조치 필요</span>
        <strong>{count(exceptions)}건</strong>
        <p>{counts["needs-action"] > 0 ? `처리 필요 ${count(counts["needs-action"])}건` : ""}{counts["needs-action"] > 0 && counts.failed > 0 ? " · " : ""}{counts.failed > 0 ? `실패 ${count(counts.failed)}건` : ""}을 확인하세요.</p>
      </div> : <p className="kpi-muted">✓ 조치가 필요한 항목이 없습니다.</p>}
      <dl className="kpi-strip kpi-routine"><Metric label="전체" value={total} total /><Metric label="완료" value={counts.passed} /><Metric label="진행 중" value={counts.running} /><Metric label="검토 필요" value={counts.review} /></dl>
    </>}
    {layout === "status-filters" && <>
      <div className="kpi-filters" role="group" aria-label="샘플 프로젝트 상태 필터">
        <button type="button" data-kpi-filter="all" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>전체 <span>{count(total)}</span></button>
        {statuses.map(s => <button key={s.id} type="button" data-kpi-filter={s.id} aria-pressed={filter === s.id} onClick={() => setFilter(s.id)}>{s.label} <span>{count(counts[s.id])}</span></button>)}
      </div>
      <div className="kpi-filter-result" data-kpi-filter-result>
        <p className="kpi-muted" role="status">{filtered.length ? `${count(filtered.length)}건 중 ${shown.length}건 표시` : "해당 상태의 프로젝트가 없습니다."}</p>
        {shown.length > 0 && <ul className="kpi-result-list">{shown.map((p, i) => <li key={i}><span>{p.name}</span><small data-state={p.status}>{p.label}</small></li>)}</ul>}
      </div>
    </>}
    {layout === "trend-rows" && <>
      <div className="kpi-total-line"><span>오늘의 작업량</span><small>전일 대비</small></div>
      <dl className="kpi-trend-list">
        {trendRows.map(row => {
          const last = row.values[row.values.length - 1], delta = last - row.values[row.values.length - 2];
          return <div className="kpi-trend-row" key={row.label}>
            <dt>{row.label}</dt><dd>{last}<small>건</small><span className="kpi-delta">{delta > 0 ? `+${delta}` : delta}</span></dd>
            <Sparkline label={row.label} values={row.values} />
          </div>;
        })}
      </dl>
    </>}
    {layout === "target-progress" && <>
      <div className="kpi-total-line"><span>주간 완료 목표</span><strong>{counts.passed}<small> / {target}건</small></strong></div>
      <div className="kpi-progress-track" role="progressbar" aria-label="주간 완료 목표" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(counts.passed, target)} aria-valuetext={`${target}건 목표 중 ${counts.passed}건 완료`}>
        <span style={{ width: `${Math.min(counts.passed / target, 1) * 100}%` }} />
      </div>
      <div className="kpi-progress-caption"><span>{Math.round(counts.passed / target * 100)}% 달성</span><span>{counts.passed >= target ? "목표 달성" : `${target - counts.passed}건 남음`}</span></div>
    </>}
  </section>;
}
