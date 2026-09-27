'use client';

import { useState } from 'react';

/**
 * Share JobFill: the system share sheet where the browser has one, otherwise copy the
 * link. Nothing is tracked.
 */
export function ShareButton({ url, title, text }: { url: string; title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ url, title, text });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return; // user cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      window.prompt('Copy this link to share JobFill:', url);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-surface px-4 py-2.5 text-sm font-semibold text-fg ring-1 ring-line-strong transition duration-150 ease-out hover:bg-subtle active:scale-[0.98]"
    >
      {copied ? (
        <>
          <svg viewBox="0 0 20 20" className="h-4 w-4 animate-pop text-ok" aria-hidden="true">
            <path
              d="m4.5 10.5 3.5 3.5 7.5-8"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="check-draw animate-draw"
            />
          </svg>
          Link copied
        </>
      ) : (
        'Share JobFill'
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? 'The JobFill link was copied to your clipboard.' : ''}
      </span>
    </button>
  );
}
