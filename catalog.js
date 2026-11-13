/* Visual selection and specimens consume the same registry as handoff generation. */
(() => {
  "use strict";
  const kit = PaletteComponents,
    colors = PALETTE_KIT,
    fonts = PALETTE_FONT_CATALOG,
    $ = (id) => document.getElementById(id),
    key = "palette-studio-catalog-v1";
  const esc = (x) =>
    String(x).replace(
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
  let state = {
      selection: { preset: "calm", overrides: {} },
      palette: "slate-blue",
      style: "operational",
      font: "pretendard",
      theme: "light",
      previewState: "default",
      screen: "dashboard",
    },
    previous,
    compare = [],
    timer,
    toastTimer;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (saved) {
      const selection = kit.normalize(saved.selection);
      if (!selection) throw Error("Missing selection");
      state = { ...state, ...saved, selection };
    }
  } catch (_) {
    /* Ignore stale or corrupt storage. */
  }
  if (!colors.palettes.some((p) => p.id === state.palette))
    state.palette = "slate-blue";
  if (!colors.styles.some((p) => p.id === state.style))
    state.style = "operational";
  if (!fonts.fonts.some((f) => f.id === state.font && f.role === "body"))
    state.font = "pretendard";
  if (!["light", "dark"].includes(state.theme)) state.theme = "light";
  if (!["dashboard", "settings", "content", "landing"].includes(state.screen))
    state.screen = "dashboard";
  if (
    !["default", "hover", "focus", "disabled", "error", "loading"].includes(
      state.previewState,
    )
  )
    state.previewState = "default";
  function notice(message) {
    $("notice").textContent = message;
    clearTimeout(timer);
    timer = setTimeout(() => ($("notice").textContent = ""), 4500);
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (_) {
      $("storage-warning").hidden = false;
    }
  }
  function update(fn) {
    previous = JSON.parse(JSON.stringify(state));
    fn();
    save();
    render();
  }
  function vars(r) {
    return (
      "--recipe-bg:var(" +
      r.tokens.background +
      ");--recipe-fg:var(" +
      r.tokens.foreground +
      ");--recipe-line:var(" +
      r.tokens.line +
      ");--recipe-radius:" +
      r.radius +
      "px;--recipe-padding:" +
      r.padding +
      "px;--recipe-border:" +
      r.border +
      "px"
    );
  }
  function recipe(id, variant) {
    const selection = {
      ...state.selection,
      overrides: { ...state.selection.overrides, [id]: variant },
    };
    return kit.resolve(selection)[id];
  }
  function box(id, html, recipes) {
    const r = recipes[id];
    return '<div class="demo-body" style="' + vars(r) + '">' + html + "</div>";
  }
  function specimen(id) {
    switch (id) {
      case "toast":
        return '<div class="inline"><span aria-hidden="true">✓</span><strong>저장 완료</strong><button data-feedback="실행취소 시연: 저장 전 상태로 돌아갔습니다.">실행취소</button></div><button data-demo="toast">알림 띄우기</button>';
      case "dialog":
        return '<div class="stack"><strong>프로젝트 저장</strong><span>변경한 내용을 적용할까요?</span><button data-demo="dialog">확인창 열기</button></div>';
      case "sheet":
        return '<div class="stack"><strong>프로젝트 상세</strong><span>목록을 벗어나지 않고 확인</span><button data-demo="sheet">상세 패널 열기 →</button></div>';
      case "tooltip":
        return (
          '<button class="tooltip-trigger" aria-describedby="tip-' +
          ++specimen.count +
          '">도움말 ⓘ</button><span class="hint" id="tip-' +
          specimen.count +
          '" role="tooltip">저장 단축키: Ctrl + S</span>'
        );
      case "popover":
        return '<details><summary>프로젝트 정보 보기</summary><p>팀 프로젝트 · 오늘 업데이트</p><button data-feedback="프로젝트 정보를 확인했습니다.">확인</button></details>';
      case "menu":
        return '<details><summary>더보기 ···</summary><div class="stack"><button data-feedback="편집을 선택했습니다.">편집</button><button data-feedback="공유를 선택했습니다.">공유</button></div></details>';
      case "alert":
        return "<strong>ⓘ 변경 사항이 있어요</strong><p>저장하면 팀에 반영됩니다.</p>";
      case "select":
        return "<label>정렬 기준<select><option>최근 수정순</option><option>이름순</option><option>생성순</option></select></label>";
      case "combobox": {
        const n = ++specimen.count;
        return (
          '<label>팀원 검색<input list="people-' +
          n +
          '" placeholder="이름 입력" autocomplete="off"></label><datalist id="people-' +
          n +
          '"><option value="김민지"><option value="이서준"><option value="박지우"></datalist>'
        );
      }
      case "tabs":
        return '<div class="stack"><div class="inline" role="group" aria-label="내용 선택"><button data-tab="개요" aria-pressed="true">개요</button><button data-tab="활동" aria-pressed="false">활동</button></div><p class="tab-content">프로젝트 개요를 보고 있어요.</p></div>';
      case "sidebar":
        return '<nav class="stack" aria-label="예제 메뉴"><button data-feedback="프로젝트 화면을 선택했습니다.">▦ 프로젝트</button><button data-feedback="팀원 화면을 선택했습니다.">♧ 팀원</button><button data-feedback="설정 화면을 선택했습니다.">⚙ 설정</button></nav>';
      case "breadcrumb":
        return '<nav aria-label="예제 경로"><button data-feedback="전체 프로젝트로 이동하는 시연입니다.">프로젝트</button><span aria-hidden="true">/</span><span aria-current="page">디자인</span></nav>';
      case "button":
        return '<div class="stack"><button data-feedback="저장 완료. 선택한 버튼 디자인이 적용되었습니다.">변경 저장</button><button disabled>비활성</button></div>';
      case "input":
        return '<label>프로젝트 이름<input placeholder="새 프로젝트" required></label>';
      case "textarea":
        return '<label>프로젝트 설명<textarea rows="2" placeholder="어떤 프로젝트인가요?"></textarea></label>';
      case "checkbox":
        return '<label class="inline"><input type="checkbox" checked>완료한 항목 포함</label><label class="inline"><input type="checkbox">내 항목만 보기</label>';
      case "radio": {
        const n = ++specimen.count;
        return (
          '<fieldset><legend>공개 범위</legend><label class="inline"><input type="radio" name="scope-' +
          n +
          '" checked>팀 공개</label><label class="inline"><input type="radio" name="scope-' +
          n +
          '">나만 보기</label></fieldset>'
        );
      }
      case "switch":
        return '<label class="inline"><input type="checkbox" role="switch" checked>이메일 알림</label>';
      case "slider":
        return '<label>화면 밀도<input type="range" min="1" max="5" value="3"><output>3 / 5</output></label>';
      case "card":
        return '<strong>웹사이트 리뉴얼</strong><p>새로운 제품 경험을 만들어요.</p><button data-feedback="프로젝트 열기 시연입니다.">프로젝트 열기 ↗</button>';
      case "table":
        return '<table><caption>프로젝트 목록</caption><thead><tr><th scope="col">이름</th><th scope="col">상태</th></tr></thead><tbody><tr><td>웹사이트</td><td>진행 중</td></tr><tr><td>문서</td><td>완료</td></tr></tbody></table>';
      case "pagination":
        return '<nav aria-label="예제 페이지"><button data-page="prev" disabled>이전</button><span class="page-number" aria-live="polite">1 / 3</span><button data-page="next">다음</button></nav>';
      case "accordion":
        return "<details><summary>디자인은 어떻게 적용하나요?</summary><p>견본을 고르고 작업지시 만들기를 누르세요.</p></details>";
      case "progress":
        return '<label>파일 업로드 · 60%<progress value="60" max="100">60%</progress></label>';
      case "skeleton":
        return '<div aria-busy="true"><span>내용을 불러오는 중…</span><div aria-hidden="true"><div class="skeleton-line"></div><div class="skeleton-line" style="width:65%"></div><div class="skeleton-line"></div></div></div>';
      case "empty":
        return '<strong>아직 프로젝트가 없어요</strong><p>첫 프로젝트를 만들어 시작하세요.</p><button data-feedback="새 프로젝트 만들기 시연입니다.">+ 프로젝트 만들기</button>';
      case "badge":
        return '<div class="inline"><span class="pill">✓ 완료</span><span class="pill">ⓘ 검토 필요</span></div>';
      case "avatar":
        return '<div class="inline"><span class="avatar" aria-hidden="true">MJ</span><span>김민지<br><small>프로젝트 담당자</small></span></div>';
      case "search":
        return '<label>프로젝트 검색<input type="search" placeholder="프로젝트 이름 찾기"></label>';
      case "stepper":
        return '<ol><li>✓ 디자인 선택</li><li aria-current="step"><strong>요소 다듬기 · 현재</strong></li><li>작업지시 만들기 · 대기</li></ol>';
    }
    return "";
  }
  specimen.count = 0;
  function sample(id, variant) {
    const r = recipe(id, variant);
    return (
      '<div class="sample" data-palette="' +
      esc(state.palette) +
      '" data-theme="' +
      state.theme +
      '" data-style="' +
      esc(state.style) +
      '"><div><div class="demo-body" style="' +
      vars(r) +
      '">' +
      specimen(id) +
      '</div><div class="demo-feedback" role="status"></div></div></div>'
    );
  }
  function screenMarkup(type, selection = state.selection) {
    const r = kit.resolve(selection);
    const card = (content) => box("card", content, r);
    let content = "";
    if (type === "settings")
      content =
        "<h3>워크스페이스 설정</h3>" +
        card(
          '<label>프로젝트 이름<input value="Palette Workspace"></label><br>' +
            box("switch", specimen("switch"), r) +
            "<br>" +
            box(
              "button",
              '<button data-feedback="설정을 저장했습니다.">설정 저장</button>',
              r,
            ),
        );
    else if (type === "content")
      content =
        "<h3>디자인 가이드</h3>" +
        box("breadcrumb", "가이드 / 시작하기", r) +
        card(
          "<h3>작은 디테일이 만드는 일관성</h3><p>좋은 도구는 고민할 것을 줄여 줍니다. 같은 색과 여백, 익숙한 동작으로 읽는 흐름을 이어가세요.</p>",
        ) +
        box("alert", "ⓘ 선택한 토큰을 모든 화면에서 사용하세요.", r);
    else if (type === "landing")
      content =
        '<p>MAKE ROOM FOR GOOD WORK</p><h3 style="font-size:1.8em">아이디어를<br>다음 단계로.</h3><p>함께 생각하고, 만들고, 완성하는 공간.</p>' +
        box(
          "button",
          '<button data-feedback="시작하기를 선택했습니다.">무료로 시작하기 ↗</button>',
          r,
        ) +
        card(
          "<strong>하나의 공간, 더 나은 협업</strong><p>팀의 다음 프로젝트를 시작하세요.</p>",
        );
    else
      content =
        "<h3>프로젝트 현황</h3>" +
        box("tabs", "개요　 활동　 파일", r) +
        card(
          '<small>진행 중인 프로젝트</small><div class="metric">24 <small>↗ 12%</small></div>',
        ) +
        box("table", specimen("table"), r) +
        box(
          "toast",
          '<span class="screen-toast">✓ 변경 사항을 저장했어요</span>',
          r,
        );
    return (
      '<div class="screen-shell">' +
      box(
        "sidebar",
        '<div class="screen-sidebar"><strong>◈ STUDIO</strong><span>▦ 프로젝트</span><span>♧ 팀원</span><span>⚙ 설정</span></div>',
        r,
      ) +
      '<div class="screen-content">' +
      content +
      "</div></div>"
    );
  }
  function thumbnail(type, selection) {
    return screenMarkup(type, selection)
      .replace(/<button[^>]*>/g, '<span class="mini-action">')
      .replace(/<\/button>/g, "</span>")
      .replace(
        /<input[^>]*>/g,
        '<span class="mini-field">Palette Workspace</span>',
      )
      .replace(/<label>/g, "<div>")
      .replace(/<\/label>/g, "</div>");
  }
  function renderPresets() {
    const current = state.selection.preset;
    $("preset-grid").innerHTML = kit.presets
      .map(
        (p) =>
          '<button class="preset" data-preset="' +
          p.id +
          '" aria-pressed="' +
          (current === p.id) +
          '"><div class="mini-screen screen" data-palette="' +
          p.palette +
          '" data-theme="light" data-style="' +
          p.style +
          '">' +
          thumbnail(p.layout, { preset: p.id, overrides: {} }) +
          "</div><strong>" +
          p.name +
          (current === p.id ? " · 선택됨" : "") +
          "</strong><span>" +
          p.description +
          "</span></button>",
      )
      .join("");
  }
  function renderRecipe(c, v, comparison = false) {
    const selected = kit.resolve(state.selection)[c.id].variant === v.id,
      ref = c.id + ":" + v.id;
    return (
      '<article class="recipe' +
      (selected ? " is-selected" : "") +
      '">' +
      (comparison ? "<h3>" + esc(c.label) + "</h3>" : "") +
      sample(c.id, v.id) +
      '<div class="recipe-heading">' +
      v.name +
      (selected ? " · 현재 선택" : "") +
      "</div><p>" +
      v.description +
      '</p><div class="recipe-actions"><button data-choose="' +
      ref +
      '" aria-pressed="' +
      selected +
      '">' +
      (selected ? "선택됨" : "이 디자인 선택") +
      '</button><button data-compare="' +
      ref +
      '" aria-pressed="' +
      compare.includes(ref) +
      '">' +
      (compare.includes(ref) ? "비교에서 빼기" : "비교 담기") +
      "</button></div></article>"
    );
  }
  function renderComponents() {
    const q = $("search").value.trim().toLocaleLowerCase().replace(/\s/g, ""),
      category = $("category").value;
    const list = kit.components.filter(
      (c) =>
        (!category || category === c.category) &&
        [c.name, c.label, c.keywords, c.purpose]
          .join(" ")
          .toLocaleLowerCase()
          .replace(/\s/g, "")
          .includes(q),
    );
    $("result-count").textContent =
      list.length + "종 요소 · " + list.length * 3 + "개 디자인";
    $("empty-results").hidden = !!list.length;
    $("component-grid").innerHTML = list
      .map(
        (c) =>
          '<section class="component-card" id="component-' +
          c.id +
          '"><div class="component-title"><div><small>' +
          c.name +
          "</small><h3>" +
          c.label +
          '</h3></div><span class="category-chip">' +
          c.category +
          "</span></div><p>" +
          c.purpose +
          '</p><div class="recipe-grid">' +
          c.variants.map((v) => renderRecipe(c, v)).join("") +
          "</div><details><summary>동작·접근성 기준</summary><p>" +
          c.behavior +
          "</p></details></section>",
      )
      .join("");
    renderComparison();
    applyPreviewState();
    applyFont();
  }
  function renderComparison() {
    $("comparison-section").hidden = !compare.length;
    $("comparison-jump").hidden = !compare.length;
    $("compare-count").textContent = compare.length + "/3";
    $("comparison").innerHTML = compare
      .map((ref) => {
        const [id, v] = ref.split(":"),
          c = kit.components.find((c) => c.id === id);
        return renderRecipe(
          c,
          c.variants.find((x) => x.id === v),
          true,
        );
      })
      .join("");
  }
  function applyPreviewState() {
    $("preview-state").value = state.previewState;
    document.querySelectorAll(".sample").forEach((sample, index) => {
      sample.dataset.previewState = state.previewState;
      const disabled =
        state.previewState === "disabled" || state.previewState === "loading";
      sample
        .querySelectorAll("input,select,textarea,button")
        .forEach((control) => {
          if (disabled) control.disabled = true;
          if (
            state.previewState === "loading" &&
            control.tagName === "BUTTON"
          ) {
            control.textContent = "처리 중…";
            control.setAttribute("aria-busy", "true");
          }
          if (
            state.previewState === "error" &&
            /^(INPUT|TEXTAREA|SELECT)$/.test(control.tagName)
          ) {
            control.setAttribute("aria-invalid", "true");
            control.setAttribute("aria-describedby", "sample-error-" + index);
          }
        });
      const feedback = sample.querySelector(".demo-feedback");
      if (
        feedback &&
        state.previewState === "error" &&
        sample.querySelector("[aria-invalid]")
      ) {
        feedback.id = "sample-error-" + index;
        feedback.textContent = "입력값을 확인하세요. 예시 오류 메시지입니다.";
      }
    });
  }
  function applyFont() {
    const f = fonts.fonts.find((f) => f.id === state.font);
    document
      .querySelectorAll(".sample,#screen")
      .forEach((el) =>
        el.style.setProperty(
          "--kit-font-sans",
          '"' + (f?.family || "system-ui") + '", system-ui, sans-serif',
        ),
      );
    if (f) {
      for (const face of f.faces) {
        if (document.querySelector('style[data-catalog-font="' + f.id + '"]'))
          break;
        const style = document.createElement("style");
        style.dataset.catalogFont = f.id;
        style.textContent = f.faces
          .map(
            (x) =>
              '@font-face{font-family:"' +
              f.family +
              '";src:url("' +
              x.local +
              '");font-weight:' +
              x.weight +
              ";font-style:normal;font-display:swap;}",
          )
          .join("\n");
        document.head.append(style);
        break;
      }
    }
  }
  function renderSelection() {
    const p = kit.presets.find((p) => p.id === state.selection.preset);
    $("selection-summary").textContent =
      p.name +
      " · " +
      Object.keys(state.selection.overrides).length +
      "개 요소 직접 선택";
    for (const [id, value] of [
      ["theme", state.theme],
      ["screen-type", state.screen],
      ["palette", state.palette],
      ["style", state.style],
      ["body-font", state.font],
    ])
      $(id).value = value;
    const screen = $("screen");
    screen.dataset.palette = state.palette;
    screen.dataset.theme = state.theme;
    screen.dataset.style = state.style;
    screen.innerHTML = screenMarkup(state.screen);
    $("undo").disabled = !previous;
    $("handoff-link").href = handoffURL();
    $("chosen-list").innerHTML = Object.entries(kit.resolve(state.selection))
      .map(
        ([id, r]) =>
          '<div class="chosen-row"><span>' +
          r.label +
          " · " +
          kit.variants.find((v) => v.id === r.variant).name +
          "</span>" +
          (state.selection.overrides[id]
            ? '<button data-revert="' + id + '">기본값</button>'
            : "<span>프리셋</span>") +
          "</div>",
      )
      .join("");
  }
  function render() {
    renderPresets();
    renderSelection();
    renderComponents();
  }
  function choosePreset(id) {
    const p = kit.presets.find((p) => p.id === id);
    update(() => {
      state.selection = { preset: id, overrides: {} };
      state.palette = p.palette;
      state.style = p.style;
      state.font = p.font;
      state.screen = p.layout;
    });
    document
      .querySelector('[data-preset="' + id + '"]')
      ?.focus({ preventScroll: true });
    notice(p.name + " 적용 · 이전 조합은 되돌리기로 복원할 수 있어요.");
  }
  $("palette").innerHTML = colors.palettes
    .map((p) => '<option value="' + p.id + '">' + p.name + "</option>")
    .join("");
  $("style").innerHTML = colors.styles
    .map((p) => '<option value="' + p.id + '">' + p.name + "</option>")
    .join("");
  $("body-font").innerHTML = fonts.fonts
    .filter((f) => f.role === "body")
    .map((f) => '<option value="' + f.id + '">' + f.name + "</option>")
    .join("");
  $("preview-state").onchange = (e) => {
    state.previewState = e.target.value;
    save();
    renderComponents();
  };
  $("search").addEventListener("input", renderComponents);
  $("category").addEventListener("change", renderComponents);
  $("clear-search").onclick = () => {
    $("search").value = "";
    $("category").value = "";
    renderComponents();
    $("search").focus();
  };
  for (const [id, k] of [
    ["theme", "theme"],
    ["screen-type", "screen"],
    ["palette", "palette"],
    ["style", "style"],
    ["body-font", "font"],
  ])
    $(id).onchange = (e) => update(() => (state[k] = e.target.value));
  $("undo").onclick = () => {
    if (previous) {
      const old = state;
      state = previous;
      previous = old;
      save();
      render();
      notice("이전 조합을 복원했습니다.");
    }
  };
  $("reset").onclick = () => $("reset-dialog").showModal();
  $("reset-dialog").addEventListener("close", () => {
    if ($("reset-dialog").returnValue === "reset")
      choosePreset(state.selection.preset);
  });
  $("clear-compare").onclick = () => {
    compare = [];
    renderComponents();
  };
  let trigger;
  $("demo-dialog").addEventListener("close", () => {
    trigger?.focus();
    notice("미리보기를 닫았습니다.");
  });
  document.addEventListener("click", (event) => {
    const preset = event.target.closest("[data-preset]");
    if (preset) {
      choosePreset(preset.dataset.preset);
      return;
    }
    const chosen = event.target.closest("[data-choose]");
    if (chosen) {
      const [id, v] = chosen.dataset.choose.split(":");
      update(() => (state.selection.overrides[id] = v));
      document
        .querySelector('[data-choose="' + id + ":" + v + '"]')
        ?.focus({ preventScroll: true });
      notice("조합에 적용했습니다. 오른쪽 화면과 작업지시에 함께 반영됩니다.");
      return;
    }
    const comp = event.target.closest("[data-compare]");
    if (comp) {
      const ref = comp.dataset.compare;
      if (compare.includes(ref)) compare = compare.filter((x) => x !== ref);
      else if (compare.length < 3) compare.push(ref);
      else {
        notice("비교는 최대 3개입니다. 먼저 후보 하나를 빼주세요.");
        return;
      }
      renderComponents();
      document
        .querySelector('[data-compare="' + ref + '"]')
        ?.focus({ preventScroll: true });
      notice("아래 후보 비교 영역에 " + compare.length + "개가 있습니다.");
      return;
    }
    const revert = event.target.closest("[data-revert]");
    if (revert) {
      update(() => delete state.selection.overrides[revert.dataset.revert]);
      return;
    }
    const dismiss = event.target.closest("[data-dismiss-toast]");
    if (dismiss) {
      $("live-toast").hidden = true;
      clearTimeout(toastTimer);
      return;
    }
    const demo = event.target.closest("[data-demo]");
    if (demo && demo.dataset.demo === "toast") {
      const own = demo
        .closest(".recipe")
        ?.querySelector("[data-choose]")
        ?.dataset.choose.split(":")[1];
      const toast = $("live-toast");
      toast.dataset.palette = state.palette;
      toast.dataset.theme = state.theme;
      toast.dataset.style = state.style;
      toast.innerHTML =
        '<div class="demo-body" style="' +
        vars(own ? recipe("toast", own) : kit.resolve(state.selection).toast) +
        '"><strong>✓ 변경 사항을 저장했어요</strong><div class="inline"><button data-feedback="저장 전 상태로 돌아갔습니다.">실행취소</button><button data-dismiss-toast aria-label="알림 닫기">×</button></div></div>';
      toast.hidden = false;
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => (toast.hidden = true), 8000);
      return;
    }
    if (demo) {
      trigger = demo;
      const dlg = $("demo-dialog"),
        r = kit.resolve(state.selection)[demo.dataset.demo];
      const own = demo
        .closest(".recipe")
        ?.querySelector("[data-choose]")
        ?.dataset.choose.split(":")[1];
      dlg.setAttribute("style", vars(own ? recipe(demo.dataset.demo, own) : r));
      dlg.dataset.palette = state.palette;
      dlg.dataset.theme = state.theme;
      dlg.dataset.style = state.style;
      dlg.classList.toggle("sheet", demo.dataset.demo === "sheet");
      dlg.showModal();
      return;
    }
    const feedback = event.target.closest("[data-feedback]");
    if (feedback) {
      if (feedback.closest("#live-toast")) {
        $("live-toast").hidden = true;
        clearTimeout(toastTimer);
      }
      const out = feedback.closest(".sample")?.querySelector(".demo-feedback");
      if (out) out.textContent = feedback.dataset.feedback;
      notice(feedback.dataset.feedback);
      return;
    }
    const tab = event.target.closest("[data-tab]");
    if (tab) {
      const group = tab.closest(".demo-body");
      group
        .querySelectorAll("[data-tab]")
        .forEach((b) => b.setAttribute("aria-pressed", String(b === tab)));
      group.querySelector(".tab-content").textContent =
        "프로젝트 " + tab.dataset.tab + "을 보고 있어요.";
      return;
    }
    const pg = event.target.closest("[data-page]");
    if (pg) {
      const nav = pg.closest("nav"),
        el = nav.querySelector(".page-number"),
        n =
          Number(el.textContent.split("/")[0]) +
          (pg.dataset.page === "next" ? 1 : -1);
      el.textContent = n + " / 3";
      nav.querySelector('[data-page="prev"]').disabled = n === 1;
      nav.querySelector('[data-page="next"]').disabled = n === 3;
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.type === "range")
      e.target.nextElementSibling.textContent = e.target.value + " / 5";
  });
  function storedObject(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "{}");
      return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
    } catch (_) {
      return {};
    }
  }
  function handoffConfig() {
    const saved = storedObject("palette-studio-handoff-v1"),
      main = storedObject("palette-studio-v1");
    const target = saved.target || main.target || "new-app",
      scope = saved.scope || main.scope || "both";
    const config = {
      ...saved,
      target: target === "existing-gate" ? "existing-app" : target,
      scope,
      palette: state.palette,
      style: state.style,
      designSelection: state.selection,
      fonts: {
        ...saved.fonts,
        body: state.font,
        code: saved.fonts?.code || main.codeFont || "d2coding",
        source: "local-only",
      },
    };
    config.layout =
      config.target === "existing-app"
        ? "existing"
        : { settings: "workflow", landing: "marketing" }[state.screen] ||
          state.screen;
    return config;
  }
  function handoffURL() {
    const config = handoffConfig();
    const params = new URLSearchParams({
      palette: config.palette,
      style: config.style,
      target: config.target,
      scope: config.scope,
      layout: config.layout,
      bodyFont: state.font,
      codeFont: config.fonts.code,
      fontSource: "local-only",
      designSelection: JSON.stringify(state.selection),
    });
    if (config.project) params.set("project", config.project);
    if (Array.isArray(config.icons))
      params.set("icons", config.icons.join(","));
    return "handoff.html#" + params;
  }
  $("handoff-link").addEventListener("click", () => {
    const config = handoffConfig();
    try {
      localStorage.setItem("palette-studio-handoff-v1", JSON.stringify(config));
    } catch (_) {}
    $("handoff-link").href = handoffURL();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document
      .querySelectorAll(".sample .hint")
      .forEach((hint) => (hint.hidden = true));
    const details = event.target.closest(".sample details[open]");
    if (details) {
      details.open = false;
      details.querySelector("summary")?.focus();
    }
  });
  for (const name of ["focusin", "pointerover"])
    document.addEventListener(name, (event) => {
      const trigger = event.target.closest(".tooltip-trigger");
      if (trigger && trigger.nextElementSibling)
        trigger.nextElementSibling.hidden = false;
    });
  window.PaletteCatalog = {
    selection: () => JSON.parse(JSON.stringify(state.selection)),
    state: () => JSON.parse(JSON.stringify(state)),
  };
  render();
})();
