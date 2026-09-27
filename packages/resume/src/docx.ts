import { inflate } from './inflate';

/**
 * DOCX → plain text, locally. A .docx is a zip archive; the body text lives in
 * word/document.xml. We read the zip's central directory, inflate that one entry
 * and turn paragraphs / tabs / line breaks into text.
 */

const EOCD = 0x06054b50;
const CENTRAL = 0x02014b50;
const LOCAL = 0x04034b50;

function findEntry(bytes: Uint8Array, wanted: string): { method: number; data: Uint8Array } | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  // End-of-central-directory record: within the last 64 KiB + 22 bytes.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) {
    if (view.getUint32(i, true) === EOCD) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;
  const count = view.getUint16(eocd + 10, true);
  let offset = view.getUint32(eocd + 16, true);
  const decoder = new TextDecoder();

  for (let n = 0; n < count && offset + 46 <= bytes.length; n++) {
    if (view.getUint32(offset, true) !== CENTRAL) return null;
    const method = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localOffset = view.getUint32(offset + 42, true);
    const name = decoder.decode(bytes.subarray(offset + 46, offset + 46 + nameLength));
    if (name === wanted) {
      if (view.getUint32(localOffset, true) !== LOCAL) return null;
      const localName = view.getUint16(localOffset + 26, true);
      const localExtra = view.getUint16(localOffset + 28, true);
      const start = localOffset + 30 + localName + localExtra;
      return { method, data: bytes.subarray(start, start + compressedSize) };
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return null;
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (match, code: string) => {
    if (code[0] === '#') {
      const n =
        code[1]?.toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : match;
    }
    return ENTITIES[code] ?? match;
  });
}

export function documentXmlToText(xml: string): string {
  return decodeEntities(
    xml
      .replace(/<w:tab\/>/g, '\t')
      .replace(/<w:(br|cr)\b[^>]*\/>/g, '\n')
      .replace(/<\/w:p>/g, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

export async function docxToText(bytes: Uint8Array): Promise<string> {
  const entry = findEntry(bytes, 'word/document.xml');
  if (!entry) throw new Error('This doesn’t look like a Word (.docx) document.');
  const xmlBytes =
    entry.method === 0
      ? entry.data
      : entry.method === 8
        ? await inflate(entry.data, 'deflate-raw')
        : null;
  if (!xmlBytes) throw new Error('This .docx uses an unsupported compression method.');
  return documentXmlToText(new TextDecoder().decode(xmlBytes));
}
