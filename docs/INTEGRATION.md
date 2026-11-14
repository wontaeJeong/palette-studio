# 기존 앱 / React / Tailwind 통합

## 기존 앱

이 키트는 특정 앱의 전체 소스를 분석한 결과물이 아닙니다. 기존 정의를 변경할 때는 내보낸 `design-profile.json`의 scope를 우선합니다. 다크만 변경할지, 라이트만 변경할지, 두 모드를 바꿀지는 적용 대상에 맞게 선택합니다.

1. 확인·내보내기 단계에서 기존 앱 / 다크만으로 내보내면 `selected-theme.css`에 다크 선언만 담깁니다.
2. 기존 `html[data-theme="dark"]` 등 프로젝트의 canonical 테마 정의에 선언값을 병합합니다. 기존 토큰 이름과 다른 역할만 명시적으로 매핑합니다. 새 override 파일을 계속 쌓지 않습니다.
3. 기존 앱 대비 검증의 전경·배경 쌍을 갱신합니다. 키트의 `data/contrast-pairs.json`에서 실제 사용 쌍을 참고하세요. 이 키트의 검사기는 그 프로젝트 테스트를 대체하지 않습니다.

확인된 이전 토큰 이름은 모두 새 카탈로그에 있습니다. 예: `--color-canvas`, `--color-raised`, `--color-line-strong`, `--color-status-passed`, `--color-sev-critical`, `--color-card-active`, `--color-code-bg`. `docs/LEGACY-MAP.md`에 전체 목록을 제공합니다. 이 이름들이 React 클래스 이름이라는 뜻은 아닙니다. 기존 `.card`, `.badge` 등의 컴포넌트 클래스는 유지하고 색상 속성을 의미 토큰에 연결하세요.

**원래 라이트 토큰을 유지하려면 두 모드가 들어 있는 단일 팔레트 파일을 통째로 import하지 마세요.** 미리보기의 새 라이트안은 비교 후보입니다.

## 신규 앱: plain CSS

`examples/vanilla/index.html`은 더블클릭으로 실행됩니다. 제품용 최소 경로는 팔레트 1개 + 필요한 스타일입니다. `.cp-scope` 예제 컴포넌트를 사용한다면 foundation 뒤에 스타일을 import하세요. 의미 토큰만 가져오면 foundation과 utilities는 필요 없습니다.

팔레트 단일 파일은 `:root`에 light 기본값, `:root[data-theme="dark"]`에 dark 값을 둡니다. 전체 팔레트 파일은 `[data-palette][data-theme]` 조합을 지원하며 여러 미리보기를 한 페이지에서 독립적으로 표시합니다. 전체 파일은 비교 화면용입니다. 제품에 불필요한 32종을 싣지 마세요.

## Tailwind v4

```css
@import "tailwindcss";
@import "./palette-studio/css/palettes/graphite-plum.css";
@import "./palette-studio/css/tailwind-v4.css";
```

```tsx
<button className="rounded-lg border px-4 py-2 cp-bg-accent cp-text-on-accent cp-border-accent hover:cp-bg-accent-hover hover:cp-border-accent-hover focus-visible:outline-3 focus-visible:outline-offset-3 [outline-color:var(--color-focus)]">
  프로젝트 추가
</button>
```

의미값은 `@theme inline`의 `var()` 별칭으로 합치지 않고, `@utility`에서 토큰을 속성값으로 소비합니다. `css/utilities.css`는 일반 CSS용, `css/tailwind-v4.css`는 Tailwind 빌드 입력용입니다. 둘을 동시에 import하지 마세요. `@utility` 파일은 브라우저에 직접 주입하지 않습니다. Tailwind 공식 문서의 custom utilities 방식에 맞춘 소스 예제입니다. 프로젝트 버전과 빌드 환경에서 최종 컴파일을 확인하세요.

기존 `bg-*` 클래스와 충돌하지 않게 `cp-` 접두사를 씁니다. 다크 색상은 `data-theme`가 토큰을 바꾸므로 같은 의미 클래스가 두 모드에 그대로 적용됩니다. 색상에 `dark:` 클래스를 중복 작성할 필요가 없습니다. 레이아웃·아이콘 등 실제 모드별 구조 차이에만 프로젝트의 다크 variant를 사용하세요.

## React

`examples/react/ThemeProvider.tsx`는 React 앱에 합쳐 쓸 수 있는 소스 예제입니다. `light/dark/system` 설정과 로컬 저장, OS 테마 변경을 다룹니다. 기존 ThemeProvider가 있으면 이 파일을 추가하지 말고 기존 구현에 필요한 값만 연결하세요.

첫 페인트 깜박임을 줄이는 `examples/theme-init.js`는 `<head>`에서 CSS보다 먼저 실행할 수 있습니다. CSP가 있는 앱은 기존 nonce/hash 또는 외부 script 정책에 맞춰 사용하세요. 그 정책을 완화할 필요는 없습니다. SSR이면 서버 쿠키·기존 프레임워크 테마 처리와 중복되지 않게 조정합니다.

