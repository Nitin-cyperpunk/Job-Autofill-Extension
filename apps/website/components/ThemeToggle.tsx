'use client';

import { useCallback, useRef, useSyncExternalStore, type KeyboardEvent } from 'react';
import { THEME_STORAGE_KEY } from '@/lib/site';

/**
 * Light / Dark / System switch. The choice is kept in localStorage on this device only
 * (no cookie, nothing sent). "System" removes the attribute and the CSS follows
 * prefers-color-scheme. The inline script in the layout applies a saved choice before
 * first paint, so there is no flash of the wrong theme.
 */

export type ThemePref = 'light' | 'dark' | 'system';

const OPTIONS: Array<{ value: ThemePref; label: string; tip: string }> = [
  { value: 'light', label: 'Switch to light mode', tip: 'Light' },
  { value: 'dark', label: 'Switch to dark mode', tip: 'Dark' },
  { value: 'system', label: 'Use your system theme', tip: 'System' },
];

const listeners = new Set<() => void>();

function readPref(): ThemePref {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  // Keep other open tabs in step.
  const onStorage = (e: StorageEvent) => {
    if (e.key === THEME_STORAGE_KEY) {
      apply(readPref(), false);
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function apply(pref: ThemePref, animate: boolean) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-transition');
    window.setTimeout(() => root.classList.remove('theme-transition'), 220);
  }
  if (pref === 'system') delete root.dataset.theme;
  else root.dataset.theme = pref;
}

function setPref(pref: ThemePref) {
  try {
    if (pref === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Storage blocked: still switch for this page view.
  }
  apply(pref, true);
  listeners.forEach((l) => l());
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  // Server render and first client render agree on "none selected"; then the real value.
  const pref = useSyncExternalStore<ThemePref | null>(subscribe, readPref, () => null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!delta) return;
      e.preventDefault();
      const current = OPTIONS.findIndex((o) => o.value === (pref ?? 'system'));
      const next = (current + delta + OPTIONS.length) % OPTIONS.length;
      setPref(OPTIONS[next]!.value);
      buttons.current[next]?.focus();
    },
    [pref],
  );

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      onKeyDown={onKeyDown}
      className={`inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5 ${className}`}
    >
      {OPTIONS.map((option, i) => {
        const checked = (pref ?? 'system') === option.value && pref !== null;
        return (
          <button
            key={option.value}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={option.label}
            tabIndex={checked || (pref === null && option.value === 'system') ? 0 : -1}
            onClick={() => setPref(option.value)}
            className={`group relative flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 ${
              checked ? 'bg-subtle-2 text-fg' : 'text-faint hover:text-fg'
            }`}
          >
            <ThemeIcon value={option.value} />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 hidden -translate-x-1/2 animate-fade rounded-md bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-white group-hover:block group-focus-visible:block"
            >
              {option.tip}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ThemeIcon({ value }: { value: ThemePref }) {
  const common = {
    viewBox: '0 0 20 20',
    className: 'h-4 w-4',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    'aria-hidden': true,
  };
  if (value === 'light')
    return (
      <svg {...common}>
        <circle cx="10" cy="10" r="3.2" />
        <path d="M10 2.5v1.8M10 15.7v1.8M2.5 10h1.8M15.7 10h1.8M4.7 4.7l1.3 1.3M14 14l1.3 1.3M4.7 15.3 6 14M14 6l1.3-1.3" />
      </svg>
    );
  if (value === 'dark')
    return (
      <svg {...common}>
        <path d="M16.5 12.2A6.5 6.5 0 0 1 7.8 3.5a6.5 6.5 0 1 0 8.7 8.7Z" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="2.5" y="3.5" width="15" height="10" rx="1.5" />
      <path d="M7 17h6M10 13.5V17" />
    </svg>
  );
}
