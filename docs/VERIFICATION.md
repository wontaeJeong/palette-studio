# 검증 범위와 재현

초기 색상·통합 검증: 2026-10-27. 공통 UI 흐름·폰트 재검증: 2026-11-02. 생성된 수치 결과는 `data/audit-results.json`, `browser-check-results.json`, `integration-check-results.json`에 기록합니다.

1.1.0 폰트 검증 결과는 `font-audit-results.json`, `font-browser-check-results.json`, `font-cdn-check-results.json`에 추가했습니다. 24개 패밀리의 WOFF2 918개는 원본 해시·OFL 고지·버전 고정을 검사했습니다. CDN URL은 패밀리별 첫·마지막 파일 45건의 실제 HTTP 응답을 확인했습니다. 브라우저의 CDN 성공 테스트는 그 원본 WOFF2를 응답으로 제공하는 fixture를 사용하고, 오프라인 시나리오는 새 브라우저 프로세스로 캐시를 격리합니다. 외부 차단·단일 HTML 이동·동봉 전용·시스템 모드도 별도로 확인합니다.

```bash
python3 scripts/audit-fonts.py
node scripts/check-fonts.cjs
```

폰트 카드 필터·선택·추천 조합·설정 복원·한글 보완과 24종 실제 견본을 확인했습니다. 사내/상업용 허용 근거와 원본 라이선스는 `FONT-LICENSES.md`에 있습니다.

| 확인 | 방법 | 범위 |
|---|---|---|
| 정적 대비 | Node 표준 라이브러리로 상대 휘도 계산 | 64개 테마 × 177쌍 = 11,328건 |
| 토큰 일치 | 생성 CSS와 JSON 비교 | 테마별 의미 토큰 189개 |
| 브라우저 적용 | Chromium에서 computed custom properties 비교 | 64개 테마 |
| 스타일 적용 | 컨트롤 높이 computed value 비교 | 6개 스타일 |
| UI 동작 | 실제 브라우저 조작 | 검색·목록 필터·모달·비교·다운로드·선택 복원 |
| 변경 범위 내보내기 | 반환 CSS 확인 | dark-only / light-only / both 분리 |
| 반응형 외형 | 실제 viewport와 document 폭 확인 | 360 / 390 / 768 / 1440px, light / split / compare |
| 시스템 표시 설정 | CSS 미디어 에뮬레이션 | reduced motion / forced colors의 일부 렌더링 |
| 오프라인 | HTTP 요청 이벤트 관찰 | 동봉/시스템 모드의 외부 요청 0건; CDN 모드는 선택 폰트·견본 WOFF2만 요청 |
| Tailwind | v4 custom utilities 실제 컴파일 | 945개 클래스와 4개 상태 variant |
| React 예제 | TSX strict typecheck | ThemeProvider / ProjectPanel / 호환 ScanPanel / Button 소스 |
| 프로필 | JSON Schema 검사 | 예제와 브라우저 내보내기 2개 |

미리보기는 단일 Chromium 엔진에서 검증했습니다. Safari·Firefox·iOS WebView의 실제 실행, 앱별 포털·모달 동작, 모든 키보드·스크린리더 시나리오를 전부 검증했다는 뜻은 아닙니다. 기존 `examples/react`는 소스 타입을 확인한 통합 예제입니다. 아래의 실제 UI 라이브러리 어댑터는 별도로 번들하고 Chromium에서 실행했습니다. 전체 WCAG 인증을 제공하지 않습니다.

## 필수 의존성 없는 검사

```bash
python3 scripts/build.py
node scripts/audit.mjs
python3 scripts/bundle.py
```

## 선택적 브라우저 검사와 PNG

Playwright와 호환 Chromium이 준비된 환경에서 실행합니다.

```bash
npm install --no-save playwright
npx playwright install chromium
node scripts/browser-check.cjs
```

기존 Chromium을 사용하려면 `PALETTE_CHROMIUM_PATH`에 실행 파일 경로를 지정할 수 있습니다. 스크립트의 이 경로는 격리된 오프라인 HTML 검사용입니다. 임의 웹사이트를 탐색하는 설정으로 재사용하지 마세요. 한국어 폰트가 없는 환경은 선택적으로 `PALETTE_QA_FONT_DIR`에 `@fontsource/noto-sans-kr` 패키지 디렉터리를 지정하면 검증 페이지에만 폰트를 주입합니다. 1.1.0의 단일 HTML에는 동봉 폰트를 내장하므로 별도 한글 폰트 설치 없이 확인할 수 있습니다.

