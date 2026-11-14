/* Own the lifetime, focus, anchoring and clocks of framework-neutral demo overlays. */
(() => {
  "use strict";
  const icons = (window.PALETTE_ICON_PARTS || []).flat();
  const icon = (name) =>
    '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (icons.find((i) => i.name === name)?.body || "") +
    "</svg>";
  let getConfig,
    tip = null,
    popup = null,
    tipClose,
    toastSerial = 0;
  const notices = new Map();
  const $ = (id) => document.getElementById(id);
  function scope(el, trigger) {
    const c = getConfig();
    Object.assign(el.dataset, {
      theme: trigger.closest("[data-theme]")?.dataset.theme || "light",
      palette: c.palette,
      style: c.style,
      concept: c.designSelection.concept,
    });
  }
  function place(el, trigger) {
    const r = trigger.getBoundingClientRect(),
      w = el.offsetWidth,
      h = el.offsetHeight,
      gap = 8,
      inset = 12;
    el.style.left =
      Math.max(inset, Math.min(r.left, innerWidth - w - inset)) + "px";
    el.style.top =
      Math.max(
        inset,
        r.bottom + gap + h <= innerHeight - inset
          ? r.bottom + gap
          : r.top - h - gap,
      ) + "px";
  }
  function showTip(trigger) {
    clearTimeout(tipClose);
    if (tip?.trigger === trigger) return;
    hideTip();
    const el = trigger.parentElement.querySelector(".tip");
    if (!el) return;
    el.hidden = false;
    el.style.removeProperty("display");
    el.setAttribute("popover", "manual");
    scope(el, trigger);
    el.showPopover();
    tip = { el, trigger };
    place(el, trigger);
  }
  function hideTip() {
    clearTimeout(tipClose);
    if (tip) {
      tip.el.hidePopover();
      tip.el.hidden = true;
      tip = null;
    }
  }
  function laterHide() {
    clearTimeout(tipClose);
    tipClose = setTimeout(() => {
      if (
        tip &&
        !tip.el.matches(":hover") &&
        !tip.trigger.matches(":hover") &&
        document.activeElement !== tip.trigger
      )
        hideTip();
    }, 180);
  }
  function closePopup(restore = true) {
    if (!popup) return;
    const { el, trigger } = popup;
    popup = null;
    el.hidePopover();
    el.remove();
    trigger.setAttribute("aria-expanded", "false");
    if (restore && trigger.isConnected) trigger.focus({ preventScroll: true });
  }
  function showPopup(trigger, kind) {
    if (popup?.trigger === trigger) {
      closePopup();
      return;
    }
    closePopup(false);
    hideTip();
    const el = document.createElement("section");
    el.id = "demo-" + kind;
    el.className = "anchored-surface";
    el.setAttribute("popover", "manual");
    el.setAttribute("role", kind === "menu" ? "menu" : "dialog");
    el.setAttribute(
      "aria-label",
      kind === "menu" ? "프로젝트 동작" : "프로젝트 표시 설정",
    );
    el.innerHTML =
      kind === "menu"
        ? '<p class="overlay-eyebrow">프로젝트 동작</p><button role="menuitem" data-popup-action="rename">' +
          icon("pencil") +
          '이름 바꾸기<kbd>↵</kbd></button><button role="menuitem" data-popup-action="duplicate">' +
          icon("copy") +
          '복제하기</button><hr><button role="menuitem" data-popup-action="archive">' +
          icon("archive") +
          "보관하기</button>"
        : '<div class="overlay-heading"><h3>표시 설정</h3><button class="icon-button" data-popup-close aria-label="설정 닫기">' +
          icon("x") +
          '</button></div><p>이 프로젝트에서 표시할 정보를 선택하세요.</p><label class="sample-check"><input type="checkbox" checked>완료한 프로젝트 포함</label><label class="sample-check"><input type="checkbox" checked>담당 팀 표시</label><button class="sample-button sample-primary" data-popup-apply>설정 적용</button>';
    if (kind === "popover" && trigger.dataset.displaySettings) {
      const values = JSON.parse(trigger.dataset.displaySettings);
      el.querySelectorAll("input").forEach((input, i) => {
        input.checked = values[i];
      });
    }
    scope(el, trigger);
    (trigger.closest("dialog[open]") || document.body).append(el);
    el.showPopover();
    place(el, trigger);
    popup = { el, trigger, kind };
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("aria-controls", el.id);
    el.querySelector("button,input")?.focus();
  }
  function dismissToast(el) {
    const state = notices.get(el);
    if (!state) return;
    clearTimeout(state.timer);
    notices.delete(el);
    const host = $("demo-toast");
    const focused = el.contains(document.activeElement);
    el.remove();
    if (!notices.size) {
      host.hidePopover();
      host.hidden = true;
    }
    if (focused && state.trigger.isConnected)
      state.trigger.focus({ preventScroll: true });
  }
  function updateClock(el) {
    const state = notices.get(el);
    if (!state) return;
    clearTimeout(state.timer);
    if (state.started !== null) {
      state.remaining -= performance.now() - state.started;
      state.started = null;
    }
    if (!state.hover && !state.focus) {
      state.started = performance.now();
      state.timer = setTimeout(
        () => dismissToast(el),
        Math.max(0, state.remaining),
      );
    }
  }
  function toast(trigger, status = "success") {
    const host = $("demo-toast");
    const owner = trigger.closest("dialog[open]") || document.body;
    if (host.parentElement !== owner) {
      if (host.matches(":popover-open")) host.hidePopover();
      owner.append(host);
    }
    scope(host, trigger);
    host.className = "toast-stack";
    host.setAttribute("popover", "manual");
    host.removeAttribute("role");
    host.hidden = false;
    host.showPopover();
    const messages = {
      success: [
        "circle-check",
        "변경 내용을 저장했습니다",
        "프로젝트의 새 디자인을 팀과 공유할 수 있습니다.",
      ],
      info: [
        "info",
        "팀과 연결되었습니다",
        "새로운 프로젝트 소식을 이곳에서 확인하세요.",
      ],
      warning: [
        "triangle-alert",
        "연결이 불안정합니다",
        "작성한 내용은 이 브라우저에 보관하고 있습니다.",
      ],
      error: [
        "circle-alert",
        "동기화하지 못했습니다",
        "아래 오류 안내에서 다시 시도할 수 있습니다.",
      ],
    };
    const [glyph, title, description] = messages[status] || messages.success;
    while (notices.size >= 3) dismissToast(notices.keys().next().value);
    const el = document.createElement("article");
    el.className = "toast-item";
    scope(el, trigger);
    el.dataset.status = status;
    el.dataset.treatment = getConfig().designSelection.components.toast;
    el.setAttribute("role", status === "error" ? "alert" : "status");
    el.setAttribute("aria-atomic", "true");
    el.innerHTML =
      '<span class="toast-icon">' +
      icon(glyph) +
      '</span><div class="toast-content"><strong class="toast-title">' +
      title +
      "</strong><p>" +
      description +
      "</p>" +
      (status === "success"
        ? '<button class="toast-undo" data-toast-undo>되돌리기</button>'
        : "") +
      '</div><button class="icon-button" data-toast-dismiss aria-label="알림 닫기">' +
      icon("x") +
      "</button>";
    if (!notices.size)
      el.querySelector("[data-toast-dismiss]").id = "dismiss-toast";
    el.dataset.notice = String(++toastSerial);
    host.append(el);
    const state = {
      remaining: 5000,
      started: null,
      hover: false,
      focus: false,
      trigger,
    };
    notices.set(el, state);
    el.addEventListener("pointerenter", () => {
      state.hover = true;
      updateClock(el);
    });
    el.addEventListener("pointerleave", () => {
      state.hover = false;
      updateClock(el);
    });
    el.addEventListener("focusin", () => {
      state.focus = true;
      updateClock(el);
    });
    el.addEventListener("focusout", () => {
      queueMicrotask(() => {
        state.focus = el.contains(document.activeElement);
        updateClock(el);
      });
    });
    updateClock(el);
    const treatment = trigger.closest(".treatment");
    const inline = treatment?.querySelector(".persistent-error");
    if (inline) inline.hidden = status !== "error";
    if (status === "success") {
      const saved = treatment?.querySelector("[data-save-state]");
      if (saved)
        saved.textContent =
          "새 디자인을 저장했습니다. 되돌리기로 이전 디자인을 복원하세요.";
    }
  }
  function cleanup() {
    hideTip();
    closePopup(false);
    for (const el of [...notices.keys()]) dismissToast(el);
  }
  function init(config) {
    getConfig = config;
    const host = $("demo-toast");
    host.replaceChildren();
    document.addEventListener("pointerover", (e) => {
      const trigger = e.target.closest('[data-demo="tooltip"]');
      if (trigger) showTip(trigger);
      if (tip?.el.contains(e.target)) clearTimeout(tipClose);
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest('[data-demo="tooltip"],.tip')) laterHide();
    });
    document.addEventListener("focusin", (e) => {
      const trigger = e.target.closest('[data-demo="tooltip"]');
      if (trigger) showTip(trigger);
      else if (tip) hideTip();
    });
    document.addEventListener("focusout", (e) => {
      if (e.target.closest('[data-demo="tooltip"]')) laterHide();
    });
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (
          popup &&
          !popup.el.contains(e.target) &&
          !popup.trigger.contains(e.target)
        )
          closePopup(false);
      },
      true,
    );
    document.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape" && (tip || popup)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          if (tip) hideTip();
          else closePopup();
          return;
        }
        if (!popup) return;
        const { el, kind } = popup;
        if (!el.contains(e.target)) return;
        const list = [...el.querySelectorAll("button,input")];
        let i = list.indexOf(document.activeElement);
        if (
          kind === "menu" &&
          ["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)
        ) {
          e.preventDefault();
          i =
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? list.length - 1
                : (i + (e.key === "ArrowDown" ? 1 : -1) + list.length) %
                  list.length;
          list[i].focus();
        }
        if (e.key === "Tab") {
          if (kind === "menu") {
            e.preventDefault();
            closePopup();
          } else {
            e.preventDefault();
            list[
              (i + (e.shiftKey ? -1 : 1) + list.length) % list.length
            ].focus();
          }
        }
      },
      true,
    );
    document.addEventListener("click", (e) => {
      const dismiss = e.target.closest("[data-toast-dismiss]");
      if (dismiss) {
        dismissToast(dismiss.closest(".toast-item"));
        return;
      }
      const undo = e.target.closest("[data-toast-undo]");
      if (undo) {
        const el = undo.closest(".toast-item");
        el.querySelector(".toast-title").textContent = "저장을 되돌렸습니다";
        el.querySelector("p").textContent =
          "프로젝트가 저장하기 전 상태로 복원되었습니다.";
        const state = notices.get(el);
        const trigger = state.trigger;
        trigger
          .closest(".treatment")
          ?.querySelector("[data-save-state]")
          ?.replaceChildren(document.createTextNode("이전 디자인으로 복원됨"));
        undo.disabled = true;
        return;
      }
      if (e.target.closest("[data-popup-close]")) closePopup();
      if (e.target.closest("[data-popup-apply]")) {
        const trigger = popup.trigger;
        const settings = [...popup.el.querySelectorAll("input")].map(
          (input) => input.checked,
        );
        trigger.dataset.displaySettings = JSON.stringify(settings);
        trigger.textContent =
          "표시 설정 · " + settings.filter(Boolean).length + "개 적용됨";
        closePopup();
      }
      const action = e.target.closest("[data-popup-action]");
      if (action) {
        const trigger = popup.trigger;
        trigger.dataset.lastAction = action.dataset.popupAction;
        trigger.textContent =
          action.dataset.popupAction === "duplicate"
            ? "프로젝트 복제됨"
            : action.dataset.popupAction === "archive"
              ? "프로젝트 보관됨"
              : "이름 변경 준비됨";
        closePopup();
      }
    });
    for (const event of ["resize", "scroll"])
      window.addEventListener(
        event,
        () => {
          if (tip) place(tip.el, tip.trigger);
          if (popup) place(popup.el, popup.trigger);
        },
        true,
      );
    for (const id of ["component-dialog", "demo-dialog", "demo-drawer"])
      $(id).addEventListener("close", () => {
        hideTip();
        closePopup(false);
        if (id === "component-dialog")
          for (const el of [...notices.keys()]) dismissToast(el);
      });
  }
  function handle(trigger) {
    const action = trigger.dataset.demo;
    if (action === "tooltip") {
      showTip(trigger);
      return true;
    }
    if (action === "toast") {
      toast(trigger, trigger.dataset.toastStatus);
      return true;
    }
    if (action === "menu" || action === "popover") {
      showPopup(trigger, action);
      return true;
    }
    if (action === "dialog" || action === "drawer") {
      const el = $("demo-" + action);
      scope(el, trigger);
      el.dataset.treatment = getConfig().designSelection.components[action];
      el.showModal();
      el.addEventListener(
        "close",
        () => {
          if (trigger.isConnected) trigger.focus({ preventScroll: true });
        },
        { once: true },
      );
      return true;
    }
    return false;
  }
  window.PaletteComponentDemos = { init, handle, cleanup, icon };
})();
