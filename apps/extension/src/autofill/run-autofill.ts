import type { PlanItem } from '@jobfill/field-mapper';
import type { FillResultItem, FillSummary } from '@jobfill/shared';
import { planForFields } from '@/mapping';
import { loadProfile, loadResume } from '@/storage';
import type { DetectedField } from '@/types';
import { base64ToBlob } from '@/utils/file';
import { attachFile, selectOptions, setChecked, setTextValue } from './fill-actions';

/**
 * Runs in the content script. Plans with the pure mapper, then writes to the page.
 * The plan is always rebuilt from a fresh scan and the local profile — the popup
 * only sends field ids, never values.
 */

export async function planPage(fields: DetectedField[]): Promise<PlanItem[]> {
  return planForFields(fields, await loadProfile());
}

/**
 * Fill the page. With `fieldIds`, only those fields (as approved in the preview);
 * otherwise every field the plan marks fill / fill-review.
 */
export async function fillPage(fields: DetectedField[], fieldIds?: string[]): Promise<FillSummary> {
  const items = await planPage(fields);
  const byId = new Map(fields.map((f) => [f.descriptor.id, f]));
  const approved = fieldIds ? new Set(fieldIds) : null;

  const summary: FillSummary = { filledCount: 0, filled: [], review: [], skipped: 0 };
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
      if (item.status === 'review') summary.review.push(result(item, item.reason));
      else summary.skipped++;
      continue;
    }
    const field = byId.get(item.fieldId);
    const ok = field ? await perform(field, item) : false;
    if (!ok) {
      summary.review.push(result(item, 'Couldn’t fill this field — please fill it yourself'));
    } else {
      summary.filledCount++;
      if (item.status === 'fill-review') summary.review.push(result(item, item.reason));
      else summary.filled.push(result(item));
    }
  }
  return summary;
}

async function perform(field: DetectedField, item: PlanItem): Promise<boolean> {
  const action = item.action!;
  const el = field.element;
  try {
    switch (action.kind) {
      case 'text':
        return (
          (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) &&
          setTextValue(el, action.text)
        );

      case 'options':
        if (el instanceof HTMLSelectElement) return selectOptions(el, action.indices);
        // Radio / checkbox groups: one element per option, in option order.
        return action.indices.every((i) => {
          const option = field.elements[i];
          return option ? setChecked(option, true) : false;
        });

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
