import { useEffect, useState } from 'react';
import type { AISettings } from '@jobfill/ai';
import { STORAGE_KEYS, formatBytes } from '@jobfill/shared';
import { Logo } from '@/components/Logo';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ArrowLeftIcon, LockIcon, ShieldCheckIcon, TrashIcon } from '@/components/ui/icons';
import { useProfile } from '@/profile/profile-context';
import { getBytesInUse } from '@/storage';
import { clearAISettings, loadAISettings } from '@/storage/ai-settings';
import { DeleteAllDataButton } from '../data/DangerZone';
import { ExportProfileButton } from '../data/ExportProfileButton';
import { ImportProfileButton } from '../data/ImportProfileButton';
import type { Route } from '../router';
import {
  NOT_STORED,
  STORED_ITEMS,
  aiConfigured,
  availableProviders,
  dataFlows,
} from './data-flows';

interface PrivacyState {
  ai: AISettings;
  usage: { total: number; byKey: Record<string, number> };
}

async function readPrivacyState(): Promise<PrivacyState> {
  const [ai, total, ...sizes] = await Promise.all([
    loadAISettings(),
    getBytesInUse(),
    ...STORED_ITEMS.map((item) => getBytesInUse(item.key)),
  ]);
  return {
    ai,
    usage: {
      total,
      byKey: Object.fromEntries(STORED_ITEMS.map((item, i) => [item.key, sizes[i] ?? 0])),
    },
  };
}

/**
 * Privacy settings: what JobFill keeps on this device, what can leave it (why, to whom,
 * when), and the controls to export, import and delete. Every statement is derived
 * from the live configuration (see data-flows.ts).
 */
export function PrivacyPage({ navigate }: { navigate: (route: Route) => void }) {
  const { profile } = useProfile();
  const [state, setState] = useState<PrivacyState | null>(null);
  const [aiCleared, setAICleared] = useState(false);

  useEffect(() => {
    void readPrivacyState().then(setState);
  }, [profile]);

  if (!state) return null;
  const { ai, usage } = state;
  const flows = dataFlows(ai);
  const hasAISettings = ai.enabled || ai.apiKey !== '' || (usage.byKey[STORAGE_KEYS.ai] ?? 0) > 0;

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <Logo />
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeftIcon />}
            onClick={() =>
              navigate(
                profile.onboardingCompletedAt
                  ? { name: 'profile' }
                  : { name: 'onboarding', step: 'welcome' },
              )
            }
          >
            Back
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Privacy settings</h1>
          <p className="mt-1 text-slate-600">
            JobFill is local-first: your data stays in this browser unless you use a feature that
            sends it somewhere — and then only what that feature needs.
          </p>
        </div>

        <Card title="What stays on your device" icon={<LockIcon />}>
          <p className="text-sm text-slate-600">
            Stored in this browser’s extension storage for JobFill only. Websites can’t read it, and
            JobFill has no servers or accounts to copy it to.
          </p>
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {STORED_ITEMS.map((item) => {
              const bytes = usage.byKey[item.key] ?? 0;
              return (
                <li key={item.key} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-500">
                    {bytes > 0 ? formatBytes(bytes) : 'Not stored'}
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-slate-500">
            Total: {formatBytes(usage.total)} of local extension storage.
          </p>
          <p className="mt-4 text-sm font-medium text-slate-900">Not kept at all</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-600">
            {NOT_STORED.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-slate-500">
            Resume import reads your PDF or Word file inside this page on your computer — the file
            is not uploaded to extract your details.
          </p>
        </Card>

        <Card title="What may leave your device" icon={<ShieldCheckIcon />}>
          <p className="text-sm text-slate-600">
            These are the only ways data leaves JobFill. Each one happens only when you click the
            button for it.
          </p>
          <div className="mt-4 space-y-4">
            {flows.map((flow) => (
              <section
                key={flow.id}
                aria-label={flow.feature}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-900">{flow.feature}</h3>
                  <span
                    className={
                      flow.active
                        ? 'rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200'
                        : 'rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600'
                    }
                  >
                    {flow.active ? 'Available' : 'Off'}
                  </span>
                </div>
                <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
                  <dt className="font-medium text-slate-500">What is sent</dt>
                  <dd className="text-slate-700">{flow.what}</dd>
                  <dt className="font-medium text-slate-500">Why it is sent</dt>
                  <dd className="text-slate-700">{flow.why}</dd>
                  <dt className="font-medium text-slate-500">Who receives it</dt>
                  <dd className="text-slate-700">{flow.who}</dd>
                  <dt className="font-medium text-slate-500">When</dt>
                  <dd className="text-slate-700">{flow.when}</dd>
                </dl>
                {flow.id === 'ai' && flow.active && !aiConfigured(ai) && (
                  <p className="mt-2 text-xs text-slate-500">
                    AI answers are on but not fully set up, so nothing can be sent yet.
                  </p>
                )}
              </section>
            ))}
          </div>
          <Alert tone="info" className="mt-4">
            <p className="text-xs">
              JobFill has no analytics, telemetry, crash reporting or advertising, and makes no
              network requests of its own. The only requests it makes are the AI requests above, to
              the provider you choose ({availableProviders().join(', ')}). Chrome itself may still
              check for extension updates.
            </p>
          </Alert>
        </Card>

        <Card title="Your data controls" icon={<ShieldCheckIcon />}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Export profile</p>
              <p className="text-xs text-slate-500">
                Download a copy to back it up or move it to another browser.
              </p>
              <ExportProfileButton />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Import profile</p>
              <p className="text-xs text-slate-500">
                Replace this profile with a JobFill export. You’ll see what’s in it first.
              </p>
              <ImportProfileButton completeOnboarding buttonProps={{ className: 'w-full' }} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">AI history</p>
              <p className="text-xs text-slate-500">
                JobFill doesn’t keep any AI history — prompts and generated answers are discarded
                when the popup closes, so there’s nothing to clear. Your AI provider may keep its
                own records under its policy.
              </p>
              {hasAISettings ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() =>
                    void clearAISettings()
                      .then(readPrivacyState)
                      .then(setState)
                      .then(() => setAICleared(true))
                  }
                >
                  Turn off AI and forget API key
                </Button>
              ) : (
                <p className="text-xs text-emerald-700">
                  {aiCleared ? 'AI settings and API key removed.' : 'No AI settings are stored.'}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-900">Delete all local data</p>
              <p className="text-xs text-slate-500">
                Erase your profile, resume, settings and API key from this device. There’s no server
                copy, so export first if you want a backup.
              </p>
              <DeleteAllDataButton
                onDone={() => navigate({ name: 'onboarding', step: 'welcome', notice: 'deleted' })}
                buttonProps={{ className: 'w-full', icon: <TrashIcon /> }}
              />
            </div>
          </div>
        </Card>

        <Card title="Permissions JobFill uses">
          <ul className="space-y-3 text-sm text-slate-600">
            <li>
              <span className="font-medium text-slate-900">Storage</span> — to save your profile in
              this browser.
            </li>
            <li>
              <span className="font-medium text-slate-900">
                Read and change data on the websites you visit
              </span>{' '}
              — application forms live on thousands of different sites, so JobFill’s form reader
              runs on web pages. It reads form fields and their labels (and the job posting’s text
              when you ask for an AI answer), sends nothing on its own, and writes to a page only
              when you click Autofill or Insert Answer.
            </li>
            <li>
              JobFill asks for nothing else: no browsing history, tabs, cookies, downloads or
              identity access, and no special access to AI providers’ sites.
            </li>
          </ul>
        </Card>
      </main>
    </div>
  );
}
