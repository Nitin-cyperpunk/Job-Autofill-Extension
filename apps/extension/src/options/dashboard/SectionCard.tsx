import { useEffect, useState } from 'react';
import type { SectionId } from '@jobfill/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckIcon, PencilIcon } from '@/components/ui/icons';
import { SectionEditor } from '../sections/SectionEditor';
import { SectionSummary } from '../sections/SectionSummary';
import { SECTIONS } from '../sections/registry';

/** A profile section on the dashboard: read-only summary, or inline editor with Save / Cancel. */
export function SectionCard({
  id,
  editing,
  onEditingChange,
}: {
  id: SectionId;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}) {
  const def = SECTIONS[id];
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 2500);
    return () => clearTimeout(t);
  }, [justSaved]);

  return (
    <div id={`section-${id}`} className="scroll-mt-6">
      <Card
        title={def.title}
        description={editing ? def.description : undefined}
        icon={def.icon}
        actions={
          editing ? null : (
            <>
              {justSaved && (
                <span
                  role="status"
                  className="flex items-center gap-1 text-xs font-medium text-emerald-700"
                >
                  <CheckIcon className="h-3.5 w-3.5" /> Saved
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                icon={<PencilIcon />}
                onClick={() => onEditingChange(true)}
              >
                Edit
              </Button>
            </>
          )
        }
      >
        {editing ? (
          <SectionEditor
            id={id}
            onSaved={() => {
              onEditingChange(false);
              setJustSaved(true);
            }}
            actions={({ saving }) => (
              <>
                <div className="flex-1" />
                <Button variant="ghost" onClick={() => onEditingChange(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save
                </Button>
              </>
            )}
          />
        ) : (
          <SectionSummary id={id} />
        )}
      </Card>
    </div>
  );
}
