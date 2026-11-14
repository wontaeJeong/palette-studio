/* Shared navigation recipes for previews and exported CSS. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PaletteNavigationDesigns = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const styles = [
    { id: "edge", name: "옆선", description: "배경 없이 왼쪽 선", rule: "Keep the selected background unchanged; mark the leading edge with a 3px line and bold text." },
    { id: "underline", name: "밑줄", description: "글자 아래 선", rule: "Keep the background unchanged; use a 3px underline and bold text." },
    { id: "pill", name: "알약", description: "둥근 선택 영역", rule: "Use a fully rounded selected surface with a visible boundary and bold text." },
    { id: "fill", name: "채움", description: "선택 영역 전체 채움", rule: "Fill the selected rectangular item with accent, on-accent text and bold weight." },
    { id: "outline", name: "테두리", description: "선택 영역 테두리", rule: "Keep the background unchanged; draw a 2px outline around the selected item and use bold text." },
    { id: "dot", name: "점", description: "항목 앞 선택 표시", rule: "Keep the background unchanged; use a visible leading dot and bold text for the current item." },
  ];
  const structures = [
    { id: "list", name: "목록", description: "아이콘과 이름을 한 줄로 표시" },
    { id: "grouped", name: "그룹", description: "그룹 이름과 간격으로 구분" },
    { id: "rail", name: "아이콘", description: "아이콘 중심 · 포커스 시 이름 표시" },
  ];
  const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  function get(items, id) {
    const item = items.find(item => item.id === id);
    if (!item) throw Error("Invalid navigation recipe: " + id);
    return item;
  }
  const baseCSS = `
.ps-navigation { display:flex; flex-direction:column; gap:var(--ps-nav-gap,6px); padding:var(--ps-nav-padding,10px); background:var(--color-nav-bg); color:var(--color-nav-fg); min-width:0; }
.ps-navigation .ps-nav-group { display:flex; flex-direction:inherit; gap:var(--ps-nav-gap,6px); min-width:0; }
.ps-navigation .ps-nav-heading { display:none; }
.ps-navigation .ps-nav-item { box-sizing:border-box; position:relative; display:flex; align-items:center; gap:var(--ps-nav-gap,8px); min-height:var(--ps-nav-height,40px); padding:var(--ps-nav-item-padding,8px 10px); border:2px solid transparent; border-radius:4px; background:var(--color-nav-bg); color:var(--color-nav-fg); font:inherit; font-size:var(--ps-nav-font,14px); font-weight:400; text-align:start; text-decoration:none; cursor:pointer; }
.ps-navigation .ps-nav-item:hover:not(:disabled) { background:var(--color-nav-hover); }
.ps-navigation .ps-nav-item:focus-visible { outline:2px solid var(--color-focus-ring); outline-offset:2px; z-index:2; }
.ps-navigation .ps-nav-item:disabled { cursor:not-allowed; color:var(--color-disabled-fg); background:var(--color-disabled-bg); }
.ps-navigation .ps-nav-item[aria-current="page"] { font-weight:700; }
.ps-navigation .ps-nav-icon { display:flex; flex-shrink:0; align-items:center; justify-content:center; width:var(--ps-nav-icon,20px); height:var(--ps-nav-icon,20px); }
.ps-navigation .ps-nav-icon svg { width:100%; height:100%; }
.ps-navigation .ps-nav-label { overflow-wrap:anywhere; }
.ps-navigation[data-nav-orientation="horizontal"] { flex-direction:row; flex-wrap:wrap; align-items:center; }
.ps-navigation[data-nav-orientation="horizontal"] .ps-nav-group { flex-wrap:wrap; }
@media (prefers-reduced-motion:reduce) { .ps-navigation .ps-nav-item { transition:none; } }
`;
  function styleCSS(id) {
    get(styles,id);
    const root = `.ps-navigation[data-nav-style="${id}"]`, active = `${root} .ps-nav-item[aria-current="page"]`;
    return {
      edge: `${active} { border-radius:0; border-inline-start:3px solid var(--color-nav-active-line); background:var(--color-nav-bg); }`,
      underline: `${active} { border-radius:0; border-bottom:3px solid var(--color-nav-active-line); background:var(--color-nav-bg); }`,
      pill: `${root} .ps-nav-item { border-radius:999px; }\n${active} { background:var(--color-nav-active-bg); color:var(--color-nav-active-fg); border-color:var(--color-nav-active-line); }`,
      fill: `${active} { border-radius:4px; background:var(--color-accent); color:var(--color-on-accent); border-color:var(--color-accent); }`,
      outline: `${active} { background:var(--color-nav-bg); border-color:var(--color-nav-active-line); }`,
      dot: `${root} .ps-nav-item { padding-inline-start:calc(var(--ps-nav-icon,20px) + 2px); }\n${active} { background:var(--color-nav-bg); }\n${active}::before { content:""; position:absolute; inset-inline-start:6px; width:6px; height:6px; border-radius:50%; background:var(--color-nav-fg); }`,
    }[id];
  }
  function structureCSS(id) {
    get(structures,id);
    const root = `.ps-navigation[data-nav-structure="${id}"]`;
    return {
      list: `${root} { gap:var(--ps-nav-gap,6px); }`,
      grouped: `${root} { gap:var(--ps-nav-section-gap,18px); }\n${root} .ps-nav-heading { display:block; font-size:var(--ps-nav-group-font,12px); padding:4px 8px; font-weight:700; }\n${root} .ps-nav-group + .ps-nav-group { border-top:1px solid var(--color-line); padding-top:8px; }\n${root}[data-nav-orientation="horizontal"] .ps-nav-group + .ps-nav-group { border-top:0; border-inline-start:1px solid var(--color-line); padding-top:0; padding-inline-start:8px; }`,
      rail: `${root} .ps-nav-item { justify-content:center; }\n${root} .ps-nav-label { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }\n${root} .ps-nav-item:is(:hover,:focus-visible) .ps-nav-label { clip-path:none; width:max-content; max-width:180px; height:auto; margin:0; padding:6px 8px; inset-inline-start:100%; top:0; background:var(--color-tooltip-bg); color:var(--color-tooltip-fg); border:1px solid var(--color-line-strong); border-radius:4px; z-index:3; }\n${root}[data-nav-orientation="horizontal"] .ps-nav-item:is(:hover,:focus-visible) .ps-nav-label { inset-inline-start:0; top:100%; }\n@media (max-width:767px) { ${root} .ps-nav-item { flex-direction:column; } ${root} .ps-nav-item .ps-nav-label, ${root} .ps-nav-item:is(:hover,:focus-visible) .ps-nav-label { position:static; clip-path:none; width:auto; height:auto; margin:0; padding:0; overflow:visible; white-space:normal; background:inherit; color:inherit; border:0; } }`,
    }[id];
  }
  function css(style, structure) { return baseCSS + styleCSS(style) + "\n" + structureCSS(structure) + "\n"; }
  function allCSS() { return baseCSS + styles.map(s => styleCSS(s.id)).join("\n") + "\n" + structures.map(s => structureCSS(s.id)).join("\n"); }
  function markup({ style, structure, orientation = "vertical", interactive = true, active = "projects", icons = {}, className = "", label = "프로젝트 메뉴" }) {
    get(styles,style); get(structures,structure);
    const tag = interactive ? "button" : "span", root = interactive ? "nav" : "span";
    const items = [{id:"projects",label:"프로젝트",group:"작업"},{id:"settings",label:"설정",group:"관리"}];
    const groups = structure === "grouped" ? items.map(item => [item]) : [items];
    return `<${root} class="ps-navigation ${esc(className)}" data-nav-style="${style}" data-nav-structure="${structure}" data-nav-orientation="${orientation === "horizontal" ? "horizontal" : "vertical"}" aria-label="${esc(label)}">${groups.map(group => `<span class="ps-nav-group">${structure === "grouped" ? `<span class="ps-nav-heading">${group[0].group}</span>` : ""}${group.map(item => `<${tag} class="ps-nav-item" ${interactive ? `type="button" data-nav-page="${item.id}"` : ""} aria-label="${item.label}" ${item.id === active ? 'aria-current="page"' : ""}><span class="ps-nav-icon" aria-hidden="true">${icons[item.id] || (item.id === "projects" ? "▦" : "⚙")}</span><span class="ps-nav-label">${item.label}</span></${tag}>`).join("")}</span>`).join("")}</${root}>`;
  }
  function brief(style, structure) {
    const appearance=get(styles,style), layout=get(structures,structure);
    return ["Navigation appearance: "+appearance.name+" ("+style+"). "+appearance.rule,"Navigation structure: "+layout.name+" ("+structure+"). "+layout.description,"Use .ps-navigation with data-nav-style, data-nav-structure and data-nav-orientation; .ps-nav-group, .ps-nav-heading, .ps-nav-item, .ps-nav-icon and .ps-nav-label match selected-style.css. Use links for routes, buttons for local actions and aria-current=page for the current route. Preserve native keyboard activation, visible focus and accessible names; disabled actions must not activate. Group related routes without duplicating destinations. Retain visible names on narrow screens and focus/hover labels for icon rails. Adapt to the existing app's navigation only within the authorized scope.","Example markup (replace sample buttons with real links for routes and use selected Lucide SVG icons):",markup({style,structure})].join("\n");
  }
  return { styles, structures, css, allCSS, markup, brief };
});
