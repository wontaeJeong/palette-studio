/* Set-first offline design library. Exports use the existing shared handoff core. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    designs = window.PaletteDesignCatalog,
    core = window.PaletteHandoff;
  const palettes = window.PALETTE_KIT,
    fonts = window.PALETTE_FONT_CATALOG,
    icons = (window.PALETTE_ICON_PARTS || []).flat();
  const esc = (value) =>
    String(value).replace(
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
  const params = new URLSearchParams(location.hash.slice(1));
  window.PaletteInitialView = Object.fromEntries(params);
  let config,
    theme = "light",
    active = null,
    statusTimer;
  let recovery = "";
  try {
    theme =
      localStorage.getItem("palette-studio-ui-theme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  } catch {}
  if (!["light", "dark"].includes(theme)) theme = "light";
  const initial = () =>
    core.normalize(
      {
        ...designs.sets[0].config,
        designSelection: designs.selection("studio"),
      },
      palettes,
      fonts,
      icons,
    );
  try {
    let candidate;
    if (params.has("selection") || params.has("catalogConfig"))
      candidate = JSON.parse(
        params.get("selection") || params.get("catalogConfig"),
      );
    else {
      let stored;
      try {
        stored = JSON.parse(
          localStorage.getItem("palette-studio-handoff-v1") || "null",
        );
      } catch {
        recovery =
          "저장된 선택을 읽지 못했습니다. 링크의 선택값을 우선 사용합니다.";
      }
      let legacy = {};
      try {
        legacy = JSON.parse(localStorage.getItem("palette-studio-v1") || "{}");
      } catch {}
      if (!legacy || typeof legacy !== "object" || Array.isArray(legacy))
        legacy = {};
      candidate = stored || {
        ...initial(),
        ...legacy,
        fonts: {
          body: legacy.bodyFont || initial().fonts.body,
          code: legacy.codeFont || initial().fonts.code,
          source: legacy.fontSource || initial().fonts.source,
        },
      };
    }
    if (
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    ) {
      if (params.has("selection") || params.has("catalogConfig"))
        throw Error("Invalid selection");
      candidate = initial();
      recovery =
        "저장된 설정을 복원할 수 없어 기본값에서 시작합니다. 링크의 선택값을 우선 사용합니다.";
    }
    if (!params.has("selection") && !params.has("catalogConfig")) {
      // Recover persisted data before applying the link's explicit choices.
      if (candidate.target === "existing-gate") {
        candidate.target = "existing-app";
        candidate.scope = "dark-only";
      }
      try {
        candidate = core.normalize(candidate, palettes, fonts, icons);
      } catch {
        candidate = initial();
        recovery =
          "저장된 설정이 오래되어 기본값을 복원했습니다. 링크의 선택값을 우선 사용합니다.";
      }
      for (const key of [
        "palette",
        "style",
        "target",
        "scope",
        "layout",
        "framework",
        "uiLibrary",
        "project",
      ])
        if (params.has(key)) candidate[key] = params.get(key);
      if (candidate.target === "existing-gate") {
        candidate.target = "existing-app";
        candidate.scope = "dark-only";
      }
      candidate.fonts = { ...candidate.fonts };
      for (const [key, name] of [
        ["bodyFont", "body"],
        ["codeFont", "code"],
        ["fontSource", "source"],
      ])
        if (params.has(key)) candidate.fonts[name] = params.get(key);
      if (params.has("icons"))
        candidate.icons = params.get("icons").split(",").filter(Boolean);
      if (params.has("concept"))
        candidate.designSelection = {
          ...(candidate.designSelection || designs.selection("studio")),
          concept: params.get("concept"),
        };
      if (params.has("designSelection"))
        candidate.designSelection = JSON.parse(params.get("designSelection"));
    }
    config = core.normalize(
      {
        ...candidate,
        designSelection:
          candidate.designSelection === undefined
            ? designs.selection("studio")
            : candidate.designSelection,
      },
      palettes,
      fonts,
      icons,
    );
  } catch {
    config = initial();
    recovery = "저장된 선택을 읽지 못해 기본 세트를 표시합니다.";
  }
  const button = (text, action = "", primary = false) =>
    '<button type="button" class="sample-button ' +
    (primary
      ? "sample-primary sample-emphasis"
      : action === "cancel"
        ? ""
        : "sample-emphasis") +
    '"' +
    (action ? ' data-demo="' + action + '"' : "") +
    ">" +
    text +
    "</button>";
  function demo(id, variant, preview = false, pane = "light") {
    const uid = (preview ? "preview-" : "detail-") + id + "-" + pane;
    const content = {
      button:
        '<div class="sample-actions">' +
        button("실행", "action", variant !== "outline") +
        button("취소", "cancel") +
        "</div>",
      input:
        '<label>이메일<input class="sample-input sample-emphasis" type="email" placeholder="hello@example.com"></label><small>이메일 주소를 입력하세요.</small>',
      select:
        '<label>프로젝트 상태<select class="sample-input sample-emphasis"><option>진행 중</option><option>검토 중</option><option>완료</option></select></label>',
      switch:
        '<label class="sample-check sample-emphasis"><input class="sample-switch" type="checkbox" role="switch" checked>이메일 알림 받기</label>',
      checkbox:
        '<label class="sample-check sample-emphasis"><input type="checkbox" checked>작업 알림</label><label class="sample-check sample-emphasis"><input type="checkbox">주간 요약</label>',
      toast: preview
        ? '<div class="sample-box sample-feedback">' +
          window.PaletteComponentDemos.icon("circle-check") +
          "<div><strong>변경 내용을 저장했습니다</strong><p>팀과 공유할 준비가 되었습니다.</p></div></div>"
        : '<div class="sample-actions">' +
          [
            ["success", "저장 완료"],
            ["info", "안내"],
            ["warning", "주의"],
            ["error", "오류"],
          ]
            .map(([status, label]) =>
              button(label, "toast", status === "success").replace(
                'data-demo="toast"',
                'data-demo="toast" data-toast-status="' + status + '"',
              ),
            )
            .join("") +
          '</div><p class="demo-hint" data-save-state>저장한 디자인을 알림에서 되돌릴 수 있습니다.</p><div class="sample-box sample-danger persistent-error" hidden><strong>동기화되지 않은 변경 내용</strong><p>연결을 확인한 후 다시 시도하세요. 작성한 내용은 보관됩니다.</p>' +
          button("다시 시도", "toast").replace(
            'data-demo="toast"',
            'data-demo="toast" data-toast-status="success"',
          ) +
          "</div>",
      popover: preview
        ? '<div class="sample-box"><h4>표시 설정</h4><p>완료한 프로젝트 포함</p><span class="sample-badge">설정 적용</span></div>'
        : button("표시 설정", "popover").replace(
            "<button ",
            '<button aria-haspopup="dialog" aria-expanded="false" ',
          ),
      alert:
        '<div class="sample-box sample-warning sample-feedback">' +
        window.PaletteComponentDemos.icon("triangle-alert") +
        '<div><strong>입력 확인 필요</strong><p>이메일 주소를 확인하고 다시 저장하세요.</p><a href="#detail-title">입력 기준 확인</a></div></div>',
      dialog: preview
        ? '<div class="sample-box"><h4 class="sample-emphasis">변경 내용을 저장할까요?</h4><p>작업 내용을 반영합니다.</p><div class="sample-actions"><span class="sample-badge">취소</span><span class="sample-badge sample-primary">저장</span></div></div>'
        : button("확인창 열기", "dialog", true),
      drawer: preview
        ? '<div class="sample-box sample-emphasis" style="margin-left:22%;width:78%;border-radius:0"><h4>프로젝트 상세</h4><p>프로젝트 상세 정보입니다.</p><div class="mini-line"></div></div>'
        : button("패널 열기", "drawer", true),
      tooltip:
        '<div class="sample-tooltip">' +
        button("도움말 보기", "tooltip").replace(
          "<button ",
          '<button aria-describedby="' + uid + '" ',
        ) +
        '<span id="' +
        uid +
        '" class="tip" role="tooltip"' +
        (preview ? " data-static-tip" : " hidden") +
        ">프로젝트 설정을 표시합니다.</span></div>",
      menu: preview
        ? '<div class="sample-box"><h4>프로젝트 동작</h4><p>이름 바꾸기</p><span>복제하기</span></div>'
        : button(
            "프로젝트 동작 " +
              window.PaletteComponentDemos.icon("chevron-down"),
            "menu",
          ).replace(
            "<button ",
            '<button aria-haspopup="menu" aria-expanded="false" ',
          ),
      tabs:
        '<div class="sample-tabs" role="tablist" aria-label="프로젝트 내용"><button type="button" class="sample-tab sample-emphasis" role="tab" id="' +
        uid +
        '-overview" aria-controls="' +
        uid +
        '-panel" aria-selected="true" data-tab="overview">개요</button><button type="button" class="sample-tab" role="tab" id="' +
        uid +
        '-activity" aria-controls="' +
        uid +
        '-panel" aria-selected="false" tabindex="-1" data-tab="activity">활동</button></div><div role="tabpanel" tabindex="0" id="' +
        uid +
        '-panel" aria-labelledby="' +
        uid +
        '-overview">프로젝트 개요입니다.</div>',
      breadcrumb:
        '<nav aria-label="현재 위치"><ol class="sample-crumbs"><li><a href="#sets">홈</a></li><li><a href="#encyclopedia-heading">프로젝트</a></li><li class="sample-emphasis" aria-current="page">상세</li></ol></nav>',
      pagination:
        '<nav class="sample-actions" aria-label="페이지"><button type="button" class="sample-button" data-page="prev" aria-label="이전 페이지" disabled>‹</button><span class="sample-badge sample-emphasis" aria-current="page" data-page-number>1 / 3</span><button type="button" class="sample-button" data-page="next" aria-label="다음 페이지">›</button></nav>',
      card: '<article class="sample-box"><h4 class="sample-emphasis">샘플 프로젝트</h4><p>담당 팀: Product Team</p><span class="sample-badge">멤버 3명</span></article>',
      badge:
        '<div class="sample-actions">' +
        [
          ["success", "circle-check", "완료"],
          ["review", "clock", "검토"],
          ["rejected", "circle-x", "거절"],
          ["failed", "triangle-alert", "실패"],
        ]
          .map(
            ([status, glyph, label]) =>
              '<span class="sample-badge sample-' +
              status +
              '">' +
              window.PaletteComponentDemos.icon(glyph) +
              label +
              "</span>",
          )
          .join("") +
        "</div>",
      accordion:
        '<details class="sample-box"><summary class="sample-emphasis">어떻게 시작하나요?</summary><p>세트를 고르고 프로젝트에 필요한 요소를 확인하세요.</p></details>',
      empty:
        '<div class="sample-empty"><span class="empty-symbol">' +
        window.PaletteComponentDemos.icon("folder-open") +
        '</span><strong class="sample-emphasis">등록된 프로젝트 없음</strong><p>프로젝트를 추가하면 목록에 표시됩니다.</p>' +
        button("프로젝트 만들기", "action", variant === "solid") +
        "</div>",
    }[id];
    return '<div class="treatment ' + esc(variant) + '">' + content + "</div>";
  }
  function notice(text) {
    $("catalog-status").textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(
      () => ($("catalog-status").textContent = ""),
      2800,
    );
  }
  async function copy(text) {
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
  }
  function download(name, text) {
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function linkConfig() {
    return {
      ...config,
      designSelection: designs.normalize(config.designSelection),
    };
  }
  function shareURL() {
    const url = new URL(location.href);
    url.hash = new URLSearchParams({
      selection: JSON.stringify(linkConfig()),
    }).toString();
    return url.href;
  }
  function persist() {
    const linked = linkConfig();
    try {
      localStorage.setItem("palette-studio-handoff-v1", JSON.stringify(linked));
      $("save-status").textContent = recovery || "자동 저장됨";
    } catch {
      $("save-status").textContent =
        "브라우저 저장을 사용할 수 없습니다. 링크나 설정 JSON으로 보관하세요.";
    }
    const p = new URLSearchParams({ selection: JSON.stringify(linked) });
    try {
      history.replaceState(
        null,
        "",
        location.pathname + location.search + "#" + p,
      );
    } catch {}
    // Explicit fragment carries the configuration across file:// storage isolation.
    if ($("open-handoff"))
      $("open-handoff").href =
        "handoff.html#catalogConfig=" +
        encodeURIComponent(JSON.stringify(linked));
  }
  function menuSample(selection, orientation = "vertical") {
    return designs.navigationDesigns.markup({
      style: selection.navigationStyle,
      structure: selection.navigationStructure,
      orientation,
      interactive: false,
      icons: designs.navigationDesigns.iconMarkup(icons),
    });
  }
  function shell(navigation, mini = false, selection = config.designSelection) {
    return `<span class="shell shell-layout-${navigation}" data-menu-structure="${selection.navigationStructure}" aria-label="${esc(designs.navigationPresets.find((n) => n.id === navigation).name)}">${navigation !== "left" ? `<span class="shell-top"><strong>프로젝트</strong>${navigation === "top" ? menuSample(selection, "horizontal") : "<span>작업 공간</span>"}</span>` : ""}<span class="shell-body">${navigation !== "top" ? `<span class="shell-side">${menuSample(selection)}</span>` : ""}<span class="shell-content"><strong>프로젝트 목록</strong><span class="shell-line"></span><span class="shell-line"></span><span class="mini-action">추가</span></span></span></span>`;
  }
  function paired(body, extra = "") {
    return ["light", "dark"]
      .map(
        (mode) =>
          '<div class="preview-pane ' +
          extra +
          '" data-theme="' +
          mode +
          '" data-palette="' +
          esc(config.palette) +
          '" data-style="' +
          esc(config.style) +
          '" data-concept="' +
          config.designSelection.concept +
          '"><span class="pane-label">' +
          (mode === "light" ? "라이트" : "다크") +
          "</span>" +
          body(mode) +
          "</div>",
      )
      .join("");
  }
  function renderSets() {
    $("set-grid").innerHTML = designs.sets
      .map(
        (set) =>
          '<button type="button" class="set-card" data-set="' +
          set.id +
          '" aria-pressed="' +
          (config.designSelection.set === set.id) +
          '"><span class="set-pair">' +
          ["light", "dark"]
            .map(
              (mode) =>
                '<span class="set-mini" data-theme="' +
                mode +
                '" data-palette="' +
                set.palette +
                '" data-style="' +
                set.style +
                '" data-concept="' +
                designs.selection(set.id).concept +
                '"><span class="pane-label">' +
                (mode === "light" ? "라이트" : "다크") +
                "</span>" +
                shell(set.defaultNavigation, true, designs.selection(set.id)) +
                "</span>",
            )
            .join("") +
          '</span><span class="set-caption"><strong>' +
          set.name +
          "</strong><small>" +
          set.description +
          "</small><small>" +
          designs.navigationPresets.find((n) => n.id === set.defaultNavigation)
            .name +
          " · " +
          designs.motionPresets.find((m) => m.id === set.defaultMotion).name +
          "</small></span></button>",
      )
      .join("");
  }
  function renderConcepts() {
    const chosen = config.designSelection.concept;
    if ($("concept-grid"))
      $("concept-grid").innerHTML = designs.concepts.concepts
        .map(
          (c) =>
            '<button type="button" class="concept-card" data-choose-concept="' +
            c.id +
            '" aria-pressed="' +
            (c.id === chosen) +
            '"><span class="concept-mini" data-concept="' +
            c.id +
            '" data-palette="' +
            config.palette +
            '" data-theme="' +
            theme +
            '"><span class="concept-surface"><span class="concept-kicker">프로젝트 03</span><strong class="concept-title">샘플 프로젝트</strong><span class="concept-lines"><i></i><i></i></span><span class="mini-action">프로젝트 열기</span></span></span><span class="concept-caption"><strong>' +
            c.name +
            "</strong><small>" +
            c.traits.slice(0, 2).join(" · ") +
            "</small></span></button>",
        )
        .join("");
    if ($("catalog-concept")) {
      $("catalog-concept").innerHTML = designs.concepts.concepts
        .map((c) => '<option value="' + c.id + '">' + c.name + "</option>")
        .join("");
      $("catalog-concept").value = chosen;
    }
    if ($("concept-description"))
      $("concept-description").textContent =
        designs.concepts.get(chosen).description;
  }
  function chooseConcept(id) {
    config = core.normalize(
      {
        ...config,
        designSelection: { ...config.designSelection, concept: id },
      },
      palettes,
      fonts,
      icons,
    );
    render();
    document
      .querySelector('[data-choose-concept="' + id + '"]')
      ?.focus({ preventScroll: true });
  }
  $("concept-grid")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-choose-concept]");
    if (b) chooseConcept(b.dataset.chooseConcept);
  });
  $("catalog-concept")?.addEventListener("change", (e) =>
    chooseConcept(e.target.value),
  );
  function renderPalettes(set) {
    const group = (label, rows) =>
      '<optgroup label="' +
      label +
      '">' +
      rows
        .map((p) => '<option value="' + p.id + '">' + esc(p.name) + "</option>")
        .join("") +
      "</optgroup>";
    $("catalog-palette").innerHTML =
      group(
        "권장 팔레트",
        set.recommendedPalettes.map((id) =>
          palettes.palettes.find((p) => p.id === id),
        ),
      ) +
      group(
        "전체 팔레트",
        palettes.palettes.filter(
          (p) => !set.recommendedPalettes.includes(p.id),
        ),
      );
    $("catalog-palette").value = config.palette;
  }
  function renderAuxiliary() {
    const selection = config.designSelection;
    $("catalog-motion").value = selection.motion;
    $("catalog-navigation").value = selection.navigation;
    $("catalog-navigationStructure").value = selection.navigationStructure;
    $("navigation-style-picker").innerHTML = designs.navigationDesigns.styles
      .map(
        (style) =>
          `<button type="button" class="navigation-choice" data-navigation-style="${style.id}" aria-pressed="${style.id === selection.navigationStyle}"><span class="navigation-choice-label">${style.name}</span><span class="navigation-choice-demo" aria-hidden="true">${menuSample({ ...selection, navigationStyle: style.id, navigationStructure: "list" })}</span><small>${style.description}</small></button>`,
      )
      .join("");
    $("navigation-description").textContent =
      designs.navigationPresets.find((n) => n.id === selection.navigation)
        .description +
      " · " +
      designs.navigationDesigns.structures.find(
        (n) => n.id === selection.navigationStructure,
      ).description;
    $("navigation-preview").innerHTML = paired(() =>
      shell(selection.navigation),
    );
    $("selected-motion-preview").textContent = core.motionCSS(config);
    $("motion-preview").innerHTML = paired(
      (mode) =>
        '<div class="motion-effects" data-ps-motion="' +
        selection.motion +
        '">' +
        [
          ["fade", "페이드"],
          ["slide", "이동"],
          ["scale", "확대"],
          ["expand", "펼치기"],
        ]
          .map(
            ([id, label]) =>
              "<div><span>" +
              label +
              '</span><div class="motion-stage"><div class="motion-tile" id="motion-' +
              mode +
              "-" +
              id +
              '">예시</div></div><button type="button" data-motion-play="' +
              id +
              '" data-motion-mode="' +
              mode +
              '">재생</button></div>',
          )
          .join("") +
        "</div>",
    );
  }
  function renderComponents() {
    const q = $("catalog-search").value.trim().toLocaleLowerCase(),
      category = $("catalog-category").value;
    const set = designs.sets.find((s) => s.id === config.designSelection.set);
    const recommended = set.recommendedComponents;
    const matches = designs.components.filter(
      (c) =>
        (category === "all" || category === c.category) &&
        (!$("recommended-only").checked || recommended.includes(c.id)) &&
        [c.name, c.label, c.purpose, c.keywords]
          .join(" ")
          .toLocaleLowerCase()
          .includes(q),
    );
    matches.sort(
      (a, b) =>
        Number(recommended.includes(b.id)) - Number(recommended.includes(a.id)),
    );
    $("component-grid").innerHTML = matches
      .map(
        (c) =>
          '<article class="component-card"><div class="component-preview" inert aria-hidden="true">' +
          paired((mode) =>
            demo(c.id, config.designSelection.components[c.id], true, mode),
          ) +
          '</div><button type="button" class="component-caption" data-component="' +
          c.id +
          '"><strong>' +
          c.label +
          (recommended.includes(c.id)
            ? ' <span class="recommend-badge">권장</span>'
            : "") +
          "</strong><small>" +
          c.name +
          " / " +
          designs.treatments[config.designSelection.components[c.id]].name +
          "</small><span>" +
          c.purpose +
          " ↗</span></button></article>",
      )
      .join("");
    $("no-results").hidden = matches.length !== 0;
  }
  function renderDetail() {
    if (!active) return;
    const c = designs.components.find((c) => c.id === active),
      variant = config.designSelection.components[active];
    $("detail-category").textContent = c.category + " / " + c.name;
    $("detail-title").textContent = c.label;
    $("detail-purpose").textContent = c.purpose;
    $("detail-behavior").textContent =
      designs.treatments[variant].rule + " " + c.behavior;
    $("variant-picker").innerHTML = c.variants
      .map(
        (v) =>
          '<button type="button" data-variant="' +
          v +
          '" aria-pressed="' +
          (v === variant) +
          '">' +
          designs.treatments[v].name +
          "</button>",
      )
      .join("");
    window.PaletteComponentDemos.cleanup();
    $("detail-demo").innerHTML = paired((mode) =>
      demo(active, variant, false, mode),
    );
  }
  function render() {
    document.documentElement.dataset.palette = config.palette;
    document.documentElement.dataset.style = config.style;
    document.documentElement.dataset.theme = theme;
    $("catalog-palette").value = config.palette;
    $("catalog-style").value = config.style;
    $("ui-theme").textContent = theme === "dark" ? "라이트 모드" : "다크 모드";
    $("ui-theme").setAttribute("aria-pressed", String(theme === "dark"));
    const set = designs.sets.find((s) => s.id === config.designSelection.set),
      p = palettes.palettes.find((p) => p.id === config.palette),
      s = palettes.styles.find((s) => s.id === config.style);
    renderPalettes(set);
    renderAuxiliary();
    $("recommendation-reason").textContent = set.recommendationReason;
    const defaults = designs.selection(set.id).components;
    const custom = Object.entries(config.designSelection.components).filter(
      ([id, v]) => v !== defaults[id],
    ).length;
    $("selection-label").textContent =
      set.name + " · " + custom + "개 요소 변경";
    $("recipe").innerHTML =
      ["light", "dark"]
        .map(
          (mode) =>
            '<div class="swatches" aria-label="' +
            mode +
            ' 색상 견본"><small>' +
            mode +
            "</small>" +
            [
              "--color-canvas",
              "--color-surface",
              "--color-line-strong",
              "--color-accent",
              "--color-ink",
            ]
              .map(
                (t) =>
                  '<span style="background:' + p.modes[mode][t] + '"></span>',
              )
              .join("") +
            "</div>",
        )
        .join("") +
      [
        ["프리셋", set.name],
        ["콘셉트", designs.concepts.get(config.designSelection.concept).name],
        [
          "메뉴 배치",
          designs.navigationPresets.find(
            (n) => n.id === config.designSelection.navigation,
          ).name,
        ],
        [
          "애니메이션",
          designs.motionPresets.find(
            (m) => m.id === config.designSelection.motion,
          ).name,
        ],
        [
          "선택 표시",
          designs.navigationDesigns.styles.find(
            (n) => n.id === config.designSelection.navigationStyle,
          ).name,
        ],
        [
          "메뉴 구성",
          designs.navigationDesigns.structures.find(
            (n) => n.id === config.designSelection.navigationStructure,
          ).name,
        ],
        ["디자인 모드", "라이트 + 다크"],
        ["색상", p.name],
        ["형태", s.name],
        ["개별 변경", custom + " / " + designs.components.length],
        ["본문 폰트", config.fonts.body],
        ["적용 범위", config.scope],
      ]
        .map(
          ([k, v]) =>
            '<div class="recipe-row"><span>' +
            k +
            "</span><strong>" +
            esc(v) +
            "</strong></div>",
        )
        .join("");
    $("agent-brief").value = core.agentTask(config, palettes);
    renderSets();
    renderConcepts();
    renderComponents();
    persist();
    const fontKey = JSON.stringify(config.fonts);
    if (fontKey !== appliedFontKey) {
      appliedFontKey = fontKey;
      fontsReady = window.PaletteFonts.apply({
        bodyFont: config.fonts.body,
        codeFont: config.fonts.code,
        fontSource: config.fonts.source,
      });
    }
    window.dispatchEvent(
      new CustomEvent("palette-selection", { detail: linkConfig() }),
    );
  }
  function chooseSet(id) {
    const set = designs.sets.find((s) => s.id === id);
    config = core.normalize(
      {
        ...config,
        ...set.config,
        project: config.project,
        target: config.target,
        scope: config.scope,
        framework: config.framework,
        layout: config.layout,
        fonts: { ...set.config.fonts, source: config.fonts.source },
        designSelection: designs.selection(id),
      },
      palettes,
      fonts,
      icons,
    );
    render();
    $("set-grid")
      .querySelector('[data-set="' + id + '"]')
      .focus({ preventScroll: true });
    notice(set.name + " 프리셋을 선택했습니다.");
  }
  $("catalog-palette").innerHTML = palettes.palettes
    .map((p) => '<option value="' + p.id + '">' + esc(p.name) + "</option>")
    .join("");
  for (const [key, items] of [
    ["navigation", designs.navigationPresets],
    ["navigationStructure", designs.navigationDesigns.structures],
    ["motion", designs.motionPresets],
  ])
    $("catalog-" + key).innerHTML = items
      .map(
        (item) =>
          '<option value="' + item.id + '">' + esc(item.name) + "</option>",
      )
      .join("");
  $("catalog-style").innerHTML = palettes.styles
    .map((s) => '<option value="' + s.id + '">' + esc(s.name) + "</option>")
    .join("");
  $("catalog-category").insertAdjacentHTML(
    "beforeend",
    [...new Set(designs.components.map((c) => c.category))]
      .map((c) => "<option>" + c + "</option>")
      .join(""),
  );
  $("set-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-set]");
    if (b) chooseSet(b.dataset.set);
  });
  $("catalog-search").addEventListener("input", renderComponents);
  $("catalog-category").addEventListener("change", renderComponents);
  $("recommended-only").addEventListener("change", renderComponents);
  $("ui-theme").addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    try {
      localStorage.setItem("palette-studio-ui-theme", theme);
    } catch {}
    document.documentElement.dataset.theme = theme;
    $("ui-theme").textContent = theme === "dark" ? "라이트 모드" : "다크 모드";
    $("ui-theme").setAttribute("aria-pressed", String(theme === "dark"));
  });
  $("navigation-design-css").textContent = designs.navigationDesigns.allCSS();
  $("navigation-style-picker").addEventListener("click", (e) => {
    const button = e.target.closest("[data-navigation-style]");
    if (!button) return;
    const id = button.dataset.navigationStyle;
    config = core.normalize(
      {
        ...config,
        designSelection: { ...config.designSelection, navigationStyle: id },
      },
      palettes,
      fonts,
      icons,
    );
    render();
    $("navigation-style-picker")
      .querySelector(`[data-navigation-style="${id}"]`)
      .focus({ preventScroll: true });
  });
  for (const key of ["motion", "navigation", "navigationStructure"])
    $("catalog-" + key).addEventListener("change", (e) => {
      config = core.normalize(
        {
          ...config,
          designSelection: { ...config.designSelection, [key]: e.target.value },
        },
        palettes,
        fonts,
        icons,
      );
      render();
      $(key === "motion" ? "motion-options" : "layout-options").open = true;
    });
  $("motion-preview").addEventListener("click", (e) => {
    const b = e.target.closest("[data-motion-play]");
    if (!b) return;
    const sample = $(
      "motion-" + b.dataset.motionMode + "-" + b.dataset.motionPlay,
    );
    sample.className = "motion-tile";
    void sample.offsetWidth;
    sample.classList.add("ps-motion-" + b.dataset.motionPlay);
  });
  $("download-motion")?.addEventListener("click", () =>
    download("selected-motion.css", core.motionCSS(config)),
  );
  for (const key of ["palette", "style"])
    $("catalog-" + key).addEventListener("change", (e) => {
      config = core.normalize(
        { ...config, [key]: e.target.value },
        palettes,
        fonts,
        icons,
      );
      render();
    });
  $("component-grid").addEventListener("click", (e) => {
    const b = e.target.closest("[data-component]");
    if (!b) return;
    active = b.dataset.component;
    renderDetail();
    $("component-dialog").showModal();
  });
  $("variant-picker").addEventListener("click", (e) => {
    const b = e.target.closest("[data-variant]");
    if (!b) return;
    const variant = b.dataset.variant;
    config.designSelection.components[active] = variant;
    render();
    renderDetail();
    $("variant-picker")
      .querySelector('[data-variant="' + variant + '"]')
      .focus();
  });
  document.addEventListener("click", (e) => {
    const close = e.target.closest("[data-close]");
    if (close) {
      $(close.dataset.close).close();
      return;
    }
    const b = e.target.closest("[data-demo]");
    if (b) {
      const mode = b.closest("[data-theme]")?.dataset.theme || "light";
      if (!window.PaletteComponentDemos.handle(b))
        notice(
          b.dataset.demo === "cancel"
            ? "취소했습니다."
            : "샘플 동작을 실행했습니다. 미리보기 예시입니다.",
        );
    }
    const tab = e.target.closest("[data-tab]");
    if (tab) selectTab(tab);
    const page = e.target.closest("[data-page]");
    if (page) {
      const nav = page.closest("nav"),
        counter = nav.querySelector("[data-page-number]");
      const n =
        Number(counter.textContent[0]) +
        (page.dataset.page === "next" ? 1 : -1);
      counter.textContent = n + " / 3";
      nav.querySelector('[data-page="prev"]').disabled = n === 1;
      nav.querySelector('[data-page="next"]').disabled = n === 3;
    }
  });
  function selectTab(tab) {
    const parent = tab.closest("[role=tablist]");
    parent.querySelectorAll("[role=tab]").forEach((t) => {
      t.setAttribute("aria-selected", String(t === tab));
      t.tabIndex = t === tab ? 0 : -1;
    });
    parent.nextElementSibling.setAttribute("aria-labelledby", tab.id);
    parent.nextElementSibling.textContent =
      tab.dataset.tab === "overview"
        ? "프로젝트 개요입니다."
        : "디자인 변경 기록 1건";
  }
  document.addEventListener("keydown", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab && ["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const tabs = [...tab.parentElement.children],
        index = tabs.indexOf(tab);
      const next =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? tabs.length - 1
            : (index + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) %
              tabs.length;
      selectTab(tabs[next]);
      tabs[next].focus();
    }
  });
  $("component-dialog").addEventListener("close", () => {
    const opener = $("component-grid").querySelector(
      '[data-component="' + active + '"]',
    );
    (opener || $("catalog-search")).focus({ preventScroll: true });
  });
  $("copy-brief").addEventListener("click", () =>
    copy(core.agentTask(config, palettes)),
  );
  $("download-brief")?.addEventListener("click", () =>
    download("AGENT-TASK.md", core.agentTask(config, palettes)),
  );
  $("download-config").addEventListener("click", () =>
    download("handoff-config.json", JSON.stringify(config, null, 2) + "\n"),
  );
  $("share-selection").addEventListener("click", () =>
    copy(window.PaletteWorkspace?.shareURL() || shareURL()),
  );
  window.PaletteCatalog = {
    getConfig: () => JSON.parse(JSON.stringify(config)),
    libraryFiles: () => core.libraryFiles(config,palettes),
    update(patch) {
      config = core.normalize(
        { ...config, ...patch, fonts: { ...config.fonts, ...patch.fonts } },
        palettes,
        fonts,
        icons,
      );
      render();
    },
    readyFonts: () => fontsReady,
    demo,
  };
  let fontsReady, appliedFontKey;
  window.PaletteComponentDemos.init(() => config);
  render();
})();
