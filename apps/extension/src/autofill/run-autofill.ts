import type { PlanItem } from '@jobfill/field-mapper';
import type { FieldOutcome, FillResultItem, FillSummary } from '@jobfill/shared';
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

/** How long the page gets to react (React re-render, masks, validators) before we re-read a field. */
const VERIFY_MS = 120;

/** Does the page still show what we wrote? Sites may trim, re-case or append a trailing slash. */
function stillShows(el: Element, text: string): 'yes' | 'changed' | 'cleared' {
  if (!el.isConnected) return 'cleared';
  const value = (el as HTMLInputElement).value ?? '';
  const norm = (v: string) => v.trim().toLowerCase().replace(/\/+$/, '');
  if (norm(value) === norm(text)) return 'yes';
  return value.trim() ? 'changed' : 'cleared';
}

function fileAttached(el: Element, fileName: string): boolean {
  const files = (el as HTMLInputElement).files;
  return el.isConnected && Array.from(files ?? []).some((f) => f.name === fileName);
}

async function fillItems(
  items: PlanItem[],
  fields: DetectedField[],
  approved: Set<string> | null,
  adapter: SiteAdapter | null,
  summary: FillSummary,
) {
  const byId = new Map(fields.map((f) => [f.descriptor.id, f]));
  const outcomes = (summary.outcomes ??= []);
  const result = (item: PlanItem, reason?: string): FillResultItem => ({
    fieldId: item.fieldId,
    label: item.label,
    preview: item.preview,
    ...(reason ? { reason } : {}),
  });
  const outcome = (item: PlanItem, status: FieldOutcome['status'], reason?: string) => {
    const o: FieldOutcome = {
      fieldId: item.fieldId,
      label: item.label,
      key: item.key,
      status,
      ...(reason ? { reason } : {}),
      ...(item.preview ? { preview: item.preview } : {}),
      ...(item.action?.kind === 'file' ? { resume: true } : {}),
    };
    outcomes.push(o);
    return o;
  };
  const resumeNotAttached = (item: PlanItem) => {
    const reason = 'Resume detected. Your saved resume is available — use “Attach Resume”.';
    summary.review.push(result(item, reason));
    outcome(item, 'needs-review', reason);
  };

  const written: Array<{ item: PlanItem; field: DetectedField }> = [];
  for (const item of items) {
    const wanted =
      item.action && (approved ? approved.has(item.fieldId) : item.status !== 'review');
    if (!wanted) {
      // Open questions get their own list (write it yourself, or ask AI) rather than ⚠.
      if (item.openEnded) {
        (summary.questions ??= []).push({ ...result(item, item.reason), openEnded: true });
        outcome(item, 'needs-review', item.reason);
      } else if (item.status === 'review') {
        summary.review.push(result(item, item.reason));
        outcome(item, 'needs-review', item.reason);
      } else {
        summary.skipped++;
        outcome(item, 'not-filled', item.reason || 'Not selected');
      }
      continue;
    }
    const field = byId.get(item.fieldId);
    const ok = field ? await perform(field, item, adapter) : false;
    if (ok && field) written.push({ item, field });
    else if (item.action?.kind === 'file') resumeNotAttached(item);
    else {
      const reason = 'Couldn’t fill this field — please fill it yourself';
      summary.review.push(result(item, reason));
      outcome(item, 'failed', reason);
    }
  }
  if (written.length === 0) return;

  // Only report "filled" once the page has had a chance to react and still shows the value:
  // controlled inputs can snap back, and validators can clear what they don't like.
  await sleep(VERIFY_MS);
  for (const { item, field } of written) {
    const action = item.action!;
    if (action.kind === 'file') {
      if (fileAttached(field.element, item.preview)) {
        summary.filledCount++;
        summary.filled.push(result(item));
        outcome(item, 'filled');
      } else resumeNotAttached(item);
      continue;
    }
    if (action.kind === 'text') {
      const state = stillShows(field.element, action.text);
      if (state === 'cleared') {
        const reason = 'The page cleared the value after it was entered — please fill it yourself';
        summary.review.push(result(item, reason));
        outcome(item, 'failed', reason);
        continue;
      }
      if (state === 'changed') {
        const shown = (field.element as HTMLInputElement).value.trim().slice(0, 60);
        const reason = `The page changed the value to “${shown}” — please check`;
        summary.filledCount++;
        summary.review.push(result(item, reason));
        outcome(item, 'needs-review', reason);
        continue;
      }
    }
    summary.filledCount++;
    if (item.status === 'fill-review') {
      summary.review.push(result(item, item.reason));
      outcome(item, 'needs-review', item.reason);
    } else {
      summary.filled.push(result(item));
      outcome(item, 'filled');
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

/**
 * "Attach Resume": the user asked for this one file field. Uses the same standard
 * DataTransfer → input.files route as autofill, and only reports success when the
 * page's input still holds the file afterwards. Never clicks, never submits.
 */
export async function attachResumeTo(
  field: DetectedField,
): Promise<{ ok: boolean; message?: string }> {
  const stored = await loadResume();
  if (!stored) return { ok: false, message: 'No resume saved yet — add one in JobFill settings.' };
  const el = field.element;
  if (!(el instanceof HTMLInputElement) || el.type !== 'file')
    return { ok: false, message: 'This isn’t a file upload field.' };
  const file = new File([base64ToBlob(stored.dataBase64, stored.mimeType)], stored.fileName, {
    type: stored.mimeType,
  });
  if (!attachFile(el, file)) {
    return {
      ok: false,
      message: `This site doesn’t accept files from extensions. Use its upload button and choose “${stored.fileName}”.`,
    };
  }
  await sleep(VERIFY_MS);
  return fileAttached(el, stored.fileName)
    ? { ok: true }
    : {
        ok: false,
        message: `The site removed the file. Use its upload button and choose “${stored.fileName}”.`,
      };
}
