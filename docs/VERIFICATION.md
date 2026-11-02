# 검증 범위와 재현

검증일: 2026-10-27. 생성된 수치 결과는 `data/audit-results.json`, `browser-check-results.json`, `integration-check-results.json`에 기록합니다.

1.1.0 폰트 검증 결과는 `font-audit-results.json`, `font-browser-check-results.json`, `font-cdn-check-results.json`에 추가했습니다. 24개 패밀리의 WOFF2 918개는 원본 해시·OFL 고지·버전 고정을 검사했습니다. CDN URL은 패밀리별 첫·마지막 파일 45건의 실제 HTTP 응답을 확인했습니다. 브라우저의 CDN 성공 테스트는 그 원본 WOFF2를 응답으로 제공하는 fixture를 사용하고, 외부 차단·단일 HTML 이동·동봉 전용·시스템 모드도 별도로 확인합니다.

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
| React 예제 | TSX strict typecheck | ThemeProvider / ScanPanel / Button 소스 3개 |
| 프로필 | JSON Schema 검사 | 예제와 브라우저 내보내기 2개 |

미리보기는 단일 Chromium 엔진에서 검증했습니다. Safari·Firefox·iOS WebView의 실제 실행, 앱별 포털·모달 동작, 모든 키보드·스크린리더 시나리오를 전부 검증했다는 뜻은 아닙니다. React는 소스 타입을 확인한 통합 예제이며 완성 앱을 실행한 테스트는 아닙니다. 전체 WCAG 인증을 제공하지 않습니다.

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

검사 스크립트는 TypeScript 5.9.3의 JS compiler API를 사용합니다. 타깃 앱에 이 버전을 강제하지 않습니다. 프로필 내보내기 검사는 `browser-check.cjs`가 만든 JSON을 사용하므로 브라우저 검사를 먼저 실행합니다.

## 미리보기 이미지

- `studio-overview.png`, `plum-light-dark.png`, `palettes-light.png`, `palettes-dark.png`, `components-dark.png`, `mobile-dark.png`: 브라우저가 렌더링한 화면입니다. 1.1.0 캡처는 실제 동봉 폰트를 사용합니다.
- `color-board-light.png`, `color-board-dark.png`: 실제 HEX 값으로 그린 정적 참고 일러스트입니다. 브라우저 스크린샷이 아닙니다. Pillow로 재생성할 수 있습니다.

```bash
python3 -m pip install pillow
python3 scripts/render_boards.py
python3 scripts/package.py
```

ZIP에는 파일별 SHA256과 크기를 담은 `MANIFEST.json`이 들어 있습니다. 패키징 시 node_modules·가상환경·캐시는 제외합니다.
