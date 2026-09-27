import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/site';

/** The shared social card (1200×630), rendered once at build time. */
export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        background: 'linear-gradient(135deg, #0b1630 0%, #0f2557 60%, #1f5ad6 100%)',
        color: 'white',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: '#2f6fed',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 7,
            padding: '0 14px',
          }}
        >
          <div style={{ height: 7, width: 36, background: 'white', borderRadius: 2 }} />
          <div style={{ height: 7, width: 36, background: 'white', borderRadius: 2 }} />
          <div style={{ height: 7, width: 22, background: 'white', borderRadius: 2 }} />
        </div>
        <div style={{ fontSize: 44, fontWeight: 700 }}>{SITE.name}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 980 }}>
          Autofill job applications faster.
        </div>
        <div style={{ fontSize: 34, color: '#bcdaff', maxWidth: 980 }}>
          Your profile stays on your device.
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, fontSize: 26, color: '#d9ebff' }}>
        <span>Chrome extension</span>
        <span>·</span>
        <span>No account</span>
        <span>·</span>
        <span>Never submits for you</span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
