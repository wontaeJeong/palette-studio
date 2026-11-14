import { store } from "./context";
/** Managed legacy sample behavior, kept outside all editor forms/layout. */
export function mountSampleRuntime(notice: (text: string) => void) {
  const dispose = window.PaletteComponentDemos.init(store.getConfig),
    controller = new AbortController(),
    options = { signal: controller.signal };
  function selectTab(tab: HTMLElement) {
    const list = tab.closest("[role=tablist]")!;
    list.querySelectorAll<HTMLElement>("[role=tab]").forEach((t) => {
      t.setAttribute("aria-selected", String(t === tab));
      t.tabIndex = t === tab ? 0 : -1;
    });
    const panel = list.nextElementSibling!;
    panel.setAttribute("aria-labelledby", tab.id);
    panel.textContent =
      tab.dataset.tab === "overview"
        ? "프로젝트 개요입니다."
        : "디자인 변경 기록 1건";
  }
  document.addEventListener(
    "click",
    (e) => {
      if (!(e.target instanceof Element)) return;
      const close = e.target.closest<HTMLElement>("[data-close]");
      if (close) {
        (
          document.getElementById(close.dataset.close!) as HTMLDialogElement
        ).close();
        return;
      }
      const trigger = e.target.closest<HTMLElement>("[data-demo]");
      if (trigger && !window.PaletteComponentDemos.handle(trigger))
        notice(
          trigger.dataset.demo === "cancel"
            ? "취소했습니다."
            : "샘플 동작을 실행했습니다. 미리보기 예시입니다.",
        );
      const tab = e.target.closest<HTMLElement>("[data-tab]");
      if (tab) selectTab(tab);
      const page = e.target.closest<HTMLElement>("[data-page]");
      if (page) {
        const nav = page.closest("nav")!,
          counter = nav.querySelector("[data-page-number]")!,
          n =
            Number(counter.textContent![0]) +
            (page.dataset.page === "next" ? 1 : -1);
        counter.textContent = n + " / 3";
        nav.querySelector<HTMLButtonElement>('[data-page="prev"]')!.disabled =
          n === 1;
        nav.querySelector<HTMLButtonElement>('[data-page="next"]')!.disabled =
          n === 3;
      }
    },
    options,
  );
  document.addEventListener(
    "keydown",
    (e) => {
      if (!(e.target instanceof Element)) return;
      const tab = e.target.closest<HTMLElement>("[data-tab]");
      if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
        return;
      e.preventDefault();
      const tabs = Array.from(tab.parentElement!.children) as HTMLElement[],
        i = tabs.indexOf(tab),
        next =
          e.key === "Home"
            ? 0
            : e.key === "End"
              ? tabs.length - 1
              : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) %
                tabs.length;
      selectTab(tabs[next]);
      tabs[next].focus();
    },
    options,
  );
  return () => {
    controller.abort();
    dispose();
  };
}
