import { useEffect } from 'react';
import { ProfileProvider } from '@/profile/ProfileProvider';
import { useProfile } from '@/profile/profile-context';
import { Dashboard } from './dashboard/Dashboard';
import { OnboardingFlow } from './onboarding/OnboardingFlow';
import { useHashRoute } from './router';

export function OptionsPage() {
  return (
    <ProfileProvider fallback={<p className="p-10 text-sm text-slate-500">Loading…</p>}>
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
  return <OnboardingFlow route={route} navigate={navigate} />;
}
