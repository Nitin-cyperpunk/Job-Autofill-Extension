import type { FieldDescriptor } from '@jobfill/types';
import type { PlanItem } from '@jobfill/field-mapper';
import type { AnswerRequest, AnswerVariants, JobContext } from '@jobfill/ai';
import type { FieldOutcome, FillSummary } from './autofill';

/**
 * Typed message contract between popup, background and content scripts.
 * All messaging is local to the browser — nothing here goes over the network.
 */

export type ExtensionMessage =
  | { type: 'PING' }
  | { type: 'DETECT_FIELDS' }
  /** Popup → all frames: frames that contain fields reply with FRAME_HAS_FIELDS. */
  | { type: 'ANNOUNCE_FRAMES' }
  /** Content script (any frame) → popup: "I have fields" (sender.frameId identifies the frame). */
  | { type: 'FRAME_HAS_FIELDS'; count: number }
  /** Work out what would be filled, without touching the page (safe mode preview). */
  | { type: 'AUTOFILL_PLAN' }
  /** Fill the page. `fieldIds` limits it to fields the user approved in the preview. */
  | { type: 'AUTOFILL_EXECUTE'; fieldIds?: string[] }
  /** Popup → content (frame): attach the saved résumé to one file field (user clicked "Attach Resume"). */
  | { type: 'ATTACH_RESUME'; fieldId: string }
  /** Dev/debug builds only: show or hide the in-page field overlay. */
  | { type: 'DEBUG_OVERLAY'; show: boolean }
  /** Popup → background: is AI configured, and where would data go? (No key returned.) */
  | { type: 'AI_STATUS' }
  /** Popup → background: generate answers for an already-minimized, user-approved request. */
  | { type: 'AI_GENERATE'; request: AnswerRequest }
  /** Popup → content (frame): the question's text, limits and the job context on the page. */
  | { type: 'AI_QUESTION_CONTEXT'; fieldId: string }
  /** Popup → content (frame): put the chosen answer into the field. Never submits. */
  | { type: 'AI_INSERT'; fieldId: string; text: string; replace?: boolean };

export interface MessageResponseMap {
  PING: { ok: true; from: 'background' | 'content' };
  DETECT_FIELDS: {
    ok: true;
    count: number;
    fields: FieldDescriptor[];
    stats: { scans: number; mutationBatches: number; ignoredBatches: number; lastScanMs: number };
  };
  AUTOFILL_PLAN:
    | {
        ok: true;
        items: PlanItem[];
        /** This frame's last fill run, for the debug panel. */ lastFill?: FieldOutcome[];
      }
    | { ok: false; message: string };
  ATTACH_RESUME: { ok: boolean; message?: string };
  AUTOFILL_EXECUTE: { ok: true; summary: FillSummary } | { ok: false; message: string };
  DEBUG_OVERLAY: { ok: boolean };
  ANNOUNCE_FRAMES: { ok: true };
  FRAME_HAS_FIELDS: { ok: true };
  AI_STATUS: { enabled: boolean; configured: boolean; destination: string; problem?: string };
  AI_GENERATE: { ok: true; variants: AnswerVariants } | { ok: false; message: string };
  AI_QUESTION_CONTEXT:
    | {
        ok: true;
        question: string;
        maxLength?: number;
        kind: 'short' | 'long';
        hasValue: boolean;
        job: JobContext;
      }
    | { ok: false; message: string };
  AI_INSERT: { ok: true } | { ok: false; message: string; hasValue?: boolean };
}

export type MessageResponse<T extends ExtensionMessage['type']> = MessageResponseMap[T];
