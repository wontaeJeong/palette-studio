/* One workspace consumes the catalog's canonical config and the CLI's pure renderers. */
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    catalog = window.PaletteCatalog,
    core = window.PaletteHandoff,
    kit = window.PALETTE_KIT,
    fonts = window.PaletteFonts,
    icons = (window.PALETTE_ICON_PARTS || []).flat(),
    initialView = window.PaletteInitialView || {};
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
  let config = catalog.getConfig(),
    previewMode = "split",
    compare = "slate-indigo",
    compareMode = "light";
  try {
    const saved = JSON.parse(
      localStorage.getItem("palette-studio-view-v1") || "{}",
    );
    previewMode = initialView.mode || saved.mode || previewMode;
    compare = initialView.compare || saved.compare || compare;
    compareMode = initialView.compareMode || saved.compareMode || compareMode;
  } catch {}
  if (!["split", "light", "dark", "compare"].includes(previewMode))
    previewMode = "split";
  if (!["light", "dark"].includes(compareMode)) compareMode = "light";
  if (!kit.palettes.some((p) => p.id === compare))
    ((compare = "slate-indigo"), (compareMode = "light"));
  function persistView() {
    try {
      localStorage.setItem(
        "palette-studio-view-v1",
        JSON.stringify({ mode: previewMode, compare, compareMode }),
      );
    } catch {}
  }
  let projectDraft = config.project,
    projectValid = true;
  const projects = [
    {
      name: "웹사이트 리뉴얼",
      team: "Product",
      status: "review",
      label: "! 검토 필요",
    },
    {
      name: "디자인 가이드",
      team: "Design",
      status: "passed",
      label: "✓ 완료",
    },
    {
      name: "모바일 프로젝트",
      team: "Engineering",
      status: "running",
      label: "◷ 진행 중",
    },
  ];
  const labels = {
    "design.md": "디자인 기준",
    "design-profile.json": "프로필 JSON",
    "selected-theme.css": "색상 CSS",
    "selected-style.css": "스타일 CSS",
    "selected-motion.css": "애니메이션 CSS",
    "selected-fonts.css": "폰트 CSS",
    "AGENT-TASK.md": "작업지시",
    "QA-CHECKLIST.md": "QA 체크리스트",
  };
  function outputs() {
    return {
      "design.md": core.designMD(config, kit),
      "design-profile.json":
        JSON.stringify(core.profile(config, kit), null, 2) + "\n",
      "selected-theme.css": core.themeCSS(config, kit),
      "selected-style.css": core.styleCSS(config, kit),
      "selected-motion.css": core.motionCSS(config),
      "selected-fonts.css": core.fontCSS(config, window.PALETTE_FONT_CATALOG),
      "AGENT-TASK.md": core.agentTask(config, kit),
      "QA-CHECKLIST.md": core.checklist(config),
    };
  }
  function notify(message) {
    $("icon-selection-status").textContent = message;
    $("catalog-status").textContent = message;
    setTimeout(() => {
      if ($("catalog-status").textContent === message)
        $("catalog-status").textContent = "";
    }, 2800);
  }
  function update(patch) {
    try {
      catalog.update(patch);
      $("export-error").hidden = projectValid;
      return true;
    } catch (error) {
      $("export-error").textContent =
        "프로젝트 이름은 문자·숫자로 시작하는 1–64자여야 합니다. 공백, _, -, .을 사용할 수 있습니다.";
      $("export-error").hidden = false;
      return false;
    }
  }
  function svg(name, size = 20) {
    const icon = icons.find((i) => i.name === name) || icons[0];
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icon.body}</svg>`;
  }
  function renderPaletteChoices() {
    $("palette-swatches").innerHTML = kit.palettes
      .map(
        (p) =>
          `<button type="button" class="palette-chip" data-palette-choice="${p.id}" aria-label="${esc(p.name)}" title="${esc(p.name)}" aria-pressed="${p.id === config.palette}">${["--color-canvas", "--color-surface", "--color-accent"].map((t) => `<i style="background:${p.modes.light[t]}"></i>`).join("")}</button>`,
      )
      .join("");
    $("appearance-summary").textContent = kit.styles.find(
      (s) => s.id === config.style,
    ).description;
  }
  function renderIcons() {
    const q = $("workspace-icon-search").value.trim().toLocaleLowerCase();
    const filtered = icons.filter((i) =>
      (i.name + " " + i.label + " " + i.category)
        .toLocaleLowerCase()
        .includes(q),
    );
    $("workspace-icons").innerHTML =
      filtered
        .map(
          (i) =>
            `<label class="icon-option"><input type="checkbox" data-select-icon="${i.name}" ${config.icons.includes(i.name) ? "checked" : ""} ${config.icons.length >= 24 && !config.icons.includes(i.name) ? "disabled" : ""} />${svg(i.name)}<span>${esc(i.label)}<small>${esc(i.name)}</small></span></label>`,
        )
        .join("") || '<p class="help">검색 결과가 없습니다.</p>';
    $("workspace-icon-count").textContent = config.icons.length + "개 선택";
    $("icon-selection-status").textContent =
      config.icons.length >= 24
        ? "24개를 선택했습니다. 다른 아이콘을 고르려면 선택한 아이콘을 먼저 해제하세요."
        : "";
  }
  async function renderFontGallery(role) {
    // Each role owns its search and does not replace the other role's DOM.
    const query = $(role + "-font-search")
      .value.trim()
      .toLocaleLowerCase();
    const list = window.PALETTE_FONT_CATALOG.fonts.filter(
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
          .includes(query),
    );
    $(role + "-font-gallery").innerHTML =
      list
        .map(
          (f) =>
            `<article class="font-card" data-font-id="${f.id}"><div><strong>${esc(f.name)}</strong><small>${f.korean ? "한글 포함" : "영문 중심 · 한글 보완"} · OFL</small></div><p class="font-sample">${role === "body" ? "다음 프로젝트를 위한 글꼴 Aa" : "const project = true; 0O 1lI"}</p><button type="button" data-font-role="${role}" data-apply-font="${f.id}" aria-pressed="${config.fonts[role] === f.id}">${config.fonts[role] === f.id ? "선택됨" : "이 글꼴 사용"}</button></article>`,
        )
        .join("") || '<p class="help">검색 결과가 없습니다.</p>';
    for (const card of $(role + "-font-gallery").querySelectorAll(
      ".font-card",
    )) {
      const font = list.find((f) => f.id === card.dataset.fontId);
      fonts
        .preview(
          font,
          config.fonts.source,
          card.querySelector(".font-sample").textContent,
        )
        .then((result) => {
          if (!card.isConnected) return;
          card.dataset.previewSource = result.source;
          card.querySelector(".font-sample").style.fontFamily = result.family;
        });
    }
  }
  function projectRows() {
    return projects
      .map(
        (p) =>
          `<tr data-status="${p.status}"><td><strong>${esc(p.name)}</strong><small>${esc(p.team)}</small></td><td><span class="sample-badge ${p.status === "passed" ? "sample-success" : p.status === "review" ? "sample-warning" : ""}">${p.label}</span></td></tr>`,
      )
      .join("");
  }
  function renderPreview() {
    const modes =
      previewMode === "split"
        ? ["light", "dark"]
        : previewMode === "compare"
          ? [compareMode, compareMode]
          : [previewMode];
    $("preview-mode").value = previewMode;
    $("compact-preview").innerHTML =
      `<span data-palette="${config.palette}" data-theme="light"><i></i><b>Aa</b><em>✓</em></span>`;
    $("compare-control").hidden = previewMode !== "compare";
    $("compare-mode-control").hidden = previewMode !== "compare";
    $("compare-mode").value = compareMode;
    $("project-stage").dataset.view = previewMode;
    $("project-stage").innerHTML = modes
      .map((mode, index) => {
        const palette =
          previewMode === "compare" && index === 1 ? compare : config.palette;
        const v = config.designSelection.components,
          navigation = config.designSelection.navigation;
        const demo = (id) => catalog.demo(id, v[id], true, mode + "-" + index);
        const nav = `<nav class="mock-nav" aria-label="샘플 프로젝트 메뉴"><button type="button" aria-label="프로젝트" aria-current="page">${svg(config.icons[0] || "layout-dashboard")}<span>프로젝트</span></button><button type="button" aria-label="설정" data-preview-notice="settings">${svg("settings")}<span>설정</span></button></nav>`;
        return `<section class="project-pane" data-theme="${mode}" data-palette="${palette}" data-style="${config.style}" data-project-preview><div class="project-pane-label"><span>${mode === "light" ? "LIGHT" : "DARK"}</span><span>${esc(kit.palettes.find((p) => p.id === palette).name)}</span></div><div class="mock-app nav-${navigation}" data-ps-motion="${config.designSelection.motion}"><div class="mock-top"><strong>${svg("layers")} My Workspace</strong><span>Product Team</span></div>${nav}${navigation === "hybrid" ? nav.replace('class="mock-nav"', 'class="mock-nav mock-secondary-nav"') : ""}<div class="mock-main"><div class="mock-title"><div><small>WORKSPACE / OVERVIEW</small><h3>좋은 아이디어를,<br>다음 프로젝트로.</h3><p>팀의 작업을 한눈에 확인하세요.</p></div></div><div class="mock-metrics"><article class="treatment ${v.card}"><div class="sample-box"><small>전체 프로젝트</small><strong>${projects.length + 9}<span>개</span></strong></div></article><article class="treatment ${v.card}"><div class="sample-box"><small>이번 주 완료</small><strong>8<span>개</span></strong></div></article></div><article class="mock-projects treatment ${v.card}"><div class="sample-box"><h4 class="sample-emphasis">최근 프로젝트</h4><label class="mock-search">${svg("search", 16)}<input type="search" data-project-search placeholder="프로젝트 검색" aria-label="샘플 프로젝트 검색" /></label><table><thead><tr><th scope="col">프로젝트</th><th scope="col">상태</th></tr></thead><tbody>${projectRows()}</tbody></table><p class="help mock-empty" hidden>검색 결과가 없습니다.</p></div></article><form class="mock-form"><h4>새 프로젝트</h4><label class="treatment ${v.input}">프로젝트 이름<input class="sample-input sample-emphasis" name="project" required placeholder="프로젝트 이름을 입력하세요" /></label><div class="treatment ${v.button}"><button type="submit" class="sample-button ${v.button === "solid" ? "sample-primary" : ""}">${svg("plus", 16)}프로젝트 추가</button></div></form><div class="mock-bottom">${demo("switch")}${demo("badge")}</div><pre class="workspace-code mock-code"><code>const project = {
  name: "My Workspace",
  ready: true
};</code></pre></div></div></section>`;
      })
      .join("");
    $("preview-selection").textContent =
      kit.palettes.find((p) => p.id === config.palette).name +
      " / " +
      kit.styles.find((s) => s.id === config.style).name;
  }
  function renderExport() {
    const names = [
      fonts.resolve(config.fonts.body, "body").name,
      fonts.resolve(config.fonts.code, "code").name,
    ];
    $("export-summary").textContent =
      kit.palettes.find((p) => p.id === config.palette).name +
      " · " +
      kit.styles.find((s) => s.id === config.style).name +
      " · " +
      names.join(" / ") +
      " · 아이콘 " +
      config.icons.length +
      "개";
    for (const key of ["target", "scope", "framework", "layout"])
      $(key).value = config[key];
    if ($("project-name").value !== projectDraft)
      $("project-name").value = projectDraft;
    $("font-source").value = config.fonts.source;
    $("scope-note").textContent =
      config.scope === "dark-only"
        ? "기존 라이트 색상은 유지하고 다크 색상만 내보냅니다."
        : config.scope === "light-only"
          ? "기존 다크 색상은 유지하고 라이트 색상만 내보냅니다."
          : "라이트와 다크 색상을 함께 내보냅니다.";
  }
  function render() {
    const previousSource = config.fonts.source;
    config = catalog.getConfig();
    if (
      previousSource !== config.fonts.source &&
      document.querySelector(".font-library").open
    )
      for (const role of ["body", "code"]) renderFontGallery(role);
    for (const role of ["body", "code"])
      $(role + "-font").value = config.fonts[role];
    $("font-summary").textContent =
      fonts.resolve(config.fonts.body, "body").name +
      " / " +
      fonts.resolve(config.fonts.code, "code").name;
    $("structure-summary").textContent =
      window.PaletteDesignCatalog.navigationPresets.find(
        (n) => n.id === config.designSelection.navigation,
      ).name +
      " · " +
      window.PaletteDesignCatalog.motionPresets.find(
        (m) => m.id === config.designSelection.motion,
      ).name;
    renderPaletteChoices();
    renderPreview();
    renderIcons();
    renderExport();
    document.querySelectorAll("[data-apply-font]").forEach((b) => {
      const selected = b.dataset.applyFont === config.fonts[b.dataset.fontRole];
      b.setAttribute("aria-pressed", String(selected));
      b.textContent = selected ? "선택됨" : "이 글꼴 사용";
    });
  }
  $("compare-palette").innerHTML = kit.palettes
    .map((p) => `<option value="${p.id}">${esc(p.name)}</option>`)
    .join("");
  $("compare-palette").value = compare;
  function selectFont(role, id) {
    const switchSource = config.fonts.source === "system" && id !== "system";
    update({
      fonts: { [role]: id, ...(switchSource ? { source: "local-only" } : {}) },
    });
    if (switchSource)
      notify("선택한 글꼴을 사용하도록 동봉 폰트로 변경했습니다.");
  }
  for (const role of ["body", "code"]) {
    $(role + "-font").innerHTML = fonts
      .choices(role)
      .map((f) => `<option value="${f.id}">${esc(f.name)}</option>`)
      .join("");
    $(role + "-font").addEventListener("change", (e) =>
      selectFont(role, e.target.value),
    );
    $(role + "-font-search").addEventListener("input", () =>
      renderFontGallery(role),
    );
    $(role + "-font-gallery").addEventListener("click", (e) => {
      const b = e.target.closest("[data-apply-font]");
      if (b) {
        const id = b.dataset.applyFont;
        selectFont(role, id);
        $(role + "-font-gallery")
          .querySelector(`[data-apply-font="${id}"]`)
          .focus({ preventScroll: true });
      }
    });
  }
  $("font-licenses").innerHTML = window.PALETTE_FONT_CATALOG.fonts
    .map(
      (f) =>
        `<details><summary>${esc(f.name)} · ${esc(f.version)} · ${esc(f.license)}</summary><a href="${esc(f.upstream)}" target="_blank" rel="noopener noreferrer">공식 출처</a><pre class="workspace-code">${esc(f.licenseText || "assets/fonts/" + f.id + "/OFL.txt")}</pre></details>`,
    )
    .join("");
  document.querySelector(".font-library").addEventListener("toggle", (e) => {
    if (e.target.open)
      for (const role of ["body", "code"]) renderFontGallery(role);
  });
  $("workspace-icon-search").addEventListener("input", renderIcons);
  $("workspace-icons").addEventListener("change", (e) => {
    const input = e.target.closest("[data-select-icon]");
    if (!input) return;
    const names = new Set(config.icons);
    input.checked
      ? names.add(input.dataset.selectIcon)
      : names.delete(input.dataset.selectIcon);
    if (names.size > 24) {
      input.checked = false;
      notify("아이콘은 최대 24개까지 선택할 수 있습니다.");
      return;
    }
    const name = input.dataset.selectIcon;
    update({ icons: [...names] });
    document
      .querySelector(`[data-select-icon="${name}"]`)
      ?.focus({ preventScroll: true });
  });
  $("palette-swatches").addEventListener("click", (e) => {
    const b = e.target.closest("[data-palette-choice]");
    if (b) {
      const id = b.dataset.paletteChoice;
      update({ palette: id });
      document
        .querySelector(`[data-palette-choice="${id}"]`)
        .focus({ preventScroll: true });
    }
  });
  $("preview-mode").addEventListener("change", (e) => {
    previewMode = e.target.value;
    persistView();
    renderPreview();
  });
  $("compare-palette").addEventListener("change", (e) => {
    compare = e.target.value;
    persistView();
    renderPreview();
  });
  $("compare-mode").addEventListener("change", (e) => {
    compareMode = e.target.value;
    persistView();
    renderPreview();
  });
  $("project-stage").addEventListener("input", (e) => {
    if (!e.target.matches("[data-project-search]")) return;
    const box = e.target.closest(".mock-projects"),
      q = e.target.value.toLocaleLowerCase();
    box
      .querySelectorAll("tbody tr")
      .forEach(
        (row) =>
          (row.hidden = !row.textContent.toLocaleLowerCase().includes(q)),
      );
    box.querySelector(".mock-empty").hidden = !!box.querySelector(
      "tbody tr:not([hidden])",
    );
  });
  $("project-stage").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get("project").trim();
    if (name) {
      projects.push({
        name,
        team: "Product Team",
        status: "running",
        label: "◷ 진행 중",
      });
      renderPreview();
      notify("샘플 프로젝트를 추가했습니다.");
    }
  });
  $("project-stage").addEventListener("click", (e) => {
    const b = e.target.closest("[data-preview-notice]");
    if (b) notify("설정 메뉴의 표시 예시입니다.");
  });
  $("open-export").addEventListener("click", () => {
    projectDraft = config.project;
    renderExport();
    $("export-dialog").showModal();
  });
  $("export-dialog").addEventListener("close", () => {
    projectDraft = config.project;
    projectValid = true;
    $("project-name").value = config.project;
    $("project-name").setAttribute("aria-invalid", "false");
    document
      .querySelectorAll(
        "#export-dialog [data-export],#download-config,#copy-brief",
      )
      .forEach((b) => (b.disabled = false));
    $("export-error").hidden = true;
    $("open-export").focus({ preventScroll: true });
  });
  $("project-name").addEventListener("input", (e) => {
    projectDraft = e.target.value;
    projectValid = update({ project: projectDraft });
    $("export-error").hidden = projectValid;
    e.target.setAttribute("aria-invalid", String(!projectValid));
    document
      .querySelectorAll(
        "#export-dialog [data-export],#download-config,#copy-brief",
      )
      .forEach((b) => (b.disabled = !projectValid));
  });
  for (const key of ["target", "scope", "framework", "layout"])
    $(key).addEventListener("change", (e) => update({ [key]: e.target.value }));
  $("font-source").addEventListener("change", (e) =>
    update({ fonts: { source: e.target.value } }),
  );
  $("export-files").innerHTML = Object.entries(labels)
    .map(
      ([name, label]) =>
        `<button type="button" data-export="${name}">${label} 저장</button>`,
    )
    .join("");
  $("export-files").addEventListener("click", (e) => {
    const b = e.target.closest("[data-export]");
    if (!b) return;
    const name = b.dataset.export,
      uri = URL.createObjectURL(
        new Blob([outputs()[name]], {
          type: name.endsWith(".json")
            ? "application/json"
            : "text/plain;charset=utf-8",
        }),
      );
    const a = document.createElement("a");
    a.href = uri;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(uri), 1000);
  });
  $("toggle-preview").addEventListener("click", () => {
    const expanded =
      $("toggle-preview").getAttribute("aria-expanded") !== "true";
    $("toggle-preview").setAttribute("aria-expanded", String(expanded));
    $("toggle-preview").textContent = expanded
      ? "미리보기 접기"
      : "미리보기 확대";
    $("preview-panel").classList.toggle("expanded", expanded);
  });
  $("selection-panel").addEventListener("focusin", () => {
    if (innerWidth >= 1000) return;
    $("preview-panel").classList.remove("expanded");
    $("toggle-preview").setAttribute("aria-expanded", "false");
    $("toggle-preview").textContent = "미리보기 확대";
    document.activeElement.scrollIntoView({
      block: "center",
      behavior: "instant",
    });
  });
  window.addEventListener("palette-selection", render);
  window.addEventListener("palette-font-status", (e) => {
    $("font-status").textContent = ["body", "code"]
      .map(
        (role) =>
          `${role === "body" ? "본문" : "코드"}: ${e.detail[role].name || ""} · ${{ pending: "불러오는 중", cdn: "CDN", local: "동봉", embedded: "내장", system: "시스템" }[e.detail[role].source] || e.detail[role].source}`,
      )
      .join(" / ");
  });
  window.PaletteWorkspace = {
    outputs,
    shareURL: () => {
      const u = new URL(location.href);
      u.hash = new URLSearchParams({
        selection: JSON.stringify(config),
        mode: previewMode,
        compare,
        compareMode,
      });
      return u.href;
    },
  };
  // Compatibility for font tooling; all results derive from the same normalized selection.
  window.PaletteStudio = {
    profile: () => core.profile(config, kit),
    selectedCSS: () => core.themeCSS(config, kit),
    fontCSS: () => core.fontCSS(config, window.PALETTE_FONT_CATALOG),
    readyFonts: () => catalog.readyFonts(),
  };
  render();
})();
