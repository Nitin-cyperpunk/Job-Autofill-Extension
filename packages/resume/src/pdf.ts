import { inflateLenient, latin1 } from './inflate';

/**
 * PDF → plain text, locally and without third-party code.
 *
 * Deliberately small: enough for résumés exported from Word, Google Docs, Pages,
 * LaTeX and online builders — compressed (FlateDecode) streams, cross-reference
 * object streams, Type0/TrueType fonts with ToUnicode maps, and the text operators
 * (Tj, TJ, ', ", Td, TD, Tm, T*). Scanned (image-only) PDFs have no text to read;
 * callers get an empty string and can offer "paste text" instead.
 */

// ---- Values & lexer ---------------------------------------------------------------------

type PdfName = { t: 'name'; v: string };
type PdfStr = { t: 'str'; b: Uint8Array };
type PdfRef = { t: 'ref'; n: number };
type PdfKeyword = { t: 'kw'; v: string };
type PdfDict = Map<string, PdfValue>;
type PdfValue =
  number | boolean | null | PdfName | PdfStr | PdfRef | PdfKeyword | PdfValue[] | PdfDict;

const WHITESPACE = new Set([0x00, 0x09, 0x0a, 0x0c, 0x0d, 0x20]);
const DELIMITERS = new Set(['(', ')', '<', '>', '[', ']', '{', '}', '/', '%']);

function isWhite(ch: string) {
  return WHITESPACE.has(ch.charCodeAt(0));
}

function bytesOf(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

type Token =
  PdfValue | { t: 'open-dict' } | { t: 'close-dict' } | { t: 'open-array' } | { t: 'close-array' };

class Lexer {
  constructor(
    readonly s: string,
    public i = 0,
  ) {}

  private skipWhite() {
    for (;;) {
      while (this.i < this.s.length && isWhite(this.s[this.i]!)) this.i++;
      if (this.s[this.i] === '%') {
        while (this.i < this.s.length && this.s[this.i] !== '\n' && this.s[this.i] !== '\r')
          this.i++;
        continue;
      }
      return;
    }
  }

  next(): Token | undefined {
    this.skipWhite();
    if (this.i >= this.s.length) return undefined;
    const c = this.s[this.i]!;
    if (c === '<' && this.s[this.i + 1] === '<') {
      this.i += 2;
      return { t: 'open-dict' };
    }
    if (c === '>' && this.s[this.i + 1] === '>') {
      this.i += 2;
      return { t: 'close-dict' };
    }
    if (c === '[') {
      this.i++;
      return { t: 'open-array' };
    }
    if (c === ']') {
      this.i++;
      return { t: 'close-array' };
    }
    if (c === '(') return this.literalString();
    if (c === '<') return this.hexString();
    if (c === '/') return this.name();
    if (c === '{' || c === '}' || c === ')' || c === '>') {
      this.i++;
      return this.next();
    }
    return this.word();
  }

  private literalString(): PdfStr {
    this.i++; // (
    let depth = 1;
    let out = '';
    while (this.i < this.s.length) {
      const c = this.s[this.i++]!;
      if (c === '\\') {
        const n = this.s[this.i++] ?? '';
        const simple: Record<string, string> = {
          n: '\n',
          r: '\r',
          t: '\t',
          b: '\b',
          f: '\f',
          '(': '(',
          ')': ')',
          '\\': '\\',
        };
        if (n in simple) out += simple[n];
        else if (/[0-7]/.test(n)) {
          let oct = n;
          while (oct.length < 3 && /[0-7]/.test(this.s[this.i] ?? '')) oct += this.s[this.i++];
          out += String.fromCharCode(parseInt(oct, 8) & 0xff);
        } else if (n === '\r') {
          if (this.s[this.i] === '\n') this.i++; // line continuation
        } else if (n !== '\n') out += n;
        continue;
      }
      if (c === '(') depth++;
      if (c === ')' && --depth === 0) break;
      out += c;
    }
    return { t: 'str', b: bytesOf(out) };
  }

  private hexString(): PdfStr {
    this.i++; // <
    const end = this.s.indexOf('>', this.i);
    let hex = this.s.slice(this.i, end < 0 ? undefined : end).replace(/[^0-9a-fA-F]/g, '');
    this.i = end < 0 ? this.s.length : end + 1;
    if (hex.length % 2) hex += '0';
    const out = new Uint8Array(hex.length / 2);
    for (let k = 0; k < out.length; k++) out[k] = parseInt(hex.slice(k * 2, k * 2 + 2), 16);
    return { t: 'str', b: out };
  }

  private name(): PdfName {
    this.i++; // /
    let out = '';
    while (
      this.i < this.s.length &&
      !isWhite(this.s[this.i]!) &&
      !DELIMITERS.has(this.s[this.i]!)
    ) {
      const c = this.s[this.i++]!;
      if (c === '#' && /^[0-9a-fA-F]{2}$/.test(this.s.slice(this.i, this.i + 2))) {
        out += String.fromCharCode(parseInt(this.s.slice(this.i, this.i + 2), 16));
        this.i += 2;
      } else out += c;
    }
    return { t: 'name', v: out };
  }

  private word(): PdfValue {
    const start = this.i;
    while (this.i < this.s.length && !isWhite(this.s[this.i]!) && !DELIMITERS.has(this.s[this.i]!))
      this.i++;
    const w = this.s.slice(start, this.i);
    if (!w) {
      this.i++;
      return { t: 'kw', v: '' };
    }
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(w)) return Number(w);
    if (w === 'true') return true;
    if (w === 'false') return false;
    if (w === 'null') return null;
    return { t: 'kw', v: w };
  }
}

