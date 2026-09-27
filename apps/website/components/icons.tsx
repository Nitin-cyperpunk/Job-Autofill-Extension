import type { ReactNode } from 'react';

/* Line icons (24px grid, currentColor). Inline SVG: no requests, no icon font. */

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className ?? 'h-6 w-6'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const BoltIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M13 3 5 13h6l-1 8 8-10h-6l1-8Z" />
  </Svg>
);

export const FileIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Svg>
);

export const SparkIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6" />
  </Svg>
);

export const ShieldIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Svg>
);

export const EyeIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
);

export const HandIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-1.5v-5a1.5 1.5 0 0 1 3 0V11m0-4.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.5a6 6 0 0 1-4.9-2.5L2.8 15a1.5 1.5 0 0 1 2.4-1.8L8 16" />
  </Svg>
);

export const FormIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 8h8M8 12h8M8 16h4" />
  </Svg>
);

export const LayersIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="m12 3 9 5-9 5-9-5 9-5Z" />
    <path d="m3 13 9 5 9-5" />
  </Svg>
);

export const DownloadIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M12 4v11m-5-5 5 5 5-5M5 20h14" />
  </Svg>
);

export const KeyIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 9-9m-4 4 3 3" />
  </Svg>
);
