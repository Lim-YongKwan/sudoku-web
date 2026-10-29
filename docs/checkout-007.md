# 007 커밋 기반 checkout 재현 검증

- 실행일: 2026-10-29 (Asia/Seoul)
- 재현 대상: e7624b6f1143d9b47074ed5a4ee28403d905d0bb
- 구현 커밋: refactor: migrate sudoku to TypeScript and add validated builds
- 원래 브랜치: feat/task-007-typescript-migration
- 검증 worktree: C:/Users/임용관/Documents/Codex/2026-10-23/agents-md/outputs/sudoku-checkout-007
- 생성 방식: 원래 저장소에서 git worktree add --detach로 위 SHA를 checkout했다. 기존 디렉터리를 덮어쓰지 않았다.
- 결과: 커밋된 입력만으로 로컬 실행·빌드를 재현했다. TS-02 충족. 007 전체 완료와 Actions 배포 성공을 뜻하지 않는다.
- 원격 작업: push·PR 생성·병합·Pages 설정 변경 없음. 검증 worktree는 재확인용으로 보존한다.

## 시작과 종료 상태

시작 시 git status --porcelain 출력이 없었고 node_modules·.build·dist도 없었다.
기존 개발 폴더의 의존성이나 출력을 복사하지 않았다. npm의 다운로드 캐시 사용은 허용하며 무캐시 설치를 주장하지 않는다.
검증 후에도 HEAD는 같은 SHA이고 git status --porcelain 출력은 없었다. 설치/빌드 결과는 Git 제외 대상에만 생겼다.
원래 작업 폴더의 게임 코드·의존성·빌드/workflow 설정은 checkout 검증 과정에서 변경하지 않았다.

## 환경과 명령

기존 Node 24.22.1·npm 8.19.4를 현재 세션 PATH로 선택했다. 전역 PATH·시스템 설치는 바꾸지 않았다.
모든 명령은 검증 worktree를 작업 디렉터리로 사용했다.

| 명령/검사 | 실제 결과 |
|---|---|
| git rev-parse HEAD | e7624b6f1143d9b47074ed5a4ee28403d905d0bb |
| npm ci --no-audit --no-fund | 재시도 성공, lockfile 기준 설치 |
| npm run typecheck | 성공 |
| npm run build:dev | 성공 |
| npm test | 99개 중 98 통과·0 실패·1 skip |
| npm run build | 성공 |
| npm start (PORT=0) | prestart 개발 출력 재생성 후 서버 시작·실제 주소/PID 출력 |
| npm start 터미널 Ctrl+C | 서버 종료 메시지와 터미널 세션 종료 확인 |
| 별도 소유자 IPC CLI 검사 | 실제 worktree의 scripts/serve.mjs 시작, HTTP 검사 후 shutdown 메시지로 종료·exit 0 |
| 개발 HTTP | HTML·main.js·CSS·controls fixture 200, 브라우저용 MIME 확인 |
| 개발 경계 | package.json 403, src/main.ts 404 |
| 배포 HTTP | 컴파일된 main.js 200, 개발 fixture 404, package.json 403 |
| 종료 후 새 TCP 연결 | CLI·배포 서버 모두 ECONNREFUSED |
| 종료 후 소스 상태 | tracked 변경·untracked 파일 없음, HEAD 동일 |

99개는 기존 92개 + 빌드 검사 5개 + Action 큐 회귀 2개다.
이번 worktree의 skip 1개는 Windows junction 생성 EPERM이다. 이전 사용자 환경의 99 통과·0 skip 확인과 별도 실행 결과로 보존한다.
이 권한 제약을 통과로 계산하지 않았으며 타입/빌드/실행 재현 성공과 구분한다. 추가 코드 수정은 필요하지 않았다.

## 환경 제약과 재시도

1. 최초 npm ci는 새 worktree의 node_modules/@typescript 생성 EPERM으로 중단됐다. 해당 worktree에 대한 명시적 쓰기 권한을 받은 뒤 npm ci부터 다시 실행해 성공했다. 첫 실패 로그는 성공으로 덮어 기록하지 않는다.
2. 별도 도구 실행에서 먼저 띄운 npm start 서버에 연결하려던 검사는 ETIMEDOUT이었다. 이 시도를 HTTP 성공으로 기록하지 않는다. npm start는 실제 PTY에서 시작·Ctrl+C 종료를 확인했고, HTTP/MIME/IPC 종료는 하나의 검사 실행 안에서 생성한 소유 서버를 대상으로 검증했다.
3. 첫 종료 확인에서 fetch의 재사용 연결이 ECONNRESET을 반환해 ECONNREFUSED 단정 검사가 실패했다. 서버가 종료되지 않은 결함으로 판단하지 않고, agent:false의 새 TCP 연결로 다시 검사했다. 최종 CLI/배포 종료 검사는 모두 ECONNREFUSED였다.
4. 브라우저 UI는 이번 checkout에서 다시 조작하지 않았다. 동일 코드의 사용자 브라우저·터치 에뮬레이션·반응형·완료 dialog·콘솔·서버 종료 확인을 별도 근거로 유지한다.

## 남은 진행 순서

- 이 결과를 원래 feature 브랜치의 후속 문서 커밋에 저장한다. 검증 worktree는 재현 대상 e7624b6에 고정한다.
- 승인 후 feature push → main 대상 PR의 validate 성공 → main 반영 직전 Pages 소스를 GitHub Actions로 전환 → 병합/Actions validate·deploy 성공 확인 순서다.
- 공개 사이트가 새 배포 커밋을 제공하는지 확인하고 게임 동작을 확인한다.
- TS-05·REV-01과 실제 공개 배포가 충족된 뒤 007을 완료 처리하고 D-001/D-004·목록·현재 구조를 갱신한다.
- 후속 커밋이 문서만 바꾸면 이 코드 재현 결과는 유효하다. 코드·의존성·빌드/workflow가 바뀌면 영향받는 검증을 다시 수행한다.

문서 최종 검사: Markdown 53개·로컬 파일 링크 671개, 깨진 링크 0개. 공백 검사 통과. 재현 뒤 변경은 원래 feature 브랜치의 문서에만 있으며 검증 대상 코드/설정은 바꾸지 않았다.
