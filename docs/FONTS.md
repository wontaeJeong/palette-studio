# 폰트 선택과 CDN 사용

1.1.0부터 컬러·스타일과 별도로 본문과 코드 폰트를 고를 수 있습니다. 기본은 Pretendard Variable + D2Coding, 공급 방식은 **CDN 우선 → 동봉 WOFF2 → 시스템 폰트**입니다. 폰트는 라이트·다크에 공통 적용하며, ‘다크만 변경’은 컬러 변경 범위입니다.

| 역할 | 후보 | 고정 버전 | 제공 굵기 |
|---|---|---|---|
| 본문 | Pretendard Variable | 1.3.9 | Variable 45–920 |
| 본문 | SUIT Variable | 2.0.3 | Variable 100–900 |
| 코드 | D2Coding | 1.3.2 | 400 / 700 |
| 코드 | JetBrains Mono | 2.304 | 400 / 700 |
| 각 역할 | 시스템 기본 / 시스템 고정폭 | OS 제공 | 설치 환경에 따름 |

한글 코드·주석의 폭이 중요하면 D2Coding을 먼저 확인하세요. JetBrains Mono 선택 시 지원하지 않는 한글은 OS fallback으로 표시됩니다. 코드 견본에 `0O 1lI ①②`, 한글 주석과 JSON을 넣었습니다. 코드의 리거처는 기본적으로 사용하지 않습니다.

전체 후보 24종과 사용 목적·한글 지원·배포 버전은 `FONT-CATALOG.md`, 폰트별 원본 라이선스와 사내/상업용 사용 확인표는 `FONT-LICENSES.md`에 있습니다. 위 표는 기본 비교 후보입니다. 패키지 버전은 원본 폰트 버전과 다를 수 있습니다.

## 미리보기

본문·코드·Font delivery를 고르면 실제 운영 화면과 컴포넌트 견본에 반영됩니다. 선택한 폰트와 필요한 한글 보완 폰트, 화면에 보이는 카드 견본을 로드합니다. 영문 중심 본문은 Pretendard로, 영문 코드 폰트는 D2Coding으로 한글을 보완합니다. 상태줄은 본문과 코드가 각각 CDN / 동봉 폰트 / 단일 HTML 내장 폰트 / 시스템 중 어느 경로로 로드됐는지 보여 줍니다. 준비 중에도 시스템 폰트로 화면을 사용할 수 있습니다.

- **CDN 우선**: 버전이 고정된 jsDelivr WOFF2를 시도합니다. 실패·타임아웃 후 동봉 파일, 마지막으로 OS fallback을 사용합니다.
- **동봉 폰트만**: 외부 요청 없이 폰트 파일을 사용합니다. 단일 HTML에서는 내장 바이너리를 읽습니다.
- **시스템 폰트만**: 외부·동봉 폰트 로딩을 생략합니다.

연결이 바뀌면 ‘폰트 다시 읽기’를 누르면 됩니다. 폰트 로더의 CDN 대기 한도는 단계당 6초입니다. 적용 generation을 확인해 빠르게 설정을 바꿀 때 이전 요청이 새 선택을 덮어쓰지 않게 합니다. 로딩한 폰트는 현재 페이지의 메모리에만 캐시하고 선택값은 로컬 설정과 선택 링크에 저장합니다.

`START-HERE.html`에는 24개 폰트 패밀리의 원본 WOFF2와 라이선스가 내장돼 있습니다. 폴더에서 분리해 옮겨도 오프라인 폰트가 동작합니다. 모듈형 `index.html`은 일반 정적 서버에서 사용하세요. 브라우저가 `file://`의 별도 폰트 파일 접근을 제한하면 시스템 폰트로 폴백할 수 있으므로, 더블클릭 사용은 단일 HTML이 확실한 경로입니다.

## CSS와 앱 통합

