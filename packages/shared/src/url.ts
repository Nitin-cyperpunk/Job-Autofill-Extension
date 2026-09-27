/** Add https:// when the user typed a bare domain like "linkedin.com/in/ada". */
export function normalizeUrl(input: string): string {
  const value = input.trim();
  if (!value) return '';
  return /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
}

/** Only http(s) URLs with a real-looking host are accepted (no javascript:, data:, …). */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      (url.protocol === 'https:' || url.protocol === 'http:') &&
      (url.hostname.includes('.') || url.hostname === 'localhost')
    );
  } catch {
    return false;
  }
}
