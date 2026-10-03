import type { SectionId } from '@jobfill/types';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
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
import { DetailsStep } from './DetailsStep';
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
  const { completeOnboarding } = useProfile();
  const { step, returnTo } = route;
  /** Links are edited inside the Resume & Professional Links step during onboarding. */
  const stepFor = (to: StepId): StepId => (to === 'links' ? 'resume' : to);
  const go = (to: StepId) => navigate({ name: 'onboarding', step: stepFor(to) });
  /**
   * After saving a step: back to review when editing from there; after a résumé import,
   * on to the details a résumé doesn't contain; otherwise onwards.
   */
  const advance = () => go(returnTo ?? nextStep(step));
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
        onScratch={() => go('resume')}
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
          <p className="mb-3 text-sm font-medium text-accent">
            {step === 'details'
              ? 'Almost done'
              : `Step ${FORM_STEPS.indexOf(step) + 1} of ${FORM_STEPS.length}`}
          </p>
          {step === 'details' ? (
            <DetailsStep onDone={() => go('review')} onBack={() => go('resume')} />
          ) : step === 'review' ? (
            <ReviewStep
              onEdit={(to) =>
                navigate({ name: 'onboarding', step: stepFor(to), returnTo: 'review' })
              }
              onBack={back}
              onFinish={async () => {
                await completeOnboarding();
                go('complete');
              }}
            />
          ) : step === 'resume' ? (
            <Card
              headingLevel={1}
              title="Resume & Professional Links"
              icon={<FileTextIcon />}
              description="Upload the resume you send with applications — JobFill attaches it to resume upload fields when it fills a form. It’s saved only on this device."
            >
              <ResumePanel />
              <div className="mt-8 border-t border-line pt-6">
                <h2 className="text-base font-semibold text-fg">Professional links</h2>
                <p className="mt-1 mb-4 text-sm text-muted">
                  Resume drive link, LinkedIn, portfolio, GitHub and X — all optional. JobFill fills
                  these into the matching fields on application forms.
                </p>
                <SectionEditor
                  id="links"
                  onSaved={advance}
                  actions={({ saving }) => (
                    <>
                      <Button variant="ghost" icon={<ArrowLeftIcon />} onClick={back}>
                        Back
                      </Button>
                      <div className="flex-1" />
                      {returnTo !== 'review' && (
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
              </div>
            </Card>
          ) : isSectionStep(step) ? (
            <Card
              headingLevel={1}
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
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Logo />
          <div className="flex items-center gap-3">
            <PrivacyNotice variant="badge" className="hidden sm:inline-flex" />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{content}</main>
      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-6 text-xs text-muted">
        <span>Everything you enter stays in this browser’s local extension storage.</span>
        <DeleteAllDataButton
          onDone={() => navigate({ name: 'onboarding', step: 'welcome', notice: 'deleted' })}
          buttonProps={{ variant: 'danger-ghost', size: 'sm' }}
        />
      </footer>
    </div>
  );
}
