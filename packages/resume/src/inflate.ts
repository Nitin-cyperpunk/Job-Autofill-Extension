/**
 * Largest output of one decompressed stream. Real résumé streams are kilobytes; the cap
 * stops a crafted file (a "zip bomb" hidden in a 5 MB upload) from exhausting memory.
 */
export const MAX_INFLATED_BYTES = 32 * 1024 * 1024;

export class InflateLimitError extends Error {
  constructor() {
    super('This file contains more data than a resume would. Try exporting it again as PDF.');
    this.name = 'InflateLimitError';
  }
}

/**
 * Decompress with the platform's own DecompressionStream (Chrome, Node 18+).
 * No third-party code touches the resume. Stops (and throws) past `maxBytes`.
 */
export async function inflate(
  bytes: Uint8Array,
  format: 'deflate' | 'deflate-raw',
  maxBytes = MAX_INFLATED_BYTES,
): Promise<Uint8Array> {
  const reader = new Blob([bytes as BlobPart])
    .stream()
    .pipeThrough(new DecompressionStream(format))
    .getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > maxBytes) {
      await reader.cancel().catch(() => undefined);
      throw new InflateLimitError();
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** Try zlib first, then raw deflate (some PDF writers omit the zlib header). */
export async function inflateLenient(bytes: Uint8Array): Promise<Uint8Array | null> {
  for (const format of ['deflate', 'deflate-raw'] as const) {
    try {
      return await inflate(bytes, format);
    } catch (err) {
      if (err instanceof InflateLimitError) throw err;
      // try the next format
    }
  }
  return null;
}

export function latin1(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    out += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return out;
}
