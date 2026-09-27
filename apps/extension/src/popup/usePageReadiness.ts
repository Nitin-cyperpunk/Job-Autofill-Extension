import { useEffect, useState } from 'react';
import { planFill } from '@jobfill/field-mapper';
import type { FieldDescriptor, Profile } from '@jobfill/types';
import { framesWithFields, sendToFrame } from '@/utils/frames';
import { targetTabId } from '@/utils/messaging';

export type Readiness =
  | { state: 'checking' }
  | { state: 'ready'; detected: number; fillable: number }
  | { state: 'unavailable' };

/**
 * "18 fields detected · 12 ready to fill" when the popup opens.
 *
 * Privacy: the page is only asked for its field structure (DETECT_FIELDS — labels and
 * types, no profile data). Matching against the profile happens here in the popup with
 * the same pure planner autofill uses, so opening the popup never sends profile values
 * into the page; they only reach it when the user clicks Autofill.
 */
export function usePageReadiness(profile: Profile, enabled: boolean): Readiness {
  const [readiness, setReadiness] = useState<Readiness>({ state: 'checking' });

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const tabId = await targetTabId();
        const frames = await framesWithFields(tabId);
        const fields: FieldDescriptor[] = [];
        let reached = false;
        for (const frameId of frames) {
          const res = await sendToFrame(tabId, frameId, { type: 'DETECT_FIELDS' }).catch(
            () => null,
          );
          if (!res?.ok) continue;
          reached = true;
          fields.push(...res.fields);
        }
        // No content script answered: a browser page, the Web Store, or a tab opened
        // before JobFill was installed.
        if (!reached) {
          if (!cancelled) setReadiness({ state: 'unavailable' });
          return;
        }
        const plan = planFill(fields, profile);
        if (!cancelled)
          setReadiness({
            state: 'ready',
            detected: fields.length,
            fillable: plan.filter((p) => p.status === 'fill' || p.status === 'fill-review').length,
          });
      } catch {
        if (!cancelled) setReadiness({ state: 'unavailable' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, profile]);

  return readiness;
}
