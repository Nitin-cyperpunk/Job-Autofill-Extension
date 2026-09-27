import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';

interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
  /** 1 when the card title is the page's main heading (e.g. an onboarding step). */
  headingLevel?: 1 | 2;
}

export function Card({
  title,
  description,
  icon,
  actions,
  className,
  children,
  headingLevel = 2,
}: CardProps) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <section className={cx('rounded-xl border border-line bg-surface shadow-card', className)}>
      {(title || actions) && (
        <header className="flex items-start gap-3 px-6 pt-5">
          {icon && (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            {title && <Heading className="text-base font-semibold text-fg">{title}</Heading>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="px-6 pt-4 pb-6">{children}</div>
    </section>
  );
}
