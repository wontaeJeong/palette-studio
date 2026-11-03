/* Palette Studio Icon Studio. No runtime CDN dependencies. */
(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };
  var paletteKit = window.PALETTE_KIT || { palettes: [], defaultPalette: "" };
  var palettes = paletteKit.palettes;
  var icons = (window.PALETTE_ICON_PARTS || []).flat();
  var categories = [
    ["all", "전체"], ["navigation", "탐색"], ["actions", "동작"],
    ["content", "콘텐츠"], ["identity", "계정·보안"],
    ["system", "시스템"], ["data", "개발·데이터"]
  ];
  var modes = ["split", "light", "dark"];
  var variants = ["outline", "accent", "duotone", "filled"];
  var storageKey = "palette-studio-icons-v1";
  var readStorage = function (key) {
    try { return JSON.parse(localStorage.getItem(key) || "{}"); }
    catch (_) { return {}; }
  };
  var mainState = readStorage("palette-studio-v1");
  var saved = readStorage(storageKey);
  var params = new URLSearchParams(location.hash.slice(1));
  var paletteIds = palettes.map(function (p) { return p.id; });
  var choose = function (value, allowed, fallback) {
    return allowed.indexOf(value) >= 0 ? value : fallback;
  };
  var state = {
    palette: choose(params.get("palette") || saved.palette || mainState.palette,
      paletteIds, paletteKit.defaultPalette || paletteIds[0]),
    mode: choose(params.get("mode") || saved.mode, modes, "split"),
    variant: choose(params.get("variant") || saved.variant, variants, "outline"),
    size: choose(Number(params.get("size") || saved.size || 24), [16, 20, 24, 28, 32, 36, 40], 24),
    stroke: choose(Number(params.get("stroke") || saved.stroke || 2), [1.5, 2, 2.5], 2),
    category: choose(saved.category, categories.map(function (c) { return c[0]; }), "all"),
    query: "",
    selected: saved.selected || "shield-check",
    codeKind: choose(saved.codeKind, ["react", "html", "css"], "react")
  };
  var byName = new Map(icons.map(function (icon) { return [icon.name, icon]; }));
  if (!byName.has(state.selected)) state.selected = icons[0] ? icons[0].name : "";
  var escapeHtml = function (value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var toastTimer;
  function toast(message) {
    $("icon-toast").textContent = message;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $("icon-toast").textContent = ""; }, 2500);
  }
  function persist() {
    try { localStorage.setItem(storageKey, JSON.stringify(state)); }
    catch (_) {}
    var p = new URLSearchParams();
    ["palette", "mode", "variant", "size", "stroke"].forEach(function (key) {
      p.set(key, String(state[key]));
    });
    try { history.replaceState(null, "", location.pathname + location.search + "#" + p.toString()); }
    catch (_) {}
    $("open-palette").href = "START-HERE.html#palette=" + encodeURIComponent(state.palette);
  }
  function svgSource(icon, size, stroke, decorative) {
    var sizeValue = Number(size) || 24;
    var widthValue = Number(stroke) || 2;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + sizeValue +
      '" height="' + sizeValue +
      '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
      widthValue + '" stroke-linecap="round" stroke-linejoin="round"' +
      (decorative ? ' aria-hidden="true" focusable="false"' : "") + '>' +
      icon.body + "</svg>";
  }
  function visual(icon) {
    return '<span class="ic-icon icon-variant--' + escapeHtml(state.variant) +
      '" style="--ic-wrap:' + Math.max(state.size + 16, 40) + 'px">' +
      svgSource(icon, state.size, state.stroke, true) + "</span>";
  }
  function themePane(mode, filtered) {
    var palette = palettes.find(function (p) { return p.id === state.palette; });
    var label = mode === "light" ? "LIGHT" : "DARK";
    var caption = escapeHtml(palette ? palette.name : state.palette);
    var markup = filtered.length ? filtered.map(function (icon) {
      return '<button type="button" class="ic-icon-btn" data-icon="' + escapeHtml(icon.name) +
        '" aria-pressed="' + (icon.name === state.selected) + '" aria-label="' +
        escapeHtml(icon.label + " (" + icon.name + ")") + '">' +
        visual(icon) + '<span class="ic-icon-name">' + escapeHtml(icon.name) + "</span></button>";
    }).join("") : '<p class="ic-empty">해당하는 아이콘이 없습니다. 검색어나 분류를 변경하세요.</p>';
    return '<section class="ic-theme-palette" data-palette="' + escapeHtml(state.palette) +
      '" data-theme="' + mode + '" aria-label="' + label + ' 아이콘 목록">' +
      '<header class="ic-theme-caption"><strong>' + caption + '</strong><span>' +
      label + "</span></header>" +
      (filtered.length ? '<div class="ic-tiles">' + markup + "</div>" : markup) + "</section>";
  }
  function filteredIcons() {
    var query = state.query.toLocaleLowerCase().trim();
    return icons.filter(function (icon) {
      return (state.category === "all" || icon.category === state.category) &&
        (!query || (icon.name + " " + icon.label + " " + icon.category)
          .toLocaleLowerCase().includes(query));
    });
  }
  function renderGallery() {
    var filtered = filteredIcons();
    var modesToShow = state.mode === "split" ? ["light", "dark"] : [state.mode];
    $("icon-gallery").innerHTML = modesToShow.map(function (mode) {
      return themePane(mode, filtered);
    }).join("");
    $("icon-result-count").textContent = filtered.length + "개 검색됨 · 선택 " +
      escapeHtml((byName.get(state.selected) || {}).name || "없음");
    $("total-count").textContent = icons.length;
  }
  function renderCategories() {
    $("icon-categories").innerHTML = categories.map(function (entry) {
      var count = entry[0] === "all" ? icons.length :
        icons.filter(function (icon) { return icon.category === entry[0]; }).length;
      return '<button type="button" data-category="' + entry[0] +
        '" aria-pressed="' + (state.category === entry[0]) + '">' +
        escapeHtml(entry[1]) + " " + count + "</button>";
    }).join("");
  }
  function componentName(name) {
    return name.split("-").map(function (part) {
      return part.slice(0, 1).toUpperCase() + part.slice(1);
    }).join("");
  }
  function codeExample(icon) {
    var svg = svgSource(icon, state.size, state.stroke, false);
    var token = state.variant === "outline" ? "--color-ink" : "--color-accent";
    if (state.codeKind === "html") {
      return '<span style="color: var(' + token + '); display:inline-flex">\n  ' +
        svg + "\n</span>\n<!-- SVG is inline, so currentColor is inherited. -->";
    }
    if (state.codeKind === "css") {
      return ".app-icon { color: var(--color-ink); width: " + state.size +
        "px; height: " + state.size + "px; }\n" +
        ".app-icon--accent { color: var(--color-accent); }\n" +
        ".app-icon--duotone > :nth-child(even) { stroke: var(--color-accent); }\n" +
        ".app-icon-tile { background: var(--color-accent); color: var(--color-on-accent); }\n" +
        "/* Inline SVG must use stroke='currentColor'. */";
    }
    var comp = componentName(icon.name);
    var element = "<" + comp + " size={" + state.size + "} strokeWidth={" + state.stroke +
      '} style={{ color: "var(' + token + ')" }} aria-hidden="true" />';
    if (state.variant === "filled") {
      element = '<span className="icon-tile">\n  ' + element + "\n</span>";
    } else if (state.variant === "duotone") {
      element = '<span className="icon-duotone">\n  ' + element + "\n</span>";
    }
    return 'import { ' + comp + ' } from "lucide-react";\n\n' +
      element + "\n\n// Use shared theme tokens; see docs/ICON-KIT.md.";
  }
  function renderDetail() {
    var icon = byName.get(state.selected);
    if (!icon) { $("icon-detail").textContent = "아이콘이 없습니다."; return; }
    var category = categories.find(function (c) { return c[0] === icon.category; });
    $("icon-detail").innerHTML = '<div class="ic-detail-split">' +
      ["light", "dark"].map(function (mode) {
        return '<div class="ic-theme-palette" data-palette="' + escapeHtml(state.palette) +
          '" data-theme="' + mode + '"><div class="ic-detail-sample">' + visual(icon) +
          '<div><p class="ic-detail-name">' + escapeHtml(icon.name) +
          '</p><span class="ic-detail-cat">' + (mode === "light" ? "LIGHT" : "DARK") +
          " · " + escapeHtml(category ? category[1] : "") + "</span></div></div></div>";
      }).join("") + "</div>";
    $("icon-code").textContent = codeExample(icon);
  }
  function render() {
    $("icon-palette").value = state.palette;
    $("icon-mode").value = state.mode;
    $("icon-variant").value = state.variant;
    $("icon-size").value = state.size;
    $("size-value").value = state.size + "px";
    $("icon-stroke").value = state.stroke;
    $("icon-code-kind").value = state.codeKind;
    renderCategories();
    renderGallery();
    renderDetail();
    persist();
  }
  async function copy(value) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw Error("clipboard");
      await navigator.clipboard.writeText(value);
      toast("복사했습니다.");
    } catch (_) {
      var element = document.createElement("textarea");
      element.value = value;
      element.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.appendChild(element);
      element.select();
      var success = document.execCommand("copy");
      element.remove();
      toast(success ? "복사했습니다." : "복사할 수 없습니다. 다운로드를 사용하세요.");
    }
  }
  function download(icon) {
    var content = svgSource(icon, state.size, state.stroke, false) + "\n";
    var url = URL.createObjectURL(new Blob([content], { type: "image/svg+xml" }));
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = icon.name + ".svg";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast(icon.name + ".svg 다운로드를 요청했습니다.");
  }
  $("icon-palette").innerHTML = palettes.map(function (p) {
    return '<option value="' + escapeHtml(p.id) + '">' + escapeHtml(p.name) + "</option>";
  }).join("");
  $("icon-palette").addEventListener("change", function (event) {
    state.palette = event.target.value; render();
  });
  $("icon-mode").addEventListener("change", function (event) {
    state.mode = event.target.value; render();
  });
  $("icon-variant").addEventListener("change", function (event) {
    state.variant = event.target.value; render();
  });
  $("icon-size").addEventListener("input", function (event) {
    state.size = Number(event.target.value); render();
  });
  $("icon-stroke").addEventListener("change", function (event) {
    state.stroke = Number(event.target.value); render();
  });
  $("icon-search").addEventListener("input", function (event) {
    state.query = event.target.value; renderGallery();
  });
  $("icon-categories").addEventListener("click", function (event) {
    var button = event.target.closest("[data-category]");
    if (!button) return;
    state.category = button.dataset.category;
    renderCategories(); renderGallery(); persist();
  });
  $("icon-gallery").addEventListener("click", function (event) {
    var button = event.target.closest("[data-icon]");
    if (!button) return;
    state.selected = button.dataset.icon;
    renderGallery(); renderDetail(); persist();
  });
  $("icon-code-kind").addEventListener("change", function (event) {
    state.codeKind = event.target.value; renderDetail(); persist();
  });
  $("copy-svg").addEventListener("click", function () {
    var icon = byName.get(state.selected);
    if (icon) copy(svgSource(icon, state.size, state.stroke, false));
  });
  $("download-svg").addEventListener("click", function () {
    var icon = byName.get(state.selected);
    if (icon) download(icon);
  });
  $("copy-code").addEventListener("click", function () {
    var icon = byName.get(state.selected);
    if (icon) copy(codeExample(icon));
  });
  window.PaletteIconStudio = {
    icons: icons,
    getState: function () { return Object.assign({}, state); },
    svgSource: svgSource,
    codeExample: codeExample
  };
  render();
}());
