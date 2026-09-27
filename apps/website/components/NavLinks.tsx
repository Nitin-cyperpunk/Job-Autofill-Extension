'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/** Desktop navigation with the current section marked (aria-current). */
export function NavLinks({ items }: { items: ReadonlyArray<{ href: string; label: string }> }) {
  const pathname = usePathname();
  return (
    <ul className="flex items-center gap-1 text-sm font-medium">
      {items.map((item) => {
        const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={current ? 'page' : undefined}
              className="rounded-md px-3 py-2 text-muted transition-colors duration-150 hover:text-fg aria-[current=page]:text-fg"
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
