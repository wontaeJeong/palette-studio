# 기존 앱 / React / Tailwind 통합

## 기존 Admission Gate

이 키트는 사내 저장소 전체를 확인한 결과물이 아닙니다. 기존 정의를 교체할 때는 내보낸 `design-profile.json`의 scope를 우선합니다. 이전 선호는 라이트 컬러 유지, 다크만 개편입니다.

1. `START-HERE.html`에서 기존 Admission Gate / 다크만으로 내보내면 `selected-theme.css`에 다크 선언만 담깁니다.
2. 기존 `html[data-theme="dark"]` 등 프로젝트의 canonical 테마 정의에 선언값을 병합합니다. 기존 토큰 이름과 다른 역할만 명시적으로 매핑합니다. 새 override 파일을 계속 쌓지 않습니다.
3. 기존 `themeContrast.test.ts`의 전경·배경 쌍을 갱신합니다. 키트의 `data/contrast-pairs.json`에서 실제 사용 쌍을 참고하세요. 이 키트의 검사기는 그 프로젝트 테스트를 대체하지 않습니다.

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
  검사 실행
</button>
```

의미값은 `@theme inline`의 `var()` 별칭으로 합치지 않고, `@utility`에서 토큰을 속성값으로 소비합니다. `css/utilities.css`는 일반 CSS용, `css/tailwind-v4.css`는 Tailwind 빌드 입력용입니다. 둘을 동시에 import하지 마세요. `@utility` 파일은 브라우저에 직접 주입하지 않습니다. Tailwind 공식 문서의 custom utilities 방식에 맞춘 소스 예제입니다. 프로젝트 버전과 빌드 환경에서 최종 컴파일을 확인하세요.

기존 `bg-*` 클래스와 충돌하지 않게 `cp-` 접두사를 씁니다. 다크 색상은 `data-theme`가 토큰을 바꾸므로 같은 의미 클래스가 두 모드에 그대로 적용됩니다. 색상에 `dark:` 클래스를 중복 작성할 필요가 없습니다. 레이아웃·아이콘 등 실제 모드별 구조 차이에만 프로젝트의 다크 variant를 사용하세요.

## React

`examples/react/ThemeProvider.tsx`는 React 앱에 합쳐 쓸 수 있는 소스 예제입니다. `light/dark/system` 설정과 로컬 저장, OS 테마 변경을 다룹니다. 기존 ThemeProvider가 있으면 이 파일을 추가하지 말고 기존 구현에 필요한 값만 연결하세요.

첫 페인트 깜박임을 줄이는 `examples/theme-init.js`는 `<head>`에서 CSS보다 먼저 실행할 수 있습니다. CSP가 있는 앱은 기존 nonce/hash 또는 외부 script 정책에 맞춰 사용하세요. 그 정책을 완화할 필요는 없습니다. SSR이면 서버 쿠키·기존 프레임워크 테마 처리와 중복되지 않게 조정합니다.

1.1.0 폰트 선택은 컬러 변경 범위와 별개이며 두 모드에 공통입니다. 기존 로더에 `design-profile.json`의 fonts 정책을 병합하세요. `selected-theme.css`에도 폰트 정의가 들어 있으므로 별도로 `selected-fonts.css`까지 중복 import하지 않습니다. 라이선스·CSP·경로는 `docs/FONTS.md`를 따릅니다.

포털로 렌더링하는 dialog/tooltip은 토큰을 읽는 DOM 범위 밖으로 나가지 않도록 합니다. 앱 토큰을 `html`에 두면 보통 body 포털도 상속합니다. 일부 패널에만 토큰을 둘 때는 포털 컨테이너도 같은 테마 범위로 맞춰야 합니다. 미리보기는 각 테마 범위 안에 dialog를 배치합니다.

## OpenCode 연동

로컬 공용 카탈로그로 둘 때는 예를 들어 `~/design-kits/palette-studio/`에 압축을 풀고 OpenCode 작업지시에서 **실제 절대 경로**를 지정합니다. 앱에는 채택한 CSS·프로필·짧은 규칙만 넣어도 됩니다. 앱별 프로필을 고정해 공용 카탈로그를 바꿔도 기존 앱의 디자인이 자동으로 흔들리지 않게 하세요.

앱 저장소 안에 보관한다면 권장 위치는 `design/palette-studio/`, 내보낸 프로필은 `design/design-profile.json`, 선택 CSS는 `design/selected-theme.css`입니다. UI의 프로필 `$schema` 경로는 이 구조를 기준으로 합니다. 다른 위치로 저장하면 `$schema` 경로도 조정하세요. 프로필 안의 integration 경로는 키트 루트 기준입니다.

자동으로 사용자 전역 설정을 수정하는 스크립트는 없습니다. `agents/ROOT-AGENTS-SNIPPET.md`를 기존 앱 `AGENTS.md`에 병합하거나, `agents/opencode.instructions.example.json`의 instructions 항목을 기존 `opencode.json`에 병합합니다. 경로 예시는 앱 루트 아래 `design/palette-studio/`에 키트를 둔 기준입니다. 실제 경로를 바꾸면 참조도 바꾸세요. Superpowers 활성화는 사용자의 기존 워크플로를 따릅니다.

## 파일 변경·검사

생성 원본은 `scripts/build.py`입니다. JSON과 CSS를 따로 손으로 바꿔 drift를 만들지 마세요. `node scripts/audit.mjs`는 모든 테마와 생성 CSS의 값 일치도 확인합니다. raw ramp에 대해서는 접근성 승인 결과를 제공하지 않습니다. 색상 변경 후에는 기존 앱의 실제 상태·겹침·focus-ring을 별도로 확인하세요.
