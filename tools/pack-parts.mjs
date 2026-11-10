// Klocki: packs every catalogue part and its LDraw sub-files into ldraw/parts.pack, reading from the official library archive in Niepotrzebne/ldraw-src/complete.zip.

import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARTS } from '../src/catalog.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = join(root, 'Niepotrzebne', 'ldraw-src');
const archive = join(cacheDir, 'complete.zip');
const outDir = join(root, 'ldraw');
const dropped = /^0\s+(\/\/|!HISTORY|!KEYWORDS|!HELP|!CMDLINE)/;

async function read(rel) {
  const local = join(cacheDir, rel);
  try {
    return await readFile(local, 'utf8');
  } catch {}
  let text;
  try {
    text = execFileSync('unzip', ['-p', archive, `ldraw/${rel}`], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
  if (!/^\s*0(\s|$)/.test(text)) return null;
  await mkdir(dirname(local), { recursive: true });
  await writeFile(local, text);
  return text;
}

function locate(ref) {
  const name = ref.trim().replace(/\\/g, '/').toLowerCase();
  if (name.startsWith('s/')) return { key: 'parts/' + name, candidates: ['parts/' + name] };
  if (name.startsWith('48/')) return { key: 'p/' + name, candidates: ['p/' + name] };
  return { key: name, candidates: ['parts/' + name, 'p/' + name] };
}

const files = new Map();

async function add(ref) {
  const { key, candidates } = locate(ref);
  if (files.has(key)) return;
  files.set(key, '');
  let text = null;
  for (const rel of candidates) {
    text = await read(rel);
    if (text) break;
  }
  if (!text) throw new Error(`LDraw file not found: ${ref}`);
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !dropped.test(line));
  files.set(key, lines.join('\n'));
  for (const line of lines) {
    if (!line.startsWith('1 ')) continue;
    const sub = line.split(/\s+/).slice(14).join(' ');
    if (sub) await add(sub);
  }
}

for (const id of Object.keys(PARTS)) await add(`${id}.dat`);

const config = await read('LDConfig.ldr');
if (!config) throw new Error('LDConfig.ldr not found');

let pack = '';
for (const [key, text] of files) pack += `0 FILE ${key}\n${text}\n`;

await mkdir(outDir, { recursive: true });
await writeFile(join(outDir, 'parts.pack'), pack);
await writeFile(join(outDir, 'LDConfig.ldr'), config);

console.log(`${Object.keys(PARTS).length} parts, ${files.size} files, ${(pack.length / 1024).toFixed(0)} KB`);