function isKw(v: unknown, word?: string): v is PdfKeyword {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    !(v instanceof Map) &&
    (v as PdfKeyword).t === 'kw' &&
    (word === undefined || (v as PdfKeyword).v === word)
  );
}

/** Parse one value; handles "n g R" references. */
function parseValue(lx: Lexer): PdfValue | undefined {
  const tok = lx.next();
  if (tok === undefined) return undefined;
  if (typeof tok === 'object' && tok !== null && !Array.isArray(tok) && !(tok instanceof Map)) {
    const t = (tok as { t: string }).t;
    if (t === 'open-dict') {
      const dict: PdfDict = new Map();
      for (;;) {
        const save = lx.i;
        const key = lx.next();
        if (key === undefined || (key as { t?: string } | null)?.t === 'close-dict') break;
        if ((key as { t?: string } | null)?.t !== 'name') {
          lx.i = save + 1;
          continue;
        }
        const value = parseValue(lx);
        if (value === undefined) break;
        dict.set((key as PdfName).v, value);
      }
      return dict;
    }
    if (t === 'open-array') {
      const arr: PdfValue[] = [];
      for (;;) {
        const save = lx.i;
        const next = lx.next();
        if (next === undefined || (next as { t?: string } | null)?.t === 'close-array') break;
        lx.i = save;
        const value = parseValue(lx);
        if (value === undefined) break;
        arr.push(value);
      }
      return arr;
    }
    if (t === 'close-dict' || t === 'close-array') return null;
  }
  if (typeof tok === 'number') {
    const save = lx.i;
    const gen = lx.next();
    const r = lx.next();
    if (typeof gen === 'number' && isKw(r, 'R')) return { t: 'ref', n: tok };
    lx.i = save;
  }
  return tok as PdfValue;
}

// ---- Object table ------------------------------------------------------------------------

interface PdfObject {
  value: PdfValue;
  raw?: Uint8Array;
}

function asDict(v: PdfValue | undefined): PdfDict | undefined {
  return v instanceof Map ? v : undefined;
}
function nameOf(v: PdfValue | undefined): string | undefined {
  return typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    !(v instanceof Map) &&
    (v as PdfName).t === 'name'
    ? (v as PdfName).v
    : undefined;
}

class PdfDocument {
  readonly objects = new Map<number, PdfObject>();
  private readonly decoded = new Map<number, Uint8Array | null>();

  constructor(private readonly bytes: Uint8Array) {}

