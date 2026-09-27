import { useEffect, useState } from 'react';
import type { SectionId } from '@jobfill/types';
import { formatBytes, fullName, type CompletenessArea } from '@jobfill/shared';
import { CompletenessMeter } from '@/components/CompletenessMeter';
import { Logo } from '@/components/Logo';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { Card } from '@/components/ui/Card';
import { FileTextIcon, ShieldCheckIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';
import { getBytesInUse } from '@/storage';
import { DeleteAllDataButton, ResetProfileButton } from '../data/DangerZone';
import { ExportProfileButton } from '../data/ExportProfileButton';
import { ImportProfileButton } from '../data/ImportProfileButton';
import { ResumePanel } from '../sections/ResumePanel';
import { SECTION_ORDER } from '../sections/registry';
import type { Route } from '../router';
import { SectionCard } from './SectionCard';

export function Dashboard({ navigate }: { navigate: (route: Route) => void }) {
  const { profile, completeness } = useProfile();
  const [editing, setEditing] = useState<Set<SectionId>>(new Set());
  const [bytesInUse, setBytesInUse] = useState<number | null>(null);
  const name = fullName(profile.personal);

  useEffect(() => {
    void getBytesInUse().then(setBytesInUse);
  }, [profile]);

  function setSectionEditing(id: SectionId, on: boolean) {
    setEditing((prev) => {
      const next = new Set(prev);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function jumpTo(area: CompletenessArea) {
    if (area !== 'resume') setSectionEditing(area, true);
    document.getElementById(`section-${area}`)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Logo />
          <PrivacyNotice variant="badge" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {name || 'Your profile'}
          </h1>
          <p className="mt-1 text-slate-600">
            {profile.professional.currentTitle ||
              'Keep your details up to date so every application fills correctly.'}
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_20rem]">
          <div className="min-w-0 space-y-6">
            {SECTION_ORDER.map((id) => (
              <SectionCard
                key={id}
                id={id}
                editing={editing.has(id)}
                onEditingChange={(on) => setSectionEditing(id, on)}
              />
            ))}
            <div id="section-resume" className="scroll-mt-6">
              <Card title="Resume" icon={<FileTextIcon />}>
                <ResumePanel />
              </Card>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-6">
            <Card>
              <CompletenessMeter completeness={completeness} onSelect={jumpTo} />
            </Card>

            <Card title="Your data" icon={<ShieldCheckIcon />}>
              <p className="text-sm text-slate-600">
                Your profile is stored locally on this device. Back it up or move it to another
                browser with export and import.
              </p>
              {bytesInUse !== null && (
                <p className="mt-2 text-xs text-slate-500">
                  Using {formatBytes(bytesInUse)} of local extension storage.
                </p>
              )}
              <div className="mt-4 space-y-3">
                <ExportProfileButton />
                <ImportProfileButton completeOnboarding buttonProps={{ className: 'w-full' }} />
              </div>

              <div className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Danger zone
                </p>
                <ResetProfileButton
                  onDone={() => navigate({ name: 'onboarding', step: 'welcome', notice: 'reset' })}
                  buttonProps={{ className: 'w-full' }}
                />
                <DeleteAllDataButton
                  onDone={() =>
                    navigate({ name: 'onboarding', step: 'welcome', notice: 'deleted' })
                  }
                  buttonProps={{ className: 'w-full' }}
                />
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}
