import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { useStudio } from "./context";
import {
  libraries,
  kit,
  designs,
  type Library,
  type MetricResult,
  type MetricClient,
} from "./data";
import type { UILibraryId } from "../core/types";
import { loadLibrary } from "./library-loader";
import { ScopedPreview } from "../../examples/library-preview/src/shared";
const formatCount = (n: number | undefined) =>
    new Intl.NumberFormat("ko-KR").format(n || 0),
  formatTime = (n: number | string) =>
    new Date(n).toLocaleString("ko-KR", { timeZone: "UTC", hour12: false }) +
    " UTC";
function Metrics({
  library: l,
  client,
}: {
  library: Library;
  client: MetricClient;
}) {
  const [result, setResult] = useState<MetricResult>(() => client.peek(l.id)),
    [busy, setBusy] = useState(false),
    mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    let alive = true;
    const show = () => {
      if (alive) setResult(client.peek(l.id));
    };
    window.addEventListener("pageshow", show);
    return () => {
      alive = false;
      mounted.current = false;
      window.removeEventListener("pageshow", show);
    };
  }, [client, l.id]);
  const refresh = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await client.load(l, { force: true });
      if (mounted.current) setResult(next);
    } finally {
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <>
      <div
        data-library-metrics={l.id}
        className="library-metrics"
        aria-live="polite"
        aria-busy={busy}
      >
        {busy && (
          <p className="metric-loading" role="status">
            공개 소스 조회 중…
          </p>
        )}
        {(["github", "release", "npm"] as const).map((source) => {
          const r = result[source],
            v = r.value,
            label =
              source === "github"
                ? "GitHub stars" + (l.monorepo ? " · monorepo" : "")
                : source === "release"
                  ? "최신 정식 릴리스"
                  : l.packageLabel
                    ? "주간 npm · CLI downloads"
                    : "주간 npm · 대표 패키지",
            text = !v
              ? "—"
              : source === "github"
                ? formatCount(v.stars)
                : source === "npm"
                  ? formatCount(v.downloads)
                  : v.noRelease
                    ? "최신 정식 릴리스 없음"
                    : v.tag,
            url =
              r.sourceUrl ||
              (source === "npm"
                ? "https://api.npmjs.org/downloads/point/last-week/" +
                  encodeURIComponent(l.npmPackage!)
                : "https://api.github.com/repos/" +
                  l.repo +
                  (source === "release" ? "/releases/latest" : "")),
            state =
              !v && !r.error
                ? "조회 전"
                : {
                    fresh: "최신 조회",
                    cached: "캐시 · 1시간 이내",
                    stale: r.error
                      ? "이전 값 · 조회 실패"
                      : "이전 값 · 기한 경과",
                    unavailable: "조회 불가",
                  }[r.state],
            detail =
              v && source === "npm"
                ? `${v.start} ~ ${v.end}`
                : v && source === "release" && !v.noRelease
                  ? "게시 " + formatTime(v.publishedAt!)
                  : "";
          return (
            <div
              className="metric-source"
              data-metric-source={source}
              key={source}
            >
              <div className="metric-heading">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {label} ↗
                </a>
                <span className="metric-state" data-metric-state={r.state}>
                  {state}
                </span>
              </div>
              <strong className="metric-value">
                {source === "release" && v && !v.noRelease ? (
                  <a href={v.url} target="_blank" rel="noopener noreferrer">
                    {text}
                  </a>
                ) : (
                  text
                )}
              </strong>
              {detail && <small>{detail}</small>}
              {r.fetchedAt !== null && (
                <small>
                  정상 조회{" "}
                  <time dateTime={new Date(r.fetchedAt).toISOString()}>
                    {formatTime(r.fetchedAt)}
                  </time>
                </small>
              )}
              {r.error && (
                <small className="metric-error">
                  ! {r.error}
                  {r.attemptedAt !== null
                    ? " · 시도 " + formatTime(r.attemptedAt)
                    : ""}
                </small>
              )}
              {r.retryAt !== null && (
                <small>재시도 가능 시각 {formatTime(r.retryAt)}</small>
              )}
            </div>
          );
        })}
      </div>
      <button
        type="button"
        data-refresh-library={l.id}
        aria-label={l.name + " 지표 새로고침"}
        disabled={busy}
        onClick={refresh}
      >
        {busy ? "조회 중…" : "지표 새로고침"}
      </button>
    </>
  );
}
export function LibraryPanel() {
  const { config, update, setExpanded } = useStudio(),
    [client] = useState(() => window.PaletteLibraryMetrics.createClient());
  return (
    <details id="library-options" className="inspector-section">
      <summary>
        <span>UI 라이브러리</span>
        <small id="library-summary">
          {libraries.get(config.uiLibrary).name}
        </small>
      </summary>
      <div className="details-content">
        <p className="help">
          실제 패키지의 동작을 오프라인으로 비교하세요. 기존 앱에서는 현재
          라이브러리를 우선 유지합니다. 선택은 프레임워크를 자동 변경하지
          않습니다.
        </p>
        <p className="help">
          지표는 버튼을 눌렀을 때만 공개 API에서 조회합니다. 정상 값은 소스별로
          1시간 캐시합니다. Stars는 저장소 관심도이며 monorepo 전체를 포함할 수
          있습니다. npm 다운로드는 CI·반복 설치를 포함한 주간 요청 수로, 고유
          사용자 수나 품질 순위가 아닙니다. 대표 패키지는 라이브러리 전체
          사용량이 아니며 shadcn 수치는 CLI 다운로드입니다. 검증 버전과 최신
          정식 릴리스는 별개입니다. 최신 정식 릴리스는 초안·사전 릴리스를
          제외합니다.
        </p>
        <div id="library-grid" className="library-grid">
          {[...libraries.libraries, ...libraries.references].map((l) => (
            <article
              className="library-card"
              data-library-card={l.id}
              key={l.id}
            >
              <div className="library-card-title">
                <strong>{l.name}</strong>
                <small>
                  {l.version
                    ? "검증 버전 " + l.version
                    : l.runtime === "recipe"
                      ? "복사해서 관리"
                      : "기존 앱 우선"}
                </small>
              </div>
              <p>{l.description}</p>
              {l.repo ? (
                <>
                  <div className="library-source">
                    <a href={l.docs} target="_blank" rel="noopener noreferrer">
                      공식 문서 ↗
                    </a>
                    <a
                      href={"https://github.com/" + l.repo}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {l.repo}
                    </a>
                  </div>
                  <code>
                    {l.npmPackage}
                    {l.packageLabel ? " · CLI" : ""}
                  </code>
                  <Metrics library={l} client={client} />
                </>
              ) : (
                <div data-library-metrics="vanilla" className="library-metrics">
                  외부 런타임 추가 없음
                </div>
              )}
              {l.runtime === "react" || l.runtime === "native" ? (
                <button
                  type="button"
                  data-choose-library={l.id}
                  aria-pressed={l.id === config.uiLibrary}
                  onClick={() => {
                    update({ uiLibrary: l.id as UILibraryId });
                    if (l.runtime === "react") {
                      setExpanded(true);
                      window.dispatchEvent(new CustomEvent("palette-library-reveal", {detail:l.id}));
                    }
                  }}
                >
                  {l.id === config.uiLibrary
                    ? "선택됨"
                    : "이 라이브러리로 비교"}
                </button>
              ) : (
                <small className="help">
                  선택 대상과 별도로 사용하는 참고 레시피
                </small>
              )}
            </article>
          ))}
        </div>
        <div className="help">
          {window.PALETTE_EMBEDDED_NOTICES ? (
            <details id="library-third-party-notices">
              <summary>라이브러리 전체 라이선스 · 고지 보기</summary>
              <pre className="library-license-text">
                {window.PALETTE_EMBEDDED_NOTICES}
              </pre>
            </details>
          ) : (
            <a
              href="assets/library-preview-LICENSES.txt"
              data-library-license-link
            >
              라이브러리 전체 라이선스 · 고지 보기
            </a>
          )}
        </div>
      </div>
    </details>
  );
}
export function LibraryPreview() {
  const { config } = useStudio(),
    selected = libraries.get(config.uiLibrary),
    external = selected.runtime === "react",
    [loaded, setLoaded] = useState<{
      id: UILibraryId;
      Adapter: React.ComponentType;
    } | null>(null),
    [visible, setVisible] = useState(true),
    [failure, setFailure] = useState<UILibraryId | null>(null),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setFailure(null);
    if (external)
      loadLibrary(config.uiLibrary).then((Adapter) => {
        if (alive) setLoaded({ id: config.uiLibrary, Adapter });
      }).catch(() => {
        if (alive) setFailure(config.uiLibrary);
      });
    return () => {
      alive = false;
    };
  }, [config.uiLibrary, external, attempt]);
  // A lazy adapter can change the scroll height after selection. Reveal only
  // after its real controls mount; never move inspector focus/document scroll.
  useLayoutEffect(() => {
    const stage = document.getElementById("library-stage")!,
      panel = document.getElementById("preview-panel")!;
    let requested: string | null = null;
    const reveal = () => {
      if (stage.dataset.librarySelection !== requested) {
        requested = null;
        observer.disconnect();
        return;
      }
      if (!stage.querySelector("[data-library-trigger=dialog]")) return;
      const target = stage.closest(".library-preview")!;
      panel.scrollTop += target.getBoundingClientRect().top - panel.getBoundingClientRect().top - 24;
      requested = null;
      observer.disconnect();
    };
    const observer = new MutationObserver(reveal);
    const request = (event: Event) => {
      requested = (event as CustomEvent<string>).detail;
      observer.disconnect();
      observer.observe(stage, {childList:true,subtree:true,attributes:true,attributeFilter:["data-library-selection"]});
      if (stage.dataset.librarySelection === requested) reveal();
    };
    window.addEventListener("palette-library-reveal", request);
    return () => {
      observer.disconnect();
      window.removeEventListener("palette-library-reveal", request);
    };
  }, []);
  useEffect(() => {
    const hide = () => setVisible(false),
      show = () => setVisible(true);
    window.addEventListener("pagehide", hide);
    window.addEventListener("pageshow", show);
    window.PaletteLibraryWorkspace = { render: show, unmount: hide };
    return () => {
      window.removeEventListener("pagehide", hide);
      window.removeEventListener("pageshow", show);
    };
  }, []);
  const p = kit.palettes.find((p) => p.id === config.palette)!,
    concept = designs.concepts.get(config.designSelection.concept),
    density = kit.styles.find((s) => s.id === config.style)!;
  return (
    <section
      className="library-preview"
      aria-labelledby="library-preview-title"
    >
      <h3 id="library-preview-title">
        {external
          ? selected.name + " · 실제 라이브러리 동작"
          : "기존 UI에 적용하기"}
      </h3>
      <p id="library-runtime-note" className="help">
        {external
          ? `${selected.name} 실제 컴포넌트 · React 런타임${config.framework === "astro" ? " / Astro React island 필요" : config.framework === "vanilla" ? " / Vanilla 대상은 React root 추가 필요" : ""}${["radix", "react-aria"].includes(config.uiLibrary) ? " · 알림: Sonner 2.0.8" : ""} · 기존 앱은 현재 라이브러리 우선`
          : "프로젝트·컴포넌트 예시는 프레임워크 중립 UI입니다. 현재 앱의 컴포넌트를 우선 재사용하세요."}
      </p>
      <div id="library-stage" data-library-selection={config.uiLibrary}>
        {!external ? (
          <p className="help">
            선택한 토큰과 디자인 기준을 현재 앱에 적용합니다. 실제 라이브러리를
            고르면 Button · Tooltip · Dialog · Popover · Toast를 여기에서 직접
            비교할 수 있습니다.
          </p>
        ) : visible && loaded?.id === config.uiLibrary ? (
          (["light", "dark"] as const).map((theme) => (
            <section
              key={theme + JSON.stringify(config)}
              className="library-preview-pane"
              data-library={config.uiLibrary}
              data-theme={theme}
              data-palette={config.palette}
            >
              <div className="library-pane-label">
                <strong>{theme.toUpperCase()}</strong>
                <span>
                  {selected.npmPackage} · {selected.version}
                </span>
              </div>
              <div data-library-mount>
                <ScopedPreview
                  options={{
                    library: config.uiLibrary,
                    theme,
                    palette: config.palette,
                    concept: concept.id,
                    style: config.style,
                    tokens: p.modes[theme],
                    shape: concept.tokens,
                    density,
                    fonts: {
                      ...config.fonts,
                      bodyFamily: "var(--kit-font-sans,system-ui)",
                      codeFamily: "var(--kit-font-mono,monospace)",
                    },
                  }}
                  Adapter={loaded.Adapter}
                />
              </div>
            </section>
          ))
        ) : failure === config.uiLibrary ? (
          <div role="alert">
            <p className="help">{selected.name} 미리보기를 불러오지 못했습니다.</p>
            <button type="button" data-retry-library onClick={() => {setFailure(null);setAttempt(value => value + 1);}}>다시 시도</button>
          </div>
        ) : (
          <p className="help" role="status">
            불러오는 중…
          </p>
        )}
      </div>
    </section>
  );
}
