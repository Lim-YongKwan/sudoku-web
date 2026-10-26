import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePort, startServer, closeServer } from './static-server.mjs';
import { assertSupportedRuntime } from './check-runtime.mjs';

export { createStaticServer, parsePort, startServer, closeServer } from './static-server.mjs';

export async function runCli() {
  let server;
  try {
    assertSupportedRuntime();
    server = await startServer({ port: parsePort(process.env.PORT) });
    const { address: host, port } = server.address();
    console.log(`Sudoku development server: http://${host}:${port}`);
    console.log(`서버 PID: ${process.pid} · 종료: Ctrl+C`);
    let shutdownPromise;
    const shutdown = () => {
      if (!shutdownPromise) {
        shutdownPromise = (async () => {
          try {
            await closeServer(server);
            console.log('서버를 종료했습니다.');
          } catch (error) {
            console.error(`서버 종료 실패: ${error.message}`);
            process.exitCode = 1;
          } finally {
            process.off('SIGINT', shutdown);
            process.off('SIGTERM', shutdown);
            process.off('message', onMessage);
            if (process.connected) process.disconnect();
          }
        })();
      }
      return shutdownPromise;
    };
    // Only a parent process that created an IPC channel can send this message.
    // No shutdown HTTP endpoint is exposed.
    const onMessage = (message) => {
      if (message?.type === 'shutdown') void shutdown();
    };
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
    if (process.send) {
      process.on('message', onMessage);
      process.send({ type: 'ready', host, port, pid: process.pid });
    }
    return server;
  } catch (error) {
    // Startup can fail after listen succeeded; do not leave that listener behind.
    if (server?.listening) await closeServer(server);
    console.error(error.code === 'EADDRINUSE'
      ? '포트가 이미 사용 중입니다. PORT 환경변수로 다른 포트를 선택하세요.'
      : `서버 시작 실패: ${error.message}`);
    process.exitCode = 1;
    if (process.connected) process.disconnect();
    return null;
  }
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await runCli();
