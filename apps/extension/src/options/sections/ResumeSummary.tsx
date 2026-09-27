import { formatBytes } from '@jobfill/shared';
import { FileTextIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';
import { NotProvided } from './summary-ui';

export function ResumeSummary() {
  const { profile } = useProfile();
  const resume = profile.resume;
  if (!resume) return <NotProvided>No resume uploaded yet.</NotProvided>;
  return (
    <p className="flex items-center gap-2 text-sm text-slate-900">
      <FileTextIcon className="h-4 w-4 text-slate-400" />
      <span className="truncate font-medium">{resume.fileName}</span>
      <span className="text-slate-500">· {formatBytes(resume.sizeBytes)}</span>
    </p>
  );
}
