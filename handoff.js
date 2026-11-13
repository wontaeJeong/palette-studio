/* Palette Studio offline handoff: UI input mapped to the same pure core as the CLI. */
(function () {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const core = window.PaletteHandoff;
  const catalog = window.PALETTE_KIT;
  const fonts = window.PALETTE_FONT_CATALOG;
  const icons = (window.PALETTE_ICON_PARTS || []).flat();
  const esc = (x) => String(x).replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const readSaved = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); }
    catch (_) { return {}; }
  };
  const main = readSaved("palette-studio-v1");
  const saved = readSaved("palette-studio-handoff-v1");
  const iconSaved = readSaved("palette-studio-icons-v1");
  const hash = new URLSearchParams(location.hash.slice(1));
  const initial = core.defaults(catalog, fonts, icons);
  const primary = {
    palette: main.palette || initial.palette, style: main.style || initial.style,
    target: main.target === "existing-gate" ? "existing-app" : (main.target || initial.target), scope: main.scope || initial.scope,
    fonts: { body: main.bodyFont || initial.fonts.body,
      code: main.codeFont || initial.fonts.code,
      source: main.fontSource || initial.fonts.source },
    icons: initial.icons
  };
  if (main.target === "existing-app") primary.layout = "existing";
  if (icons.some((item) => item.name === iconSaved.selected) &&
      !primary.icons.includes(iconSaved.selected))
    primary.icons = primary.icons.concat([iconSaved.selected]);
  const candidates = { ...initial, ...primary, ...saved, fonts: {
    ...initial.fonts, ...primary.fonts, ...(saved.fonts || {})
  }};
  for (const key of ["palette", "style", "target", "scope", "layout", "framework", "project"]) {
    if (hash.has(key)) candidates[key] = hash.get(key);
  }
  for (const [urlKey, fontKey] of [["bodyFont", "body"], ["codeFont", "code"], ["fontSource", "source"]]) {
    if (hash.has(urlKey)) candidates.fonts[fontKey] = hash.get(urlKey);
  }
  if (hash.has("icons")) candidates.icons = hash.get("icons").split(",").filter(Boolean);
  if (hash.has("catalogConfig")) {
    try { Object.assign(candidates, JSON.parse(hash.get("catalogConfig"))); } catch (_) {}
  }
  if (hash.has("designSelection")) {
    try { candidates.designSelection = JSON.parse(hash.get("designSelection")); } catch (_) {}
  }
  let config;
  try { config = core.normalize(candidates, catalog, fonts, icons); }
  catch (_) { config = core.normalize(initial, catalog, fonts, icons); }
  let mode = "split", iconQuery = "", noticeTimer;
  const selects = {
    "ah-palette": "palette", "ah-style": "style", "ah-layout": "layout",
    "ah-target": "target", "ah-scope": "scope", "ah-framework": "framework",
    "ah-body-font": "body", "ah-code-font": "code", "ah-font-source": "source"
  };
  const rows = icons.slice().sort((a, b) => a.name.localeCompare(b.name));
  const tokenFields = ["ah-palette", "ah-style", "ah-target", "ah-scope",
    "ah-layout", "ah-framework"];
  const doc = (c) => core.designMD(c, catalog);
  const exportsFor = (c) => ({
    "design.md": doc(c),
    "design-profile.json": JSON.stringify(core.profile(c, catalog), null, 2) + "\n",
    "selected-theme.css": core.themeCSS(c, catalog),
    "selected-style.css": core.styleCSS(c, catalog),
    "selected-motion.css": core.motionCSS(c),
    "selected-fonts.css": core.fontCSS(c, fonts),
    "AGENT-TASK.md": core.agentTask(c,catalog),
    "QA-CHECKLIST.md": core.checklist(c)
  });
  function toast(message) {
    $("ah-toast").textContent = message;
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => { $("ah-toast").textContent = ""; }, 2300);
  }
  function saveFile(name, body) {
    const type = name.endsWith(".json") ? "application/json" : "text/plain";
    const url = URL.createObjectURL(new Blob([body], { type: type + ";charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast(name + " 저장을 요청했습니다.");
  }
  async function copyText(content) {
    try {
      if (!navigator.clipboard?.writeText) throw Error("clipboard unavailable");
      await navigator.clipboard.writeText(content);
      toast("복사했습니다.");
    } catch (_) {
      const textarea = document.createElement("textarea");
      textarea.value = content; textarea.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.append(textarea); textarea.select();
      const success = document.execCommand("copy"); textarea.remove();
      toast(success ? "복사했습니다." : "복사가 제한됩니다. 저장 버튼을 이용하세요.");
    }
  }
  function persist() {
    try { localStorage.setItem("palette-studio-handoff-v1", JSON.stringify(config)); }
    catch (_) {}
    const params = new URLSearchParams();
    for (const key of ["palette", "style", "layout", "target", "scope", "framework", "project"]) {
      params.set(key, config[key]);
    }
    params.set("bodyFont", config.fonts.body);
    params.set("codeFont", config.fonts.code);
    params.set("fontSource", config.fonts.source);
    params.set("icons", config.icons.join(","));
    if (config.designSelection) params.set("designSelection", JSON.stringify(config.designSelection));
    try { history.replaceState(null, "", location.pathname + location.search + "#" + params); }
    catch (_) {}
  }
  function renderPicker() {
    const q = iconQuery.trim().toLocaleLowerCase();
    const filtered = rows.filter((icon) =>
      (icon.name + " " + icon.label + " " + icon.category).toLocaleLowerCase().includes(q));
    $("ah-icon-picker").innerHTML = filtered.length ? filtered.map((icon) =>
      '<label><input type="checkbox" value="' + esc(icon.name) + '"' +
      (config.icons.includes(icon.name) ? " checked" : "") + "><span>" +
      esc(icon.label) + " · " + esc(icon.name) + "</span></label>").join("") :
      '<p class="ah-note">검색 결과가 없습니다.</p>';
    $("ah-icon-count").textContent = config.icons.length + " / 24";
  }
  function renderPreview() {
    const p = catalog.palettes.find((item) => item.id === config.palette);
    const title = config.layout === "content" ? "문서 탐색" :
      config.layout === "workflow" ? "요청 처리" :
      config.layout === "marketing" ? "제품 개요" : "프로젝트 현황";
    const panes = mode === "split" ? ["light", "dark"] : [mode];
    $("ah-preview-grid").innerHTML = panes.map((theme) =>
      '<div class="ah-mock" data-theme="' + esc(theme) + '" data-palette="' +
        esc(config.palette) + '" data-style="' + esc(config.style) + '">' +
        '<div class="ah-mock-header"><span>' + esc(p.name) + '</span><span>' +
        theme.toUpperCase() + '</span></div>' +
        '<div class="ah-mock-area"><div class="ah-mock-title">' + title + '</div>' +
        '<div class="ah-mock-tab">개요</div>' +
        '<div class="ah-mock-metric">1,284</div>' +
        '<div class="ah-mock-desc">샘플 데이터 · 30일 기준</div>' +
        '<div class="ah-mock-row"><span>진행 항목</span><strong>32</strong></div>' +
        '<div class="ah-mock-row"><span>완료</span><strong class="ah-mock-good">28 · 완료</strong></div>' +
        '<div class="ah-mock-row"><span>검토 필요</span><strong class="ah-mock-warn">4 · 검토</strong></div>' +
        '<div class="ah-mock-row"><span>현재 선택</span><span class="ah-mock-chip">활성</span></div>' +
        '</div></div>'
    ).join("");
    document.querySelectorAll("[data-mode]").forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
  }
  function render() {
    const fields = {
      "ah-project": config.project, "ah-palette": config.palette,
      "ah-style": config.style, "ah-layout": config.layout,
      "ah-target": config.target, "ah-scope": config.scope,
      "ah-framework": config.framework,
      "ah-body-font": config.fonts.body, "ah-code-font": config.fonts.code,
      "ah-font-source": config.fonts.source
    };
    for (const [key, value] of Object.entries(fields)) $(key).value = value;
    renderPicker(); renderPreview();
    $("ah-markdown-preview").textContent = doc(config);
    $("ah-error").hidden = true;
    persist();
  }
  function change(input) {
    try {
      config = core.normalize(input, catalog, fonts, icons);
      render();
    } catch (error) {
      $("ah-error").textContent = String(error.message || error);
      $("ah-error").hidden = false;
    }
  }
  $("ah-palette").innerHTML = catalog.palettes.map((p) =>
    '<option value="' + esc(p.id) + '">' + esc(p.name) + "</option>").join("");
  $("ah-style").innerHTML = catalog.styles.map((s) =>
    '<option value="' + esc(s.id) + '">' + esc(s.name) + "</option>").join("");
  for (const [key, role] of [["ah-body-font", "body"], ["ah-code-font", "code"]]) {
    $(key).innerHTML = '<option value="system">System font</option>' +
      fonts.fonts.filter((f) => f.role === role).map((font) =>
        '<option value="' + esc(font.id) + '">' + esc(font.name) + "</option>").join("");
  }
  $("ah-project").addEventListener("change", (e) => change({ ...config, project: e.target.value }));
  for (const key of tokenFields) {
    $(key).addEventListener("change", (e) => {
      const property = selects[key];
      const changed = { ...config, [property]: e.target.value };
      if (property === "layout") changed.icons = core.iconPresets[changed.layout].filter(
        (name) => icons.some((icon) => icon.name === name));
      if (property === "target" && changed.target === "existing-app")
        changed.layout = "existing";
      change(changed);
    });
  }
  for (const key of ["ah-body-font", "ah-code-font", "ah-font-source"]) {
    $(key).addEventListener("change", (e) =>
      change({ ...config, fonts: { ...config.fonts, [selects[key]]: e.target.value } }));
  }
  $("ah-icon-search").addEventListener("input", (e) => {
    iconQuery = e.target.value; renderPicker();
  });
  $("ah-icon-picker").addEventListener("change", (event) => {
    const el = event.target;
    if (!(el instanceof HTMLInputElement) || el.type !== "checkbox") return;
    const next = el.checked ? config.icons.concat(el.value) :
      config.icons.filter((name) => name !== el.value);
    if (next.length > 24) {
      el.checked = false; toast("아이콘은 최대 24개까지 선택할 수 있습니다."); return;
    }
    change({ ...config, icons: next });
  });
  document.querySelectorAll("[data-mode]").forEach((button) =>
    button.addEventListener("click", () => { mode = button.dataset.mode; renderPreview(); }));
  $("ah-config-download").addEventListener("click", () =>
    saveFile("handoff-config.json", JSON.stringify(config, null, 2) + "\n"));
  document.querySelectorAll("[data-export]").forEach((button) =>
    button.addEventListener("click", () => {
      const file = button.dataset.export;
      const output = exportsFor(config);
      if (Object.hasOwn(output, file)) saveFile(file, output[file]);
    }));
  $("ah-copy-design").addEventListener("click", () => copyText(doc(config)));
  $("ah-copy-cli").addEventListener("click", () => copyText($("ah-cli").textContent));
  window.PaletteAgentHandoff = {
    getConfig: () => JSON.parse(JSON.stringify(config)),
    outputs: () => exportsFor(config)
  };
  render();
})();
