# CSS와 UI 색상 사용 가이드

## 색상을 고르는 순서

바탕(neutral), 포인트(accent), 의미색(status), 데이터색(chart), 코드색(syntax)을 역할로 분리합니다. 이름이 Plum이라고 모든 초록·주황·파랑을 Plum으로 바꾸지 않습니다. 포인트는 주요 행동·현재 위치·선택에 집중합니다. 상태와 데이터는 별도 정보입니다.

팔레트는 바탕과 포인트가 함께 설계된 단위입니다. 32종의 일부 토큰을 임의로 섞으면 제공된 대비 결과를 그대로 사용할 수 없습니다. 새 조합이 필요하면 `scripts/build.py`의 BASES/SPECS를 수정하고 생성·검사를 다시 수행하세요. 램프의 50~950 번호는 이 키트의 탐색용 단계이며 Tailwind 공식 색상과 같지 않습니다.

## 표면과 정보 계층

| 역할 | 토큰 | 사용 |
|---|---|---|
| 화면 바닥 | `canvas` | 페이지 전체 |
| 카드·대화상자 | `raised` | 주요 콘텐츠 표면 |
| 보조 표면 | `surface`, `surface-soft` | 표 헤더·보조 패널·코드 |
| 내비게이션 | `shell`, `nav-*` | 사이드바·메뉴 |
| 장식 분리 | `line` | 카드 경계·구분선 |
| 식별 경계 | `line-strong`, `input-border` | 폼 입력·기능 식별에 필요한 경계 |
| 본문·보조 텍스트 | `ink`, `ink-muted` | 작은 보조 텍스트도 대비 유지 |
| 주 행동 | `accent`, `on-accent` | solid 버튼의 배경·전경 |
| 약한 강조 | `accent-subtle`, `accent-text` | 선택된 항목·강조 설명 |

`line`은 장식용이므로 모든 표면과 3:1을 보장하지 않습니다. 입력 상자를 `line`만으로 식별시키지 마세요. 코드 블록은 `code-bg`와 `code-line`을 함께 사용합니다.

## 색상 클래스

의미 토큰을 직접 소비해도 되고 `cp-*` 클래스를 사용해도 됩니다. 애플리케이션의 기존 클래스가 있다면 그 정의를 토큰으로 연결하는 편이 낫습니다.

```css
.request-panel {
  color: var(--color-ink);
  background-color: var(--color-raised);
  border: 1px solid var(--color-line);
}
.repo-input {
  color: var(--color-input-fg);
  background-color: var(--color-input-bg);
  border: 1px solid var(--color-input-border);
}
.repo-input:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}
```

```html
<section class="cp-bg-raised cp-text-ink cp-border-line">...</section>
```

`cp-border-*`는 border-color만 지정합니다. 너비와 스타일은 별도로 지정해야 합니다. `cp-fill-*`/`cp-stroke-*`는 SVG 전용입니다. 색상 변수에 대응하는 5종 클래스가 모두 있지만, 모든 전경·배경 임의 조합이 접근성 검사를 통과한다는 뜻은 아닙니다. 승인된 색상 쌍은 `data/contrast-pairs.json`을 확인하세요. `cp-text-accent`보다 본문에는 `cp-text-accent-text` 또는 `cp-text-link`를 사용하세요.

## 상태·선택·포커스

| 상태 | 색상과 함께 줄 단서 |
|---|---|
| Hover | 표면 변화; 대상의 구조·이름 유지 |
| Pressed | 명확한 면 변화; 입력 장치 상태를 지속 선택과 혼동하지 않음 |
| Selected | `aria-selected`/`aria-current` + 좌측 표시 또는 체크 |
| Active tab | 밑줄 + 글자 굵기; 탭 패턴이면 키보드 이동도 구현 |
| Focus | 최소 3px outline + 3px offset; 주변 요소나 overflow에 가리지 않음 |
| Disabled | 실제 `disabled` 또는 적절한 접근성 동작 + 설명; opacity 일괄 감소 회피 |
| Error | 오류 문구 + 아이콘 + `aria-invalid`/`aria-describedby` |
| Loading | 진행 문구·접근성 이름 + 필요 시 `aria-busy`; 무의미한 무한 애니메이션 회피 |