  async load() {
    const text = latin1(this.bytes);
    const re = /(\d+)\s+(\d+)\s+obj\b/g;
    for (let m = re.exec(text); m; m = re.exec(text)) {
      const lx = new Lexer(text, m.index + m[0].length);
      const value = parseValue(lx);
      if (value === undefined) continue;
      const obj: PdfObject = { value };
      const after = new Lexer(text, lx.i);
      const kw = after.next();
      if (isKw(kw, 'stream')) {
        let start = after.i;
        if (text[start] === '\r') start++;
        if (text[start] === '\n') start++;
        const length = asDict(value)?.get('Length');
        let end = typeof length === 'number' ? start + length : -1;
        if (end < 0 || text.slice(end, end + 30).indexOf('endstream') < 0)
          end = text.indexOf('endstream', start);
        if (end > start) obj.raw = this.bytes.subarray(start, end);
        re.lastIndex = Math.max(re.lastIndex, end);
      }
      this.objects.set(Number(m[1]), obj);
    }
    // Objects packed inside object streams (PDF 1.5+).
    for (const [, obj] of [...this.objects]) {
      const dict = asDict(obj.value);
      if (nameOf(dict?.get('Type')) !== 'ObjStm' || !obj.raw) continue;
      const data = await this.decodeStream(obj);
      if (!data) continue;
      const s = latin1(data);
      const first = Number(dict?.get('First'));
      const count = Number(dict?.get('N'));
      const header = s.slice(0, first).trim().split(/\s+/).map(Number);
      for (let k = 0; k < count; k++) {
        const num = header[k * 2]!;
        const off = header[k * 2 + 1]!;
        if (this.objects.has(num)) continue;
        const value = parseValue(new Lexer(s, first + off));
        if (value !== undefined) this.objects.set(num, { value });
      }
    }
  }

  resolve(v: PdfValue | undefined, depth = 0): PdfValue | undefined {
    if (depth > 20) return undefined;
    if (
      typeof v === 'object' &&
      v !== null &&
      !Array.isArray(v) &&
      !(v instanceof Map) &&
      (v as PdfRef).t === 'ref'
    ) {
      return this.resolve(this.objects.get((v as PdfRef).n)?.value, depth + 1);
    }
    return v;
  }

  private async decodeStream(obj: PdfObject): Promise<Uint8Array | null> {
    if (!obj.raw) return null;
    const filter = this.resolve(asDict(obj.value)?.get('Filter'));
    const filters = Array.isArray(filter)
      ? filter.map((f) => nameOf(f))
      : filter
        ? [nameOf(filter)]
        : [];
    if (filters.length === 0) return obj.raw;
    if (filters.length === 1 && filters[0] === 'FlateDecode') return inflateLenient(obj.raw);
    return null; // other filters (images, ASCII85…) don't carry résumé text
  }

  async streamOf(ref: PdfValue | undefined): Promise<Uint8Array | null> {
    if (
      typeof ref !== 'object' ||
      ref === null ||
      Array.isArray(ref) ||
      ref instanceof Map ||
      (ref as PdfRef).t !== 'ref'
    )
      return null;
    const n = (ref as PdfRef).n;
    if (!this.decoded.has(n)) {
      const obj = this.objects.get(n);
      this.decoded.set(n, obj ? await this.decodeStream(obj) : null);
    }
    return this.decoded.get(n) ?? null;
  }

  /** Pages in reading order, each with inherited resources. */
  pages(): Array<{ page: PdfDict; resources: PdfDict | undefined }> {
    const out: Array<{ page: PdfDict; resources: PdfDict | undefined }> = [];
    const catalog = [...this.objects.values()]
      .map((o) => asDict(o.value))
      .find((d) => nameOf(d?.get('Type')) === 'Catalog');
    const visit = (node: PdfDict | undefined, inherited: PdfDict | undefined, depth: number) => {
      if (!node || depth > 50) return;
      const resources = asDict(this.resolve(node.get('Resources'))) ?? inherited;
      const type = nameOf(node.get('Type'));
      if (type === 'Page') return void out.push({ page: node, resources });
      const kids = this.resolve(node.get('Kids'));
      if (Array.isArray(kids))
        for (const kid of kids) visit(asDict(this.resolve(kid)), resources, depth + 1);
    };
    visit(asDict(this.resolve(catalog?.get('Pages'))), undefined, 0);
    if (out.length) return out;
    // Fallback: every page object, in object order.
    return [...this.objects.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, o]) => asDict(o.value))
      .filter((d): d is PdfDict => nameOf(d?.get('Type')) === 'Page')
      .map((page) => ({ page, resources: asDict(this.resolve(page.get('Resources'))) }));
  }
}

