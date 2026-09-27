'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

/**
 * Small-screen navigation on a native <details> (works without JS). The script only
 * closes it after navigating, on Escape, and on a click outside.
 */
export function MobileMenu({ items }: { items: ReadonlyArray<{ href: string; label: string }> }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.removeAttribute('open');
  }, [pathname]);

  useEffect(() => {
    const close = (e: Event) => {
      const menu = ref.current;
      if (!menu?.open) return;
      if (e instanceof KeyboardEvent) {
        if (e.key !== 'Escape') return;
        menu.open = false;
        menu.querySelector('summary')?.focus();
      } else if (!menu.contains(e.target as Node)) {
        menu.open = false;
      }
    };
    document.addEventListener('keydown', close);
    document.addEventListener('click', close);
    return () => {
      document.removeEventListener('keydown', close);
      document.removeEventListener('click', close);
    };
  }, []);

  return (
    <details ref={ref} className="group relative md:hidden">
      <summary
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-fg transition-colors hover:bg-subtle"
        aria-label="Menu"
      >
        <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
          <path
            d="M3 6h14M3 10h14M3 14h14"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="group-open:hidden"
          />
          <path
            d="M5 5l10 10M15 5 5 15"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="hidden group-open:block"
          />
        </svg>
      </summary>
      <nav
        aria-label="Mobile"
        className="absolute right-0 z-50 mt-2 w-60 origin-top-right animate-scale-in rounded-xl border border-line bg-surface p-2 shadow-raised"
      >
        <ul>
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={pathname === item.href ? 'page' : undefined}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-body transition-colors hover:bg-subtle hover:text-fg aria-[current=page]:text-accent"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}
