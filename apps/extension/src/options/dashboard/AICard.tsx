import { useEffect, useState } from 'react';
import { PROVIDERS, type AISettings, type ProviderId } from '@jobfill/ai';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CheckboxField, SelectField, TextField } from '@/components/ui/Field';
import { clearAISettings, loadAISettings, saveAISettings } from '@/storage/ai-settings';

const PROVIDER_OPTIONS = (Object.keys(PROVIDERS) as ProviderId[])
  .filter((id) => PROVIDERS[id].available)
  .map((id) => ({ value: id, label: PROVIDERS[id].label }));

/** Optional AI answers: off by default, bring-your-own-key, explained in plain words. */
export function AICard() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void loadAISettings().then(setSettings);
  }, []);

  if (!settings) return null;
  const meta = PROVIDERS[settings.provider];

  async function save(patch: Partial<AISettings>) {
    const next = await saveAISettings(patch);
    setSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card title="AI answers (optional)">
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Get draft answers for open questions like “Why do you want to work here?”. JobFill works
          fully without this.
        </p>
        <CheckboxField
          label="Enable AI-assisted answers"
          checked={settings.enabled}
          onChange={(enabled) => void save({ enabled })}
        />

        {settings.enabled && (
          <>
            <SelectField
              label="Provider"
              options={PROVIDER_OPTIONS}
              value={settings.provider}
              onChange={(provider) =>
                provider &&
                void save({
                  provider,
                  model: PROVIDERS[provider].defaultModel,
                  apiKey: '',
                  baseUrl: '',
                })
              }
            />
            {meta.needsUrl && (
              <TextField
                label="Endpoint URL"
                placeholder="https://your-endpoint/v1"
                hint="Any OpenAI-compatible Chat Completions API (e.g. a local model server)."
                value={settings.baseUrl}
                onChange={(baseUrl) => setSettings({ ...settings, baseUrl })}
                onBlur={() => void save({ baseUrl: settings.baseUrl.trim() })}
              />
            )}
            <TextField
              label="Model"
              value={settings.model}
              onChange={(model) => setSettings({ ...settings, model })}
              onBlur={() => void save({ model: settings.model.trim() })}
            />
            <div className="space-y-2">
              <TextField
                label={`${meta.label} API key${meta.needsKey ? '' : ' (if required)'}`}
                type="password"
                autoComplete="off"
                placeholder={settings.apiKey ? '•••••••••••• saved' : 'Paste your API key'}
                hint="Your own key. Stored only in this browser — never in JobFill’s code, never on a JobFill server."
                value={keyInput}
                onChange={setKeyInput}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={!keyInput.trim()}
                  onClick={() => {
                    void save({ apiKey: keyInput.trim() });
                    setKeyInput('');
                  }}
                >
                  Save key
                </Button>
                {settings.apiKey && (
                  <Button
                    size="sm"
                    variant="danger-ghost"
                    onClick={() => void save({ apiKey: '' })}
                  >
                    Remove key
                  </Button>
                )}
                {saved && <span className="self-center text-xs text-ok">Saved</span>}
              </div>
            </div>
          </>
        )}

        <Alert tone="info">
          <p className="font-medium">How your data is handled</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs">
            <li>Nothing is sent unless you click “Generate Answer” for a specific question.</li>
            <li>
              Before sending, JobFill shows exactly what will be used (e.g. job title, job
              description, relevant skills and experience) — you can untick anything.
            </li>
            <li>
              Never sent: your name, contact details, address, links, salary, work authorization,
              demographic answers or resume file.
            </li>
            <li>
              Requests go directly from your browser to the provider you choose; its own privacy
              policy and data retention apply.
            </li>
          </ul>
        </Alert>

        {(settings.enabled || settings.apiKey) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              void clearAISettings().then(loadAISettings).then(setSettings);
            }}
          >
            Turn off and forget AI settings
          </Button>
        )}
      </div>
    </Card>
  );
}