폰트 선택은 컬러 변경 범위와 별개이며 두 모드에 공통입니다. 기존 로더에 `design-profile.json`의 fonts 정책을 병합하세요. 통합 작업실과 CLI의 `selected-theme.css`는 색상 토큰을, `selected-fonts.css`는 글꼴 선언을 담당합니다. 선택한 스타일 수치가 필요하면 `selected-style.css`도 연결하고, 각 파일은 한 번만 import합니다. 라이선스·CSP·경로는 `docs/FONTS.md`를 따릅니다.

포털로 렌더링하는 dialog/tooltip은 토큰을 읽는 DOM 범위 밖으로 나가지 않도록 합니다. 앱 토큰을 `html`에 두면 보통 body 포털도 상속합니다. 일부 패널에만 토큰을 둘 때는 포털 컨테이너도 같은 테마 범위로 맞춰야 합니다. 미리보기는 각 테마 범위 안에 dialog를 배치합니다.

## OpenCode 연동

로컬 공용 카탈로그로 둘 때는 예를 들어 `~/design-kits/palette-studio/`에 압축을 풀고 OpenCode 작업지시에서 **실제 절대 경로**를 지정합니다. 앱에는 채택한 CSS·프로필·짧은 규칙만 넣어도 됩니다. 앱별 프로필을 고정해 공용 카탈로그를 바꿔도 기존 앱의 디자인이 자동으로 흔들리지 않게 하세요.

앱 저장소 안에 보관한다면 권장 위치는 `design/palette-studio/`, 내보낸 프로필은 `design/design-profile.json`, 선택 CSS는 `design/selected-theme.css`입니다. UI의 프로필 `$schema` 경로는 이 구조를 기준으로 합니다. 다른 위치로 저장하면 `$schema` 경로도 조정하세요. 프로필 안의 integration 경로는 키트 루트 기준입니다.

자동으로 사용자 전역 설정을 수정하는 스크립트는 없습니다. `agents/ROOT-AGENTS-SNIPPET.md`를 기존 앱 `AGENTS.md`에 병합하거나, `agents/opencode.instructions.example.json`의 instructions 항목을 기존 `opencode.json`에 병합합니다. 경로 예시는 앱 루트 아래 `design/palette-studio/`에 키트를 둔 기준입니다. 실제 경로를 바꾸면 참조도 바꾸세요. Superpowers 활성화는 사용자의 기존 워크플로를 따릅니다.

## 파일 변경·검사

생성 원본은 `scripts/build.py`입니다. JSON과 CSS를 따로 손으로 바꿔 drift를 만들지 마세요. `node scripts/audit.mjs`는 모든 테마와 생성 CSS의 값 일치도 확인합니다. raw ramp에 대해서는 접근성 승인 결과를 제공하지 않습니다. 색상 변경 후에는 기존 앱의 실제 상태·겹침·focus-ring을 별도로 확인하세요.

## 독립 콘셉트와 컴포넌트 미리보기

작업실의 여섯 세트는 업무 시작점이고, 아홉 콘셉트는 별도로 선택하는 형태·타이포 위계·재질 기준입니다. `designSelection.concept`는 `minimal`, `soft`, `editorial`, `compact`, `brutalist`, `glass`, `expressive`, `terminal`, `tactile` 중 하나입니다. 기존 선택에서 이 값이 없으면 studio/precision은 minimal, bloom은 soft, editorial은 editorial, console은 compact, signal은 brutalist로 정규화합니다. 기존 세트 ID와 개별 soft/outline/solid 표현은 보존됩니다.

`data/design-concepts.js`가 브라우저와 CLI의 단일 원본입니다. `node scripts/build-concepts.cjs`는 미리보기용 `css/concepts.css`를 생성합니다. 내보내기의 `selected-style.css`에는 선택한 콘셉트 하나만 같은 함수로 들어갑니다. 샘플 클래스명을 앱의 클래스라고 가정하지 말고 `--concept-*`를 현재 컴포넌트에 연결하세요. 형태·위계·깊이는 콘셉트가, 밀도·컨트롤 크기는 스타일이 담당하며 본문/코드 글꼴 선택은 그대로 유지합니다.

포털 루트에 `data-theme`, `data-palette`, `data-style`, `data-concept`를 전달합니다. Glass의 장식층은 내비게이션·팝오버·대화상자에 제한되고 본문에는 불투명 의미 표면을 유지합니다. 선택된 재질도 토큰의 literal HEX 규칙과 dark-only 색상 범위를 바꾸지 않습니다.

프레임워크 중립 예시는 19종입니다. 툴팁은 고정 앵커·hover/focus·Escape 후 재열기를 지원하며 인터랙티브 내용은 별도 Popover를 씁니다. Toast는 최대 3개, 남은 시간 기준 hover/focus 일시정지, 되돌리기, 영구 오류 안내를 제공합니다. 모달에서 실행하는 알림은 해당 모달 아래 DOM에 두고 top layer로 표시해 보이면서도 조작 가능하게 합니다. 기존 앱에서는 이미 사용하는 접근성 라이브러리를 우선 재사용하세요.

