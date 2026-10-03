import type { FieldDescriptor } from '@jobfill/types';
import {
  CATEGORY_LABELS,
  classifyQuestion,
  explainMatch,
  matchField,
  normalizeText,
  sectionContext,
} from '@jobfill/field-mapper';

export interface DebugMapping {
  /** Profile key, "sensitive", or null (unmapped). */
  key: string | null;
  confidence: number | null;
  why: string;
  /** The label as the matcher reads it ("Candidate's First-Name *" → "first name"). */
  question: string;
  /** Question category (Motivation, Salary, Project…). */
  category: string;
  /** Section context that changes meaning (Projects, Permanent address…), if any. */
  context: string;
}

/** How the mapper sees a field, for the overlay and console table. */
export function debugMapping(d: FieldDescriptor): DebugMapping {
  const m = matchField(d);
  return {
    key: m.kind === 'match' ? m.key : m.kind === 'sensitive' ? 'sensitive' : null,
    confidence: m.kind === 'match' ? m.confidence : null,
    why: explainMatch(d, m),
    question: normalizeText(d.label || d.ariaLabel || d.placeholder || d.name),
    category: CATEGORY_LABELS[classifyQuestion(`${d.label} ${d.description}`)],
    context: sectionContext(d) ?? '',
  };
}
