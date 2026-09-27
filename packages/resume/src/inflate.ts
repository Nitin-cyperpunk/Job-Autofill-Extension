/**
 * Decompress with the platform's own DecompressionStream (Chrome, Node 18+).
 * No third-party code touches the resume.
 */
export async function inflate(bytes: Uint8Array, format: 'deflate' | 'deflate-raw'): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Try zlib first, then raw deflate (some PDF writers omit the zlib header). */
export async function inflateLenient(bytes: Uint8Array): Promise<Uint8Array | null> {
  for (const format of ['deflate', 'deflate-raw'] as const) {
    try {
      return await inflate(bytes, format);
    } catch {
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
