import { useState } from 'react';
import type { CompletenessArea } from '@jobfill/shared';
import { validateSection } from '@jobfill/shared';
import { CompletenessMeter } from '@/components/CompletenessMeter';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeftIcon, CheckIcon, FileTextIcon, PencilIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';
import { ResumeSummary } from '../sections/ResumeSummary';
import { SectionSummary } from '../sections/SectionSummary';
import { SECTIONS, SECTION_ORDER } from '../sections/registry';
import type { StepId } from '../router';

export function ReviewStep({
  onEdit,
  onBack,
  onFinish,
}: {
  onEdit: (step: StepId) => void;
  onBack: () => void;
  onFinish: () => Promise<void>;
}) {
  const { profile, completeness } = useProfile();
  const [finishing, setFinishing] = useState(false);
  const personalReady = Object.keys(validateSection('personal', profile.personal)).length === 0;

  async function finish() {
    setFinishing(true);
    try {
      await onFinish();
    } finally {
      setFinishing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">Review your profile</h1>
        <p className="mt-1 text-muted">
          Check everything looks right. You can edit any section later.
        </p>
      </div>

      <Card>
        <CompletenessMeter
          completeness={completeness}
          onSelect={(area: CompletenessArea) => onEdit(area)}
        />
      </Card>

      {SECTION_ORDER.map((id) => {
        const def = SECTIONS[id];
        return (
          <Card
            key={id}
            title={def.title}
            icon={def.icon}
            actions={
              <Button variant="ghost" size="sm" icon={<PencilIcon />} onClick={() => onEdit(id)}>
                Edit
              </Button>
            }
          >
            <SectionSummary id={id} />
          </Card>
        );
      })}

      <Card
        title="Resume"
        icon={<FileTextIcon />}
        actions={
          <Button variant="ghost" size="sm" icon={<PencilIcon />} onClick={() => onEdit('resume')}>
            Edit
          </Button>
        }
      >
        <ResumeSummary />
      </Card>

      {!personalReady && (
        <Alert tone="error">
          Add your first name, last name and a valid email to finish setup.
        </Alert>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-line pt-6">
        <Button variant="ghost" icon={<ArrowLeftIcon />} onClick={onBack}>
          Back
        </Button>
        <div className="flex-1" />
        {!personalReady && (
          <Button variant="secondary" onClick={() => onEdit('personal')}>
            Complete personal info
          </Button>
        )}
        <Button
          size="lg"
          icon={<CheckIcon />}
          loading={finishing}
          disabled={!personalReady}
          onClick={finish}
        >
          Finish setup
        </Button>
      </div>
    </div>
  );
}
