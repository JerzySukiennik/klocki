// Klocki: zero-dependency local server. Static files, the pile state in data/stan.json and saved model renders, bound to 127.0.0.1 only.

import { createServer } from 'node:http';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2]) || 8742;
const stateFile = join(root, process.argv[3] || 'data', 'stan.json');
const served = new Set(['index.html', 'style.css', 'src', 'lib', 'models', 'ldraw']);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.pack': 'text/plain; charset=utf-8',
  '.ldr': 'text/plain; charset=utf-8',
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 12_000_000) {
        reject(new Error('too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function send(res, status, body = '', type = 'text/plain; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
}

async function state(req, res) {
  if (req.method === 'GET') {
    try {
      return send(res, 200, await readFile(stateFile, 'utf8'), types['.json']);
    } catch {
      return send(res, 200, '{}', types['.json']);
    }
  }
  if (req.method === 'PUT') {
    const text = (await readBody(req)).toString('utf8');
    JSON.parse(text);
    await mkdir(dirname(stateFile), { recursive: true });
    await writeFile(stateFile + '.tmp', text);
    await rename(stateFile + '.tmp', stateFile);
    return send(res, 204);
  }
  return send(res, 405);
}

async function render(req, res, id) {
  if (req.method !== 'PUT') return send(res, 405);
  const image = await readBody(req);
  const folder = join(root, 'Niepotrzebne', 'rendery');
  await mkdir(folder, { recursive: true });
  await writeFile(join(folder, `${id}.png`), image);
  return send(res, 204);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/state') return await state(req, res);
    const shot = url.pathname.match(/^\/api\/render\/([a-z0-9-]+)$/);
    if (shot) return await render(req, res, shot[1]);
    if (req.method !== 'GET') return send(res, 405);
    const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '') || 'index.html';
    if (rel.includes('..') || !served.has(rel.split(sep)[0])) return send(res, 404, 'Not found');
    const data = await readFile(join(root, rel));
    return send(res, 200, data, types[extname(rel)] || 'application/octet-stream');
  } catch (error) {
    return send(res, error.code === 'ENOENT' || error.code === 'EISDIR' ? 404 : 400, 'Not found');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Klocki: http://localhost:${port}`);
});
