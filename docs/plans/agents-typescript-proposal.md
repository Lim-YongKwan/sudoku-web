# AGENTS.md TypeScript 전환 수정안 — 007 로컬 적용

- 작성일: 2026-10-28
- 상태: 2026-10-28~29 007 구현 요청으로 로컬 AGENTS에 적용했다. 실제 검증과 남은 공개 배포는 [007 기록](../typescript-007.md)을 따른다. 아래는 당시 수정안이며 적용 순서의 이력을 보존한다.
- 관련: [007](../../tasks/007-typescript-migration.md), [D-004](../decisions/004-typescript-toolchain.md), [후속 공통 계약](sudoku-next-iteration.md).
- 수정안 작성 당시에는 빌드 없는 JavaScript였다. 현재 브랜치는 TS·타입/로컬 빌드를 구현했고 원격 Pages 전환은 미실행이다.

## 적용 순서

1. 007 구현을 시작할 때 TypeScript 개발 도구를 허용하는 조항을 현재 AGENTS에 반영한다. 아직 없는 파일이나 명령을 완료된 것으로 쓰지 않는다.
2. package.json·lockfile·tsconfig·정적 파일 준비·테스트 import·Pages workflow를 구현한다.
3. 타입 검사·빌드·회귀 테스트·로컬 HTTP·Pages를 실제 검증한 뒤 명령과 경로를 확정한다.
4. README·architecture·작업·결정 목록을 실제 구현에 맞춘다. 전환 전까지 D-001과 기존 배포 소스를 유지한다.

## 교체안: 기술과 의존성

현재 JavaScript 전용·외부 npm 패키지 전면 금지 조항을 다음 범위로 교체한다.

> 게임 원본은 엄격한 TypeScript와 시맨틱 HTML/CSS로 작성한다. 브라우저는 컴파일된 JavaScript Native ESM을 실행한다. React·Next.js·번들러·게임 런타임 외부 패키지·CDN을 도입하지 않는다.
>
> 개발 의존성으로 프로젝트에 버전을 고정한 TypeScript 컴파일러만 허용한다. package-lock.json을 커밋하고 재현 설치에는 npm ci를 사용한다. 다른 개발 도구가 필요하면 목적·범위·대안을 먼저 기록한다.
>
> Node 22 이상은 로컬 서버·내장 node:test/assert·타입 검사·빌드·정적 파일 준비에 사용한다. 게임 백엔드는 만들지 않는다.
>
> 007에서는 src/ 원본만 TypeScript로 전환한다. scripts/*.mjs·Node 테스트·개발 fixture는 JavaScript로 유지한다.

이 수정안 작성은 패키지 설치 승인이 아니다. 실제 007 구현 요청 전에는 설치하지 않는다.

## 교체안: 원본과 생성물

- 원본은 src/**/*.ts, index.html, styles/다. 원본 옆에 생성된 .js를 수동으로 함께 관리하지 않는다.
- .build/에는 컴파일된 src와 HTML/CSS·개발 fixture를 준비한다. 로컬 서버와 테스트는 이 최신 출력을 사용한다.
- dist/에는 배포용 index.html·styles/·컴파일된 src/만 둔다. docs·tests·scripts·package·설정 파일·소스맵은 기본 공개 출력에서 제외한다.
- .build/·dist/·node_modules는 Git에서 제외한다. 생성물은 직접 수정하지 않고 원본에서 다시 만든다.
- 생성물 정리 범위는 해당 출력 폴더로 한정한다. 이전 출력으로 검증이 통과하거나 실패한 빌드가 게시되지 않게 한다.

## 교체안: 개발 명령

아래 명령은 007 구현 후 실제 scripts와 대조해 확정한다.

| 명령 | 예정 동작 |
|---|---|
| npm ci | 고정된 개발 의존성 재현 설치 |
| npm run typecheck | tsc --noEmit |
| npm run build:dev | 깨끗한 .build 생성·컴파일·개발 정적 파일 준비 |
| npm test | 최신 개발 출력 생성 후 Node 검사 |
| npm run build | 타입 검사·컴파일 후 배포용 dist 준비 |
| npm start | 최신 개발 출력 생성 후 HTTP 서버 실행 |

명령이 서로 순환 호출하거나 동시에 같은 출력 폴더를 지우지 않게 한다.
Windows의 npm.cmd 또는 명시적 Node/npm CLI 안내를 유지하고 전역 PATH 변경이나 전역 TypeScript 설치를 요구하지 않는다.

## 추가안: 타입 규칙

> strict와 noEmitOnError를 기본으로 한다. 목표 브라우저·Node에 맞는 target/module/resolution을 명시하고 고정된 컴파일러 버전에서 검증한다.
>
> 보드·GameState·Action 판별 유니온·생성/검증 결과·주입 시계/생성 함수·store 구독 계약을 타입으로 정의한다.
>
> 타입 오류를 숨기기 위한 any·근거 없는 as·ts-ignore·strict 해제를 하지 않는다. 외부 JSON은 unknown으로 받아 검증한다. 단언이 필요한 경우에는 검증 근거와 범위를 남긴다.
>
> DOM 조회의 null·이벤트 target·읽기 전용 배열/Set·선택 인덱스·호출 상태를 실제로 다룬다. 타입 선언만으로 배열 길이·단서·저장 데이터의 유효성을 보장하지 않는다.
>
> 컴파일은 런타임 검증을 대체하지 않는다. core는 DOM·저장소·시계 효과와 분리한다.
>
> 원본의 상대 import와 출력의 .js 주소는 TypeScript·브라우저 Native ESM·Node 검사에서 모두 해석돼야 한다.

## 교체안: 검증과 배포

- 전체 타입 검사·깨끗한 빌드·전 회귀·로컬 HTTP를 확인한다. 기존 92개 검증 범위를 제거해 통과시키지 않는다.
- 깨끗한 checkout에서 재현 설치와 빌드를 확인한다. skip·미실행을 통과로 표시하지 않는다.
- UI 검증은 기존 320px/1280px·키보드·터치·포커스·콘솔 확인을 유지한다.
- 007 전환 후에는 GitHub Actions에서 설치·타입 검사·테스트·빌드를 통과한 dist만 Pages에 배포한다.
- main/(root) 게시에서 Actions로 실제 전환하고 공개 주소를 검증하는 것을 007 완료 조건으로 둔다.
- 실패한 빌드는 배포하지 않는다. 기존 게시본을 보존하고 필수 검증이 남으면 완료를 보류한다. 접속 승인 거부는 우회하지 않고 미실행 사유와 해제 조건을 기록한다.
- 커밋·push·원격 설정 변경은 해당 요청의 승인 범위를 따른다. 이번 명세 작성에서는 수행하지 않는다.

## 유지할 규칙

작업/결정 ID 발급·원본 템플릿 보존·문서 읽기 순서·코드 리뷰·03/04/05 흐름·비밀값 보호·Git 쓰기 승인 범위·core/UI 책임 분리는 유지한다.
001~006의 완료와 배포 이력을 지우지 않고 007의 전환 근거와 새 검증을 추가한다.
