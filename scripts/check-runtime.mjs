export function assertSupportedRuntime(version = process.versions.node) {
  const major = Number(version.split('.')[0]);
  if (!Number.isInteger(major) || major < 22) {
    throw new Error(`Node.js 22 이상이 필요합니다. 현재 버전: ${version}. README의 실행 환경 안내를 확인하세요.`);
  }
}

assertSupportedRuntime();