// ---- Fonts / CMaps -------------------------------------------------------------------------

interface CMap {
  bytes: 1 | 2;
  map: Map<number, string>;
}

function utf16be(hex: string): string {
  let out = '';
  for (let i = 0; i + 4 <= hex.length; i += 4)
    out += String.fromCharCode(parseInt(hex.slice(i, i + 4), 16));
  if (hex.length === 2) out += String.fromCharCode(parseInt(hex, 16));
  return out;
}

export function parseToUnicode(text: string): CMap {
  const map = new Map<number, string>();
  const space = /begincodespacerange\s*<([0-9a-fA-F]+)>/.exec(text);
  const bytes: 1 | 2 = space && space[1]!.length <= 2 ? 1 : 2;
  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const m of block[1]!.matchAll(/<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]*)>/g))
      map.set(parseInt(m[1]!, 16), utf16be(m[2]!));
  }
  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const m of block[1]!.matchAll(
      /<([0-9a-fA-F]+)>\s*<([0-9a-fA-F]+)>\s*(<([0-9a-fA-F]+)>|\[([^\]]*)\])/g,
    )) {
      const lo = parseInt(m[1]!, 16);
      const hi = parseInt(m[2]!, 16);
      if (hi - lo > 0xffff) continue;
      if (m[4] !== undefined) {
        const base = m[4];
        const prefix = base.slice(0, -4);
        const start = parseInt(base.slice(-4), 16);
        for (let c = lo; c <= hi; c++)
          map.set(c, utf16be(prefix + (start + c - lo).toString(16).padStart(4, '0')));
      } else {
        const list = [...m[5]!.matchAll(/<([0-9a-fA-F]+)>/g)].map((x) => x[1]!);
        list.forEach((hex, k) => map.set(lo + k, utf16be(hex)));
      }
    }
  }
  return { bytes, map };
}

/** WinAnsi quirks worth fixing for résumés (quotes, dashes, bullets). */
const WIN_ANSI: Record<number, string> = {
  0x91: '‘',
  0x92: '’',
  0x93: '“',
  0x94: '”',
  0x95: '•',
  0x96: '–',
  0x97: '—',
  0x85: '…',
};

/**
 * What we need from a font: how to turn codes into text (ToUnicode) and how far
 * each glyph advances (widths) — the latter decides where the spaces are.
 */
interface FontInfo {
  cmap?: CMap;
  /** Bytes per character code: 2 for composite (Type0) fonts, 1 otherwise. */
  bytes: 1 | 2;
  /** Glyph widths in 1/1000 em by character code. */
  widths: Map<number, number>;
  defaultWidth: number;
}

function* codes(bytes: Uint8Array, size: 1 | 2): Generator<number> {
  for (let i = 0; i < bytes.length; i += size) {
    yield size === 2 ? (bytes[i]! << 8) | (bytes[i + 1] ?? 0) : bytes[i]!;
  }
}

function charFor(code: number, font: FontInfo | undefined): string {
  if (font?.cmap)
    return font.cmap.map.get(code) ?? (font.bytes === 1 ? String.fromCharCode(code) : '');
  if (font?.bytes === 2) return ''; // composite font without ToUnicode: codes are glyph ids
  return WIN_ANSI[code] ?? String.fromCharCode(code);
}

