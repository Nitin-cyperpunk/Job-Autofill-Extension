import { useState, type ReactNode } from 'react';
import type { SectionId } from '@jobfill/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeftIcon, ArrowRightIcon, BriefcaseIcon, UserIcon } from '@/components/ui/icons';
import { SectionEditor } from '../sections/SectionEditor';

/**
 * Resume import + manual details = a complete profile. A résumé never contains a street
 * address, PIN / postal code, date of birth or gender, and rarely availability or work
 * authorization — so after an import we ask for them here instead of jumping to Review
 * as if the résumé were the whole profile. Every field is optional and skippable.
 */
const PARTS: ReadonlyArray<{
  id: SectionId;
  title: string;
  description: string;
  icon: ReactNode;
  groups: readonly string[];
}> = [
  {
    id: 'personal',
    title: 'Contact, address & personal details',
    description:
      'Resumes rarely include your full address, and never your date of birth or gender. Add what you want JobFill to fill — anything left blank is left for you to answer on each form. JobFill never guesses these.',
    icon: <UserIcon />,
    groups: ['contact', 'current', 'permanent', 'details'],
  },
  {
    id: 'professional',
    title: 'Preferences, availability & work authorization',
    description:
      'Common application questions a resume doesn’t answer. All optional — skip anything you’d rather answer per job.',
    icon: <BriefcaseIcon />,
    groups: ['preferences', 'availability', 'authorization', 'compensation'],
  },
];

export function DetailsStep({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const part = PARTS[index]!;
  const last = index === PARTS.length - 1;
  const next = () => {
    if (last) onDone();
    else {
      setIndex(index + 1);
      window.scrollTo({ top: 0 });
    }
  };
  const back = () => (index === 0 ? onBack() : setIndex(index - 1));

  return (
    <Card headingLevel={1} title={part.title} description={part.description} icon={part.icon}>
      <p className="mb-5 text-xs text-muted">
        Part {index + 1} of {PARTS.length} · What your resume included is already saved. This is the
        part a resume doesn’t cover — all optional.
      </p>
      <SectionEditor
        key={part.id}
        id={part.id}
        groups={part.groups}
        onSaved={next}
        actions={({ saving }) => (
          <>
            <Button variant="ghost" icon={<ArrowLeftIcon />} onClick={back}>
              Back
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" onClick={next}>
              Skip for now
            </Button>
            <Button type="submit" loading={saving}>
              Save & continue
              {!saving && <ArrowRightIcon />}
            </Button>
          </>
        )}
      />
    </Card>
  );
}
