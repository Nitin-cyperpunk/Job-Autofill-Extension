import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { STORAGE_KEYS } from '@jobfill/shared';
import {
  loadSettings,
  onItemChanged,
  saveSettings,
  type Settings,
  type ThemePreference,
} from '@/storage';
import { cx } from '@/utils/cx';
import { applyTheme } from '@/utils/theme';

const OPTIONS: Array<{ value: ThemePreference; label: string; tip: string }> = [
  { value: 'light', label: 'Switch to light mode', tip: 'Light' },
  { value: 'dark', label: 'Switch to dark mode', tip: 'Dark' },
  { value: 'system', label: 'Use your system theme', tip: 'System' },
];

/**
 * Light / Dark / System, saved in JobFill's settings on this device. A radio group:
 * Tab reaches the selected option, arrow keys move between options.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [pref, setPref] = useState<ThemePreference | null>(null);
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    void loadSettings().then((s) => setPref(s.theme));
    return onItemChanged<Partial<Settings>>(STORAGE_KEYS.settings, (v) => {
      const t = v?.theme;
      setPref(t === 'light' || t === 'dark' ? t : 'system');
    });
  }, []);

  function choose(value: ThemePreference) {
    setPref(value);
    applyTheme(value, true);
    void saveSettings({ theme: value });
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const delta = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!delta) return;
    e.preventDefault();
    const current = OPTIONS.findIndex((o) => o.value === (pref ?? 'system'));
    const next = (current + delta + OPTIONS.length) % OPTIONS.length;
    choose(OPTIONS[next]!.value);
    buttons.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      onKeyDown={onKeyDown}
      className={cx(
        'inline-flex items-center gap-0.5 rounded-lg border border-line bg-surface p-0.5',
        className,
      )}
    >
      {OPTIONS.map((option, i) => {
        const checked = (pref ?? 'system') === option.value;
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
            tabIndex={checked ? 0 : -1}
            onClick={() => choose(option.value)}
            className={cx(
              'group relative flex h-7 w-7 items-center justify-center rounded-md transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-accent',
              checked ? 'bg-subtle-2 text-fg' : 'text-faint hover:text-fg',
            )}
          >
            <ThemeIcon value={option.value} />
            <span
              aria-hidden="true"
              className={cx(
                'pointer-events-none absolute top-full z-50 mt-2 hidden animate-fade rounded-md bg-ink px-2 py-1 text-xs font-medium whitespace-nowrap text-white group-hover:block group-focus-visible:block',
                // Edge-aligned so the tooltip never pushes past the popup's edge.
                i === 0
                  ? 'left-0'
                  : i === OPTIONS.length - 1
                    ? 'right-0'
                    : 'left-1/2 -translate-x-1/2',
              )}
            >
              {option.tip}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ThemeIcon({ value }: { value: ThemePreference }) {
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
