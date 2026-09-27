import { Logo } from '@/components/Logo';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, CheckIcon, LockIcon, PencilIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';

const FEATURES = [
  {
    icon: <PencilIcon className="h-5 w-5" />,
    title: 'Fill it in once',
    text: 'Your details, education, experience, skills, links and resume — in one place.',
  },
  {
    icon: <CheckIcon className="h-5 w-5" />,
    title: 'Autofill in seconds',
    text: 'On any application form, click the JobFill icon and let it fill the fields for you.',
  },
  {
    icon: <LockIcon className="h-5 w-5" />,
    title: 'Private by design',
    text: 'No account and no JobFill servers — your data stays on this device unless you turn on optional AI. Export or delete it whenever you like.',
  },
];

export function WelcomeStep({
  notice,
  onStart,
  onContinue,
}: {
  notice?: 'deleted' | 'reset';
  onStart: () => void;
  onContinue: () => void;
}) {
  const { profile } = useProfile();
  const inProgress = profile.createdAt !== null;

  return (
    <div className="mx-auto max-w-2xl py-6 text-center">
      {notice && (
        <Alert tone="success" className="mb-8 text-left">
          {notice === 'deleted'
            ? 'All JobFill data has been deleted from this device.'
            : 'Your profile has been reset.'}
        </Alert>
      )}
      <div className="flex justify-center">
        <Logo />
      </div>
      <h1 className="mt-8 text-4xl font-bold tracking-tight text-balance text-slate-900">
        Save your information once. Autofill job applications in seconds.
      </h1>
      <p className="mt-4 text-lg text-slate-600">
        Set up your profile in about five minutes. You can skip anything and come back later.
      </p>

      <ul className="mt-10 grid gap-4 text-left sm:grid-cols-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              {f.icon}
            </span>
            <p className="mt-3 font-semibold text-slate-900">{f.title}</p>
            <p className="mt-1 text-sm text-slate-600">{f.text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {inProgress ? (
          <>
            <Button size="lg" onClick={onContinue} icon={<ArrowRightIcon />}>
              Continue where you left off
            </Button>
            <Button size="lg" variant="secondary" onClick={onStart}>
              Start over options
            </Button>
          </>
        ) : (
          <Button size="lg" onClick={onStart} icon={<ArrowRightIcon />}>
            Get started
          </Button>
        )}
      </div>

      <PrivacyNotice className="mt-10 text-left" />
    </div>
  );
}
