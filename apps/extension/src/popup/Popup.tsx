import { fullName } from '@jobfill/shared';
import { CompletenessBar } from '@/components/CompletenessMeter';
import { Logo } from '@/components/Logo';
import { PRIVACY_MESSAGE } from '@/components/PrivacyNotice';
import { Button } from '@/components/ui/Button';
import { LockIcon } from '@/components/ui/icons';
import { ProfileProvider } from '@/profile/ProfileProvider';
import { useProfile } from '@/profile/profile-context';
import { DEBUG } from '@/utils/env';
import { AutofillPanel } from './AutofillPanel';
import { DebugPanel } from './DebugPanel';

export function Popup() {
  return (
    <main className="w-96 p-4">
      <ProfileProvider fallback={<p className="text-sm text-slate-500">Loading…</p>}>
        <PopupContent />
      </ProfileProvider>
      {DEBUG && <DebugPanel />}
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

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <Logo size="sm" />
        {ready && (
          <Button variant="ghost" size="sm" onClick={() => openProfile('#/profile')}>
            Edit profile
          </Button>
        )}
      </header>

      {ready ? (
        <>
          <p className="mb-3 text-sm text-slate-600">Profile ready{name ? ` for ${name}` : ''}.</p>
          <div className="mb-4">
            <CompletenessBar percent={completeness.percent} compact />
          </div>
          <AutofillPanel />
        </>
      ) : (
        <>
          <p className="mb-4 text-sm text-slate-600">
            {profile.createdAt
              ? 'Finish setting up your profile to start autofilling.'
              : 'Set up your profile once, then fill applications in one click.'}
          </p>
          <Button className="w-full" onClick={() => openProfile()}>
            {profile.createdAt ? 'Continue setup' : 'Create profile'}
          </Button>
        </>
      )}

      <p className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
        <LockIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
        {PRIVACY_MESSAGE}
      </p>
    </>
  );
}
