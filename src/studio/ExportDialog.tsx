import React, {
  useState,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import { useStudio } from "./context";
import {
  outputs,
  core,
  kit,
  palette,
  style,
  designs,
  fontLoader,
  libraries,
} from "./data";
import type {
  Target,
  Scope,
  Framework,
  Layout,
  FontSource,
} from "../core/types";
export const labels: Record<string, string> = {
  "design.md": "디자인 기준",
  "design-profile.json": "프로필 JSON",
  "selected-theme.css": "색상 CSS",
  "selected-style.css": "스타일 CSS",
  "selected-motion.css": "애니메이션 CSS",
  "selected-fonts.css": "폰트 CSS",
  "AGENT-TASK.md": "작업지시",
  "QA-CHECKLIST.md": "검증 목록",
};
export function download(name: string, text: string) {
  const uri = URL.createObjectURL(
      new Blob([text], {
        type: name.endsWith(".json")
          ? "application/json"
          : "text/plain;charset=utf-8",
      }),
    ),
    a = document.createElement("a");
  a.href = uri;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(uri), 1000);
}
export const ExportDialog = forwardRef<
  { open(): void },
  { copy: (text: string) => void }
>(function ExportDialog({ copy }, ref) {
  const { config, update } = useStudio(),
    dialog = useRef<HTMLDialogElement>(null),
    [draft, setDraft] = useState(config.project),
    [valid, setValid] = useState(true);
  useImperativeHandle(
    ref,
    () => ({
      open() {
        setDraft(config.project);
        setValid(true);
        dialog.current!.showModal();
      },
    }),
    [config.project],
  );
  const files = core.libraryFiles(config, kit),
    save = (name: string) => download(name, outputs(config)[name]);
  return (
    <dialog
      id="export-dialog"
      className="export-dialog"
      aria-labelledby="export-heading"
      ref={dialog}
      onClose={() => {
        setDraft(config.project);
        setValid(true);
        document.getElementById("open-export")?.focus({ preventScroll: true });
      }}
    >
      <div className="detail-top">
        <button
          type="button"
          data-close="export-dialog"
          aria-label="내보내기 닫기"
        >
          닫기 ×
        </button>
      </div>
      <h2 id="export-heading">내보내기</h2>
      <p className="help">적용 범위와 파일을 확인하세요.</p>
      <div id="export-summary" className="export-summary">
        {palette(config.palette).name} ·{" "}
        {designs.concepts.get(config.designSelection.concept).name} ·{" "}
        {style(config.style).name} ·{" "}
        {fontLoader.resolve(config.fonts.body, "body").name} /{" "}
        {fontLoader.resolve(config.fonts.code, "code").name} · 아이콘{" "}
        {config.icons.length}개
      </div>
      <div className="export-fields">
        <label>
          프로젝트 이름
          <input
            id="project-name"
            maxLength={64}
            required
            value={draft}
            aria-invalid={!valid}
            onChange={(e) => {
              setDraft(e.target.value);
              try {
                update({ project: e.target.value });
                setValid(true);
              } catch {
                setValid(false);
              }
            }}
          />
        </label>
        <label>
          적용 대상
          <select
            id="target"
            value={config.target}
            onChange={(e) => update({ target: e.target.value as Target })}
          >
            <option value="new-app">새 앱</option>
            <option value="existing-app">기존 앱</option>
          </select>
        </label>
        <label>
          색상 적용 범위
          <select
            id="scope"
            value={config.scope}
            onChange={(e) => update({ scope: e.target.value as Scope })}
          >
            <option value="both">라이트 + 다크</option>
            <option value="dark-only">다크만</option>
            <option value="light-only">라이트만</option>
          </select>
        </label>
        <label>
          프레임워크
          <select
            id="framework"
            value={config.framework}
            onChange={(e) => update({ framework: e.target.value as Framework })}
          >
            <option value="react">React / Vite / Next</option>
            <option value="vanilla">Vanilla HTML/CSS</option>
            <option value="astro">Astro</option>
          </select>
        </label>
        <label>
          화면 종류
          <select
            id="layout"
            value={config.layout}
            onChange={(e) => update({ layout: e.target.value as Layout })}
          >
            <option value="existing">기존 앱 구조 유지</option>
            <option value="dashboard">운영 · 데이터</option>
            <option value="content">문서 · 콘텐츠</option>
            <option value="workflow">입력 · 승인</option>
            <option value="marketing">소개 · 랜딩</option>
          </select>
        </label>
        <label>
          폰트 불러오기
          <select
            id="font-source"
            value={config.fonts.source}
            onChange={(e) =>
              update({ fonts: { source: e.target.value as FontSource } })
            }
          >
            <option value="cdn-first">CDN 우선 · 실패 시 동봉 폰트</option>
            <option value="local-only">동봉 폰트</option>
            <option value="system">시스템 폰트만</option>
          </select>
        </label>
      </div>
      <p id="export-error" className="help" role="alert" hidden={valid}>
        프로젝트 이름은 문자·숫자로 시작하는 1–64자여야 합니다. 공백, _, -, .을
        사용할 수 있습니다.
      </p>
      <p id="scope-note" className="help">
        {config.scope === "dark-only"
          ? "기존 라이트 색상은 유지하고 다크 색상만 내보냅니다."
          : config.scope === "light-only"
            ? "기존 다크 색상은 유지하고 라이트 색상만 내보냅니다."
            : "라이트와 다크 색상을 함께 내보냅니다."}
      </p>
      <div className="export-buttons">
        <button
          id="copy-brief"
          className="primary"
          type="button"
          disabled={!valid}
          onClick={() => copy(core.agentTask(config, kit))}
        >
          작업지시 복사
        </button>
        <button
          id="download-config"
          type="button"
          disabled={!valid}
          onClick={() =>
            download(
              "handoff-config.json",
              JSON.stringify(config, null, 2) + "\n",
            )
          }
        >
          설정 JSON 저장
        </button>
      </div>
      <details>
        <summary>파일별 저장 · CSS / 프로필 / 문서</summary>
        <div id="export-files" className="export-buttons">
          {Object.entries(labels).map(([name, label]) => (
            <button
              key={name}
              type="button"
              data-export={name}
              disabled={!valid}
              onClick={() => save(name)}
            >
              {label} 저장
            </button>
          ))}
        </div>
        <p id="library-export-note" className="library-export-note">
          {libraries.summary(config)}
        </p>
        <div id="library-export-files" className="export-buttons">
          {Object.keys(files).map((name) => (
            <button
              key={name}
              type="button"
              data-export={name}
              disabled={!valid}
              onClick={() => save(name)}
            >
              {name} 저장
            </button>
          ))}
        </div>
      </details>
      <details>
        <summary>작업지시 미리보기</summary>
        <label className="brief-label">
          AGENT-TASK.md
          <textarea
            id="agent-brief"
            readOnly
            rows={12}
            value={core.agentTask(config, kit)}
          />
        </label>
      </details>
      <details>
        <summary>폰트 · SVG 파일 저장</summary>
        <p className="help">
          설정 JSON을 저장한 뒤 저장소에서 실행하세요. 선택한 폰트·SVG와
          라이선스까지 포함합니다.
        </p>
        <pre className="workspace-code">
          <code>
            node scripts/create-design-handoff.cjs --config handoff-config.json
            --out design/handoff
          </code>
        </pre>
      </details>
    </dialog>
  );
});
