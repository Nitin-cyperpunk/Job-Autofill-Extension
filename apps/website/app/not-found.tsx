import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <Container className="max-w-2xl py-24 text-center">
      <p className="text-sm font-semibold text-accent">404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-fg">Page not found</h1>
      <p className="mt-4 text-lg text-muted">That page doesn’t exist or has moved.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-4 font-semibold">
        <Link href="/" className="text-accent hover:underline">
          Home
        </Link>
        <Link href="/features" className="text-accent hover:underline">
          Features
        </Link>
        <Link href="/blog" className="text-accent hover:underline">
          Blog
        </Link>
      </div>
    </Container>
  );
}
