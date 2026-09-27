import { useEffect, useState, type ReactNode } from 'react';
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
  title,
  lead,
  editLabel = 'Edit',
}: {
  id: SectionId;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
  /** Override the section title (e.g. to group it with related content). */
  title?: ReactNode;
  /** Content shown above the summary / editor, e.g. the resume file panel. */
  lead?: ReactNode;
  editLabel?: string;
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
        title={title ?? def.title}
        description={editing ? def.description : undefined}
        icon={def.icon}
        actions={
          editing ? null : (
            <>
              {justSaved && (
                <span
                  role="status"
                  className="flex animate-fade items-center gap-1 text-xs font-medium text-ok"
                >
                  <CheckIcon className="h-3.5 w-3.5 animate-pop" /> Saved
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                icon={<PencilIcon />}
                onClick={() => onEditingChange(true)}
              >
                {editLabel}
              </Button>
            </>
          )
        }
      >
        {lead}
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
          <div className="animate-fade">
            <SectionSummary id={id} />
          </div>
        )}
      </Card>
    </div>
  );
}
