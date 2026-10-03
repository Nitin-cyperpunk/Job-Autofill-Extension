import type { Answer } from '@jobfill/types';

/** "Yes" / "No" / "" (not answered) for summaries. */
export function answerLabel(value: Answer): string {
  return value === 'yes' ? 'Yes' : value === 'no' ? 'No' : '';
}
