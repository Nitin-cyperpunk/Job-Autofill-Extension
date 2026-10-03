import { CompletenessBar } from '@/components/CompletenessMeter';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon, CheckIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';

const HOW_TO = [
  'Open a job application form in any tab.',
  'Click the JobFill icon in your toolbar (pin it from the puzzle-piece menu for one-click access).',
  'Press “Autofill this page” and review the answers before you submit.',
];

export function CompleteStep({ onViewProfile }: { onViewProfile: () => void }) {
  const { profile, completeness } = useProfile();
  const name = profile.personal.preferredName || profile.personal.firstName;

  return (
    <div className="mx-auto max-w-xl py-6 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ok-soft text-ok">
        <CheckIcon className="h-8 w-8" />
      </span>
      <h1 className="mt-6 text-3xl font-bold tracking-tight text-fg">
        You’re all set{name ? `, ${name}` : ''}!
      </h1>
      <p className="mt-3 text-muted">Your profile is saved and ready to fill applications.</p>

      <div className="mt-8 rounded-xl border border-line bg-surface p-5 text-left shadow-card">
        <CompletenessBar percent={completeness.percent} />
        {completeness.percent < 100 && (
          <p className="mt-2 text-xs text-muted">
            A more complete profile fills more fields. You can add details any time.
          </p>
        )}
        {completeness.optional.some((o) => !o.provided) && (
          <p className="mt-2 text-xs text-muted">
            Optional, not provided:{' '}
            {completeness.optional
              .filter((o) => !o.provided)
              .map((o) => o.label)
              .join(', ')}
            . Forms that ask for these are left for you to answer.
          </p>
        )}
      </div>

      <ol className="mt-8 space-y-3 text-left">
        {HOW_TO.map((text, i) => (
          <li key={text} className="flex gap-3 text-sm text-body">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
              {i + 1}
            </span>
            {text}
          </li>
        ))}
      </ol>

      <Button size="lg" className="mt-10" icon={<ArrowRightIcon />} onClick={onViewProfile}>
        View my profile
      </Button>
      <PrivacyNotice className="mt-10 text-left" />
    </div>
  );
}
