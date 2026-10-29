import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../.build');
const HOST = '127.0.0.1';
const MIME_TYPES = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
]);

export function parsePort(value) {
  if (value === undefined) return 8080;
  if (!['string', 'number'].includes(typeof value) || !/^\d+$/.test(String(value))) throw new RangeError('PORT는 0~65535 정수여야 합니다.');
  const port = Number(value);
  if (!Number.isSafeInteger(port) || port < 0 || port > 65535) {
    throw new RangeError('PORT는 0~65535 정수여야 합니다.');
  }
  return port;
}

function insideRoot(root, candidate) {
  const tail = relative(root, candidate);
  return tail === '' || (tail !== '..' && !tail.startsWith(`..${sep}`) && !isAbsolute(tail));
}

function publicPath(pathname) {
  return pathname === '/index.html'
    || pathname.startsWith('/src/')
    || pathname.startsWith('/styles/')
    || pathname.startsWith('/tests/browser/')
    || pathname.startsWith('/tests/fixtures/');
}

function respond(request, response, status, message, extraHeaders = {}) {
  const body = Buffer.from(message);
  response.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': body.length,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
    ...extraHeaders,
  });
  response.end(request.method === 'HEAD' ? undefined : body);
}

export async function createStaticServer({ root = PROJECT_ROOT } = {}) {
  const canonicalRoot = await realpath(resolve(root));
  if (!(await stat(canonicalRoot)).isDirectory()) throw new TypeError('정적 파일 루트가 디렉터리가 아닙니다.');

  return createServer(async (request, response) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      respond(request, response, 405, 'Method Not Allowed', { Allow: 'GET, HEAD' });
      return;
    }

    try {
      // Read the raw origin-form target before URL normalization can remove .. segments.
      const rawPath = (request.url ?? '').split('?')[0];
      if (!rawPath.startsWith('/') || rawPath.startsWith('//')) {
        respond(request, response, 400, 'Bad Request');
        return;
      }
      let pathname;
      try {
        pathname = decodeURIComponent(rawPath);
      } catch {
        respond(request, response, 400, 'Bad Request');
        return;
      }
      if (/[\x00-\x1f\x7f\\:]/.test(pathname)) {
        respond(request, response, 400, 'Bad Request');
        return;
      }
      const segments = pathname.split('/');
      if (segments.some((part) => part === '..' || part.startsWith('.'))) {
        respond(request, response, 403, 'Forbidden');
        return;
      }
      if (pathname === '/') pathname = '/index.html';
      if (!publicPath(pathname)) {
        respond(request, response, 403, 'Forbidden');
        return;
      }
      const mime = MIME_TYPES.get(extname(pathname).toLowerCase());
      if (!mime) {
        respond(request, response, 404, 'Not Found');
        return;
      }
      const candidate = resolve(canonicalRoot, `.${pathname}`);
      if (!insideRoot(canonicalRoot, candidate)) {
        respond(request, response, 403, 'Forbidden');
        return;
      }
      const canonicalFile = await realpath(candidate);
      if (!insideRoot(canonicalRoot, canonicalFile)) {
        respond(request, response, 403, 'Forbidden');
        return;
      }
      const canonicalPath = `/${relative(canonicalRoot, canonicalFile).split(sep).join('/')}`;
      if (!publicPath(canonicalPath) || canonicalPath.split('/').some((part) => part.startsWith('.'))) {
        respond(request, response, 403, 'Forbidden');
        return;
      }
      if (!(await stat(canonicalFile)).isFile()) {
        respond(request, response, 404, 'Not Found');
        return;
      }
      const content = await readFile(canonicalFile);
      response.writeHead(200, {
        'Content-Type': mime,
        'Content-Length': content.length,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      });
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      if (response.destroyed) return;
      const status = ['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code) ? 404
        : ['EACCES', 'EPERM'].includes(error.code) ? 403 : 500;
      respond(request, response, status, status === 404 ? 'Not Found' : status === 403 ? 'Forbidden' : 'Internal Server Error');
    }
  });
}

export async function startServer({ port = parsePort(), root = PROJECT_ROOT } = {}) {
  port = parsePort(port);
  const server = await createStaticServer({ root });
  await new Promise((resolveListen, rejectListen) => {
    const onError = (error) => rejectListen(error);
    server.once('error', onError);
    server.listen(port, HOST, () => {
      server.off('error', onError);
      resolveListen();
    });
  });
  return server;
}

export async function closeServer(server) {
  await new Promise((resolveClose, rejectClose) => {
    server.close((error) => error ? rejectClose(error) : resolveClose());
    // This development server has no long-running API; stop remaining connections too.
    server.closeAllConnections();
  });
}



