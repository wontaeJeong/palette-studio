/* Local preview with optional pinned CDN fonts and bundled fallback; no telemetry. */
(() => {
  "use strict";
  const kit = window.PALETTE_KIT,
    fonts = window.PaletteFonts;
  const $ = (id) => document.getElementById(id),
    esc = (s) =>
      String(s).replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      );
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem("palette-studio-v1") || "{}");
  } catch {}
  const params = new URLSearchParams(location.hash.slice(1));
  const valid = (v, all, fallback) => (all.includes(v) ? v : fallback);
  const ids = kit.palettes.map((p) => p.id),
    styleIds = kit.styles.map((s) => s.id);
  const requestedTarget = params.get("target") || stored.target;
  const steps = ["palette", "style", "fonts", "export"];
  const state = {
    step: valid(params.get("step") || stored.step, steps, "palette"),
    palette: valid(
      params.get("palette") || stored.palette,
      ids,
      kit.defaultPalette,
    ),
    style: valid(params.get("style") || stored.style, styleIds, "operational"),
    mode: valid(
      params.get("mode") || stored.mode,
      ["light", "dark", "split", "compare"],
      "light",
    ),
    compare: valid(params.get("compare") || stored.compare, ids, "graphite-plum"),
    compareMode: valid(
      params.get("compareMode") || stored.compareMode,
      ["light", "dark"],
      "light",
    ),
    target:
      requestedTarget === "existing-gate"
        ? "existing-app"
        : valid(requestedTarget, ["existing-app", "new-app"], "new-app"),
    scope: valid(
      params.get("scope") || stored.scope,
      ["dark-only", "both", "light-only"],
      requestedTarget === "existing-gate" ? "dark-only" : "both",
    ),
    bodyFont: valid(
      params.get("bodyFont") || stored.bodyFont,
      fonts.choices("body").map((f) => f.id),
      "pretendard",
    ),
    codeFont: valid(
      params.get("codeFont") || stored.codeFont,
      fonts.choices("code").map((f) => f.id),
      "d2coding",
    ),
    fontSource: valid(
      params.get("fontSource") || stored.fontSource,
      ["cdn-first", "local-only", "system"],
      "cdn-first",
    ),
    family: "all",
  };
  const current = () => kit.palettes.find((p) => p.id === state.palette);
  $("font-licenses").innerHTML = window.PALETTE_FONT_CATALOG.fonts
    .map(
      (f) =>
        `<details><summary>${esc(f.name)} ${esc(f.version)} · ${esc(f.license)}</summary><p><a href="${esc(f.upstream)}" target="_blank" rel="noopener noreferrer">${esc(f.upstream)}</a></p><pre style="white-space:pre-wrap;font:11px/1.6 monospace">${esc(f.licenseText || "assets/fonts/" + f.id + "/OFL.txt")}</pre></details>`,
    )
    .join("");
  const currentMode = () =>
    state.mode === "dark"
      ? "dark"
      : state.mode === "compare"
        ? state.compareMode
        : "light";
  const style = () => kit.styles.find((s) => s.id === state.style);
  let toastTimer;
  function toast(s) {
    $("toast").textContent = s;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => ($("toast").textContent = ""), 3000);
  }
  async function copy(s) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(s);
      } else throw 0;
    } catch {
      const el = document.createElement("textarea");
      el.value = s;
      el.style.position = "fixed";
      el.style.top = "-10000px";
      document.body.append(el);
      el.select();
      const ok = document.execCommand("copy");
      el.remove();
      if (!ok) {
        toast("복사가 제한된 환경입니다. 저장 버튼을 사용하세요.");
        return;
      }
    }
    toast("복사했습니다.");
  }
  function download(name, text, type = "text/plain") {
    const a = document.createElement("a"),
      url = URL.createObjectURL(new Blob([text], { type }));
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(name + " 저장을 요청했습니다.");
  }
  function persist() {
    try {
      localStorage.setItem("palette-studio-v1", JSON.stringify(state));
    } catch {}
    const p = new URLSearchParams();
    for (const k of [
      "step",
      "palette",
      "style",
      "mode",
      "compare",
      "compareMode",
      "target",
      "scope",
      "bodyFont",
      "codeFont",
      "fontSource",
    ])
      p.set(k, state[k]);
    try {
      history.replaceState(null, "", "#" + p);
    } catch {}
  }
  function selectionURL() {
    const url = new URL(location.href),
      p = new URLSearchParams();
    for (const k of [
      "step",
      "palette",
      "style",
      "mode",
      "compare",
      "compareMode",
      "target",
      "scope",
      "bodyFont",
      "codeFont",
      "fontSource",
    ])
      p.set(k, state[k]);
    url.hash = p.toString();
    return url.href;
  }
  function block(selector, t, mode) {
    return (
      selector +
      " {\n  color-scheme: " +
      mode +
      ";\n" +
      Object.entries(t)
        .map(([k, v]) => "  " + k + ": " + v + ";")
        .join("\n") +
      "\n}\n"
    );
  }
  function selectedCSS() {
    const p = current();
    let css =
      fonts.css(state) +
      "\n/* " +
      p.name +
      " | " +
      style().name +
      " | scope: " +
      state.scope +
      " */\n";
    if (state.scope !== "dark-only")
      css += block(':root:not([data-theme="dark"])', p.modes.light, "light");
    if (state.scope !== "light-only")
      css += block(':root[data-theme="dark"]', p.modes.dark, "dark");
    const s = style();
    css +=
      '\n/* Set data-style="' +
      s.id +
      '" on the same .cp-scope element. */\n[data-style="' +
      s.id +
      '"] {\n' +
      [
        "radius",
        "card",
        "padding",
        "height",
        "gap",
        "font",
        "line",
        "border",
        "shadow",
      ]
        .map((k) => "  --ui-" + k + ": " + s[k] + ";")
        .join("\n") +
      "\n}\n";
    return css;
  }
  function profile() {
    return {
      $schema: "./palette-studio/data/profile.schema.json",
      kitVersion: kit.version,
      palette: state.palette,
      style: state.style,
      target: state.target,
      scope: state.scope,
      previewMode: currentMode(),
      themeAttribute: "data-theme",
      paletteAttribute: "data-palette",
      styleAttribute: "data-style",
      fonts: fonts.snapshot(state),
      fontScope: "global",
      fontPolicy:
        "Use selected delivery policy; CDN -> bundled fonts -> system in cdn-first mode. Merge into existing font loader.",
      tokenPolicy: "literal-hex-no-color-aliases",
      statusPolicy:
        "Preserve success/warning/rejected/failed and severity meanings; always pair color with labels or icons.",
      integration: {
        tokens: "css/palettes/" + state.palette + ".css",
        components: "css/foundation.css",
        style: "css/styles/" + state.style + ".css",
        utilities: "css/utilities.css",
        tailwind: "css/tailwind-v4.css",
        fonts: "font-loader.js",
        fontAssets: "assets/fonts/",
        note: "Paths are relative to the kit. Font settings apply across color modes; merge the selected color scope into the canonical theme.",
      },
      constraints: [
        "One canonical definition per token/theme.",
        "Preserve existing light palette when color scope is dark-only.",
        "No new raw HEX values in application components.",
        "No color-only state indicators.",
        "Code containers require fill and visible border.",
        "Do not bundle all 32 palettes into the production app.",
        "Keep font URLs version-pinned and ship their OFL licenses.",
      ],
      reviewScreens: [
        "table-with-long-korean-labels",
        "details-with-json-and-diff",
        "error-empty-loading-permission-states",
      ],
    };
  }
  function prompt() {
    return `선택한 디자인 프로필을 앱에 적용해 주세요. Superpowers는 이미 활성화된 상태를 전제로 합니다.\n\n- 팔레트: ${current().name} (${state.palette})\n- 스타일: ${style().name} — ${style().description}\n- 대상: ${state.target}; 컬러 변경 범위: ${state.scope}\n- 본문 폰트: ${fonts.resolve(state.bodyFont, "body").name}; 코드 폰트: ${fonts.resolve(state.codeFont, "code").name}; 공급: ${state.fontSource}\n- 폰트는 두 컬러 모드에 공통 적용합니다. 기존 로더에 병합하고, CDN 우선 선택이면 실패 시 동봉 WOFF2 → 시스템 순서로 폴백하세요. 버전·라이선스·파일 경로는 프로필을 따르세요.\n- 첨부한 design-profile.json과 selected-theme.css를 기준으로 사용하세요.\n- 기존 컴포넌트와 테마 선택자를 재사용하고 한 토큰/한 모드에 하나의 정의만 남기세요. 별도의 디자인 시스템을 중복 도입하지 마세요.\n- ${state.scope === "dark-only" ? "기존 라이트 컬러는 유지하세요. 새 팔레트 CSS의 라이트 선언을 함께 들여오지 마세요." : "프로필에 지정한 모드에만 적용하세요."}\n- 색상은 의미 토큰으로 사용하고, 색 토큰 선언은 직접 #RRGGBB로 두세요. 과도한 그림자·네온·장식용 그라데이션은 넣지 마세요.\n- 내비게이션은 포인트 면+좌측 표시, 탭은 밑줄, 상태는 문구+아이콘으로 구별하세요. 코드 블록에는 배경과 경계선을 모두 두세요.\n- 앱의 기존 대비 검증에 바뀐 전경/배경 쌍을 반영하세요. 키트의 scripts/audit.mjs는 선언된 쌍을 확인하는 보조 자료입니다.\n- 표/폼/JSON 상세와 실패·빈 상태를 같은 데이터로 확인하고 실제 화면에서 대비와 밀도가 맞도록 마무리하세요. 색상만으로 해결되지 않는 레이아웃 변경은 선택한 스타일 범위에 맞춰 근거를 남기세요.\n\n관련 규칙: agents/DESIGN-CONTRACT.md, docs/INTEGRATION.md.\n`;
  }
  function badge(name, label, sev = false) {
    const stem = (sev ? "sev-" : "status-") + name;
    return `<span class="ui-badge" style="background:var(--color-${stem});color:var(--color-${stem}-text);border-color:var(--color-${stem}-line)">${esc(label)}</span>`;
  }
  const mark = `<svg class="demo-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="3" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="3" y="14" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/><rect x="14" y="14" width="7" height="7" rx="2" stroke="currentColor" stroke-width="1.8"/></svg>`;
  function demo(p, mode, idx) {
    return `<div class="studio-pane"><div class="pane-caption"><b>${esc(p.name)}</b><span>${mode.toUpperCase()} / ${esc(style().name)}</span></div><div class="cp-scope demo-app" data-palette="${p.id}" data-theme="${mode}" data-style="${state.style}" data-demo="${idx}">
    <aside class="demo-side"><div class="demo-brand">${mark}<span>Orbit Workspace</span></div><p class="demo-side-heading">WORKSPACE</p><nav class="ui-nav" aria-label="샘플 워크스페이스"><button type="button" aria-current="page">◈ &nbsp; 대시보드</button><button type="button">☰ &nbsp; 프로젝트</button><button type="button">⌘ &nbsp; 멤버</button></nav><p class="demo-side-heading">OPERATIONS</p><nav class="ui-nav" aria-label="샘플 운영"><button type="button">◎ &nbsp; 공지사항</button><button type="button">▤ &nbsp; 요청 · VOC</button><button type="button">⚙ &nbsp; 설정</button></nav><p class="demo-side-heading" style="margin-top:100px!important">SAMPLE WORKSPACE<br><span style="display:block;margin-top:7px;letter-spacing:0">데모 데이터 · UI 비교용</span></p></aside>
    <main class="demo-main"><div class="demo-top"><div><p class="demo-breadcrumb">워크스페이스 &nbsp; / &nbsp; 개요</p><h2 class="demo-title">프로젝트를 한눈에.</h2><p class="demo-caption">진행 상황과 팀의 활동을 확인하세요.</p></div><button class="ui-btn ui-btn-primary open-demo-dialog" type="button">＋ 프로젝트 추가</button></div>
    <div class="demo-stats"><article class="ui-card"><p class="demo-stat-label">전체 프로젝트</p><p class="demo-stat-value">1,284</p><p class="demo-stat-foot">최근 30일</p></article><article class="ui-card"><p class="demo-stat-label">완료 비율</p><p class="demo-stat-value" style="color:var(--color-card-passed)">96.8<span style="font-size:14px">%</span></p><p class="demo-stat-foot">✓ 정상 범위</p></article><article class="ui-card"><p class="demo-stat-label">검토 대기</p><p class="demo-stat-value" style="color:var(--color-card-review)">12</p><p class="demo-stat-foot">! 수동 확인 필요</p></article></div>
    <div class="demo-grid"><article class="ui-card demo-table-card"><div class="demo-table-heading"><h2>최근 프로젝트</h2><p class="demo-table-caption">이름과 상태를 함께 확인하세요.</p><div class="ui-tabs" aria-label="샘플 목록 필터"><button class="ui-tab" type="button" aria-pressed="true" data-filter="all">전체 <span class="ui-muted">5</span></button><button class="ui-tab" type="button" aria-pressed="false" data-filter="review">검토 필요</button><button class="ui-tab" type="button" aria-pressed="false" data-filter="passed">완료</button></div></div><div class="demo-search"><label class="ui-field"><span class="ui-muted" style="font-size:10px">프로젝트 검색</span><input class="ui-input row-search" type="search" placeholder="이름으로 검색…" aria-label="샘플 프로젝트 검색"></label></div><div class="ui-table-wrap"><table class="ui-table"><thead><tr><th scope="col">프로젝트 / 팀</th><th scope="col">상태</th><th scope="col">업데이트</th></tr></thead><tbody>
    <tr data-status="passed"><td><strong>웹사이트 리뉴얼</strong><br><small class="ui-muted">Product Team</small></td><td>${badge("passed", "✓ 완료")}</td><td>방금</td></tr>
    <tr data-status="review"><td><strong>모바일 앱</strong><br><small class="ui-muted">Mobile Team</small></td><td>${badge("review", "! 검토")}</td><td>10분 전</td></tr>
    <tr data-status="rejected"><td><strong>디자인 시스템</strong><br><small class="ui-muted">Product Team</small></td><td>${badge("rejected", "⊘ 보류")}</td><td>1시간 전</td></tr>
    <tr data-status="running"><td><strong>사용자 가이드</strong><br><small class="ui-muted">Content Team</small></td><td>${badge("running", "↻ 진행")}</td><td>진행 중</td></tr>
    <tr data-status="failed"><td><strong>데이터 대시보드</strong><br><small class="ui-muted">Data Team</small></td><td>${badge("failed", "× 오류")}</td><td>재시도 필요</td></tr>
    </tbody></table></div><p class="demo-table-footer">5개 항목 · 샘플 데이터</p></article>
    <article class="ui-card demo-form-card"><p class="demo-section-label">NEW PROJECT</p><h2 style="margin-bottom:16px">새 프로젝트</h2><form class="demo-form"><div class="ui-field"><label for="repo-${idx}">프로젝트 이름</label><input id="repo-${idx}" class="ui-input" value="새로운 프로젝트" required></div><div class="ui-field"><label for="branch-${idx}">담당 팀</label><input id="branch-${idx}" class="ui-input" value="Product Team"></div><div class="ui-field"><label for="engine-${idx}">카테고리</label><select id="engine-${idx}" class="ui-input"><option>제품 개발</option><option>문서 · 콘텐츠</option></select></div><label class="ui-row" style="font-size:11px"><input type="checkbox" class="ui-switch" checked>결과 알림 받기</label><div class="ui-alert" style="color:var(--color-info);background:var(--color-info-subtle);border-color:var(--color-info-line)"><b>i</b><span>프로젝트를 만들면 팀과 함께 진행 상황을 관리할 수 있습니다.</span></div><button class="ui-btn ui-btn-primary" type="submit">프로젝트 만들기</button></form></article></div>
    <div class="demo-bottom"><article class="ui-card"><p class="demo-section-label">PROJECT DATA</p><pre class="ui-code" aria-label="프로젝트 JSON">{<br>  <span style="color:var(--color-syntax-key)">"project"</span>: <span style="color:var(--color-syntax-string)">"website"</span>,<br>  <span style="color:var(--color-syntax-key)">"progress"</span>: <span style="color:var(--color-syntax-number)">0</span>,<br>  <span style="color:var(--color-syntax-key)">"active"</span>: <span style="color:var(--color-syntax-boolean)">true</span><br>}</pre></article><article class="ui-card demo-chart-card"><p class="demo-section-label">ACTIVITY / 7 DAYS</p><div class="demo-chart" role="img" aria-label="샘플 7일 활동 수: 32, 48, 40, 61, 74, 51, 82"><span style="height:32%;background:var(--color-chart-1)"></span><span style="height:48%;background:var(--color-chart-2)"></span><span style="height:40%;background:var(--color-chart-1)"></span><span style="height:61%;background:var(--color-chart-2)"></span><span style="height:74%;background:var(--color-chart-1)"></span><span style="height:51%;background:var(--color-chart-2)"></span><span style="height:82%;background:var(--color-chart-1)"></span></div><div class="demo-chart-labels"><span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span></div></article></div>
    </main><dialog class="ui-dialog"><form method="dialog" class="ui-stack"><h2>프로젝트 만들기 미리보기</h2><p class="ui-muted">이 화면은 색상·스타일 비교용 샘플입니다. 실제 API 요청은 전송하지 않습니다.</p><div class="ui-alert" style="color:var(--color-success);background:var(--color-success-subtle);border-color:var(--color-success-line)">✓ 요청 UI 상태를 확인했습니다.</div><button class="ui-btn ui-btn-primary" value="close">확인</button></form></dialog></div></div>`;
  }
  function renderStage() {
    let panes = [];
    if (state.mode === "split")
      panes = [
        [current(), "light"],
        [current(), "dark"],
      ];
    else if (state.mode === "compare")
      panes = [
        [current(), state.compareMode],
        [kit.palettes.find((p) => p.id === state.compare), state.compareMode],
      ];
    else panes = [[current(), state.mode]];
    $("stage").classList.toggle("is-split", panes.length > 1);
    $("stage").innerHTML = panes.map(([p, m], i) => demo(p, m, i)).join("");
    document.querySelectorAll("[data-demo]").forEach((app) => {
      const dialog = app.querySelector("dialog");
      app
        .querySelector(".open-demo-dialog")
        .addEventListener("click", () => dialog.showModal());
      app.querySelector("form.demo-form")?.addEventListener("submit", (e) => {
        e.preventDefault();
        dialog.showModal();
      });
      const filterRows = () => {
        const f = app.querySelector('.ui-tab[aria-pressed="true"]').dataset
            .filter,
          q = app.querySelector(".row-search").value.toLowerCase();
        let n = 0;
        app.querySelectorAll("tr[data-status]").forEach((tr) => {
          const visible =
            (f === "all" || tr.dataset.status === f) &&
            tr.textContent.toLowerCase().includes(q);
          tr.hidden = !visible;
          if (visible) n++;
        });
        app.querySelector(".demo-table-footer").textContent =
          n + "개 항목 · 샘플 데이터";
      };
      app.querySelector(".row-search").addEventListener("input", filterRows);
      app.querySelectorAll(".ui-tab").forEach((b) =>
        b.addEventListener("click", () => {
          app
            .querySelectorAll(".ui-tab")
            .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
          filterRows();
        }),
      );
      app
        .querySelectorAll(".ui-nav button")
        .forEach((b) =>
          b.addEventListener("click", () =>
            toast(
              "레이아웃 비교용 메뉴입니다. 선택 팔레트는 그대로 유지됩니다.",
            ),
          ),
        );
    });
  }
  function renderGallery() {
    const q = $("search").value.toLowerCase(),
      mode = currentMode(),
      list = kit.palettes.filter(
        (p) =>
          (state.family === "all" || p.family === state.family) &&
          (p.name + " " + p.id + " " + p.use).toLowerCase().includes(q),
      );
    $("palette-gallery").innerHTML = list.length
      ? list
          .map((p) => {
            const t = p.modes[mode];
            return `<button class="palette-card" aria-pressed="${p.id === state.palette}" data-id="${p.id}" aria-label="${esc(p.name)} 팔레트 선택"><div class="card-visual cp-scope" data-palette="${p.id}" data-theme="${mode}"><div class="card-mini-side"><i></i><i></i><i></i><i></i></div><div class="card-mini-main"><div class="card-mini-title"><i></i><b></b></div><div class="card-mini-stats"><i></i><i></i><i></i></div><div class="card-mini-table"><i></i><i></i><i></i></div></div></div><div class="card-meta"><strong>${esc(p.name)}${p.id === state.palette ? '<span class="selection-check">✓ 선택됨</span>' : ""}</strong><small>${esc(p.use)}</small><div class="card-swatches" aria-hidden="true">${["canvas", "shell", "surface", "ink", "accent", "accent-subtle"].map((k) => `<i style="background:${t["--color-" + k]}"></i>`).join("")}</div></div></button>`;
          })
          .join("")
      : '<p class="studio-empty">검색 결과가 없습니다. 다른 이름이나 색상 계열로 찾아보세요.</p>';
    $("gallery-note").textContent =
      list.length + " / 32개 조합 · " + mode + " 미리보기";
    $("palette-gallery")
      .querySelectorAll("button")
      .forEach((b) =>
        b.addEventListener("click", () => {
          state.palette = b.dataset.id;
          $("palette").value = state.palette;
          render();
          $("palette-gallery")
            .querySelector('[data-id="' + state.palette + '"]')
            ?.focus({ preventScroll: true });
          toast(current().name + " 선택");
        }),
      );
  }
  function renderSpecimens() {
    const mode = currentMode();
    $("specimens").innerHTML =
      `<div class="studio-samples cp-scope" data-palette="${state.palette}" data-theme="${mode}" data-style="${state.style}"><div class="specimen-grid"><article class="ui-card"><h3>Actions / Interactive states</h3><div class="ui-stack"><div class="ui-row"><button class="ui-btn ui-btn-primary">기본</button><button class="ui-btn ui-btn-primary is-hover">Hover</button><button class="ui-btn ui-btn-primary is-active">Pressed</button></div><div class="ui-row"><button class="ui-btn is-focus">Focus</button><button class="ui-btn" disabled>비활성</button><button class="ui-btn ui-btn-danger">삭제</button></div><div class="ui-row"><button class="ui-btn ui-btn-ghost">Ghost</button><a href="#tokens">문서 링크 ↗</a></div><div class="ui-row"><label><input type="checkbox" checked> 확인</label><label><input type="radio" name="sample-radio" checked> 기본</label><label><input type="radio" name="sample-radio"> 대안</label></div><div><span class="ui-tooltip" role="note">툴팁 색상 견본</span></div></div></article><article class="ui-card"><h3>Forms / Validation</h3><div class="ui-stack"><div class="ui-field"><label for="sample-input">기본 입력</label><input id="sample-input" class="ui-input" placeholder="내용을 입력하세요"></div><div class="ui-field"><label for="sample-invalid">오류 입력</label><input id="sample-invalid" class="ui-input" value="not-a-url" aria-invalid="true" aria-describedby="sample-error"><p class="ui-error" id="sample-error">! HTTPS 주소를 입력해 주세요.</p></div><div class="ui-field"><label for="sample-readonly">읽기 전용</label><input id="sample-readonly" class="ui-input" value="workspace / default" readonly></div><div class="ui-field"><label for="sample-disabled">비활성 입력</label><input id="sample-disabled" class="ui-input" value="권한 없음" disabled></div></div></article><article class="ui-card"><h3>Status / Severity</h3><div class="ui-stack"><div class="ui-row">${[
        ["passed", "✓ 완료"],
        ["review", "! 검토"],
        ["rejected", "⊘ 보류"],
        ["failed", "× 실패"],
        ["running", "↻ 진행"],
        ["queued", "◷ 대기"],
        ["cancelled", "− 취소"],
        ["skipped", "→ 생략"],
        ["unknown", "? 미확인"],
      ]
        .map((x) => badge(...x))
        .join("")}</div><div class="ui-row">${[
        ["critical", "!! Critical"],
        ["high", "! High"],
        ["medium", "! Medium"],
        ["low", "i Low"],
        ["info", "i Info"],
        ["unknown", "? Unknown"],
      ]
        .map((x) => badge(...x, true))
        .join(
          "",
        )}</div><div class="ui-alert" style="color:var(--color-warning);background:var(--color-warning-subtle);border-color:var(--color-warning-line)"><b>!</b><span>상태색은 포인트 색상과 별개로 의미를 유지합니다.</span></div><div class="ui-progress" role="progressbar" aria-valuenow="68" aria-valuemin="0" aria-valuemax="100" aria-label="샘플 작업 진행률"><span style="width:68%"></span></div><p class="ui-muted" style="font-size:11px">작업 진행률 68%</p></div></article><article class="ui-card"><h3>Syntax / JSON & Diff</h3><pre class="ui-code">{<br>  <span style="color:var(--color-syntax-key)">"name"</span>: <span style="color:var(--color-syntax-string)">"security-policy"</span>,<br>  <span style="color:var(--color-syntax-key)">"enabled"</span>: <span style="color:var(--color-syntax-boolean)">true</span>,<br>  <span style="color:var(--color-syntax-key)">"risk"</span>: <span style="color:var(--color-syntax-number)">3</span>,<br>  <span style="color:var(--color-syntax-key)">"note"</span>: <span style="color:var(--color-syntax-null)">null</span><br>}</pre><p style="margin-top:12px;font-size:11px"><code style="background:var(--color-diff-remove-bg);color:var(--color-diff-remove-fg)">− threshold: 5</code><br><code style="background:var(--color-diff-add-bg);color:var(--color-diff-add-fg)">+ threshold: 3</code></p></article><article class="ui-card"><h3>Data / 8 categorical colors</h3><div class="ui-stack">${Array.from({ length: 8 }, (_, i) => `<div class="ui-row" style="font-size:11px"><span style="width:${35 + ((i * 9) % 55)}%;height:9px;background:var(--color-chart-${i + 1});border-radius:2px"></span><span>Series ${i + 1}</span></div>`).join("")}<p class="ui-muted" style="font-size:10px">범례·직접 라벨·선 패턴을 함께 사용하세요. 색각 이상 적합성은 별도 확인이 필요합니다.</p></div></article><article class="ui-card"><h3>Empty / Loading</h3><div class="ui-stack"><div class="ui-empty"><p style="font-size:18px">◇</p><strong style="display:block;margin:6px 0">아직 프로젝트가 없습니다</strong><p style="font-size:11px">첫 프로젝트를 추가해 보세요.</p></div><div class="ui-skeleton" style="width:80%"></div><div class="ui-skeleton" style="width:60%"></div><p class="ui-muted" style="font-size:11px">데이터를 불러오는 중…</p></div></article></div></div>`;
  }
  function renderTokens() {
    const p = current(),
      q = $("token-search").value.toLowerCase();
    $("token-rows").innerHTML = kit.tokens
      .filter((x) => x.token.includes(q))
      .map(
        (t) =>
          `<tr><td><code>${t.token}</code></td>${["light", "dark"].map((m) => `<td><button class="studio-btn" style="min-height:30px;border:0;padding:0;background:transparent;font-weight:400" data-copy="${p.modes[m][t.token]}" aria-label="${t.token} ${m} ${p.modes[m][t.token]} 복사"><span class="studio-swatch" style="background:${p.modes[m][t.token]}"></span><code>${p.modes[m][t.token]}</code></button></td>`).join("")}<td><code>${t.classes.text}</code></td></tr>`,
      )
      .join("");
    $("token-rows")
      .querySelectorAll("[data-copy]")
      .forEach((b) => b.addEventListener("click", () => copy(b.dataset.copy)));
  }
  let fontKey = "",
    fontPromise = Promise.resolve();
  function updateFontStatus() {
    const status = fonts.getStatus(),
      labels = {
        pending: "로딩 중…",
        cdn: "CDN",
        local: "동봉 폰트",
        embedded: "단일 HTML 내장 폰트",
        system: "시스템 폰트",
      };
    $("font-status").textContent = ["body", "code"]
      .map((role) => {
        const item = status[role];
        return (
          (role === "body" ? "본문" : "코드") +
          " · " +
          (item.name || "준비 중") +
          " — " +
          labels[item.source] +
          (item.reason === "load-failed"
            ? " (폰트 로딩 실패, 시스템 폴백)"
            : "")
        );
      })
      .join("  /  ");
  }
  function requestFonts() {
    const key = [state.bodyFont, state.codeFont, state.fontSource].join("|");
    if (key !== fontKey) {
      fontKey = key;
      fontPromise = fonts.apply(state);
    }
    updateFontStatus();
  }
  function renderFontSamples() {
    $("font-samples").innerHTML =
      `<div class="studio-font-samples cp-scope" data-palette="${state.palette}" data-theme="${currentMode()}"><div><small>${esc(fonts.resolve(state.bodyFont, "body").name)}</small><p>빠르고 명확한 사용자 경험.<br>Aa Bb 0123456789 · 한글 가독성<br><strong>제목과 본문의 무게를 비교하세요.</strong></p></div><div><small>${esc(fonts.resolve(state.codeFont, "code").name)}</small><pre class="ui-code">const trusted = true;<br>// 한글 주석 · 0O 1lI ①②<br>{ "project": "website" }</pre></div></div>`;
  }
  window.addEventListener("palette-font-status", updateFontStatus);
  let fontFilter = "all",
    fontGalleryKey = "",
    fontObserver = null;
  const fontQueue = [];
  let fontWorkers = 0;
  function pumpFontPreviews() {
    while (fontWorkers < 3 && fontQueue.length) {
      const job = fontQueue.shift();
      if (!job.card.isConnected) continue;
      fontWorkers++;
      fonts
        .preview(job.font, job.source, job.sample.textContent)
        .then((result) => {
          if (!job.card.isConnected) return;
          job.sample.style.fontFamily = result.family;
          job.card.querySelector(".font-card-loading").textContent = {
            cdn: "CDN 견본",
            local: "동봉 폰트 견본",
            embedded: "내장 폰트 견본",
            system: "시스템 폰트로 표시 중",
          }[result.source];
          job.card.dataset.previewSource = result.source;
        })
        .finally(() => {
          fontWorkers--;
          pumpFontPreviews();
        });
    }
  }
  function renderFontGallery() {
    const key = [
      fontFilter,
      $("body-font-search").value,
      $("code-font-search").value,
      state.fontSource,
    ].join("|");
    const markSelection = () =>
      document.querySelectorAll(".font-card").forEach((card) => {
        const selected =
          card.dataset.fontId === state.bodyFont ||
          card.dataset.fontId === state.codeFont;
        card.dataset.selected = String(selected);
        const button = card.querySelector("[data-apply-font]"),
          role = card.dataset.fontRole === "body" ? "본문" : "코드";
        button.setAttribute("aria-pressed", String(selected));
        button.textContent = selected
          ? "✓ " + role + " 선택됨"
          : role + "에 적용";
      });
    if (key === fontGalleryKey) {
      markSelection();
      return;
    }
    fontGalleryKey = key;
    fontObserver?.disconnect();
    fontQueue.length = 0;
    for (const role of ["body", "code"]) {
      const q = $(role + "-font-search").value.toLowerCase();
      const list = window.PALETTE_FONT_CATALOG.fonts.filter((f) => {
        const text = [f.name, f.purpose, f.korean ? "한글" : "영문", f.group]
          .join(" ")
          .toLowerCase();
        return (
          f.role === role &&
          (!q || text.includes(q)) &&
          (role === "code" ||
            fontFilter === "all" ||
            (fontFilter === "korean" && f.korean) ||
            (fontFilter === "latin" && !f.korean) ||
            (fontFilter === "serif" && f.group.endsWith("serif")))
        );
      });
      $(role + "-font-count").textContent =
        list.length + " / " + (role === "body" ? 15 : 9) + "종";
      $(role + "-font-gallery").innerHTML = list.length
        ? list
            .map(
              (f) =>
                `<article class="font-card" data-font-id="${f.id}" data-font-role="${role}"><div class="font-card-top"><h4>${esc(f.name)}</h4><span class="font-card-tag">${role === "code" ? "CODE" : f.group.endsWith("serif") ? "SERIF" : "BODY"}</span></div><p class="font-purpose">${esc(f.purpose)}</p><div class="font-card-sample" data-role="${role}">${role === "code" ? esc("const project = true;\n0O 1lI {} [] => 012345\n" + (f.korean ? "// 한글 주석 · ①②" : "// Readable code.")) : f.korean ? "나의 다음 프로젝트.<br>가나다 Aa 0123456789" : "Build your next project.<br>Aa Bb 0123456789"}</div><p class="font-card-loading">견본 로딩 대기</p><div class="font-card-meta"><span>${f.korean ? "한글 포함" : "영문 중심 · 한글 보완 폰트 병용"}</span><span>OFL-1.1 · 사내/상업용</span><a href="${esc(f.upstream)}" target="_blank" rel="noopener noreferrer">공식 출처 ↗</a></div><div class="font-card-bottom"><span>${f.versionKind === "package" ? "패키지" : "폰트"} ${esc(f.version)}</span><button class="studio-btn" data-apply-font="${f.id}"></button></div></article>`,
            )
            .join("")
        : '<p class="studio-empty" role="status">검색 결과가 없습니다. 다른 이름이나 분류로 찾아보세요.</p>';
    }
    $("font-gallery-note").textContent =
      "본문용 15종 / 코드용 9종 · 각 역할은 독립적으로 선택됩니다.";
    markSelection();
    $("font-gallery")
      .querySelectorAll("[data-apply-font]")
      .forEach((b) =>
        b.addEventListener("click", () => {
          const font = window.PALETTE_FONT_CATALOG.fonts.find(
            (f) => f.id === b.dataset.applyFont,
          );
          state[font.role === "body" ? "bodyFont" : "codeFont"] = font.id;
          $(font.role === "body" ? "body-font" : "code-font").value = font.id;
          render();
          toast(font.name + " 적용");
        }),
      );
    const schedule = (card) => {
      const font = window.PALETTE_FONT_CATALOG.fonts.find(
        (f) => f.id === card.dataset.fontId,
      );
      fontQueue.push({
        card,
        font,
        sample: card.querySelector(".font-card-sample"),
        source: state.fontSource,
      });
      pumpFontPreviews();
    };
    if ("IntersectionObserver" in window) {
      fontObserver = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              fontObserver.unobserve(entry.target);
              schedule(entry.target);
            }
          }),
        { rootMargin: "120px" },
      );
      $("font-gallery")
        .querySelectorAll(".font-card")
        .forEach((card) => fontObserver.observe(card));
    } else $("font-gallery").querySelectorAll(".font-card").forEach(schedule);
  }
  function renderStyleCards() {
    $("style-gallery").innerHTML = kit.styles
      .map(
        (s) =>
          `<button class="style-card" data-style-id="${s.id}" aria-pressed="${s.id === state.style}"><span class="style-example" style="--sample-radius:${s.card};--sample-gap:${s.gap}"><i></i><i></i><i></i></span><strong>${esc(s.name)} ${s.id === state.style ? "✓" : ""}</strong><small>${esc(s.description)}</small></button>`,
      )
      .join("");
    $("style-gallery")
      .querySelectorAll("button")
      .forEach((b) =>
        b.addEventListener("click", () => {
          state.style = b.dataset.styleId;
          $("style").value = state.style;
          render();
          $("style-gallery")
            .querySelector('[data-style-id="' + state.style + '"]')
            ?.focus({ preventScroll: true });
        }),
      );
  }
  function renderFlow() {
    document
      .querySelectorAll(".studio-step")
      .forEach((panel) => (panel.hidden = panel.id !== "step-" + state.step));
    document.querySelectorAll("[data-step]").forEach((button) => {
      if (button.dataset.step === state.step)
        button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    const n = steps.indexOf(state.step);
    $("previous-step").disabled = n === 0;
    $("next-step").hidden = n === steps.length - 1;
    $("next-step").textContent = [
      "다음: 스타일 →",
      "다음: 폰트 →",
      "선택 확인 →",
      "",
    ][n];
    $("step-position").textContent = n + 1 + " / 4";
    const items = [
      ["팔레트", current().name],
      ["스타일", style().name],
      ["본문 폰트", fonts.resolve(state.bodyFont, "body").name],
      ["코드 폰트", fonts.resolve(state.codeFont, "code").name],
    ];
    $("export-summary").innerHTML =
      "<dl>" +
      items
        .map(
          ([key, value]) =>
            "<div><dt>" + key + "</dt><dd>" + esc(value) + "</dd></div>",
        )
        .join("") +
      "</dl>";
    $("selected-fonts").textContent =
      "본문 " +
      fonts.resolve(state.bodyFont, "body").name +
      " · 코드 " +
      fonts.resolve(state.codeFont, "code").name;
  }
  function goToStep(step) {
    if (!steps.includes(step)) return;
    state.step = step;
    renderFlow();
    persist();
    $("selection-panel").scrollIntoView({ block: "start", behavior: "auto" });
    $("step-" + step)
      .querySelector("h2")
      .focus({ preventScroll: true });
  }
  function render() {
    const p = current();
    $("selected-dot").style.background =
      p.modes[currentMode()]["--color-accent"];
    $("selected-name").textContent = p.name;
    $("selected-description").textContent = style().name;
    $("compare-control").hidden = state.mode !== "compare";
    $("compare-mode-control").hidden = state.mode !== "compare";
    $("policy-note").textContent =
      (state.target === "existing-app"
        ? "기존 앱의 테마 정의와 컴포넌트를 재사용해 병합하세요. "
        : "새 앱의 기본 테마로 적용하세요. ") +
      (state.scope === "both"
        ? "라이트와 다크 컬러를 함께 내보냅니다."
        : state.scope === "dark-only"
          ? "다크 컬러만 내보내며 기존 라이트 컬러는 보존합니다."
          : "라이트 컬러만 내보내며 기존 다크 컬러는 보존합니다.") +
      " 본문·코드 폰트는 두 테마에 공통 적용됩니다.";
    renderStage();
    renderGallery();
    renderSpecimens();
    renderTokens();
    $("font-combo").value =
      window.PALETTE_FONT_CATALOG.combos.find(
        (c) => c.body === state.bodyFont && c.code === state.codeFont,
      )?.id || "";
    renderFontSamples();
    renderFontGallery();
    renderStyleCards();
    renderFlow();
    requestFonts();
    persist();
  }
  $("font-combo").innerHTML += [...window.PALETTE_FONT_CATALOG.combos]
    .map((c) => `<option value="${c.id}">${esc(c.name)}</option>`)
    .join("");
  $("font-combo").addEventListener("change", () => {
    const combo = window.PALETTE_FONT_CATALOG.combos.find(
      (c) => c.id === $("font-combo").value,
    );
    if (combo) {
      state.bodyFont = combo.body;
      state.codeFont = combo.code;
      $("body-font").value = combo.body;
      $("code-font").value = combo.code;
      render();
    }
  });
  for (const id of ["body-font-search", "code-font-search"])
    $(id).addEventListener("input", renderFontGallery);
  $("font-filters").innerHTML = [
    ["all", "본문 전체"],
    ["korean", "한글"],
    ["latin", "영문"],
    ["serif", "세리프"],
  ]
    .map(
      ([id, label]) =>
        `<button data-font-filter="${id}" aria-pressed="${id === fontFilter}">${label}</button>`,
    )
    .join("");
  $("font-filters")
    .querySelectorAll("button")
    .forEach((b) =>
      b.addEventListener("click", () => {
        fontFilter = b.dataset.fontFilter;
        $("font-filters")
          .querySelectorAll("button")
          .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        renderFontGallery();
      }),
    );
  for (const [id, role] of [
    ["body-font", "body"],
    ["code-font", "code"],
  ])
    $(id).innerHTML = fonts
      .choices(role)
      .map((f) => `<option value="${f.id}">${esc(f.name)}</option>`)
      .join("");
  for (const id of ["palette", "compare"])
    $(id).innerHTML = kit.palettes
      .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`)
      .join("");
  $("style").innerHTML = kit.styles
    .map(
      (s) =>
        `<option value="${s.id}">${esc(s.name)} · ${esc(s.label)}</option>`,
    )
    .join("");
  for (const [id, k] of [
    ["palette", "palette"],
    ["style", "style"],
    ["mode", "mode"],
    ["compare", "compare"],
    ["compare-mode", "compareMode"],
    ["target", "target"],
    ["scope", "scope"],
    ["body-font", "bodyFont"],
    ["code-font", "codeFont"],
    ["font-source", "fontSource"],
  ]) {
    $(id).value = state[k];
    $(id).addEventListener("change", () => {
      state[k] = $(id).value;
      render();
    });
  }
  $("filters").innerHTML = [
    ["all", "전체"],
    ["neutral", "무채색"],
    ["blue", "Blue / Navy"],
    ["purple", "Plum / Purple"],
    ["green", "Teal / Green"],
    ["warm", "Earth / Warm"],
    ["red", "Rose / Red"],
  ]
    .map(
      ([k, l]) =>
        `<button data-family="${k}" aria-pressed="${state.family === k}">${l}</button>`,
    )
    .join("");
  $("filters")
    .querySelectorAll("button")
    .forEach((b) =>
      b.addEventListener("click", () => {
        state.family = b.dataset.family;
        $("filters")
          .querySelectorAll("button")
          .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        renderGallery();
      }),
    );
  $("search").addEventListener("input", renderGallery);
  $("token-search").addEventListener("input", renderTokens);
  $("retry-fonts").addEventListener("click", () => {
    fontPromise = fonts.retry(state);
    fontGalleryKey = "";
    renderFontGallery();
  });
  $("export-font-css").addEventListener("click", () =>
    download("selected-fonts.css", fonts.css(state), "text/css"),
  );
  $("copy-css").addEventListener("click", () => copy(selectedCSS()));
  $("export-css").addEventListener("click", () =>
    download("selected-theme.css", selectedCSS(), "text/css"),
  );
  $("export-profile").addEventListener("click", () =>
    download(
      "design-profile.json",
      JSON.stringify(profile(), null, 2) + "\n",
      "application/json",
    ),
  );
  $("copy-prompt").addEventListener("click", () => copy(prompt()));
  $("save-prompt").addEventListener("click", () =>
    download("OPENCODE-APPLY.md", prompt()),
  );
  $("save-link").addEventListener("click", () => copy(selectionURL()));
  document
    .querySelectorAll("[data-step]")
    .forEach((button) =>
      button.addEventListener("click", () => goToStep(button.dataset.step)),
    );
  $("previous-step").addEventListener("click", () =>
    goToStep(steps[steps.indexOf(state.step) - 1]),
  );
  $("next-step").addEventListener("click", () =>
    goToStep(steps[steps.indexOf(state.step) + 1]),
  );
  $("toggle-preview").addEventListener("click", () => {
    const expanded =
      document.documentElement.classList.toggle("preview-expanded");
    $("toggle-preview").setAttribute("aria-expanded", String(expanded));
    $("toggle-preview").textContent = expanded
      ? "미리보기 줄이기"
      : "크게 보기";
  });
  $("selection-panel").addEventListener("focusin", (event) => {
    if (!window.matchMedia("(max-width: 999px)").matches) return;
    const target = event.target;
    requestAnimationFrame(() => {
      if (!target.isConnected) return;
      const bottom = target.getBoundingClientRect().bottom;
      const visibleBottom = $("preview-panel").getBoundingClientRect().top - 16;
      if (bottom > visibleBottom) window.scrollBy(0, bottom - visibleBottom);
    });
  });
  window.PaletteStudio = {
    goToStep,
    getState: () => ({ ...state }),
    profile,
    selectedCSS,
    prompt,
    selectionURL,
    fontCSS: () => fonts.css(state),
    readyFonts: () => fontPromise,
  };
  render();
})();
