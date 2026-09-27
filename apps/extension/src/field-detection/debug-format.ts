import type { FieldDescriptor } from '@jobfill/types';
import { explainMatch, matchField } from '@jobfill/field-mapper';

export interface DebugMapping {
  /** Profile key, "sensitive", or null (unmapped). */
  key: string | null;
  confidence: number | null;
  why: string;
}

/** How the mapper sees a field, for the overlay and console table. */
export function debugMapping(d: FieldDescriptor): DebugMapping {
  const m = matchField(d);
  return {
    key: m.kind === 'match' ? m.key : m.kind === 'sensitive' ? 'sensitive' : null,
    confidence: m.kind === 'match' ? m.confidence : null,
    why: explainMatch(d, m),
  };
}
