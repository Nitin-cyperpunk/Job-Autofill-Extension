import { useCallback, useEffect, useState } from 'react';
import type { SectionId } from '@jobfill/types';
import { SECTION_ORDER } from './sections/registry';

/**
 * Minimal hash router for the options page: #/onboarding/<step>?return=review
 * #/profile, #/privacy and #/import-resume. The hash keeps the user's place across reloads.
 */

export type StepId = 'welcome' | 'start' | SectionId | 'resume' | 'review' | 'complete';

export const STEP_ORDER: StepId[] = [
  'welcome',
  'start',
  ...SECTION_ORDER,
  'resume',
  'review',
  'complete',
];

export type Route =
  | { name: 'onboarding'; step: StepId; returnTo?: 'review'; notice?: 'deleted' | 'reset' }
  | { name: 'profile' }
  /** What's stored, what can leave the device, and the data controls. */
  | { name: 'privacy' }
  /** Résumé → profile import, from onboarding or the dashboard. */
  | { name: 'resume-import'; from: 'onboarding' | 'profile' };

export function toHash(route: Route): string {
  if (route.name === 'profile') return '#/profile';
  if (route.name === 'privacy') return '#/privacy';
  if (route.name === 'resume-import') return `#/import-resume?from=${route.from}`;
  const params = new URLSearchParams();
  if (route.returnTo) params.set('return', route.returnTo);
  if (route.notice) params.set('notice', route.notice);
  const query = params.toString();
  return `#/onboarding/${route.step}${query ? `?${query}` : ''}`;
}

export function parseHash(hash: string): Route | null {
  const [path = '', query = ''] = hash.replace(/^#/, '').split('?');
  const params = new URLSearchParams(query);
  if (path === '/profile') return { name: 'profile' };
  if (path === '/privacy') return { name: 'privacy' };
  if (path === '/import-resume') {
    return {
      name: 'resume-import',
      from: params.get('from') === 'onboarding' ? 'onboarding' : 'profile',
    };
  }
  const match = /^\/onboarding\/([a-z]+)$/.exec(path);
  const step = match?.[1] as StepId | undefined;
  if (step && STEP_ORDER.includes(step)) {
    const notice = params.get('notice');
    return {
      name: 'onboarding',
      step,
      returnTo: params.get('return') === 'review' ? 'review' : undefined,
      notice: notice === 'deleted' || notice === 'reset' ? notice : undefined,
    };
  }
  return null;
}

export function useHashRoute(): [
  Route | null,
  (route: Route, options?: { replace?: boolean }) => void,
] {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: Route, options?: { replace?: boolean }) => {
    const hash = toHash(next);
    if (options?.replace) window.history.replaceState(null, '', hash);
    else window.history.pushState(null, '', hash);
    setRoute(next);
    window.scrollTo({ top: 0 });
  }, []);

  return [route, navigate];
}
