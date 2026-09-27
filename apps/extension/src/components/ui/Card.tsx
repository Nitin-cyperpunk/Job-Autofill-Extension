import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';

interface CardProps {
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function Card({ title, description, icon, actions, className, children }: CardProps) {
  return (
    <section className={cx('rounded-2xl border border-slate-200 bg-white shadow-sm', className)}>
      {(title || actions) && (
        <header className="flex items-start gap-3 px-6 pt-5">
          {icon && (
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              {icon}
            </span>
          )}
          <div className="min-w-0 flex-1">
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="px-6 pt-4 pb-6">{children}</div>
    </section>
  );
}
