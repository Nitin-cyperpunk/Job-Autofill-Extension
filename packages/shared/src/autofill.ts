/** The result of an autofill run, shown in the popup summary. */
export interface FillResultItem {
  fieldId: string;
  label: string;
  preview: string;
  reason?: string;
  /** Unanswered open question (AI assistance may be offered). */
  openEnded?: boolean;
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
}
