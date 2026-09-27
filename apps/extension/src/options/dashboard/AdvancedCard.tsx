import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { CheckboxField } from '@/components/ui/Field';
import { loadSettings, saveSettings } from '@/storage';

/** Developer / troubleshooting options. */
export function AdvancedCard() {
  const [debugMode, setDebugMode] = useState<boolean | null>(null);

  useEffect(() => {
    void loadSettings().then((s) => setDebugMode(s.debugMode));
  }, []);

  if (debugMode === null) return null;
  return (
    <Card title="Advanced">
      <CheckboxField
        label="Debug mode"
        description="Show detected, mapped and unmapped fields — with confidence and the reason for each mapping — in the popup, plus an in-page overlay. Nothing leaves your device."
        checked={debugMode}
        onChange={(next) => {
          setDebugMode(next);
          void saveSettings({ debugMode: next });
        }}
      />
    </Card>
  );
}
