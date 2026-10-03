import { useEffect, useState } from 'react';
import { STORAGE_KEYS, fullName } from '@jobfill/shared';
import { CompletenessBar } from '@/components/CompletenessMeter';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PRIVACY_MESSAGE } from '@/components/PrivacyNotice';
import { Button } from '@/components/ui/Button';
import { CheckIcon, LockIcon } from '@/components/ui/icons';
import { ProfileProvider } from '@/profile/ProfileProvider';
import { useProfile } from '@/profile/profile-context';
import { loadSettings, onItemChanged } from '@/storage';
import { DEBUG } from '@/utils/env';
import { AutofillPanel } from './AutofillPanel';
import { usePageReadiness, type Readiness } from './usePageReadiness';
import { DebugPanel } from './DebugPanel';

/** Dev builds always show the debugger; release builds when "Debug mode" is on. */
function useDebugMode(): boolean {
  const [enabled, setEnabled] = useState(DEBUG);
  useEffect(() => {
    if (DEBUG) return;
    void loadSettings().then((s) => setEnabled(s.debugMode));
    return onItemChanged<{ debugMode?: boolean }>(STORAGE_KEYS.settings, (v) =>
      setEnabled(v?.debugMode === true),
    );
  }, []);
  return enabled;
}

export function Popup() {
  const debug = useDebugMode();
  return (
    <main className="w-96 animate-enter p-4">
      <h1 className="sr-only">JobFill</h1>
      <ProfileProvider fallback={<p className="text-sm text-muted">Loading…</p>}>
        <PopupContent />
      </ProfileProvider>
      {debug && <DebugPanel />}
    </main>
  );
}

function openProfile(hash = '') {
  // openOptionsPage() can't take a hash, so open the page URL directly for deep links.
  if (!hash) return void chrome.runtime.openOptionsPage();
  void chrome.tabs.create({ url: chrome.runtime.getURL(`src/options/index.html${hash}`) });
}

function PopupContent() {
  const { profile, completeness } = useProfile();
  const ready = profile.onboardingCompletedAt !== null;
  const name = fullName(profile.personal);
  const readiness = usePageReadiness(profile, ready);

  return (
    <>
      <header className="mb-4 flex items-center justify-between gap-2">
        <Logo size="sm" />
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {ready && (
            <Button variant="ghost" size="sm" onClick={() => openProfile('#/profile')}>
              Edit profile
            </Button>
          )}
        </div>
      </header>

      {ready ? (
        <>
          <div className="mb-4 rounded-lg border border-line bg-surface p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-fg">
              <span className="flex h-5 w-5 animate-pop items-center justify-center rounded-full bg-ok-soft text-ok">
                <CheckIcon className="h-3 w-3" />
              </span>
              Profile ready
              {name && <span className="truncate font-normal text-muted">· {name}</span>}
            </p>
            <div className="mt-3">
              <CompletenessBar percent={completeness.percent} compact />
            </div>
            <PageStatus readiness={readiness} />
          </div>
          <AutofillPanel readiness={readiness} />
        </>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted">
            {profile.createdAt
              ? 'Finish setting up your profile to start autofilling.'
              : 'Set up your profile once, then fill applications in one click.'}
          </p>
          <Button className="w-full" onClick={() => openProfile()}>
            {profile.createdAt ? 'Continue setup' : 'Create profile'}
          </Button>
        </>
      )}

      <p className="mt-4 flex items-center gap-1.5 border-t border-line pt-3 text-xs text-muted">
        <LockIcon className="h-3.5 w-3.5 shrink-0 text-ok" />
        <span className="flex-1">{PRIVACY_MESSAGE}</span>
        <button
          type="button"
          className="shrink-0 font-medium text-accent hover:underline"
          onClick={() => openProfile('#/privacy')}
        >
          Privacy
        </button>
      </p>
    </>
  );
}

/** "18 fields detected · 12 ready to fill" — from the page's structure, matched here. */
function PageStatus({ readiness }: { readiness: Readiness }) {
  if (readiness.state === 'checking')
    return (
      <p className="mt-3 flex items-center gap-2 text-xs text-muted" aria-live="polite">
        <span
          aria-hidden="true"
          className="h-3 w-3 animate-spin rounded-full border-2 border-line-strong border-r-transparent"
        />
        Looking for form fields…
      </p>
    );
  if (readiness.state === 'unavailable')
    return <p className="mt-3 text-xs text-muted">No form JobFill can read on this page.</p>;
  if (readiness.detected === 0)
    return <p className="mt-3 text-xs text-muted">No form fields detected on this page yet.</p>;
  const stats = [
    { label: 'Ready', value: readiness.fillable, icon: '✓', tone: 'text-ok' },
    { label: 'Need review', value: readiness.review, icon: '⚠', tone: 'text-warn' },
    { label: 'Not available', value: readiness.unavailable, icon: '○', tone: 'text-muted' },
  ];
  return (
    <div className="mt-3 animate-fade" aria-live="polite">
      <p className="text-xs font-medium text-body">
        JobFill found {readiness.detected} {readiness.detected === 1 ? 'field' : 'fields'}
      </p>
      <dl className="mt-1.5 grid grid-cols-3 gap-1.5 text-center">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col-reverse rounded-md bg-subtle px-1 py-1.5">
            <dt className="text-[10px] leading-tight text-muted">{s.label}</dt>
            <dd className={`text-sm font-semibold tabular-nums ${s.tone}`}>
              <span aria-hidden="true">{s.icon} </span>
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
