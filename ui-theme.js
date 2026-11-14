/* Viewer preference only; never part of an exported design profile. */
(() => {
  const key = "palette-studio-ui-theme";
  let theme = matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  try {
    const saved = localStorage.getItem(key);
    if (["light", "dark"].includes(saved)) theme = saved;
  } catch {}
  const render = () => {
    document.documentElement.dataset.uiTheme = theme;
    document.querySelectorAll("[data-ui-theme-toggle]").forEach((button) => {
      button.textContent = theme === "dark" ? "라이트 모드" : "다크 모드";
      button.setAttribute("aria-pressed", String(theme === "dark"));
    });
  };
  document.querySelectorAll("[data-ui-theme-toggle]").forEach((button) =>
    button.addEventListener("click", () => {
      theme = theme === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(key, theme);
      } catch {}
      render();
    }),
  );
  render();
})();
