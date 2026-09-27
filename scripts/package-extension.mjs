// Production ZIP for the Chrome Web Store: `npm run package`.
//
// Zips apps/extension/dist (manifest.json at the zip root) into release/jobfill-<version>.zip
// after checking the build is store-ready. No dependencies: the zip is written with node:zlib.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync, crc32 } from 'node:zlib';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'apps', 'extension', 'dist');
const OUT_DIR = path.join(ROOT, 'release');

function files(dir, base = dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return files(full, base);
    return [path.relative(base, full).split(path.sep).join('/')];
  });
}

// ---- Pre-flight: refuse to package something the store (or users) shouldn't get ------------
const problems = [];
const manifestPath = path.join(DIST, 'manifest.json');
if (!fs.existsSync(manifestPath)) {
  console.error('No build found. Run `npm run build` first.');
  process.exit(1);
}
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const list = files(DIST).sort();

if (manifest.manifest_version !== 3) problems.push('manifest_version must be 3');
if (!manifest.name || manifest.name.length > 75) problems.push('name missing or over 75 chars');
if (!manifest.description || manifest.description.length > 132)
  problems.push('description missing or over 132 chars');
for (const size of ['16', '32', '48', '128'])
  if (!manifest.icons?.[size] || !list.includes(manifest.icons[size]))
    problems.push(`icon ${size} missing`);
const extra = (manifest.permissions ?? []).filter((p) => p !== 'storage');
if (extra.length || manifest.host_permissions?.length)
  problems.push(`unexpected permissions: ${[...extra, ...(manifest.host_permissions ?? [])]}`);
for (const f of list) {
  if (f.endsWith('.map')) problems.push(`source map in build: ${f}`);
  if (/(^|\/)\.(vite|DS_Store)|\.env/.test(f)) problems.push(`stray file in build: ${f}`);
  if (!/\.(js|css|html|json|png)$/.test(f)) problems.push(`unexpected file type: ${f}`);
}
for (const f of list.filter((f) => /\.(js|html)$/.test(f))) {
  const src = fs.readFileSync(path.join(DIST, f), 'utf8');
  if (/localhost:\d|127\.0\.0\.1|@vite\/client|\/@crx\//.test(src))
    problems.push(`dev-server reference in ${f} — is this a dev build?`);
  if (/<script[^>]+src=["']https?:/i.test(src)) problems.push(`remote script in ${f}`);
  if (/\beval\(|new Function\(/.test(src)) problems.push(`eval / new Function in ${f}`);
  if (/sk-[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{30,}/.test(src))
    problems.push(`secret-like string in ${f}`);
}
if (problems.length) {
  console.error('Not packaging:\n - ' + problems.join('\n - '));
  process.exit(1);
}

// ---- Write the zip (stored names, deflate, fixed timestamps for reproducible output) --------
const DOS_TIME = 0; // 00:00:00
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1; // 2026-01-01
const locals = [];
const centrals = [];
let offset = 0;
for (const name of list) {
  const data = fs.readFileSync(path.join(DIST, name));
  const packed = deflateRawSync(data, { level: 9 });
  const nameBuf = Buffer.from(name, 'utf8');
  const crc = crc32(data);
  const header = Buffer.alloc(30);
  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0x0800, 6); // UTF-8 names
  header.writeUInt16LE(8, 8);
  header.writeUInt16LE(DOS_TIME, 10);
  header.writeUInt16LE(DOS_DATE, 12);
  header.writeUInt32LE(crc, 14);
  header.writeUInt32LE(packed.length, 18);
  header.writeUInt32LE(data.length, 22);
  header.writeUInt16LE(nameBuf.length, 26);
  locals.push(header, nameBuf, packed);

  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(DOS_TIME, 12);
  central.writeUInt16LE(DOS_DATE, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(packed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(offset, 42);
  centrals.push(central, nameBuf);
  offset += header.length + nameBuf.length + packed.length;
}
const cd = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(list.length, 8);
end.writeUInt16LE(list.length, 10);
end.writeUInt32LE(cd.length, 12);
end.writeUInt32LE(offset, 16);

fs.mkdirSync(OUT_DIR, { recursive: true });
const out = path.join(OUT_DIR, `jobfill-${manifest.version}.zip`);
fs.writeFileSync(out, Buffer.concat([...locals, cd, end]));
const kb = (fs.statSync(out).size / 1024).toFixed(1);
console.log(`${path.relative(ROOT, out)} — ${list.length} files, ${kb} KB`);
