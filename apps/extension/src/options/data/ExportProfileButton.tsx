import { useState } from 'react';
import { buildExportFile, exportFileName } from '@jobfill/shared';
import { Button } from '@/components/ui/Button';
import { CheckboxField } from '@/components/ui/Field';
import { DownloadIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';
import { loadResume } from '@/storage';
import { downloadBlob } from '@/utils/file';

/** Saves a JSON backup to the user's Downloads folder. Nothing leaves the device otherwise. */
export function ExportProfileButton() {
  const { profile } = useProfile();
  const [includeResume, setIncludeResume] = useState(true);
  const [busy, setBusy] = useState(false);

  async function exportProfile() {
    setBusy(true);
    try {
      const resume = includeResume && profile.resume ? await loadResume() : null;
      const file = buildExportFile(profile, resume);
      const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
      downloadBlob(blob, exportFileName());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      {profile.resume && (
        <CheckboxField
          label="Include resume file"
          checked={includeResume}
          onChange={setIncludeResume}
        />
      )}
      <Button
        variant="secondary"
        icon={<DownloadIcon />}
        loading={busy}
        onClick={exportProfile}
        className="w-full"
      >
        Export profile
      </Button>
    </div>
  );
}
