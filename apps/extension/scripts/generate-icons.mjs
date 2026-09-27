// Generates placeholder PNG icons (brand-blue rounded square with a white "form line" mark).
// Dependency-free so it runs anywhere: `node apps/extension/scripts/generate-icons.mjs`.
// Replace the output with real brand icons before publishing.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const BRAND = [0x1f, 0x5a, 0xd6];
const WHITE = [0xff, 0xff, 0xff];

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function pixel(x, y, s) {
  const r = s * 0.22; // corner radius
  const cx = Math.min(Math.max(x + 0.5, r), s - r);
  const cy = Math.min(Math.max(y + 0.5, r), s - r);
  if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 > r * r) return [0, 0, 0, 0];
  // Three white "form field" bars, the last one shorter.
  const u = x / s;
  const v = y / s;
  const bar = (top, right) => v >= top && v < top + 0.12 && u >= 0.22 && u < right;
  if (bar(0.24, 0.78) || bar(0.44, 0.78) || bar(0.64, 0.58)) return [...WHITE, 255];
  return [...BRAND, 255];
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      Buffer.from(pixel(x, y, size)).copy(raw, y * (size * 4 + 1) + 1 + x * 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

for (const size of [16, 32, 48, 128]) {
  writeFileSync(join(outDir, `icon-${size}.png`), png(size));
}
console.log(`Icons written to ${outDir}`);
