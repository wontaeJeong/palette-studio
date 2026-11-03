# Icon Kit · 범용 테마 대응 SVG

## 범위

- Palette Studio의 색상 선택과 별도인 95개 Lucide SVG 부분집합입니다. 특정 앱이나 로고에 종속되지 않습니다.
- 브라우저에서 icons.html을 열면 기존 선택 팔레트를 읽고 32개 팔레트 × Light/Dark를 비교합니다.
- 탐색, 동작, 콘텐츠, 계정·보안, 시스템, 개발·데이터 카테고리에서 이름·한국어 기능 검색을 제공합니다.
- Outline / Accent / Duotone / Filled tile 시연을 지원합니다. Filled tile은 **채워진 타일 배경 + 원본 Outline SVG**이며 Solid glyph 세트가 아닙니다.
- 16~40px, 1.5/2/2.5px 두께를 조절하고 선택 SVG 복사·다운로드, React·HTML·CSS 예제를 확인합니다.

## 소스와 라이선스

- 공식 출처: https://github.com/lucide-icons/lucide
- 고정 커밋: 4b203ec9b6002fd74fd5dadc8612220e64289305
- SVG 원본: assets/icons/*.svg
- 카탈로그: data/icon-parts/*.js (브라우저 file://에서도 동작하도록 SVG geometry 포함)
- 고지: assets/icons/LICENSE-LUCIDE.txt (Lucide ISC, 일부 Feather MIT). 재배포 시 원문 고지 유지.
- SVG는 CDN을 호출하지 않으며 오프라인으로 동작합니다.

## CSS 연동

원본 SVG는 stroke="currentColor"를 유지합니다. HTML에 SVG를 **인라인**으로 넣거나 React 컴포넌트로 렌더링하면 아래 클래스가 Light/Dark 테마를 자동으로 따릅니다.

```css
.app-icon { color: var(--color-ink); }
.app-icon--accent { color: var(--color-accent); }
.icon-duotone svg > :nth-child(even) { stroke: var(--color-accent); }
.icon-tile { display: inline-flex; padding: 8px; border-radius: 8px;
  background: var(--color-accent); color: var(--color-on-accent); }
```

```tsx
import { ShieldCheck } from "lucide-react";

<ShieldCheck size={24} strokeWidth={2} className="app-icon app-icon--accent" aria-hidden />
```

Palettes: 선택한 css/palettes/<palette>.css 파일 **하나**만 앱에 포함하세요. 예제 아이콘을 사용하기 위해 별도의 full palette CSS, 글로벌 스타일, 런타임 라이브러리를 강제로 추가하지 않습니다. 이 스튜디오의 Preview는 32개를 비교하기 때문에 css/palettes.css를 사용합니다.

외부 이미지 참조 (예: img src="...svg")는 CSS currentColor 상속이 되지 않습니다. 테마 연동에는 인라인 SVG 또는 lucide-react를 사용하세요.

## 검증

```bash
node --check icons.js
node scripts/check-icons.cjs
node scripts/check-icon-studio.cjs # Playwright + Chromium 필요
```

브라우저 테스트는 palette/theme/variant/검색/다운로드/모바일 폭을 검증하며, 키트 전체 앱의 색 대비 승인 또는 프로젝트별 UI 테스트를 대체하지는 않습니다.
