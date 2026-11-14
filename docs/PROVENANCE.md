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

## 2026-11-14 콘셉트·실제 라이브러리·공개 지표

아홉 콘셉트와 컴포넌트 정리는 이 저장소에서 작성한 비교 후보입니다. 트렌드 전체를 열거하거나 라이브러리를 인기 순으로 정렬한 결과가 아닙니다. 형태·타이포·재질·상호작용의 근거로 확인한 공식 자료:

- [Material design eras](https://design.google/library/material-design-eras): 형태·타입·모션의 독립 차원.
- [Apple Materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Fluent material](https://fluent2.microsoft.design/material): 기능적 재질층과 불투명 fallback.
- [Floating UI Tooltip](https://floating-ui.com/docs/tooltip): 앵커·충돌·hover/focus·dismiss 동작.
- [Base UI Tooltip](https://base-ui.com/react/components/tooltip), [Toast](https://base-ui.com/react/components/toast), [Radix primitives](https://www.radix-ui.com/primitives/docs/overview/introduction), [React Aria styling](https://react-aria.adobe.com/styling), [MUI theming](https://mui.com/material-ui/customization/theming/), [Mantine theme object](https://mantine.dev/theming/theme-object/), [Sonner](https://sonner.emilkowal.ski/): 실제 어댑터와 설치 패키지 타입·소스를 대조했습니다.
- [shadcn Base UI default](https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default): Base UI/Radix 기반 복사 컴포넌트 레시피로 표시합니다.

실제 번들의 고정 버전·transitive integrity는 `examples/library-preview/package-lock.json`, 전체 라이선스·NOTICE는 `assets/library-preview-LICENSES.txt`에 보존합니다. npm에 누락된 한 MIT 고지의 원본 제한은 `examples/library-preview/licenses/README.md`에 별도 기재합니다.

지표 원본은 [GitHub repository REST](https://docs.github.com/en/rest/repos/repos#get-a-repository), [latest release REST](https://docs.github.com/en/rest/releases/releases#get-the-latest-release), [npm download counts API](https://github.com/npm/registry/blob/main/docs/download-counts.md)입니다. 인증·백엔드 없이 명시적 조회합니다. Stars는 저장소 관심도, npm은 응답 기간의 다운로드 요청 수입니다. CI/반복 설치, monorepo 범위, 대표 패키지, shadcn CLI의 한계를 화면에 표시하고 고유 사용자·품질 순위를 계산하지 않습니다.

2026-11-14 05:56:57 UTC에 실제 `file://index.html`의 Base UI 카드에서 한 번 새로고침했습니다. GitHub 저장소·latest release·npm 세 요청은 모두 HTTP 200이었고, 11,410 stars, `v1.9.0`, `@base-ui/react` 다운로드 29,705,480건(2026-11-06 ~ 2026-11-12)을 확인했습니다. 이 수치는 당시 관측일 뿐 현재 수치를 보장하지 않습니다. 정확한 소스별 시각·URL·값·응답 상태는 `previews/library-metrics-observation.json`에 보존합니다. 지표 스크린샷은 그 실제 관측을 네트워크 차단 상태에서 캐시로 재표시한 것으로, 합성 사용량 fixture가 아닙니다. 결정적 오류/제한 테스트는 별도의 HTTP fixture를 사용합니다.
