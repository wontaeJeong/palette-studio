import React, { useRef, useLayoutEffect, useCallback } from "react";
import { useStudio } from "./context";
import { SelectionPanel } from "./SelectionPanel";
import { ProjectPreview } from "./ProjectPreview";
import { ExportDialog } from "./ExportDialog";
import { mountSampleRuntime } from "./sample-runtime";
export function App() {
  const { theme, setTheme, saveStatus, status, notice } = useStudio(),
    exportRef = useRef<{ open(): void }>(null);
  useLayoutEffect(() => mountSampleRuntime(notice), [notice]);
  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        notice("복사했습니다.");
      } catch {
        const t = document.createElement("textarea");
        t.value = text;
        document.body.append(t);
        t.select();
        const ok = document.execCommand("copy");
        t.remove();
        notice(
          ok ? "복사했습니다." : "복사가 제한됩니다. 저장 버튼을 이용하세요.",
        );
      }
    },
    [notice],
  );
  return (
    <>
      <a className="skip" href="#selection-panel">
        디자인 편집으로 이동
      </a>
      <header className="workspace-header">
        <a className="brand" href="index.html">
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          Palette Studio
        </a>
        <div className="header-actions">
          <span id="save-status" role="status">
            {saveStatus}
          </span>
          <button
            id="ui-theme"
            type="button"
            aria-label="도구 다크 모드"
            aria-pressed={theme === "dark"}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "라이트 모드" : "다크 모드"}
          </button>
          <button
            id="open-export"
            className="primary"
            type="button"
            onClick={() => exportRef.current!.open()}
          >
            내보내기 <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>
      <main id="workspace" className="workspace">
        <SelectionPanel />
        <ProjectPreview copy={copy} />
      </main>
      <ExportDialog ref={exportRef} copy={copy} />
      <dialog
        className="demo-surface"
        id="demo-dialog"
        aria-labelledby="demo-title"
      >
        <h2 id="demo-title">변경 내용을 저장할까요?</h2>
        <p>
          프로젝트의 새 디자인을 적용합니다. 팀원에게도 변경 사항이 표시됩니다.
        </p>
        <div className="sample-box">
          <strong>샘플 프로젝트</strong>
          <p>색상 · 글꼴 · 컴포넌트 설정</p>
        </div>
        <button
          type="button"
          className="sample-button"
          data-demo="toast"
          data-toast-status="info"
        >
          저장 안내 확인
        </button>
        <div className="demo-actions">
          <button type="button" data-close="demo-dialog">
            취소
          </button>
          <button type="button" className="primary" data-close="demo-dialog">
            저장
          </button>
        </div>
      </dialog>
      <dialog
        id="demo-drawer"
        className="drawer demo-surface"
        aria-labelledby="drawer-title"
      >
        <button type="button" data-close="demo-drawer">
          닫기 ×
        </button>
        <h2 id="drawer-title">프로젝트 상세</h2>
        <p>팀의 진행 상황과 프로젝트 정보를 확인하세요.</p>
        <div className="sample-box">
          <span className="sample-badge sample-review">검토 중</span>
          <p>Product Team · 멤버 3명</p>
        </div>
        <label>
          프로젝트 이름
          <input defaultValue="샘플 프로젝트" />
        </label>
      </dialog>
      <div id="demo-toast" className="demo-toast" role="status" hidden />
      <div id="catalog-status" className="status" role="status">
        {status}
      </div>
    </>
  );
}