## 선택적 빌드·타입 검사

```bash
npm install --no-save tailwindcss@4 @tailwindcss/node@4 typescript@5.9.3 @types/react@19 ajv@8
node scripts/check-integration.cjs
```

검사 스크립트는 TypeScript 5.9.3의 JS compiler API를 사용합니다. 타깃 앱에 이 버전을 강제하지 않습니다. 프로필 내보내기 검사는 `check-studio-flow.cjs`가 만든 JSON을 사용하므로 브라우저 검사를 먼저 실행합니다.

## 미리보기 이미지

- `studio-overview.png`, `plum-light-dark.png`, `palettes-light.png`, `palettes-dark.png`, `components-dark.png`, `mobile-dark.png`: 브라우저가 렌더링한 화면입니다. 1.1.0 캡처는 실제 동봉 폰트를 사용합니다.
- `color-board-light.png`, `color-board-dark.png`: 실제 HEX 값으로 그린 정적 참고 일러스트입니다. 브라우저 스크린샷이 아닙니다. Pillow로 재생성할 수 있습니다.

```bash
python3 -m pip install pillow
python3 scripts/render_boards.py
python3 scripts/package.py
```

ZIP에는 파일별 SHA256과 크기를 담은 `MANIFEST.json`이 들어 있습니다. 패키징 시 node_modules·가상환경·캐시는 제외합니다.

## 1.2.0 공통 UI 회귀

`node scripts/check-studio-flow.cjs`는 64개 테마와 6개 스타일, 마지막 단계 다운로드, 본문 15종/코드 9종의 독립 검색·선택, 검색 결과 없음, 키보드 포커스 유지, 선택 복원, 이전 대상 링크 이관을 확인합니다. 360/390/768/1440px에서 선택 목록 끝의 미리보기 위치와 가로 넘침도 검사합니다. 결과는 `data/studio-flow-check-results.json`에 기록합니다.

`studio-common-overview.png`, `studio-flow-desktop.png`, `studio-flow-mobile.png`는 1.2.0의 실제 브라우저 화면입니다. 기본 개요·Plum 비교·모바일·컴포넌트 이미지는 공통 앱 예시로 갱신했습니다. 팔레트 축소 이미지와 참고 색상 보드는 색상값이 동일한 초기 자료입니다. 전체 접근성 인증이나 모든 브라우저 검증을 뜻하지 않습니다.

## 2026-11-14 콘셉트·라이브러리·라이브 지표

기존 여섯 세트와 폰트/아이콘 역할을 유지한 통합 작업실에서 다음 범위를 검증합니다. 루트에는 aggregate `npm test`가 없으며 실제 라이브러리 서브프로젝트의 `npm test`는 설치 패키지 타입과 5개 실제 생성 TSX 내보내기를 컴파일합니다.

```bash
node scripts/test-design-handoff.cjs  # catalog 순수 검사도 호출
node scripts/test-design-concepts.cjs
node scripts/test-ui-libraries.cjs
node scripts/check-handoff-schemas.cjs
node --test scripts/test-library-metrics.cjs
node scripts/audit.mjs
(cd examples/library-preview && npm test)
python3 scripts/bundle.py
node scripts/check-component-concepts.cjs
node scripts/check-component-gallery.cjs
node scripts/check-library-browser.cjs
node scripts/check-library-selection.cjs
node scripts/check-library-export-summary.cjs
node scripts/check-library-metrics-browser.cjs
node scripts/check-workspace-browser.cjs
node scripts/check-handoff-browser.cjs  # catalog 브라우저도 호출
node scripts/check-studio-flow.cjs
node scripts/capture-previews.cjs
node scripts/check-screenshot-freshness.cjs
```

