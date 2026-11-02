# 이전 기준과 새 후보의 출처

이 패키지는 2026-10-27 제작했습니다. 사용자와 이전 대화에서 확인한 기준과 이번 작성안을 구분합니다.

## 이전에 확인한 기준

- Plum 브랜드: Light accent `#78469E`, strong `#623680`; Dark accent `#D4A1EB`, strong `#EAC7F6`.
- 다크 표면 기준: canvas `#101114`, raised `#1C1D22`, surface `#25252D`, shell `#18191D`, line `#303038`.
- 과도한 그림자·그라데이션·네온을 피하는 단순하고 절제된 UI.
- 라이트 컬러 유지, 다크만 컬러 변경. 이 조건은 기존 Gate 적용 기본값입니다. 새 앱이나 명시적으로 양쪽 변경을 선택할 때는 새 두 모드안을 사용할 수 있습니다.
- `themeContrast.test.ts`에 색상 쌍 등록. 색상 선언은 직접 HEX로 두고 var() 별칭으로 합치지 않는 기존 파서 제약. 코드에는 fill+border.
- 본문 Pretendard Variable, 코드 D2Coding과 기존 로더/fallback 재사용.

## 기존 참고 파일

2026-10-20 생성된 `color-tokens.css`의 제목은 **Graphite & Indigo | Reference palette**입니다. 최종 Gate의 전체 팔레트라고 단정하지 않습니다. 원문은 `reference/color-tokens.css.original.txt`, 당시 검사 정의는 `reference/color-audit.rules.json.original.txt`에 보존했습니다.

`graphite-indigo-reference`에는 accent·strong·on-accent 및 canvas·raised·surface·ink·ink-muted의 당시 핵심값을 유지했습니다. 나머지 지원 역할은 이번 범용 토큰 계약에 맞춰 보완·검사했습니다. 이전 파일의 모든 토큰 이름을 포함하지만 모든 값이 원문과 같다는 뜻은 아닙니다. 기존 var() 별칭은 생성된 새 팔레트에서 직접 HEX로 풀었습니다.

이전 규칙의 forbiddenColors는 당시 한 팔레트의 경고 목록이며 새 키트의 전역 금지 목록으로 적용하지 않았습니다. 당시 chart DeltaE76 권고를 전체 접근성 통과 기준으로 사용하지 않았습니다.

## 이번에 새로 작성한 범위

Plum의 전체 라이트 표면·지원 색상, Slate와 기타 팔레트, 상태색의 표면별 조정, 6개 스타일, 원시 램프, 의미 유틸리티와 샘플 컴포넌트는 새 후보안입니다. ‘기존 전체 CSS 클래스와 픽셀까지 복원’한 자료가 아닙니다. 사내 최신 저장소 소스는 이번 패키지에서 직접 확인하지 않았습니다.

색조합은 범용 UI에서 선택하기 유용하도록 큐레이션했습니다. 특정 제품의 정확한 디자인을 복제한 테마나 사용량 통계에 따른 인기 순위는 아닙니다. 새 앱을 디자인할 때 폭넓게 비교할 후보로 사용합니다.
