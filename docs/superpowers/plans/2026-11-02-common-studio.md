# Common Palette Studio Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task.

**Goal:** 앱 중립적인 선택 흐름과 항상 확인 가능한 미리보기를 제공한다.

**Architecture:** 기존 상태·팔레트·폰트 로더와 내보내기를 유지하고, 선택 UI를 네 단계로 나눈다. 미리보기는 편집 패널과 독립적인 스크롤 영역으로 둔다.

**Tech Stack:** HTML, CSS, vanilla JavaScript, Python 생성기, 선택적 Playwright QA.

**Spec:** `docs/superpowers/specs/2026-11-02-common-studio-design.md`

## Global Constraints

- 제품 런타임 의존성 추가 없음. 폰트 바이너리·라이선스·컬러 토큰 의미 유지.
- 다운로드는 마지막 단계. 본문·코드 폰트는 역할별로 분리.
- 기존 `existing-gate` 링크는 호환 이관. 신규 프로필은 공통 대상 사용.

## Review Focus

- 모바일 하단 미리보기가 조작부·키보드 포커스를 가리지 않음.
- 단계 이동·새로고침 후 팔레트·폰트·범위 유지.
- 폰트 검색 결과 없음과 역할별 독립 선택.
- split/compare와 긴 텍스트에서 가로 넘침 없음.
- 단독 HTML·모듈 원본 및 생성 프로필의 동일한 계약.

### Task 1: 공통 선택 흐름과 미리보기

**Files:** `index.html`, `app.js`, `css/studio.css`, `scripts/build.py`, `scripts/browser-check.cjs`.

- [x] 기존 동작에서 공통 기본값·단계·미리보기 회귀 검사를 먼저 실패시킨다.
- [x] 공통 예시와 이전 대상값 이관, 네 단계, 최종 내보내기, sticky/docked 미리보기를 구현한다.
- [x] 본문·코드 갤러리, 역할별 검색·선택 표시와 빈 결과를 구현한다.
- [x] 64개 테마·6개 스타일·다운로드·폰트 역할·반응형·영속성 검사를 통과시킨다.

### Task 2: 문서·산출물·통합 검증

**Files:** `README.md`, `AGENTS.md`, `agents/`, `docs/`, `scripts/check-fonts.cjs`, `scripts/package.py`, generated HTML/catalog/schema/profile/manifest/previews.

- [x] 공통 적용 규칙과 사용 순서로 문서를 갱신하고 기존 출처 자료는 보존한다.
- [x] 원본과 단독 HTML을 생성하고 폰트·대비·브라우저 검사를 실행한다.
- [x] 실제 데스크톱/모바일 화면을 검토하고, 검증된 변경과 생성물을 저장소에 반영한다.
