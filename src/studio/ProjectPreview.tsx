import React, { useState } from "react";
import { useStudio } from "./context";
import { palette, style, kit, designs } from "./data";
import { Navigation } from "./navigation";
import { DemoBoundary, Svg } from "./DemoBoundary";
import { LibraryPreview } from "./LibraryPanel";
import { DashboardSummary, initialRecentProjects, type SampleProject } from "./DashboardSummary";
import type { PaletteId } from "../core/types";
function ProjectPane({
  mode,
  index,
  previewPage,
  setPreviewPage,
  projects,
  addProject,
}: {
  mode: "light" | "dark";
  index: number;
  previewPage: string;
  setPreviewPage: (page: string) => void;
  projects: readonly SampleProject[];
  addProject: (name: string) => void;
}) {
  const { config, view, notice } = useStudio(),
    [query, setQuery] = useState(""),
    [name, setName] = useState(""),
    p = palette(
      view.mode === "compare" && index === 1 ? view.compare : config.palette,
    ),
    selection = config.designSelection,
    v = selection.components,
    navigation = selection.navigation;
  const matches = projects.filter((p) =>
    (p.name + " " + p.team + " " + p.label)
      .toLocaleLowerCase()
      .includes(query.toLocaleLowerCase()),
  );
  return (
    <section
      className="project-pane"
      data-theme={mode}
      data-palette={p.id}
      data-style={config.style}
      data-concept={selection.concept}
      data-project-preview
    >
      <div className="project-pane-label">
        <span>{mode === "light" ? "라이트" : "다크"}</span>
        <span>{p.name}</span>
      </div>
      <div
        className={"mock-app nav-" + navigation}
        data-menu-structure={selection.navigationStructure}
        data-ps-motion={selection.motion}
      >
        <div className="mock-top">
          <strong>
            <Svg name="layers" /> 프로젝트
          </strong>
          <span>제품팀</span>
        </div>
        {navigation === "hybrid" && (
          <div className="mock-context-nav">
            <span>작업 공간</span>
            <button
              type="button"
              data-preview-notice="account"
              onClick={() => notice("계정 메뉴 예시입니다.")}
            >
              계정
            </button>
          </div>
        )}
        <Navigation
          selection={selection}
          interactive
          active={previewPage}
          onNavigate={setPreviewPage}
          orientation={navigation === "top" ? "horizontal" : "vertical"}
          className={
            "mock-nav" + (navigation === "hybrid" ? " mock-secondary-nav" : "")
          }
          projectIcon={config.icons[0] || "layout-dashboard"}
        />
        <div className="mock-main">
          <div data-preview-projects hidden={previewPage !== "projects"}>
            <div className="mock-title">
              <div>
                <h3>프로젝트 현황</h3>
              </div>
            </div>
            <DashboardSummary key={selection.dashboardLayout} layout={selection.dashboardLayout} recent={projects} treatment={v.card} />
            <section className="mock-dashboard" aria-label="통계와 진행 상태">
              <div className="mock-dashboard-title"><h4>작업 통계</h4><span>샘플 데이터 · 최근 6주</span></div>
              <DemoBoundary
                className="dashboard-summary"
                html={(selection.dashboardLayout === "cards" ? ["metric", "progress"] as const : ["progress"] as const)
                  .map(id => window.PaletteSampleMarkup.demo(id, v[id], false, "project-" + index + "-" + mode))
                  .join("")}
              />
              <DemoBoundary
                className="dashboard-charts"
                html={(["bar-chart", "line-chart", "donut-chart"] as const)
                  .map(id => window.PaletteSampleMarkup.demo(id, v[id], false, "project-" + index + "-" + mode))
                  .join("")}
              />
            </section>
            <article className={"mock-projects treatment " + v.card}>
              <div className="sample-box">
                <h4 className="sample-emphasis">최근 프로젝트</h4>
                <label className="mock-search">
                  <Svg name="search" size={16} />
                  <input
                    type="search"
                    data-project-search
                    placeholder="프로젝트 검색"
                    aria-label="샘플 프로젝트 검색"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <table>
                  <thead>
                    <tr>
                      <th scope="col">프로젝트</th>
                      <th scope="col">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((p, i) => (
                      <tr
                        key={i}
                        data-status={p.status}
                        hidden={!matches.includes(p)}
                      >
                        <td>
                          <strong>{p.name}</strong>
                          <small>{p.team}</small>
                        </td>
                        <td>
                          <span
                            className={
                              "sample-badge " +
                              (p.status === "passed"
                                ? "sample-success"
                                : p.status === "review"
                                  ? "sample-warning"
                                  : "")
                            }
                          >
                            {p.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="help mock-empty" hidden={matches.length > 0}>
                  검색 결과가 없습니다.
                </p>
              </div>
            </article>
            <form
              className="mock-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (name.trim()) {
                  addProject(name.trim());
                  setName("");
                }
              }}
            >
              <h4>새 프로젝트</h4>
              <label className={"treatment " + v.input}>
                프로젝트 이름
                <input
                  className="sample-input sample-emphasis"
                  name="project"
                  required
                  placeholder="프로젝트 이름을 입력하세요"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <div className={"treatment " + v.button}>
                <button
                  type="submit"
                  className={
                    "sample-button " +
                    (v.button === "solid" ? "sample-primary" : "")
                  }
                >
                  <Svg name="plus" size={16} />
                  프로젝트 추가
                </button>
              </div>
            </form>
            <div className="mock-bottom">
              {(["switch", "badge"] as const).map((id) => (
                <DemoBoundary
                  key={id}
                  html={window.PaletteSampleMarkup.demo(
                    id,
                    v[id],
                    true,
                    mode + "-" + index,
                  )}
                />
              ))}
            </div>
            <pre className="workspace-code mock-code">
              <code>
                {
                  'const project = {\n  name: "My Workspace",\n  ready: true\n};'
                }
              </code>
            </pre>
          </div>
          <section data-preview-settings hidden={previewPage !== "settings"}>
            <div className="mock-title">
              <h3>설정</h3>
            </div>
            <label className="sample-check">
              <input type="checkbox" defaultChecked />
              이메일 알림
            </label>
            <label className="sample-check">
              <input type="checkbox" />
              주간 요약
            </label>
            <p className="help">미리보기 설정입니다.</p>
          </section>
        </div>
      </div>
    </section>
  );
}
function Recipe() {
  const { config } = useStudio(),
    set = designs.sets.find((s) => s.id === config.designSelection.set)!,
    selection = config.designSelection,
    p = palette(config.palette),
    defaults = designs.selection(set.id).components,
    custom = Object.entries(selection.components).filter(
      ([id, v]) => v !== defaults[id as keyof typeof defaults],
    ).length;
  const rows = [
    ["프리셋", set.name],
    ["콘셉트", designs.concepts.get(selection.concept).name],
    ["대시보드 요약", designs.dashboardLayouts.find(p => p.id === selection.dashboardLayout)!.name],
    [
      "메뉴 배치",
      designs.navigationPresets.find((n) => n.id === selection.navigation)!
        .name,
    ],
    [
      "애니메이션",
      designs.motionPresets.find((n) => n.id === selection.motion)!.name,
    ],
    [
      "선택 표시",
      designs.navigationDesigns.styles.find(
        (n) => n.id === selection.navigationStyle,
      )!.name,
    ],
    [
      "메뉴 구성",
      designs.navigationDesigns.structures.find(
        (n) => n.id === selection.navigationStructure,
      )!.name,
    ],
    ["디자인 모드", "라이트 + 다크"],
    ["색상", p.name],
    ["형태", style(config.style).name],
    ["개별 변경", custom + " / " + designs.components.length],
    ["본문 폰트", config.fonts.body],
    ["적용 범위", config.scope],
  ];
  return (
    <div id="recipe">
      {(["light", "dark"] as const).map((mode) => (
        <div key={mode} className="swatches" aria-label={mode + " 색상 견본"}>
          <small>{mode}</small>
          {[
            "--color-canvas",
            "--color-surface",
            "--color-line-strong",
            "--color-accent",
            "--color-ink",
          ].map((t) => (
            <span key={t} style={{ background: p.modes[mode][t] }} />
          ))}
        </div>
      ))}
      {rows.map(([k, v]) => (
        <div className="recipe-row" key={k}>
          <span>{k}</span>
          <strong>{v}</strong>
        </div>
      ))}
    </div>
  );
}
export function ProjectPreview({ copy }: { copy: (text: string) => void }) {
  const { config, view, setView, expanded, setExpanded, notice } = useStudio(),
    [previewPage, setPreviewPage] = useState("projects"),
    [projects, setProjects] = useState<SampleProject[]>(initialRecentProjects);
  const modes: ("light" | "dark")[] =
    view.mode === "split"
      ? ["light", "dark"]
      : view.mode === "compare"
        ? [view.compareMode, view.compareMode]
        : [view.mode];
  return (
    <aside
      id="preview-panel"
      className={"project-preview" + (expanded ? " expanded" : "")}
      aria-label="선택한 디자인 미리보기"
    >
      <div className="preview-heading">
        <div>
          <h2>미리보기</h2>
        </div>
        <div id="compact-preview" aria-hidden="true">
          <span data-palette={config.palette} data-theme="light">
            <i />
            <b>Aa</b>
            <em>✓</em>
          </span>
        </div>
        <button
          id="toggle-preview"
          type="button"
          aria-controls="preview-content"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "미리보기 접기" : "미리보기 확대"}
        </button>
      </div>
      <div id="preview-content">
        <div className="preview-controls">
          <label>
            보기
            <select
              id="preview-mode"
              value={view.mode}
              onChange={(e) =>
                setView({ ...view, mode: e.target.value as typeof view.mode })
              }
            >
              <option value="split">라이트 + 다크</option>
              <option value="light">라이트</option>
              <option value="dark">다크</option>
              <option value="compare">팔레트 비교</option>
            </select>
          </label>
          <label id="compare-control" hidden={view.mode !== "compare"}>
            비교 팔레트
            <select
              id="compare-palette"
              value={view.compare}
              onChange={(e) =>
                setView({ ...view, compare: e.target.value as PaletteId })
              }
            >
              {kit.palettes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label id="compare-mode-control" hidden={view.mode !== "compare"}>
            비교 모드
            <select
              id="compare-mode"
              value={view.compareMode}
              onChange={(e) =>
                setView({
                  ...view,
                  compareMode: e.target.value as "light" | "dark",
                })
              }
            >
              <option value="light">라이트</option>
              <option value="dark">다크</option>
            </select>
          </label>
          <span className="help">프로젝트 UI 예시 · 프레임워크 중립</span>
        </div>
        <div id="project-stage" data-view={view.mode}>
          {modes.map((mode, i) => (
            <ProjectPane
              key={i}
              mode={mode}
              index={i}
              previewPage={previewPage}
              setPreviewPage={setPreviewPage}
              projects={projects}
              addProject={(name) => {
                setProjects([
                  ...projects,
                  {
                    name,
                    team: "제품팀",
                    status: "running",
                    label: "◷ 진행 중",
                  },
                ]);
                notice("샘플 프로젝트를 추가했습니다.");
              }}
            />
          ))}
        </div>
        <LibraryPreview />
        <div className="preview-caption">
          <span id="preview-selection">
            {palette(config.palette).name} / {style(config.style).name}
          </span>
          <button
            id="share-selection"
            type="button"
            onClick={() => copy(window.PaletteWorkspace.shareURL())}
          >
            선택 링크 복사
          </button>
        </div>
        <details id="selection-details">
          <summary>선택 상세</summary>
          <Recipe />
        </details>
      </div>
    </aside>
  );
}
