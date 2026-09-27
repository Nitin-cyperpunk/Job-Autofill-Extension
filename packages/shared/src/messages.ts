import type { FieldDescriptor } from '@jobfill/types';
import type { PlanItem } from '@jobfill/field-mapper';
import type { FillSummary } from './autofill';

/**
 * Typed message contract between popup, background and content scripts.
 * All messaging is local to the browser — nothing here goes over the network.
 */

export type ExtensionMessage =
  | { type: 'PING' }
  | { type: 'DETECT_FIELDS' }
  /** Work out what would be filled, without touching the page (safe mode preview). */
  | { type: 'AUTOFILL_PLAN' }
  /** Fill the page. `fieldIds` limits it to fields the user approved in the preview. */
  | { type: 'AUTOFILL_EXECUTE'; fieldIds?: string[] }
  /** Dev/debug builds only: show or hide the in-page field overlay. */
  | { type: 'DEBUG_OVERLAY'; show: boolean };

export interface MessageResponseMap {
  PING: { ok: true; from: 'background' | 'content' };
  DETECT_FIELDS: {
    ok: true;
    count: number;
    fields: FieldDescriptor[];
    stats: { scans: number; mutationBatches: number; ignoredBatches: number; lastScanMs: number };
  };
  AUTOFILL_PLAN: { ok: true; items: PlanItem[] } | { ok: false; message: string };
  AUTOFILL_EXECUTE: { ok: true; summary: FillSummary } | { ok: false; message: string };
  DEBUG_OVERLAY: { ok: boolean };
}

export type MessageResponse<T extends ExtensionMessage['type']> = MessageResponseMap[T];
