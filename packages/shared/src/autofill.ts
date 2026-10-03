/**
 * Per-field result of an autofill run.
 *  - filled:         the value was written AND the page still shows it after it had a chance to react
 *  - already-filled: the field had a value (usually typed by the user) — left untouched
 *  - needs-review:   written but worth a check, or JobFill has/needs an answer the user must give
 *  - not-filled:     nothing to put there (no profile data, not a profile field)
 *  - unsupported:    a field type JobFill can't safely fill (rich-text editors, unknown widgets)
 *  - failed:         JobFill tried, and the page rejected or cleared the value
 */
export type FieldFillStatus =
  'filled' | 'already-filled' | 'needs-review' | 'not-filled' | 'unsupported' | 'failed';

export interface FieldOutcome {
  fieldId: string;
  label: string;
  /** Profile key the field mapped to, e.g. "links.linkedin". */
  key: string | null;
  status: FieldFillStatus;
  reason?: string;
  preview?: string;
  /** A résumé upload JobFill couldn't attach; the popup offers "Attach Resume". */
  resume?: boolean;
}

/** The result of an autofill run, shown in the popup summary. */
export interface FillResultItem {
  fieldId: string;
  label: string;
  preview: string;
  reason?: string;
  /** Unanswered open question (AI assistance may be offered). */
  openEnded?: boolean;
  /** What kind of question this is (motivation, project, salary…), for grouping and hints. */
  category?: string;
}

export interface FillSummary {
  /** Every field JobFill wrote to (confident + needs-a-check). */
  filledCount: number;
  /** Confidently filled — ✓ list. */
  filled: FillResultItem[];
  /** Filled but worth a second look, or not filled and needs the user — ⚠ list. */
  review: FillResultItem[];
  /** Left alone: already filled, optional with no data, unrelated. */
  skipped: number;
  /** Fields that appeared after filling but weren't filled (preview mode) — run Autofill again. */
  revealed?: number;
  /** Open questions the profile can't answer — candidates for writing yourself or AI help. */
  questions?: FillResultItem[];
  /** Every planned field with its verified status (debug panel, "Attach Resume"). */
  outcomes?: FieldOutcome[];
  /**
   * Informational notes, e.g. "Your profile has 2 more projects than this form has
   * sections — add a section on the form and run Autofill again."
   */
  notes?: string[];
}