검증: `node scripts/test-design-concepts.cjs`, `node scripts/check-component-concepts.cjs`(Playwright), 기존 카탈로그·작업실·handoff 회귀 검사, `node scripts/audit.mjs`. 최종 단일 HTML은 `python3 scripts/bundle.py`로 다시 만듭니다.

## 실제 UI 라이브러리 비교와 내보내기

`uiLibrary`는 색상·콘셉트·프레임워크와 독립된 선택입니다. 이전 설정은 `vanilla`(기존 UI 재사용)로 정규화됩니다. Base UI, Radix Primitives, React Aria, MUI, Mantine을 고르면 작업실의 별도 실제 라이브러리 영역에서 Button · Tooltip · Dialog · Popover · 알림을 비교합니다. 프로젝트와 컴포넌트 도감 예시는 계속 프레임워크 중립이며, 실제 패키지를 사용한 화면으로 표시하지 않습니다. 기존 앱에서는 선택한 참고 라이브러리보다 현재 앱의 컴포넌트·Provider를 우선합니다.

- Base UI는 자체 Toast, MUI는 Snackbar/Alert, Mantine은 자체 Notifications를 사용합니다. Radix와 React Aria의 알림은 명시적으로 Sonner입니다. React Aria의 alpha Toast API는 사용하지 않습니다. Radix Primitives에는 스타일된 Button이 없으므로 실제 Trigger에 연결한 네이티브 버튼이 올바른 예입니다.
- 모든 외부 대상은 React 런타임이 필요합니다. Astro는 `@astrojs/react`와 클라이언트 island, Vanilla 대상은 의도적인 React root/bundle 추가가 필요합니다. 미리보기 선택만으로 프레임워크가 변경되지 않으며 UI와 `library-README.md`에서 이 조건을 표시합니다.
- shadcn/ui는 독립 런타임 패키지가 아니라 복사해서 관리하는 컴포넌트 레시피입니다. Base UI/Radix 선택 시 실제 선택 HEX의 `shadcn-tokens.css`가 함께 나옵니다. 현재 컴포넌트의 Tailwind 매핑에 연결하고 과거 `hsl(var(...))` 래퍼를 제거해야 합니다. `shadcn` CLI 다운로드를 컴포넌트 사용량으로 해석하지 않습니다.

`data/ui-libraries.js`의 순수 `recipe(config,catalog)`를 `PaletteHandoff.libraryFiles`가 공유합니다. 확인·내보내기 화면과 독립 handoff 화면 및 CLI는 같은 파일을 생성합니다. `library-theme.ts`에는 허용된 색상 모드의 실제 HEX만 있고 제외 모드는 `applyLibraryTokens(existing,mode)`가 기존 값을 그대로 반환합니다. `library-components.tsx`, 실제 `library-adapter.tsx`, `library-shared.tsx`, `library.css`, 정확한 의존성 목록 `library-packages.json`, 적용 설명이 함께 나옵니다. 이 샘플 전체로 앱을 대체하지 말고 이미 쓰는 Provider에 토큰/shape/font를 병합하세요. 폰트 파일과 OFL은 기존 CLI의 fonts 폴더 내보내기를 사용합니다.

포털은 선택 색상·본문 폰트·콘셉트 변수를 가진 별도 DOM 컨테이너 안에 렌더합니다. 실제 앱에 매핑할 때도 해당 스코프와 모드가 포털까지 이어져야 합니다. Light/Dark 예시는 각각 별도 Base UI Provider, Sonner toaster ID, Mantine notification store와 MUI 상태를 소유합니다. 한쪽 알림이 다른 쪽에 복제되지 않으며 해제 시 React root와 포털을 제거합니다. Mantine CSS는 파서로 `.ps-library` 안에 한정하고 CssBaseline 같은 전역 reset은 사용하지 않습니다. 유지해야 할 필수 오류는 토스트에만 두지 마세요.

사용자 실행에는 npm이나 네트워크가 필요하지 않습니다. 번들은 classic script이며 `START-HERE.html`에 그대로 인라인됩니다. 개발 재빌드는 다음과 같습니다.

```bash
cd examples/library-preview
npm ci
npm test
npm run build
cd ../..
node scripts/test-ui-libraries.cjs
node scripts/check-library-browser.cjs  # Playwright + Chromium 필요
python3 scripts/bundle.py
```

원본은 `examples/library-preview/src/`, 버전과 무결성은 `package-lock.json`에 고정합니다. 빌드는 `assets/library-preview.js`, 스코프 CSS, `data/library-sources.js`(같은 실제 소스를 내보내는 생성물), 완전한 `assets/library-preview-LICENSES.txt`를 만듭니다. 번들 재배포 시 전체 라이선스와 고지를 유지하세요. npm tarball에 누락된 한 MIT 라이선스는 `examples/library-preview/licenses/`에 출처와 함께 보존합니다. 검증한 패키지 버전과 온라인 최신 릴리스/다운로드 지표는 별개입니다. 메타데이터 표시 슬롯은 초기 로드에서 네트워크를 요청하지 않습니다.