CSS 저장에는 색상·스타일과 선택 폰트의 `@font-face`가 포함됩니다. ‘폰트 CSS 저장’은 폰트 설정만 내보냅니다. CDN 우선 CSS는 각 face의 `src`에 CDN URL과 동봉 파일 URL을 순서대로 두며 `font-display: swap`을 사용합니다. 이 순서는 브라우저의 폰트 소스 실패 처리에 따른 fallback이며, JS 로더의 6초 전환 시간까지 CSS만으로 보장하는 것은 아닙니다. 정확한 전환 상태·시간 관리가 필요하면 공유 `font-loader.js`를 기존 로더에 병합하세요.

권장 디렉터리는 다음과 같습니다.

| 경로 | 내용 |
|---|---|
| `design/selected-theme.css` 또는 `selected-fonts.css` | 내보낸 CSS |
| `design/design-profile.json` | 선택 프로필 |
| `design/palette-studio/assets/fonts/` | 선택한 폰트와 해당 OFL.txt |

내보낸 CSS의 동봉 경로는 CSS 파일 기준 `./palette-studio/assets/fonts/...`입니다. 다른 위치에 넣으면 URL도 조정하세요. 제품에는 선택한 폰트 패밀리만 복사하면 됩니다. 모든 패밀리나 큰 미리보기 HTML을 제품 번들에 넣을 필요는 없습니다.

빠른 기본 적용은 `css/fonts-cdn.css`를 한 번 import하면 됩니다. 외부 접근이 없는 앱은 `css/fonts-local.css`를 사용합니다. 기본 CSS에는 Pretendard + D2Coding만 포함해 불필요한 폰트 번들이 생기지 않게 합니다. 다른 조합은 미리보기에서 선택해 내보내세요. 이 CSS의 동봉 URL은 해당 CSS 위치 기준 `../assets/fonts/...`입니다. 앱에서 이동할 때 이 상대 관계를 유지하세요. React·Tailwind·Vanilla 예제에도 기본 폰트 CSS를 연결했습니다.

`--kit-font-sans`, `--kit-font-mono`가 선택한 전역 스택이며 foundation이 `--ui-font-sans`, `--ui-font-mono`로 소비합니다. 색 토큰의 직접 HEX 규칙과는 별개입니다. 기존 앱 ThemeProvider·폰트 로더·CSP를 재사용하고 중복 로더를 추가하지 마세요.

## 사내망·CSP

CDN을 사용하는 앱의 `font-src`에는 `https://cdn.jsdelivr.net`과 실제 로컬 폰트 출처가 허용돼 있어야 합니다. 패키지는 외부 스타일시트를 읽지 않고 WOFF2를 직접 로드하므로 기본 구성에서 외부 `style-src`를 추가할 필요는 없습니다. CSP를 무조건 완화하지 말고 앱의 기존 정책에 맞춰 선택하세요. 외부가 차단된 환경은 동봉 폰트 모드로 사용할 수 있습니다.

제공한 단일 HTML은 inline script/style을 포함하는 로컬 미리보기입니다. 엄격한 CSP를 가진 실제 앱에서는 모듈 파일과 기존 nonce/hash 처리를 사용하세요. 폰트 소스만 동봉 파일로 바꾸면 사내 인증서나 프록시 때문에 외부 로딩이 실패해도 UI 확인을 계속할 수 있습니다.

## 출처·재생성

원본 설정은 `data/fonts.source.json`, 버전·정확한 URL·파일 크기·SHA256·라이선스 전문은 `data/fonts.json`입니다. 폰트는 OFL-1.1이며 `THIRD-PARTY-NOTICES.md`와 각 폰트의 `OFL.txt`를 유지해야 합니다. D2Coding WOFF2는 NAVER 원본의 Joungkyun 변환 배포본입니다.

```bash
# 동봉 파일이 이미 있으면 네트워크 없이 카탈로그와 CSS를 갱신합니다.
python3 scripts/vendor_fonts.py
python3 scripts/audit-fonts.py
python3 scripts/bundle.py

# URL에 고정된 버전을 다시 내려받을 때만 사용합니다.
python3 scripts/vendor_fonts.py --refresh
```

공식 참고: https://github.com/orioncactus/pretendard · https://github.com/sunn-us/SUIT · https://github.com/naver/d2-coding-font · https://github.com/Joungkyun/font-d2coding · https://github.com/JetBrains/JetBrainsMono
