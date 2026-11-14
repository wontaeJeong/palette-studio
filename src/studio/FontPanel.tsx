import React, { useState, useEffect, useRef } from "react";
import { fontCatalog, fontLoader, type Font, type FontStatus } from "./data";
import { useStudio } from "./context";
import type { BodyFontId, CodeFontId } from "../core/types";
function FontCard({ font, select }: { font: Font; select: () => void }) {
  const { config } = useStudio(),
    ref = useRef<HTMLElement>(null),
    [preview, setPreview] = useState<{ source: string; family: string }>();
  const text =
    font.role === "body" ? "프로젝트 이름 Aa" : "const project = true; 0O 1lI";
  useEffect(() => {
    let alive = true;
    fontLoader.preview(font, config.fonts.source, text).then((value) => {
      if (alive) setPreview(value);
    });
    return () => {
      alive = false;
    };
  }, [font, config.fonts.source, text]);
  const chosen = config.fonts[font.role] === font.id;
  return (
    <article
      ref={ref}
      className="font-card"
      data-font-id={font.id}
      data-preview-source={preview?.source}
    >
      <div>
        <strong>{font.name}</strong>
        <small>
          {font.korean ? "한글 포함" : "영문 중심 · 한글 보완"} · OFL
        </small>
      </div>
      <p className="font-sample" style={{ fontFamily: preview?.family }}>
        {text}
      </p>
      <button
        type="button"
        data-font-role={font.role}
        data-apply-font={font.id}
        aria-pressed={chosen}
        onClick={select}
      >
        {chosen ? "선택됨" : "선택"}
      </button>
    </article>
  );
}
export function FontPanel() {
  const { config, update, notice } = useStudio(),
    [queries, setQueries] = useState({ body: "", code: "" }),
    [open, setOpen] = useState(false),
    [status, setStatus] = useState<FontStatus>(fontLoader.getStatus());
  useEffect(() => {
    const handler = (e: Event) =>
      setStatus((e as CustomEvent<FontStatus>).detail);
    window.addEventListener("palette-font-status", handler);
    return () => window.removeEventListener("palette-font-status", handler);
  }, []);
  const select = (role: "body" | "code", id: string) => {
    const switchSource = config.fonts.source === "system" && id !== "system";
    update({
      fonts: {
        [role]: id,
        ...(switchSource ? { source: "local-only" as const } : {}),
      },
    });
    if (switchSource)
      notice("선택한 글꼴을 사용하도록 동봉 폰트로 변경했습니다.");
  };
  return (
    <details id="typography-options" className="inspector-section">
      <summary>
        <span>글꼴</span>
        <small id="font-summary">
          {fontLoader.resolve(config.fonts.body, "body").name} /{" "}
          {fontLoader.resolve(config.fonts.code, "code").name}
        </small>
      </summary>
      <div className="details-content">
        <div className="field-pair">
          {(["body", "code"] as const).map((role) => (
            <label key={role}>
              {role === "body" ? "본문" : "코드"} 폰트
              <select
                id={role + "-font"}
                value={config.fonts[role]}
                onChange={(e) =>
                  select(role, e.target.value as BodyFontId | CodeFontId)
                }
              >
                {fontLoader.choices(role).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
        <p id="font-status" className="help" role="status">
          {(["body", "code"] as const)
            .map(
              (role) =>
                `${role === "body" ? "본문" : "코드"}: ${status[role].name || ""} · ${{ pending: "불러오는 중", cdn: "CDN", local: "동봉", embedded: "내장", system: "시스템" }[status[role].source] || status[role].source}`,
            )
            .join(" / ")}
        </p>
        <details
          className="font-library"
          onToggle={(e) => setOpen(e.currentTarget.open)}
        >
          <summary>글꼴 목록 · 24종</summary>
          <div id="font-gallery">
            {(["body", "code"] as const).map((role) => (
              <section key={role}>
                <h3 id={role === "body" ? "body-gallery-heading" : undefined}>
                  {role === "body" ? "본문" : "코드"} 폰트
                </h3>
                <label>
                  {role === "body" ? "본문" : "코드"} 폰트 검색
                  <input
                    id={role + "-font-search"}
                    type="search"
                    placeholder={
                      role === "body" ? "이름, 한글, 세리프…" : "이름, 한글…"
                    }
                    value={queries[role]}
                    onChange={(e) =>
                      setQueries({ ...queries, [role]: e.target.value })
                    }
                  />
                </label>
                <div id={role + "-font-gallery"} className="font-gallery">
                  {open &&
                    (() => {
                      const list = fontCatalog.fonts.filter(
                        (f) =>
                          f.role === role &&
                          (
                            f.name +
                            " " +
                            f.group +
                            " " +
                            (f.korean ? "한글" : "영문") +
                            " " +
                            (f.group.includes("serif") ? "세리프" : "")
                          )
                            .toLocaleLowerCase()
                            .includes(queries[role].trim().toLocaleLowerCase()),
                      );
                      return list.length ? (
                        list.map((f) => (
                          <FontCard
                            key={f.id}
                            font={f}
                            select={() => select(role, f.id)}
                          />
                        ))
                      ) : (
                        <p className="help">검색 결과가 없습니다.</p>
                      );
                    })()}
                </div>
              </section>
            ))}
          </div>
        </details>
        <details>
          <summary>출처 · 라이선스</summary>
          <div id="font-licenses">
            {fontCatalog.fonts.map((f) => (
              <details key={f.id}>
                <summary>
                  {f.name} · {f.version} · {f.license}
                </summary>
                <a href={f.upstream} target="_blank" rel="noopener noreferrer">
                  공식 출처
                </a>
                <pre className="workspace-code">
                  {f.licenseText || "assets/fonts/" + f.id + "/OFL.txt"}
                </pre>
              </details>
            ))}
          </div>
        </details>
      </div>
    </details>
  );
}
