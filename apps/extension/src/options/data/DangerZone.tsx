import { useState } from 'react';
import { Button, type ButtonProps } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RotateCcwIcon, TrashIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';

/** Clears the profile + resume and restarts onboarding. */
export function ResetProfileButton({
  onDone,
  buttonProps,
}: {
  onDone: () => void;
  buttonProps?: ButtonProps;
}) {
  const { resetProfile } = useProfile();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="secondary"
        icon={<RotateCcwIcon />}
        onClick={() => setOpen(true)}
        {...buttonProps}
      >
        Reset profile
      </Button>
      <ConfirmDialog
        open={open}
        title="Reset your profile?"
        description="All profile fields and your resume will be cleared, and setup will start again. Export a backup first if you might want it back."
        confirmLabel="Reset profile"
        tone="danger"
        onConfirm={async () => {
          await resetProfile();
          onDone();
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

/** Erases everything JobFill stores on this device. Requires typing DELETE. */
export function DeleteAllDataButton({
  onDone,
  buttonProps,
}: {
  onDone: () => void;
  buttonProps?: ButtonProps;
}) {
  const { deleteAllData } = useProfile();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" icon={<TrashIcon />} onClick={() => setOpen(true)} {...buttonProps}>
        Delete all local data
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete all JobFill data on this device?"
        description={
          <>
            This permanently erases your profile, resume, settings and any AI settings (including
            your API key) from this device. Because nothing is stored on a server,{' '}
            <strong>this can’t be undone</strong> unless you have an exported backup.
          </>
        }
        confirmLabel="Delete everything"
        tone="danger"
        requireText="DELETE"
        onConfirm={async () => {
          await deleteAllData();
          onDone();
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
