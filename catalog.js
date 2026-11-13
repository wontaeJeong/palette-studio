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
  let config,
    theme = params.get("theme") === "dark" ? "dark" : "light",
    active = null,
    toastTimer,
    statusTimer;
  let recovery = "";
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
    if (params.has("selection"))
      candidate = JSON.parse(params.get("selection"));
    else {
      const stored = JSON.parse(
        localStorage.getItem("palette-studio-handoff-v1") || "null",
      );
      candidate = stored || initial();
    }
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate))
      throw Error("Invalid selection");
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
    (primary ? "sample-primary sample-emphasis" : "sample-emphasis") +
    '"' +
    (action ? ' data-demo="' + action + '"' : "") +
    ">" +
    text +
    "</button>";
  function demo(id, variant, preview = false) {
    const uid = (preview ? "preview-" : "detail-") + id;
    const content = {
      button:
        '<div class="sample-actions">' +
        button("시작하기", "action", variant !== "outline") +
        button("취소", "cancel") +
        "</div>",
      input:
        '<label>이메일<input class="sample-input sample-emphasis" type="email" placeholder="hello@example.com"></label><small>소식을 받을 주소를 입력하세요.</small>',
      select:
        '<label>프로젝트 상태<select class="sample-input sample-emphasis"><option>진행 중</option><option>검토 중</option><option>완료</option></select></label>',
      switch:
        '<label class="sample-check sample-emphasis"><input class="sample-switch" type="checkbox" role="switch" checked>이메일 알림 받기</label>',
      checkbox:
        '<label class="sample-check sample-emphasis"><input type="checkbox" checked>업데이트 소식 받기</label><label class="sample-check sample-emphasis"><input type="checkbox">주간 요약 받기</label>',
      toast: preview
        ? '<div class="sample-box sample-emphasis">✓ 변경 내용을 저장했어요.</div>'
        : button("저장 알림 띄우기", "toast", true),
      alert:
        '<div class="sample-box sample-warning"><strong>△ 확인이 필요해요</strong><p>변경 내용을 한 번 더 확인하세요.</p></div>',
      dialog: preview
        ? '<div class="sample-box"><h4 class="sample-emphasis">변경 내용을 저장할까요?</h4><p>작업 내용을 반영합니다.</p><div class="sample-actions"><span class="sample-badge">취소</span><span class="sample-badge sample-primary">저장</span></div></div>'
        : button("확인창 열어보기", "dialog", true),
      drawer: preview
        ? '<div class="sample-box sample-emphasis" style="margin-left:22%;width:78%;border-radius:0"><h4>프로젝트 상세</h4><p>맥락을 이어서 확인해요.</p><div class="mini-line"></div></div>'
        : button("옆 패널 열어보기", "drawer", true),
      tooltip:
        '<div class="sample-tooltip">' +
        button("도움말 보기", "tooltip").replace(
          "<button ",
          '<button aria-describedby="' + uid + '" ',
        ) +
        '<span id="' +
        uid +
        '" class="tip" role="tooltip"' +
        (preview ? ' style="display:block"' : "") +
        ">프로젝트를 함께 관리해요.</span></div>",
      menu: preview
        ? '<div class="sample-box sample-emphasis">프로젝트 동작 ▾<hr>이름 바꾸기<br>복제하기</div>'
        : '<details><summary class="sample-button sample-emphasis">프로젝트 동작 ▾</summary><ul class="menu-items"><li>' +
          button("이름 바꾸기", "action") +
          "</li><li>" +
          button("복제하기", "action") +
          "</li></ul></details>",
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
        '-overview">프로젝트의 주요 내용을 확인해요.</div>',
      breadcrumb:
        '<nav aria-label="현재 위치"><ol class="sample-crumbs"><li><a href="#sets">홈</a></li><li><a href="#encyclopedia-heading">프로젝트</a></li><li class="sample-emphasis" aria-current="page">상세</li></ol></nav>',
      pagination:
        '<nav class="sample-actions" aria-label="페이지"><button type="button" class="sample-button" data-page="prev" aria-label="이전 페이지" disabled>‹</button><span class="sample-badge sample-emphasis" aria-current="page" data-page-number>1 / 3</span><button type="button" class="sample-button" data-page="next" aria-label="다음 페이지">›</button></nav>',
      card: '<article class="sample-box"><h4 class="sample-emphasis">새로운 프로젝트</h4><p>아이디어를 한곳에 모으세요.</p><span class="sample-badge">멤버 3명</span></article>',
      badge:
        '<div class="sample-actions"><span class="sample-badge sample-emphasis">진행 중</span><span class="sample-badge sample-success">✓ 완료</span></div>',
      accordion:
        '<details class="sample-box"><summary class="sample-emphasis">어떻게 시작하나요?</summary><p>세트를 고르고 프로젝트에 필요한 요소를 확인하세요.</p></details>',
      empty:
        '<div class="sample-empty"><strong class="sample-emphasis">아직 프로젝트가 없어요</strong><p>첫 아이디어를 추가해 보세요.</p>' +
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
      notice("복사했어요.");
    } catch {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.append(t);
      t.select();
      const ok = document.execCommand("copy");
      t.remove();
      notice(ok ? "복사했어요." : "복사가 제한됩니다. 저장 버튼을 이용하세요.");
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
      theme,
    }).toString();
    return url.href;
  }
  function persist() {
    const linked = linkConfig();
    try {
      localStorage.setItem("palette-studio-handoff-v1", JSON.stringify(linked));
      $("save-status").textContent =
        recovery || "이 브라우저에 선택을 저장했어요.";
    } catch {
      $("save-status").textContent =
        "브라우저 저장이 제한돼요. 링크나 설정 JSON으로 보관하세요.";
    }
    const p = new URLSearchParams({ selection: JSON.stringify(linked), theme });
    try {
      history.replaceState(
        null,
        "",
        location.pathname + location.search + "#" + p,
      );
    } catch {}
    // Explicit fragment carries the configuration across file:// storage isolation.
    $("open-handoff").href =
      "handoff.html#catalogConfig=" +
      encodeURIComponent(JSON.stringify(linked));
  }
  function renderSets() {
    $("set-grid").innerHTML = designs.sets
      .map(
        (set, index) =>
          '<button type="button" class="set-card" data-set="' +
          set.id +
          '" aria-pressed="' +
          (config.designSelection.set === set.id) +
          '"><span class="set-mini" data-palette="' +
          set.palette +
          '" data-theme="' +
          theme +
          '" data-style="' +
          set.style +
          '"><span class="mini-panel"><span class="mini-kicker">PROJECT / 0' +
          (index + 1) +
          '</span><span class="mini-heading">작은 아이디어의 시작</span><span class="mini-line"></span><span class="mini-line" style="width:55%"></span></span><span class="mini-action">새 프로젝트 +</span><span class="mini-notice">✓ 변경 내용을 저장했어요</span></span><span class="set-caption"><span class="set-tag">' +
          set.tag +
          "</span><strong>" +
          set.name +
          "</strong><small>" +
          set.description +
          "</small></span></button>",
      )
      .join("");
  }
  function renderComponents() {
    const q = $("catalog-search").value.trim().toLocaleLowerCase(),
      category = $("catalog-category").value;
    const matches = designs.components.filter(
      (c) =>
        (category === "all" || category === c.category) &&
        [c.name, c.label, c.purpose, c.keywords]
          .join(" ")
          .toLocaleLowerCase()
          .includes(q),
    );
    $("component-grid").innerHTML = matches
      .map(
        (c) =>
          '<article class="component-card"><div class="component-preview" inert aria-hidden="true">' +
          demo(c.id, config.designSelection.components[c.id], true) +
          '</div><button type="button" class="component-caption" data-component="' +
          c.id +
          '"><strong>' +
          c.label +
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
    $("detail-demo").innerHTML = demo(active, variant);
  }
  function render() {
    document.documentElement.dataset.palette = config.palette;
    document.documentElement.dataset.style = config.style;
    document.documentElement.dataset.theme = theme;
    $("catalog-palette").value = config.palette;
    $("catalog-style").value = config.style;
    $("catalog-theme").value = theme;
    const set = designs.sets.find((s) => s.id === config.designSelection.set),
      p = palettes.palettes.find((p) => p.id === config.palette),
      s = palettes.styles.find((s) => s.id === config.style);
    const custom = Object.values(config.designSelection.components).filter(
      (v) => v !== set.variant,
    ).length;
    $("selection-label").textContent =
      set.name + " · " + custom + "개 요소 변경";
    $("recipe").innerHTML =
      '<div class="swatches" aria-hidden="true">' +
      [
        "--color-canvas",
        "--color-surface",
        "--color-line-strong",
        "--color-accent",
        "--color-ink",
      ]
        .map(
          (t) => '<span style="background:' + p.modes[theme][t] + '"></span>',
        )
        .join("") +
      "</div>" +
      [
        ["시작 세트", set.name],
        ["색상", p.name],
        ["형태", s.name],
        ["개별 변경", custom + " / 18"],
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
    renderComponents();
    persist();
    window.PaletteFonts.apply({
      bodyFont: config.fonts.body,
      codeFont: config.fonts.code,
      fontSource: config.fonts.source,
    });
  }
  function chooseSet(id) {
    const set = designs.sets.find((s) => s.id === id);
    config = core.normalize(
      { ...config, ...set.config, designSelection: designs.selection(id) },
      palettes,
      fonts,
      icons,
    );
    render();
    $("set-grid")
      .querySelector('[data-set="' + id + '"]')
      .focus({ preventScroll: true });
    notice(set.name + " 세트를 선택했어요.");
  }
  $("catalog-palette").innerHTML = palettes.palettes
    .map((p) => '<option value="' + p.id + '">' + esc(p.name) + "</option>")
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
  $("catalog-theme").addEventListener("change", (e) => {
    theme = e.target.value;
    render();
  });
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
      if (b.dataset.demo === "toast") {
        $("component-dialog").append($("demo-toast"));
        clearTimeout(toastTimer);
        $("demo-toast").hidden = false;
        const variant = config.designSelection.components.toast;
        $("demo-toast").className = "demo-toast treatment " + variant;
        $("demo-toast").style.width = "auto";
        toastTimer = setTimeout(() => ($("demo-toast").hidden = true), 5000);
      } else if (b.dataset.demo === "dialog") {
        $("demo-dialog").dataset.treatment =
          config.designSelection.components.dialog;
        $("demo-dialog").showModal();
      } else if (b.dataset.demo === "drawer") {
        $("demo-drawer").dataset.treatment =
          config.designSelection.components.drawer;
        $("demo-drawer").showModal();
      } else if (b.dataset.demo === "tooltip") {
        const tip = b.parentElement.querySelector(".tip");
        tip.hidden = false;
        tip.style.display = "block";
      } else
        notice(
          b.dataset.demo === "cancel"
            ? "취소했어요."
            : "동작을 실행했어요. 미리보기 예시입니다.",
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
        ? "프로젝트의 주요 내용을 확인해요."
        : "오늘 디자인을 변경했어요.";
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
    if (e.key === "Escape")
      document.querySelectorAll(".tip").forEach((t) => {
        t.hidden = true;
        t.style.display = "none";
      });
  });
  $("component-dialog").addEventListener("close", () => {
    clearTimeout(toastTimer);
    $("demo-toast").hidden = true;
    document.body.append($("demo-toast"));
    const opener = $("component-grid").querySelector(
      '[data-component="' + active + '"]',
    );
    (opener || $("catalog-search")).focus({ preventScroll: true });
  });
  $("dismiss-toast").addEventListener(
    "click",
    () => ($("demo-toast").hidden = true),
  );
  for (const event of ["mouseenter", "focusin"])
    $("demo-toast").addEventListener(event, () => clearTimeout(toastTimer));
  for (const event of ["mouseleave", "focusout"])
    $("demo-toast").addEventListener(event, () => {
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => ($("demo-toast").hidden = true), 5000);
    });
  $("copy-brief").addEventListener("click", () =>
    copy(core.agentTask(config, palettes)),
  );
  $("download-brief").addEventListener("click", () =>
    download("AGENT-TASK.md", core.agentTask(config, palettes)),
  );
  $("download-config").addEventListener("click", () =>
    download("handoff-config.json", JSON.stringify(config, null, 2) + "\n"),
  );
  $("share-selection").addEventListener("click", () => copy(shareURL()));
  window.PaletteCatalog = {
    getConfig: () => JSON.parse(JSON.stringify(config)),
  };
  render();
})();
