import { useEffect } from 'react';
import { ProfileProvider } from '@/profile/ProfileProvider';
import { useProfile } from '@/profile/profile-context';
import { Dashboard } from './dashboard/Dashboard';
import { OnboardingFlow } from './onboarding/OnboardingFlow';
import { PrivacyPage } from './privacy/PrivacyPage';
import { ResumeImportFlow } from './resume-import/ResumeImportFlow';
import { useHashRoute } from './router';

export function OptionsPage() {
  return (
    <ProfileProvider fallback={<p className="p-10 text-sm text-muted">Loading…</p>}>
      <OptionsRoutes />
    </ProfileProvider>
  );
}

function OptionsRoutes() {
  const { profile } = useProfile();
  const [route, navigate] = useHashRoute();

  // No (or unknown) hash: send finished users to their profile, everyone else to onboarding.
  useEffect(() => {
    if (route) return;
    navigate(
      profile.onboardingCompletedAt ? { name: 'profile' } : { name: 'onboarding', step: 'welcome' },
      { replace: true },
    );
  }, [route, profile.onboardingCompletedAt, navigate]);

  if (!route) return null;
  if (route.name === 'profile') return <Dashboard navigate={navigate} />;
  if (route.name === 'privacy') return <PrivacyPage navigate={navigate} />;
  if (route.name === 'resume-import') {
    // After saving: onboarding confirms Resume & Professional Links (links are often only
    // hyperlinked on the resume), then Review; the dashboard shows the result.
    const back =
      route.from === 'onboarding'
        ? ({ name: 'onboarding', step: 'start' } as const)
        : ({ name: 'profile' } as const);
    const done =
      route.from === 'onboarding'
        ? ({ name: 'onboarding', step: 'resume', returnTo: 'review' } as const)
        : ({ name: 'profile' } as const);
    return (
      <main className="min-h-screen animate-enter px-6 py-10">
        <ResumeImportFlow onDone={() => navigate(done)} onCancel={() => navigate(back)} />
      </main>
    );
  }
  return <OnboardingFlow route={route} navigate={navigate} />;
}
