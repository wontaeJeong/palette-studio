/* One offline catalog for the browser, CLI and generated implementation briefs. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PaletteDesignCatalog = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const treatments = {
    soft: {
      name: "은은한 면",
      rule: "Use --color-raised background, --color-ink text and --color-line border; reserve accent for the primary action.",
    },
    outline: {
      name: "선으로 또렷하게",
      rule: "Use --color-canvas background, --color-ink text and --color-line-strong 1px border; no shadow.",
    },
    solid: {
      name: "강조색으로 선명하게",
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
      name: "차분한 스튜디오",
      tag: "균형 잡힌 기본",
      description:
        "보라 포인트와 단정한 윤곽. 업무 도구부터 개인 프로젝트까지.",
      palette: "graphite-plum",
      style: "operational",
      variant: "soft",
    },
    {
      id: "bloom",
      name: "부드러운 라운지",
      tag: "편안하고 친근하게",
      description: "라벤더와 넉넉한 여백. 일상 서비스와 커뮤니티에.",
      palette: "pearl-lavender",
      style: "soft",
      variant: "soft",
    },
    {
      id: "precision",
      name: "명료한 워크스페이스",
      tag: "선명한 정보 위계",
      description: "블루 포인트와 또렷한 선. 복잡한 입력과 승인 작업에.",
      palette: "slate-blue",
      style: "outline",
      variant: "outline",
    },
    {
      id: "editorial",
      name: "종이 위의 이야기",
      tag: "읽는 경험에 집중",
      description: "종이 톤과 절제된 면. 문서와 콘텐츠 서비스에.",
      palette: "paper-ink",
      style: "editorial",
      variant: "outline",
    },
    {
      id: "console",
      name: "집중하는 콘솔",
      tag: "촘촘하고 효율적으로",
      description: "시안 포인트와 작은 간격. 운영 화면과 개발 도구에.",
      palette: "navy-cyan",
      style: "compact",
      variant: "soft",
    },
    {
      id: "signal",
      name: "분명한 시그널",
      tag: "중요한 행동을 강조",
      description: "에메랄드와 명확한 경계. 주요 행동이 잘 보이는 서비스에.",
      palette: "stone-emerald",
      style: "contrast",
      variant: "solid",
    },
  ].map((set) => ({
    ...set,
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
      components: Object.fromEntries(
        components.map((c) => [c.id, set.variant]),
      ),
    };
  }
  function normalize(input) {
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw Error("Invalid design selection");
    const result = selection(input.set);
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
  return { sets, components, treatments, selection, normalize, brief };
});
