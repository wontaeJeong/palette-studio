# 스타일 선택 가이드

색상을 바꾸지 않고 형태·여백·밀도를 비교할 수 있습니다. 모든 스타일은 그림자 없이 시작합니다. Clear Boundaries는 경계 강조이며 WCAG AAA를 뜻하지 않습니다.

| ID | 스타일 | 컨트롤 | 기본 글자 | 카드 라운드 | 패딩 | 간격 | 용도 |
|---|---|---|---|---|---|---|---|
| `operational` | Operational | 38px | 14px | 10px | 20px | 16px | 작은 라운드, 평평한 카드, 명확한 정보 계층. Gate 기본 추천. |
| `soft` | Soft Product | 42px | 14px | 16px | 24px | 20px | 넉넉한 여백과 16px 카드. 채도는 포인트에만 사용. |
| `outline` | Outline | 38px | 14px | 5px | 20px | 16px | 작은 라운드, 강한 카드 경계, 그림자 없는 도구형 UI. |
| `editorial` | Editorial | 42px | 15px | 6px | 28px | 24px | 20px 섹션 제목과 긴 행간, 문서·위키·콘텐츠 중심. |
| `compact` | Compact | 32px | 13px | 7px | 16px | 12px | 32px 컨트롤과 조밀한 표. 데스크톱 운영 화면용. |
| `contrast` | Clear Boundaries | 42px | 14px | 6px | 20px | 16px | 2px 경계, 넓은 포커스. 색 대비 AAA 인증을 뜻하지 않음. |

색상 비교에서는 스타일을 고정하고, 스타일 비교에서는 색상을 고정하세요. `foundation.css` 다음에 선택한 스타일 CSS를 불러오고, 같은 `.cp-scope` 요소에 `data-style`을 지정합니다. 터치 환경 예제는 컨트롤 높이를 최소 44px로 확장합니다.
