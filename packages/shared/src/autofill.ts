/** The result of an autofill run, shown in the popup summary. */
export interface FillResultItem {
  fieldId: string;
  label: string;
  preview: string;
  reason?: string;
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
}
