import type { PlanItem } from '@jobfill/field-mapper';
import type { FillResultItem, FillSummary } from '@jobfill/shared';
import type { SiteAdapter } from '@/adapters';
import { planForFields } from '@/mapping';
import { loadProfile, loadResume } from '@/storage';
import type { DetectedField } from '@/types';
import { base64ToBlob } from '@/utils/file';
import { fillDropdown } from './dropdown-fill';
import { attachFile, selectOptions, setChecked, setTextValue } from './fill-actions';

/**
 * Runs in the content script. Plans with the pure mapper, then writes to the page.
 * The plan is always rebuilt from a fresh scan and the local profile — the popup
 * only sends field ids, never values.
 */

export async function planPage(fields: DetectedField[]): Promise<PlanItem[]> {
  return planForFields(fields, await loadProfile());
}

export interface FillOptions {
  /** Only these fields (as approved in the preview). */
  fieldIds?: string[];
  adapter?: SiteAdapter | null;
  /** Extra passes for fields revealed by our own answers ("Yes" → details box). */
  followUpPasses?: number;
  /** How long to let the page react before a follow-up pass. */
  settleMs?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fill the page. `scan` returns the current fields; it's called again between passes
 * so fields that appear because of what we filled get filled too. In preview mode
 * (`fieldIds`) new fields are only reported — the user didn't approve them.
 */
export async function fillPage(
  scan: () => DetectedField[],
  options: FillOptions = {},
): Promise<FillSummary> {
  const { fieldIds, adapter = null, followUpPasses = 2, settleMs = 450 } = options;
  const approved = fieldIds ? new Set(fieldIds) : null;
  const summary: FillSummary = {
    filledCount: 0,
    filled: [],
    review: [],
    skipped: 0,
    revealed: 0,
    questions: [],
  };
  const seen = new Set<string>();

  let fields = scan();
  for (let pass = 0; pass <= followUpPasses; pass++) {
    const fresh = fields.filter((f) => !seen.has(f.descriptor.id));
    if (pass > 0 && fresh.length === 0) break;
    fresh.forEach((f) => seen.add(f.descriptor.id));

    if (pass > 0 && approved) {
      summary.revealed = fresh.length;
      break;
    }
    // Plan with the full list (occurrence counting for repeated sections), fill only fresh fields.
    const items = (await planPage(fields)).filter((item) =>
      fresh.some((f) => f.descriptor.id === item.fieldId),
    );
    await fillItems(items, fields, approved, adapter, summary);

    if (pass === followUpPasses) break;
    await sleep(settleMs);
    fields = scan();
  }
  return summary;
}

async function fillItems(
  items: PlanItem[],
  fields: DetectedField[],
  approved: Set<string> | null,
  adapter: SiteAdapter | null,
  summary: FillSummary,
) {
  const byId = new Map(fields.map((f) => [f.descriptor.id, f]));
  const result = (item: PlanItem, reason?: string): FillResultItem => ({
    fieldId: item.fieldId,
    label: item.label,
    preview: item.preview,
    ...(reason ? { reason } : {}),
  });

  for (const item of items) {
    const wanted =
      item.action && (approved ? approved.has(item.fieldId) : item.status !== 'review');
    if (!wanted) {
      // Open questions get their own list (write it yourself, or ask AI) rather than ⚠.
      if (item.openEnded)
        (summary.questions ??= []).push({ ...result(item, item.reason), openEnded: true });
      else if (item.status === 'review') summary.review.push(result(item, item.reason));
      else summary.skipped++;
      continue;
    }
    const field = byId.get(item.fieldId);
    const ok = field ? await perform(field, item, adapter) : false;
    if (!ok) {
      summary.review.push(result(item, 'Couldn’t fill this field — please fill it yourself'));
    } else {
      summary.filledCount++;
      if (item.status === 'fill-review') summary.review.push(result(item, item.reason));
      else summary.filled.push(result(item));
    }
  }
}

async function perform(
  field: DetectedField,
  item: PlanItem,
  adapter: SiteAdapter | null,
): Promise<boolean> {
  const action = item.action!;
  const el = field.element;
  try {
    const handled = await adapter?.fill?.(field, action);
    if (handled !== undefined) return handled;

    switch (action.kind) {
      case 'text':
        return (
          (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) &&
          setTextValue(el, action.text)
        );

      case 'options': {
        if (el instanceof HTMLSelectElement) return selectOptions(el, action.indices);
        // Custom dropdown whose options were known at planning time (e.g. Google Forms).
        if (field.descriptor.type === 'select') {
          const label = field.descriptor.options[action.indices[0] ?? -1]?.label;
          return label ? fillDropdown(el, null, label, label) : false;
        }
        // Radio / checkbox groups: one element per option, in option order.
        return action.indices.every((i) => {
          const option = field.elements[i];
          return option ? setChecked(option, true) : false;
        });
      }

      case 'dropdown':
        return (
          (await fillDropdown(el, action.value, action.search)) ||
          (action.fallback ? fillDropdown(el, action.fallback, '') : false)
        );

      case 'check':
        return setChecked(el, action.checked);

      case 'file': {
        const stored = await loadResume();
        if (!stored || !(el instanceof HTMLInputElement)) return false;
        const file = new File([base64ToBlob(stored.dataBase64, stored.mimeType)], stored.fileName, {
          type: stored.mimeType,
        });
        return attachFile(el, file);
      }
    }
  } catch {
    return false;
  }
}
