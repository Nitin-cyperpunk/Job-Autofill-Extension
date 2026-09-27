import { APP_NAME } from '@jobfill/shared';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <img src="/icons/icon-48.png" alt="" className={size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'} />
      <span className={size === 'sm' ? 'text-base font-semibold' : 'text-lg font-semibold'}>
        {APP_NAME}
      </span>
    </span>
  );
}
