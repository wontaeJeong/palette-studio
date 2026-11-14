/* One offline catalog for the browser, CLI and generated implementation briefs. */
(function (root, factory) {
  if (typeof module === "object" && module.exports)
    module.exports = factory(require("./ui-presets.js"), require("./navigation-designs.js"));
  else root.PaletteDesignCatalog = factory(root.PaletteUIPresets, root.PaletteNavigationDesigns);
})(typeof globalThis !== "undefined" ? globalThis : this, function (ui, navigationDesigns) {
  "use strict";
  const {
    navigationPresets,
    motionPresets,
    navigationBrief,
    motionBrief,
    motionCSS,
  } = ui;
  const treatments = {
    soft: {
      name: "기본 배경",
      rule: "Use --color-raised background, --color-ink text and --color-line border; reserve accent for the primary action.",
    },
    outline: {
      name: "윤곽선",
      rule: "Use --color-canvas background, --color-ink text and --color-line-strong 1px border; no shadow.",
    },
    solid: {
      name: "강조색",
      rule: "Use --color-accent background and --color-on-accent text for the leading control or header, with neutral content surfaces. Keep warning/error semantic colors.",
    },
  };
  const rows = [
    [
      "button",
      "버튼",
      "Button",
      "입력",
      "누르면 실행되는 기본 동작",
      "실행 저장 취소 클릭",
      "Use a native button, min-height 40px; show hover, focus-visible, disabled and loading; prevent duplicate submission.",
    ],
    [
      "input",
      "입력란",
      "Text field",
      "입력",
      "이름이나 이메일을 적는 칸",
      "폼 텍스트 이메일",
      "Use a persistent label, min-height 40px, hint and associated validation message; never use placeholder as the only label.",
    ],
    [
      "select",
      "선택 목록",
      "Select",
      "입력",
      "여러 선택지 중 하나를 고르는 메뉴",
      "드롭다운 옵션",
      "Use a labeled native select or existing accessible listbox; support keyboard arrows and selected/disabled states.",
    ],
    [
      "switch",
      "켜기 · 끄기",
      "Switch",
      "입력",
      "설정을 바로 켜고 끄는 스위치",
      "토글 설정",
      "Use role=switch with an accessible label and checked state; Space toggles; explain save failures and restore prior state.",
    ],
    [
      "checkbox",
      "체크 항목",
      "Checkbox",
      "입력",
      "여러 항목을 함께 선택하는 표시",
      "동의 다중 선택",
      "Use a labeled checkbox with checked, unchecked, disabled and indeterminate states where needed.",
    ],
    [
      "toast",
      "잠깐 뜨는 알림",
      "Toast",
      "피드백",
      "저장 완료처럼 흐름을 끊지 않는 알림",
      "스낵바 알림 메시지 저장",
      "Place at bottom-right on desktop, bottom with 16px inset on mobile; role=status, polite live announcement, dismiss control, 5s timeout paused on hover/focus. Never put essential errors only in a disappearing toast.",
    ],
    [
      "alert",
      "화면 안 안내문",
      "Alert",
      "피드백",
      "주의나 오류를 화면에 계속 보여주는 안내",
      "경고 배너 에러",
      "Keep inline with related content, with text and icon cues. Use role=alert only for newly urgent errors; include recovery action.",
    ],
    [
      "dialog",
      "중앙 확인창",
      "Dialog",
      "오버레이",
      "작업 전에 확인하거나 내용을 입력하는 창",
      "모달 팝업 확인 삭제",
      "Center a max-width 440px dialog with 24px padding and backdrop. Move focus inside, trap Tab, close with Escape, restore trigger focus; destructive actions require explicit confirmation.",
    ],
    [
      "drawer",
      "옆에서 열리는 패널",
      "Drawer",
      "오버레이",
      "현재 화면을 보며 상세 내용을 여는 패널",
      "시트 사이드 상세",
      "Open from right at max-width 380px, full width on mobile. Use modal semantics, focus trap, Escape and focus restoration; keep dismiss control visible.",
    ],
    [
      "tooltip",
      "짧은 도움말",
      "Tooltip",
      "오버레이",
      "버튼이나 용어에 붙는 짧은 설명",
      "힌트 설명 마우스",
      "Show on hover and keyboard focus, associate via aria-describedby, dismiss with Escape; never hide essential instructions or interactive content inside.",
    ],
    [
      "menu",
      "더보기 메뉴",
      "Dropdown menu",
      "탐색",
      "관련 동작을 작은 목록으로 펼치는 메뉴",
      "드롭다운 더보기 액션",
      "Use existing accessible menu with trigger expanded state; support Escape, arrow keys, Home/End and return focus on close.",
    ],
    [
      "tabs",
      "화면 전환 탭",
      "Tabs",
      "탐색",
      "같은 자리에서 관련 내용을 바꿔 보는 탭",
      "분류 탭 패널",
      "Use tablist/tab/tabpanel semantics, selected state and roving tabindex; arrows/Home/End navigate and associated panels update.",
    ],
    [
      "breadcrumb",
      "현재 위치 경로",
      "Breadcrumb",
      "탐색",
      "어느 화면에 있는지 보여주는 경로",
      "빵부스러기 경로 내비",
      "Use labeled navigation and ordered list; current page aria-current=page, previous segments are links with non-color cues.",
    ],
    [
      "pagination",
      "페이지 넘기기",
      "Pagination",
      "탐색",
      "긴 목록을 여러 페이지로 나누는 이동",
      "페이지 다음 이전",
      "Use labeled navigation, aria-current=page and named previous/next controls; preserve filters and disable unavailable directions.",
    ],
    [
      "card",
      "정보 카드",
      "Card",
      "콘텐츠",
      "관련 내용을 한 덩어리로 모은 상자",
      "패널 박스 정보",
      "Use semantic article/section with heading, 20px padding and selected style radius; only add a card boundary for a genuinely grouped entity.",
    ],
    [
      "badge",
      "작은 상태 표시",
      "Badge",
      "콘텐츠",
      "진행 중이나 완료 상태를 짧게 표시",
      "칩 태그 상태 라벨",
      "Pair semantic status color with readable text; no color-only meaning. Static badges are not buttons and must not enter tab order.",
    ],
    [
      "accordion",
      "접고 펼치는 내용",
      "Accordion",
      "콘텐츠",
      "자주 묻는 질문처럼 필요할 때 펼치는 영역",
      "FAQ 아코디언 접기",
      "Use details/summary or heading buttons with expanded/controls; Enter/Space toggles, keep focus visible and content reachable.",
    ],
    [
      "empty",
      "내용이 없을 때",
      "Empty state",
      "콘텐츠",
      "데이터가 없을 때 다음 행동을 안내하는 화면",
      "빈 상태 결과 없음 로딩",
      "Explain what is empty and offer one relevant next action; distinguish no data, no search results, loading, errors and lack of permission.",
    ],
  ];
  const components = rows.map(
    ([id, label, name, category, purpose, keywords, behavior]) => ({
      id,
      label,
      name,
      category,
      purpose,
      keywords,
      behavior,
      variants: Object.keys(treatments),
    }),
  );
  const sets = [
    {
      id: "studio",
      name: "기본 프로젝트",
      tag: "기본형",
      description: "플럼 · 반경 8px · 간격 16px",
      palette: "graphite-plum",
      style: "operational",
      variant: "soft",
      recommendedPalettes: ["graphite-plum", "slate-indigo", "slate-teal"],
      recommendedComponents: [
        "button",
        "card",
        "tabs",
        "menu",
        "toast",
        "empty",
      ],
      recommendationReason:
        "프로젝트 목록과 상세 전환을 위한 카드·탭·메뉴와 작업 결과 알림을 권장합니다.",
      componentOverrides: {
        button: "solid",
        badge: "outline",
      },
      defaultMotion: "standard",
    },
    {
      id: "bloom",
      name: "설정·개인화",
      tag: "카드형",
      description: "라벤더 · 카드 반경 16px · 간격 20px",
      palette: "pearl-lavender",
      style: "soft",
      variant: "soft",
      recommendedPalettes: ["pearl-lavender", "warm-sage", "zinc-rose"],
      recommendedComponents: ["input", "switch", "checkbox", "card", "toast"],
      recommendationReason:
        "설정 값 입력, 알림 켜기·끄기, 다중 선택과 저장 결과 안내를 권장합니다.",
      componentOverrides: {
        button: "solid",
        switch: "solid",
      },
      defaultMotion: "standard",
    },
    {
      id: "precision",
      name: "입력·승인",
      tag: "윤곽선형",
      description: "블루 · 반경 4px · 1px 경계",
      palette: "slate-blue",
      style: "outline",
      variant: "outline",
      recommendedPalettes: ["slate-blue", "slate-steel", "slate-indigo"],
      recommendedComponents: [
        "input",
        "select",
        "checkbox",
        "dialog",
        "alert",
        "button",
      ],
      recommendationReason:
        "입력·선택·동의 항목과 제출 전 확인창, 검증 안내를 권장합니다.",
      componentOverrides: {
        button: "solid",
        alert: "soft",
      },
      defaultMotion: "quick",
    },
    {
      id: "editorial",
      name: "문서·콘텐츠",
      tag: "문서형",
      description: "페이퍼 · 본문 15px · 행간 1.8",
      palette: "paper-ink",
      style: "editorial",
      variant: "outline",
      recommendedPalettes: ["paper-ink", "stone-sand", "neutral-monochrome"],
      recommendedComponents: [
        "breadcrumb",
        "tabs",
        "accordion",
        "tooltip",
        "empty",
      ],
      recommendationReason:
        "문서 위치 경로, 섹션 탭, 접기·펼치기와 용어 도움말을 권장합니다.",
      componentOverrides: {
        badge: "soft",
      },
      defaultMotion: "none",
    },
    {
      id: "console",
      name: "운영·데이터",
      tag: "고밀도형",
      description: "시안 · 컨트롤 32px · 간격 12px",
      palette: "navy-cyan",
      style: "compact",
      variant: "soft",
      recommendedPalettes: ["navy-cyan", "midnight-periwinkle", "slate-slate"],
      recommendedComponents: [
        "tabs",
        "menu",
        "pagination",
        "toast",
        "alert",
        "badge",
      ],
      recommendationReason:
        "데이터 탐색을 위한 탭·메뉴·페이지 이동과 운영 상태·오류 안내를 권장합니다.",
      componentOverrides: {
        button: "outline",
        badge: "outline",
        alert: "outline",
      },
      defaultMotion: "quick",
    },
    {
      id: "signal",
      name: "상태·알림",
      tag: "경계 강조형",
      description: "에메랄드 · 2px 경계 · 간격 16px",
      palette: "stone-emerald",
      style: "contrast",
      variant: "solid",
      recommendedPalettes: ["stone-emerald", "charcoal-ruby", "sand-amber"],
      recommendedComponents: ["button", "dialog", "alert", "badge", "toast"],
      recommendationReason:
        "상태 표시, 오류 안내, 작업 결과 알림과 주요 동작 확인창을 권장합니다.",
      componentOverrides: {
        dialog: "outline",
        input: "outline",
        card: "soft",
      },
      defaultMotion: "standard",
    },
  ].map((set) => ({
    ...set,
    defaultNavigation: {
      studio: "left",
      bloom: "top",
      precision: "left",
      editorial: "left",
      console: "hybrid",
      signal: "top",
    }[set.id],
    config: {
      palette: set.palette,
      style: set.style,
      fonts: { body: "pretendard", code: "d2coding", source: "local-only" },
    },
  }));
  function selection(id) {
    const set = sets.find((s) => s.id === id);
    if (!set) throw Error("Invalid design selection set: " + id);
    return {
      set: id,
      motion: set.defaultMotion,
      navigation: set.defaultNavigation,
      navigationStyle: {studio:"edge",bloom:"pill",precision:"outline",editorial:"underline",console:"fill",signal:"dot"}[id],
      navigationStructure: {studio:"list",bloom:"list",precision:"grouped",editorial:"grouped",console:"rail",signal:"list"}[id],
      components: Object.fromEntries(
        components.map((c) => [
          c.id,
          set.componentOverrides[c.id] || set.variant,
        ]),
      ),
    };
  }
  function normalize(input) {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw Error("Invalid design selection");
    const result = selection(input.set);
    if (input.motion !== undefined) {
      if (!motionPresets.some((m) => m.id === input.motion))
        throw Error("Invalid design selection motion");
      result.motion = input.motion;
    }
    if (input.navigation !== undefined) {
      if (!navigationPresets.some((n) => n.id === input.navigation))
        throw Error("Invalid design selection navigation");
      result.navigation = input.navigation;
    }
    for (const [field, choices] of [["navigationStyle", navigationDesigns.styles], ["navigationStructure", navigationDesigns.structures]]) {
      if (input[field] !== undefined) {
        if (!choices.some(choice => choice.id === input[field])) throw Error("Invalid design selection " + field);
        result[field] = input[field];
      }
    }
    const overrides = input.components === undefined ? {} : input.components;
    if (!overrides || typeof overrides !== "object" || Array.isArray(overrides))
      throw Error("Invalid design selection components");
    for (const [id, variant] of Object.entries(overrides)) {
      const item = components.find((c) => c.id === id);
      if (!item || !item.variants.includes(variant))
        throw Error("Invalid design selection component: " + id);
      result.components[id] = variant;
    }
    return result;
  }
  function brief(input) {
    if (input === undefined) return "";
    const selected = normalize(input),
      set = sets.find((s) => s.id === selected.set);
    return [
      "## Component design selection",
      "",
      "Starting set: " +
        set.name +
        " (" +
        set.id +
        "). Palette/style/font overrides in the profile take precedence.",
      "Recommended palette alternatives: " +
        set.recommendedPalettes.join(", ") +
        ". Keep the explicitly selected palette; do not silently replace it.",
      "Recommended components: " +
        set.recommendedComponents.join(", ") +
        ". " +
        set.recommendationReason,
      motionBrief(selected.motion),
      navigationBrief(selected.navigation),
      navigationDesigns.brief(selected.navigationStyle, selected.navigationStructure),
      "Apply the selected style radius, padding, gap and control height from selected-style.css; control targets at least 40px. Honor reduced motion. Test light/dark only within the selected scope.",
      "",
      ...components.map(
        (c) =>
          "- " +
          c.label +
          " / " +
          c.name +
          " [" +
          c.id +
          ": " +
          selected.components[c.id] +
          "]: " +
          treatments[selected.components[c.id]].rule +
          " " +
          c.behavior,
      ),
      "",
      "Use these as visual/behavior contracts for components relevant to the requested feature. Do not add unrelated UI solely because it appears in this catalog.",
      "",
    ].join("\n");
  }
  return {
    sets,
    components,
    treatments,
    selection,
    normalize,
    brief,
    navigationPresets,
    navigationDesigns,
    navigationBrief,
    motionPresets,
    motionCSS,
    motionBrief,
  };
});
