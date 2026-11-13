/* One offline registry for visual recipes and agent implementation contracts. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PaletteComponents = api;
})(globalThis, function () {
  "use strict";
  const rows = [
    [
      "toast",
      "Toast · Snackbar",
      "잠깐 뜨는 저장 알림",
      "피드백",
      "저장하면 잠깐 뜨는 알림 실행취소",
      "저장 완료처럼 작업을 방해하지 않는 결과 알림",
      "하단 오른쪽, 5초 후 닫기, 닫기 버튼, 실행취소는 8초. role=status, 포커스 이동 금지.",
    ],
    [
      "dialog",
      "Dialog · Alert Dialog",
      "가운데 뜨는 확인창",
      "오버레이",
      "모달 삭제 확인 팝업",
      "중요한 결정과 확인",
      "최대 480px, 제목·설명 연결, 취소 왼쪽/확인 오른쪽. 모달 포커스 가두기, Escape 닫기, 트리거로 포커스 복원. 삭제는 명시적 확인.",
    ],
    [
      "sheet",
      "Sheet · Drawer",
      "옆이나 아래에서 나오는 창",
      "오버레이",
      "상세 패널 모바일 바텀시트",
      "목록의 맥락을 유지하는 상세 정보",
      "데스크톱 오른쪽 360px, 모바일 하단. 모달 포커스 관리, Escape 닫기, 닫은 뒤 트리거 복원.",
    ],
    [
      "tooltip",
      "Tooltip",
      "마우스 올리면 뜨는 설명",
      "오버레이",
      "도움말 풍선 단축키",
      "짧은 보충 설명",
      "hover와 focus 양쪽에서 표시, Escape 닫기, aria-describedby, 필수 정보는 본문에도 제공.",
    ],
    [
      "popover",
      "Popover",
      "누르면 펼쳐지는 작은 창",
      "오버레이",
      "작은 설명창 날짜 정보",
      "보조 상세 정보를 제자리에서 확인",
      "트리거 아래 정렬, 화면 가장자리 회피, Escape와 외부 클릭으로 닫고 포커스 복원.",
    ],
    [
      "menu",
      "Dropdown Menu",
      "누르면 나오는 작업 목록",
      "탐색",
      "드롭다운 더보기 사용자 메뉴",
      "편집·공유 등 작업 선택",
      "Enter/Space 열기, 방향키 탐색, Escape 닫기. menu 역할을 쓸 경우 roving tabindex 구현.",
    ],
    [
      "alert",
      "Alert · Callout",
      "본문에 들어가는 안내문",
      "피드백",
      "배너 경고 안내 오류",
      "지속적으로 보여야 하는 상태나 도움말",
      "정보는 status, 긴급 오류만 alert. 아이콘·텍스트로 의미 병행, 색상만으로 상태 구분 금지.",
    ],
    [
      "select",
      "Select",
      "항목 고르는 입력창",
      "입력",
      "선택박스 드롭다운 옵션",
      "짧은 고정 목록에서 하나 선택",
      "연결된 label, 기본값·오류·비활성 상태. 가능한 native select를 재사용.",
    ],
    [
      "combobox",
      "Combobox",
      "검색해서 항목 고르기",
      "입력",
      "자동완성 검색형 선택",
      "긴 목록에서 검색과 선택",
      "입력·목록 연결, 방향키/Enter/Escape, 결과 수 안내, 결과 없음 및 비동기 로딩 처리.",
    ],
    [
      "tabs",
      "Tabs",
      "같은 자리에서 내용 바꾸기",
      "탐색",
      "탭 메뉴 화면 전환",
      "관련 내용을 묶어 전환",
      "tablist/tab/tabpanel 연결, 선택된 탭만 tabindex=0, 방향키/Home/End 탐색.",
    ],
    [
      "sidebar",
      "Sidebar",
      "화면 옆에 놓는 메뉴",
      "탐색",
      "사이드바 접는 메뉴 내비게이션",
      "제품의 주요 화면 이동",
      "nav landmark와 현재 링크 aria-current, 모바일 메뉴 명시적 열기·닫기, 아이콘만 쓰지 않기.",
    ],
    [
      "breadcrumb",
      "Breadcrumb",
      "지금 위치와 상위 경로",
      "탐색",
      "빵부스러기 경로 위치",
      "깊은 페이지의 상위로 이동",
      "이름 있는 nav와 순서 목록, 현재 항목 aria-current=page, 구분 기호는 보조기술에서 숨기기.",
    ],
    [
      "button",
      "Button",
      "누르면 실행하는 버튼",
      "입력",
      "확인 저장 취소 액션",
      "핵심 작업 실행",
      "기본·hover·focus-visible·disabled·loading 제공. 제출 중 중복 실행 방지, focus outline 2px.",
    ],
    [
      "input",
      "Text Field",
      "한 줄 입력하는 칸",
      "입력",
      "텍스트 필드 이름 입력 오류",
      "이름·제목 등 짧은 정보 입력",
      "영구 label, 오류를 aria-describedby와 aria-invalid로 연결, placeholder를 label 대용으로 쓰지 않기.",
    ],
    [
      "textarea",
      "Textarea",
      "여러 줄 쓰는 입력칸",
      "입력",
      "긴 글 메모 설명",
      "긴 설명이나 의견 입력",
      "연결된 label, 세로 크기 조절, 길이 안내 및 오류 연결.",
    ],
    [
      "checkbox",
      "Checkbox",
      "여러 개 체크하기",
      "입력",
      "체크박스 동의 다중 선택",
      "여러 독립 옵션 선택",
      "native checkbox와 label, Space 전환, 그룹은 fieldset/legend.",
    ],
    [
      "radio",
      "Radio Group",
      "여러 개 중 하나 고르기",
      "입력",
      "라디오 요금제 단일 선택",
      "서로 배타적인 옵션 비교",
      "동일 name의 native radio, fieldset/legend, 방향키 선택.",
    ],
    [
      "switch",
      "Switch",
      "켜고 끄는 설정",
      "입력",
      "토글 온오프",
      "즉시 적용되는 이진 설정",
      "항상 보이는 label, role=switch 및 aria-checked 또는 native checkbox. 저장이 필요하면 명시.",
    ],
    [
      "slider",
      "Slider",
      "막대를 움직여 값 조절",
      "입력",
      "범위 볼륨 크기",
      "연속적 수치 선택",
      "native range, label·현재값·단위·min/max/step. 방향키와 Home/End 지원.",
    ],
    [
      "card",
      "Card",
      "정보를 묶는 작은 판",
      "구조",
      "카드 패널 상자",
      "하나의 대상과 관련 작업 요약",
      "제목 계층 유지, 내부 링크와 버튼 분리, 카드 전체 클릭 중첩 금지.",
    ],
    [
      "table",
      "Data Table",
      "행과 열로 보는 목록",
      "구조",
      "표 테이블 데이터 정렬",
      "여러 항목의 속성을 비교",
      "caption과 th/scope, 정렬 상태 aria-sort, 작은 화면은 표 영역만 가로 스크롤.",
    ],
    [
      "pagination",
      "Pagination",
      "목록의 다음 페이지",
      "탐색",
      "페이지 넘기기 이전 다음",
      "긴 목록을 페이지로 나눔",
      "이름 있는 nav, 현재 페이지 aria-current, 첫/끝에서 이전·다음 비활성.",
    ],
    [
      "accordion",
      "Accordion",
      "눌러서 펼치는 내용",
      "구조",
      "아코디언 접기 FAQ",
      "필요한 정보만 펼쳐 읽기",
      "native details/summary 또는 버튼 aria-expanded/controls, Enter/Space 지원.",
    ],
    [
      "progress",
      "Progress",
      "얼마나 끝났는지 표시",
      "피드백",
      "진행률 업로드 퍼센트",
      "시간이 걸리는 작업의 진행 표시",
      "native progress와 접근 가능한 label, 백분율 텍스트, 불확정 진행이면 거짓 퍼센트 금지.",
    ],
    [
      "skeleton",
      "Skeleton",
      "불러오는 동안 자리 표시",
      "피드백",
      "로딩 뼈대 회색 자리",
      "콘텐츠의 예상 배치를 유지",
      "장식은 aria-hidden, 컨테이너 aria-busy, 상태 텍스트 제공, reduced-motion에서 애니메이션 제거.",
    ],
    [
      "empty",
      "Empty State",
      "아무 내용이 없을 때",
      "피드백",
      "빈 화면 결과 없음 데이터 없음",
      "첫 사용이나 검색 결과 없음 안내",
      "비어 있는 이유·다음 행동·검색 초기화 제공. 오류와 빈 상태를 구분.",
    ],
    [
      "badge",
      "Badge",
      "짧은 상태 꼬리표",
      "피드백",
      "뱃지 태그 완료 검토",
      "상태나 개수를 간단히 표시",
      "색상 외 텍스트·아이콘 병행, 작은 텍스트 대비 유지, 클릭하면 별도 버튼으로 구현.",
    ],
    [
      "avatar",
      "Avatar",
      "사용자를 나타내는 그림",
      "구조",
      "프로필 이미지 이니셜",
      "사람과 계정 식별",
      "이름을 인접 제공, 중복 장식 이미지는 빈 alt, 이미지 실패 시 이니셜 폴백.",
    ],
    [
      "search",
      "Search Field",
      "내용을 찾는 검색창",
      "입력",
      "검색 필터 돋보기",
      "목록이나 문서 탐색",
      "search input과 label, 초기화 버튼, 결과 수 status, 결과 없음에서 검색 유지.",
    ],
    [
      "stepper",
      "Stepper",
      "지금 몇 단계인지 안내",
      "탐색",
      "단계 진행 마법사 온보딩",
      "여러 단계의 입력과 완료 상태",
      "순서 목록 및 현재 단계 aria-current=step, 완료·현재·대기를 텍스트로 구분, 이전 입력 보존.",
    ],
  ];
  const variants = [
    {
      id: "neutral",
      name: "차분한 기본",
      description: "중립 표면 · 선명한 경계 · 작은 라운드",
      radius: 6,
      padding: 12,
      border: 1,
      background: "--color-surface",
      foreground: "--color-ink",
      line: "--color-line-strong",
    },
    {
      id: "soft",
      name: "부드러운 면",
      description: "옅은 강조 표면 · 넉넉한 여백 · 큰 라운드",
      radius: 16,
      padding: 20,
      border: 1,
      background: "--color-raised",
      foreground: "--color-ink",
      line: "--color-line",
    },
    {
      id: "accent",
      name: "강조 테두리",
      description: "주제색 경계 · 각진 형태 · 정보 강조",
      radius: 2,
      padding: 16,
      border: 2,
      background: "--color-canvas",
      foreground: "--color-ink",
      line: "--color-accent",
    },
  ];
  const components = rows.map(
    ([id, name, label, category, keywords, purpose, behavior]) => ({
      id,
      name,
      label,
      category,
      keywords,
      purpose,
      behavior,
      variants,
    }),
  );
  const presets = [
    {
      id: "calm",
      name: "차분한 업무형",
      description: "정돈된 대시보드와 프로젝트 관리",
      palette: "slate-blue",
      style: "operational",
      layout: "dashboard",
      font: "pretendard",
      base: "neutral",
    },
    {
      id: "soft",
      name: "부드러운 제품형",
      description: "넉넉한 여백과 편안한 설정 화면",
      palette: "warm-sage",
      style: "soft",
      layout: "settings",
      font: "suit",
      base: "soft",
    },
    {
      id: "outline",
      name: "선명한 테두리형",
      description: "구조와 조작 영역이 분명한 도구",
      palette: "neutral-monochrome",
      style: "outline",
      layout: "dashboard",
      font: "geist",
      base: "accent",
    },
    {
      id: "editorial",
      name: "타이포 중심형",
      description: "문서와 읽는 흐름에 집중",
      palette: "paper-ink",
      style: "editorial",
      layout: "content",
      font: "noto-serif-kr",
      base: "neutral",
    },
    {
      id: "compact",
      name: "조밀한 운영형",
      description: "많은 데이터와 빠른 반복 작업",
      palette: "slate-steel",
      style: "compact",
      layout: "dashboard",
      font: "pretendard",
      base: "neutral",
    },
    {
      id: "brand",
      name: "대담한 브랜드형",
      description: "큰 제목과 주제색을 앞세운 랜딩",
      palette: "zinc-violet",
      style: "contrast",
      layout: "landing",
      font: "wanted-sans",
      base: "accent",
    },
  ].map((p) => ({
    ...p,
    components: Object.fromEntries(components.map((c) => [c.id, p.base])),
  }));
  presets.find((p) => p.id === "soft").components.table = "neutral";
  presets.find((p) => p.id === "brand").components.input = "soft";
  presets.find((p) => p.id === "editorial").components.alert = "soft";
  function normalize(value) {
    if (value === undefined) return undefined;
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw Error("Invalid design selection");
    const preset = presets.find((p) => p.id === value.preset);
    if (!preset) throw Error("Invalid preset");
    const overrides = value.overrides === undefined ? {} : value.overrides;
    if (!overrides || typeof overrides !== "object" || Array.isArray(overrides))
      throw Error("Invalid component overrides");
    const result = {};
    for (const [id, variant] of Object.entries(overrides)) {
      const c = components.find((c) => c.id === id);
      if (!c) throw Error("Invalid component: " + id);
      if (!c.variants.some((v) => v.id === variant))
        throw Error("Invalid variant: " + variant);
      result[id] = variant;
    }
    return { preset: preset.id, overrides: result };
  }
  function resolve(value) {
    const s = normalize(value);
    if (!s) return {};
    const p = presets.find((p) => p.id === s.preset);
    return Object.fromEntries(
      components.map((c) => {
        const id = s.overrides[c.id] || p.components[c.id],
          v = c.variants.find((v) => v.id === id);
        return [
          c.id,
          {
            name: c.name,
            label: c.label,
            variant: id,
            radius:
              p.id === "compact" ? 4 : p.id === "editorial" ? 0 : v.radius,
            padding:
              p.id === "compact" ? 8 : p.id === "editorial" ? 24 : v.padding,
            border: v.border,
            tokens: {
              background: v.background,
              foreground: v.foreground,
              line: v.line,
              focus: "--color-focus",
            },
            behavior: c.behavior,
          },
        ];
      }),
    );
  }
  function markdown(value) {
    if (!value) return "";
    const s = normalize(value);
    return (
      "\n## Component design contract\n\nPreset: " +
      presets.find((p) => p.id === s.preset).name +
      " (" +
      s.preset +
      "). Explicit overrides: " +
      Object.keys(s.overrides).length +
      ".\n\n" +
      Object.entries(resolve(s))
        .map(
          ([id, r]) =>
            "- " +
            r.name +
            " [" +
            id +
            "] / " +
            r.variant +
            ": radius " +
            r.radius +
            "px; padding " +
            r.padding +
            "px; border " +
            r.border +
            "px; background " +
            r.tokens.background +
            "; text " +
            r.tokens.foreground +
            "; border " +
            r.tokens.line +
            ". " +
            r.behavior,
        )
        .join("\n") +
      "\n\nAll examples require default, hover, focus-visible, disabled, loading and error states where applicable. Resolve semantic color roles from selected-theme.css for the selected mode. Preserve behavior of existing components within the requested scope.\n"
    );
  }
  return { components, presets, variants, normalize, resolve, markdown };
});
