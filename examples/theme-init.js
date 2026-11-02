/* Optional: run in <head> before CSS. Reuse the app's existing theme loader if present. */
(() => {
  let preference='system';
  try { const saved=localStorage.getItem('app-theme');if(['light','dark','system'].includes(saved))preference=saved; } catch {}
  document.documentElement.dataset.theme=preference==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):preference;
})();