async function loadFont(
  doc: PdfDocument,
  dict: PdfDict | undefined,
  cmapCache: Map<number, CMap | undefined>,
): Promise<FontInfo> {
  const subtype = nameOf(dict?.get('Subtype'));
  const composite = subtype === 'Type0';
  const widths = new Map<number, number>();
  let defaultWidth = composite ? 1000 : 500;

  const toUnicode = dict?.get('ToUnicode');
  let cmap: CMap | undefined;
  if (typeof toUnicode === 'object' && toUnicode !== null && (toUnicode as PdfRef).t === 'ref') {
    const key = (toUnicode as PdfRef).n;
    if (!cmapCache.has(key)) {
      const data = await doc.streamOf(toUnicode);
      cmapCache.set(key, data ? parseToUnicode(latin1(data)) : undefined);
    }
    cmap = cmapCache.get(key);
  }

  if (composite) {
    // Widths live on the descendant CIDFont: /DW default, /W [c [w…] | c1 c2 w …].
    const descendants = doc.resolve(dict?.get('DescendantFonts'));
    const cid = asDict(doc.resolve(Array.isArray(descendants) ? descendants[0] : undefined));
    const dw = doc.resolve(cid?.get('DW'));
    if (typeof dw === 'number') defaultWidth = dw;
    const w = doc.resolve(cid?.get('W'));
    if (Array.isArray(w)) {
      for (let i = 0; i < w.length;) {
        const first = doc.resolve(w[i]);
        const next = doc.resolve(w[i + 1]);
        if (typeof first !== 'number') break;
        if (Array.isArray(next)) {
          next.forEach((width, k) => {
            const value = doc.resolve(width);
            if (typeof value === 'number') widths.set(first + k, value);
          });
          i += 2;
        } else {
          const last = next;
          const width = doc.resolve(w[i + 2]);
          if (typeof last !== 'number' || typeof width !== 'number') break;
          for (let c = first; c <= last && c - first < 65536; c++) widths.set(c, width);
          i += 3;
        }
      }
    }
  } else {
    const first = doc.resolve(dict?.get('FirstChar'));
    const list = doc.resolve(dict?.get('Widths'));
    if (typeof first === 'number' && Array.isArray(list)) {
      list.forEach((width, k) => {
        const value = doc.resolve(width);
        if (typeof value === 'number') widths.set(first + k, value);
      });
    }
    const descriptor = asDict(doc.resolve(dict?.get('FontDescriptor')));
    const missing = doc.resolve(descriptor?.get('MissingWidth'));
    if (typeof missing === 'number' && missing > 0) defaultWidth = missing;
  }
  return { cmap, bytes: composite ? 2 : (cmap?.bytes ?? 1), widths, defaultWidth };
}

// ---- Content streams -----------------------------------------------------------------------

type Matrix = [number, number, number, number, number, number];
const IDENTITY: Matrix = [1, 0, 0, 1, 0, 0];

/**
 * Run the text operators, tracking the text and line matrices like a viewer does.
 * Word breaks come from geometry: a gap wider than a fraction of the font size
 * between where the last glyph ended and where the next one starts is a space;
 * a vertical jump is a new line. This handles per-glyph positioning (Chrome/Skia),
 * per-word runs (Word) and kerned TJ arrays (LaTeX) alike.
 */
