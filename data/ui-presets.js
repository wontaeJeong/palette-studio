/* Framework-neutral navigation and CSS motion contracts. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PaletteUIPresets = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const navigationPresets = [
    {
      id: "top",
      name: "상단 메뉴",
      description: "상단 높이 56px · 본문 최대 너비 1200px",
      rule: "Place primary navigation in a 56px top bar, with content max-width 1200px below it. At widths below 768px collapse navigation into a labeled menu trigger and accessible drawer; keep the current page visible.",
    },
    {
      id: "left",
      name: "좌측 메뉴",
      description: "좌측 너비 232px · 본문 패딩 24px",
      rule: "Place primary navigation in a 232px left sidebar and content in the remaining width with 24px padding. Below 768px replace the sidebar with a 56px top bar and accessible navigation drawer; preserve focus and current page indication.",
    },
    {
      id: "hybrid",
      name: "상단 + 좌측 메뉴",
      description: "상단 56px · 좌측 232px · 본문 패딩 24px",
      rule: "Use a 56px top bar for workspace/account actions and a 232px left sidebar for section navigation. Keep content padding 24px. Below 768px retain the top bar and move section navigation into an accessible drawer. Avoid duplicating navigation destinations.",
    },
  ];
  const motionPresets = [
    { id: "none", name: "전환 없음 · 0ms", duration: 0, distance: 0 },
    { id: "quick", name: "빠른 전환 · 120ms", duration: 120, distance: 4 },
    { id: "standard", name: "기본 전환 · 180ms", duration: 180, distance: 8 },
    { id: "extended", name: "긴 전환 · 260ms", duration: 260, distance: 12 },
  ];
  function navigationBrief(id) {
    const n = navigationPresets.find((n) => n.id === id);
    if (!n) throw Error("Invalid design selection navigation");
    return (
      "Navigation layout: " +
      n.name +
      " (" +
      n.id +
      "). " +
      n.rule +
      " Reuse the target app's existing navigation architecture when the requested scope does not authorize moving it; document any conflict."
    );
  }
  function motionBrief(id) {
    const m = motionPresets.find((m) => m.id === id);
    if (!m) throw Error("Invalid design selection motion");
    return (
      "CSS motion: " +
      m.name +
      " (" +
      m.id +
      "), easing cubic-bezier(0.2, 0, 0, 1), movement " +
      m.distance +
      "px. Use fade for toast/tooltip, translate for drawer, subtle scale for dialog and expansion only for accordion content. Respect prefers-reduced-motion: reduce with no transition or animation. Preserve focus, state and content visibility; no infinite decorative animation. Use selected-motion.css or map these values to the existing motion system."
    );
  }
  function motionCSS(id) {
    const m = motionPresets.find((m) => m.id === id);
    if (!m) throw Error("Invalid design selection motion");
    const selector = '[data-ps-motion="' + m.id + '"]';
    return (
      '/* Add data-ps-motion="' +
      m.id +
      '" to a scoped container. Apply a ps-motion-* class only while entering/expanding; remove after completion before replay. */\n' +
      selector +
      " { --ps-motion-duration: " +
      m.duration +
      "ms; --ps-motion-distance: " +
      m.distance +
      "px; --ps-motion-ease: cubic-bezier(0.2, 0, 0, 1); }\n" +
      ["fade", "slide", "scale", "expand"]
        .map(
          (effect) =>
            selector +
            " .ps-motion-" +
            effect +
            " { animation: " +
            (m.duration
              ? "ps-enter-" +
                effect +
                " var(--ps-motion-duration) var(--ps-motion-ease) both"
              : "none") +
            "; }",
        )
        .join("\n") +
      "\n" +
      "@keyframes ps-enter-fade { from { opacity: 0; } to { opacity: 1; } }\n" +
      "@keyframes ps-enter-slide { from { opacity: 0; transform: translateX(var(--ps-motion-distance)); } to { opacity: 1; transform: translateX(0); } }\n" +
      "@keyframes ps-enter-scale { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }\n" +
      "@keyframes ps-enter-expand { from { opacity: 0; clip-path: inset(0 0 100% 0); } to { opacity: 1; clip-path: inset(0); } }\n" +
      "@media (prefers-reduced-motion: reduce) { " +
      selector +
      " :is(.ps-motion-fade, .ps-motion-slide, .ps-motion-scale, .ps-motion-expand) { animation: none; transition: none; } }\n"
    );
  }
  return {
    navigationPresets,
    motionPresets,
    navigationBrief,
    motionBrief,
    motionCSS,
  };
});