- 9개 콘셉트의 실제 geometry/type/elevation 차이, 저장/공유/내보내기와 기존 정규화, 범위별 HEX, UI/CLI 동일 생성 결과를 확인합니다. 19종 샘플 × 9개 콘셉트 × 1440/390px에서 Light/Dark 두 pane 및 가로 넘침을 검사합니다.
- 앵커 tooltip의 무이동·hover/focus·Escape·재열기, 메뉴 키, popover 적용/복원, modal/drawer 복귀 포커스, 최대 3개 토스트·실제 남은 시간 pause·undo·영구 오류·키보드 dismiss와 모바일 쌓임, reduced-motion/일부 forced-colors를 확인합니다.
- 실제 Base UI/Radix/React Aria/MUI/Mantine의 Button·Tooltip·Dialog·Popover·알림을 양 모드와 390px에서 실행합니다. 설치된 컴포넌트의 포커스·포털·선택 HEX·본문 폰트·콘셉트 geometry, 알림 격리와 해제를 검사합니다. Radix/React Aria 알림은 Sonner임을 표시합니다. 오프라인 `file://START-HERE.html`에서도 5종 실제 dialog와 pagehide/pageshow 수명을 검사합니다.
- 메트릭 Node 검사는 외부 fetch/storage 경계만 제어해 실제 응답 형태와 정확한 엔드포인트, 유효한 0, 음수/문자/unsafe 수치 거절, 날짜·패키지 검증, 부분 실패, release 404, 403/429·retry 시각, 독립 TTL/캐시 보존, 진행 중 중복 제거, 최대 동시 3요청, 슬롯 확보 후 8초 기본 timeout, 늦은 응답·abort, storage getter/method 오류와 손상 캐시를 확인합니다.
- 실제 UI/client 브라우저 검사는 최초 메트릭 요청 0건, 성공, 일부 503/404, 403/429·재시도, 기한 경과 캐시, 차단된 저장소, 늦은 응답 중 라이브러리/콘셉트 변경, 390px 가로 넘침을 확인합니다. 지표 갱신 전후 디자인 설정·공유 URL·생성 파일은 동일합니다. 실제 라이브러리 선택 클릭 후 데스크톱/모바일에서 실제 예시가 미리보기 내부 스크롤로 즉시 보이며, 모바일 기존 확대 기능과 선택 컨트롤 포커스·inspector 위치를 보존하는 것도 확인합니다. 이 결정적 검사에서만 HTTP 경계를 fixture로 대체합니다.
- `scripts/smoke-library-metrics.cjs`는 별도의 선택적 실제 네트워크 검사입니다. 2026-11-14 05:56:57 UTC, `file://` 실제 UI에서 Base UI를 한 번 새로고침하여 GitHub/npm 세 소스 200을 확인했습니다. 공개 서비스/할당량/CORS 정책에 의존하므로 CI 성공 요건으로 사용하지 않습니다. 소스·값·시각 증거는 `previews/library-metrics-observation.json`입니다.

`capture-previews.cjs`는 기존 화면과 함께 새 콘셉트, 알림/팝오버, 5종 실제 라이브러리, light/dark/mobile 지표를 오프라인 캡처합니다. 지표는 실제 관측 JSON을 캐시로 읽고 원래 시각·캐시/기한 경과를 그대로 표시합니다. 새 authored/runtime JS·CSS·라이브러리 원본/잠금 파일·생성 번들·실제 관측 JSON도 소스 해시에 포함합니다. freshness 검사는 소스 해시와 각 PNG의 크기·해시를 확인하므로 UI가 바뀐 오래된 캡처를 통과시키지 않습니다.

브라우저 범위는 Playwright 1.56.1 / Chromium 141.0.7390.37입니다. Safari/Firefox/iOS·모든 스크린리더나 대상 앱 통합을 검증한 것은 아닙니다. npm 다운로드를 전체 활성 사용자 수로 환산하지 않고, GitHub 최신 저장소 릴리스가 테스트한 대표 패키지 버전과 같다고 가정하지 않습니다. 폰트/아이콘 원본은 이번 변경에서 바꾸지 않았으며 기존 별도 감사 결과는 위의 원래 범위에 한정됩니다. 전체 앱 접근성 인증을 뜻하지 않습니다.


최신 main의 작업실 회귀도 통합했습니다. `check-workspace-browser.cjs`는 `check-workspace-review.cjs`를 함께 실행해 입력/버튼 표현의 독립성, 라이트/다크 비교 링크·URL·저장 복원, 시스템 폰트 공급에서 역할별 선택 복구, 내비게이션 버튼의 접근 가능한 이름을 확인합니다. 라이브러리 내보내기 화면은 간결한 한국어 적용 범위·React/Astro 요구사항을 표시하며, 전체 canonical `library-README.md`의 실제 다운로드 바이트를 1440/390px에서 검사합니다. 두 내보내기 캡처를 포함한 최신 manifest는 31개 PNG를 검사합니다.
