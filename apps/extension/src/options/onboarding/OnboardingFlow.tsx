import type { SectionId } from '@jobfill/types';
import { Logo } from '@/components/Logo';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeftIcon, ArrowRightIcon, FileTextIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';
import { DeleteAllDataButton } from '../data/DangerZone';
import { ResumePanel } from '../sections/ResumePanel';
import { SectionEditor } from '../sections/SectionEditor';
import { SECTIONS } from '../sections/registry';
import type { Route, StepId } from '../router';
import { StepSidebar } from './StepSidebar';
import { CompleteStep } from './CompleteStep';
import { ReviewStep } from './ReviewStep';
import { StartStep } from './StartStep';
import { WelcomeStep } from './WelcomeStep';
import { FORM_STEPS, nextStep, prevStep } from './steps';

type OnboardingRoute = Extract<Route, { name: 'onboarding' }>;

function isSectionStep(step: StepId): step is SectionId {
  return step in SECTIONS;
}

export function OnboardingFlow({
  route,
  navigate,
}: {
  route: OnboardingRoute;
  navigate: (route: Route) => void;
}) {
  const { profile, completeOnboarding } = useProfile();
  const { step, returnTo } = route;
  const go = (to: StepId) => navigate({ name: 'onboarding', step: to });
  /** After saving a step: back to review when editing from there, otherwise onwards. */
  const advance = () => go(returnTo === 'review' ? 'review' : nextStep(step));
  const back = () => go(returnTo === 'review' ? 'review' : prevStep(step));

  let content;
  if (step === 'welcome') {
    content = (
      <WelcomeStep
        notice={route.notice}
        onStart={() => go('start')}
        onContinue={() => go('review')}
      />
    );
  } else if (step === 'start') {
    content = (
      <StartStep
        onResume={() => navigate({ name: 'resume-import', from: 'onboarding' })}
        onScratch={() => go('personal')}
        onImported={() => go('review')}
        onBack={back}
      />
    );
  } else if (step === 'complete') {
    content = <CompleteStep onViewProfile={() => navigate({ name: 'profile' })} />;
  } else {
    content = (
      <div className="grid gap-8 lg:grid-cols-[15rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-8">
            <StepSidebar current={step} onSelect={go} />
          </div>
        </aside>
        <div className="min-w-0">
          <p className="mb-3 text-sm font-medium text-brand-600">
            Step {FORM_STEPS.indexOf(step) + 1} of {FORM_STEPS.length}
          </p>
          {step === 'review' ? (
            <ReviewStep
              onEdit={(to) => navigate({ name: 'onboarding', step: to, returnTo: 'review' })}
              onBack={back}
              onFinish={async () => {
                await completeOnboarding();
                go('complete');
              }}
            />
          ) : step === 'resume' ? (
            <Card
              title="Resume"
              icon={<FileTextIcon />}
              description="Upload the resume you send with applications. It’s saved only on this device."
            >
              <ResumePanel />
              <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5">
                <Button variant="ghost" icon={<ArrowLeftIcon />} onClick={back}>
                  Back
                </Button>
                <div className="flex-1" />
                <Button onClick={advance} variant={profile.resume ? 'primary' : 'secondary'}>
                  {profile.resume ? 'Continue' : 'Skip for now'}
                  {profile.resume && <ArrowRightIcon />}
                </Button>
              </div>
            </Card>
          ) : isSectionStep(step) ? (
            <Card
              title={SECTIONS[step].title}
              description={SECTIONS[step].description}
              icon={SECTIONS[step].icon}
            >
              <SectionEditor
                key={step}
                id={step}
                onSaved={advance}
                actions={({ saving }) => (
                  <>
                    <Button variant="ghost" icon={<ArrowLeftIcon />} onClick={back}>
                      Back
                    </Button>
                    <div className="flex-1" />
                    {SECTIONS[step].optional && returnTo !== 'review' && (
                      <Button variant="ghost" onClick={advance}>
                        Skip for now
                      </Button>
                    )}
                    <Button type="submit" loading={saving}>
                      {returnTo === 'review' ? 'Save & return to review' : 'Save & continue'}
                      {!saving && <ArrowRightIcon />}
                    </Button>
                  </>
                )}
              />
            </Card>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Logo />
          <PrivacyNotice variant="badge" className="hidden sm:inline-flex" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{content}</main>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-6 py-6 text-xs text-slate-500">
        <span>Everything you enter stays in this browser’s local extension storage.</span>
        <DeleteAllDataButton
          onDone={() => navigate({ name: 'onboarding', step: 'welcome', notice: 'deleted' })}
          buttonProps={{ variant: 'danger-ghost', size: 'sm' }}
        />
      </footer>
    </div>
  );
}