미리보기 목록의 필터는 `aria-pressed` 버튼입니다. 실제 탭 컴포넌트를 구현한다면 tablist/tab/tabpanel과 해당 키보드 규칙을 사용하세요. 미리보기만 복사해 ARIA 역할을 추가하는 것으로 끝내지 마세요.

## 상태·심각도

- **Passed=성공**, **Review=수동 검토**, **Rejected=정책 반려**, **Failed=검사 실행 실패**를 구분합니다.
- 심각도 Critical/High/Medium/Low/Info/Unknown은 판정과 별도 축입니다.
- 녹색 포인트 팔레트에서도 모든 녹색 요소를 ‘승인’으로 해석하지 않도록 이름·위치·아이콘을 함께 씁니다.
- 빨간 포인트 팔레트에서도 주요 CTA와 파괴 작업의 텍스트·배치를 명확히 구분합니다.
- Neutral / Monochrome도 의미색까지 제거하지 않습니다. 상태색은 업무상 정보를 유지하기 위해 남깁니다.

## 코드·차트·오버레이

JSON에는 key/string/number/boolean/null/punctuation을 구분합니다. `syntax-comment`는 JSONC 등 주석을 지원하는 문맥에만 사용하세요. CSS 색상만 제공하므로 실제 토큰화는 기존 하이라이터와 연동하세요. Diff는 +/− 기호를 유지합니다. 코드 선택·복사 버튼과 라인 번호의 실제 대비도 앱에서 확인하세요.

8개 차트색은 표면과의 대비를 확인했습니다. 색상끼리 충분히 구별되는지, 적록색각 등에서 구별되는지는 보증하지 않습니다. 범례·직접 라벨·마커·선 패턴을 함께 사용하세요. `chart-axis`는 축 텍스트, `chart-grid`는 장식 그리드입니다. 데이터값을 주석 없이 색으로만 표현하지 마세요.

`overlay`는 검정 HEX이며 opacity는 backdrop 레이어에만 적용합니다. 패널 전체에 opacity를 주면 자식 텍스트 대비가 달라집니다. 네이티브 `<dialog>` 또는 기존 접근성 모달을 사용하고 포커스 이동·복원을 유지하세요. 고대비 모드는 시스템 색상을 존중합니다.

## 스타일·서체·간격

6개 스타일은 팔레트와 독립적입니다. 기본 텍스트 13~15px, 라운드 4~16px, 컨트롤 32~42px입니다. Compact는 데스크톱 고밀도 용도이며 터치 환경 예제에서는 44px로 확장합니다. 제목은 크기·굵기·간격으로 먼저 계층을 만들고 색상은 보조 수단으로 사용하세요.

기본은 Pretendard Variable + D2Coding이며, OFL 폰트 24종과 시스템 폰트 중 선택할 수 있습니다. 본문·코드 폰트는 색상 모드와 독립적입니다. 기존 폰트 로더에 선택한 CDN·동봉 정책을 병합하고, 별도 로더를 중복 도입하지 마세요. 자세한 기준은 `FONTS.md`, 후보 목록은 `FONT-CATALOG.md`를 참고하세요.

레이아웃은 4px 단위, 섹션 간격 16/20/24/32px를 출발점으로 삼습니다. 한 화면에 강한 포인트 면을 반복하지 마세요. 배지·칩·아이콘에 포인트를 모두 적용하면 현재 위치와 주요 행동의 우선순위가 약해집니다. 그라데이션·네온·입체 그림자는 기본 스타일에 포함하지 않습니다.

실제 앱 확인 시 360px/768px/1440px, 긴 한국어·영문 ID, 200% 확대, 키보드 포커스, 빈 상태와 실패 상태를 함께 봅니다. 이는 화면 적용 검토 항목이며 정적 팔레트 검사 결과와 구분합니다.