function interpret(content: string, fonts: Map<string, FontInfo>): string {
  const lx = new Lexer(content);
  const operands: PdfValue[] = [];
  let font: FontInfo | undefined;
  let fontSize = 1;
  let charSpacing = 0;
  let wordSpacing = 0;
  let hScale = 1;
  let leading = 0;
  let tm: Matrix = [...IDENTITY];
  let lm: Matrix = [...IDENTITY];
  let pen: { x: number; y: number; size: number } | null = null;
  let out = '';

  const scale = () => Math.hypot(tm[0], tm[1]) || Math.hypot(tm[2], tm[3]) || 1;
  const translate = (tx: number, ty: number) => {
    lm = [
      lm[0],
      lm[1],
      lm[2],
      lm[3],
      lm[4] + lm[0] * tx + lm[2] * ty,
      lm[5] + lm[1] * tx + lm[3] * ty,
    ];
    tm = [...lm];
  };

  const show = (v: PdfValue | undefined) => {
    if (
      typeof v !== 'object' ||
      v === null ||
      Array.isArray(v) ||
      v instanceof Map ||
      (v as PdfStr).t !== 'str'
    )
      return;
    const bytes = (v as PdfStr).b;
    if (!bytes.length) return;
    const size = Math.abs(fontSize) * scale();
    const x = tm[4];
    const y = tm[5];
    if (pen && out) {
      if (Math.abs(y - pen.y) > Math.max(size, pen.size) * 0.5) {
        if (!out.endsWith('\n')) out += '\n';
      } else if (Math.abs(x - pen.x) > Math.max(size, pen.size) * 0.15 && !/\s$/.test(out)) {
        out += ' ';
      }
    }
    for (const code of codes(bytes, font?.bytes ?? 1)) {
      out += charFor(code, font);
      const width = (font?.widths.get(code) ?? font?.defaultWidth ?? 500) / 1000;
      const advance =
        (width * fontSize + charSpacing + (code === 32 && font?.bytes !== 2 ? wordSpacing : 0)) *
        hScale;
      tm = [tm[0], tm[1], tm[2], tm[3], tm[4] + tm[0] * advance, tm[5] + tm[1] * advance];
    }
    pen = { x: tm[4], y: tm[5], size };
  };

  for (;;) {
    const value = parseValue(lx);
    if (value === undefined) break;
    if (!isKw(value)) {
      operands.push(value);
      continue;
    }
    const op = value.v;
    const nums = operands.filter((o): o is number => typeof o === 'number');
    const last = operands[operands.length - 1];
    switch (op) {
      case 'BT':
        tm = [...IDENTITY];
        lm = [...IDENTITY];
        break;
      case 'Tf':
        font = fonts.get(nameOf(operands[operands.length - 2]) ?? '');
        fontSize = nums[nums.length - 1] ?? fontSize;
        break;
      case 'Tc':
        charSpacing = nums[0] ?? 0;
        break;
      case 'Tw':
        wordSpacing = nums[0] ?? 0;
        break;
      case 'Tz':
        hScale = (nums[0] ?? 100) / 100;
        break;
      case 'TL':
        leading = nums[0] ?? 0;
        break;
      case 'Td':
        translate(nums[0] ?? 0, nums[1] ?? 0);
        break;
      case 'TD':
        leading = -(nums[1] ?? 0);
        translate(nums[0] ?? 0, nums[1] ?? 0);
        break;
      case 'Tm':
        if (nums.length >= 6) {
          lm = nums.slice(-6) as Matrix;
          tm = [...lm];
        }
        break;
      case 'T*':
        translate(0, -leading);
        break;
      case 'Tj':
        show(last);
        break;
      case "'":
        translate(0, -leading);
        show(last);
        break;
      case '"':
        wordSpacing = nums[0] ?? wordSpacing;
        charSpacing = nums[1] ?? charSpacing;
        translate(0, -leading);
        show(last);
        break;
      case 'TJ':
        if (Array.isArray(last)) {
          for (const item of last) {
            if (typeof item === 'number') {
              const adjust = (-item / 1000) * fontSize * hScale;
              tm = [tm[0], tm[1], tm[2], tm[3], tm[4] + tm[0] * adjust, tm[5] + tm[1] * adjust];
            } else show(item);
          }
        }
        break;
      case 'ID': {
        // Inline image data: skip to "EI".
        const end = content.slice(lx.i).search(/\sEI(\s|$)/);
        lx.i = end < 0 ? content.length : lx.i + end + 3;
        break;
      }
    }
    operands.length = 0;
  }
  return out;
}

export async function pdfToText(bytes: Uint8Array): Promise<string> {
  if (latin1(bytes.subarray(0, 1024)).indexOf('%PDF') < 0)
    throw new Error('This doesn’t look like a PDF file.');
  const doc = new PdfDocument(bytes);
  await doc.load();
  const pageTexts: string[] = [];
  const cmapCache = new Map<number, CMap | undefined>();
  const fontCache = new Map<PdfDict, FontInfo>();

  for (const { page, resources } of doc.pages()) {
    const fonts = new Map<string, FontInfo>();
    const fontDict = asDict(doc.resolve(resources?.get('Font')));
    for (const [name, ref] of fontDict ?? []) {
      const dict = asDict(doc.resolve(ref));
      if (!dict) continue;
      if (!fontCache.has(dict)) fontCache.set(dict, await loadFont(doc, dict, cmapCache));
      fonts.set(name, fontCache.get(dict)!);
    }
    const contents = page.get('Contents');
    const refs = Array.isArray(doc.resolve(contents))
      ? (doc.resolve(contents) as PdfValue[])
      : [contents];
    let content = '';
    for (const ref of refs) {
      const data = await doc.streamOf(ref as PdfValue);
      if (data) content += `${latin1(data)}\n`;
    }
    pageTexts.push(interpret(content, fonts));
  }
  return pageTexts
    .join('\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
