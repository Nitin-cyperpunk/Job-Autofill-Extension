import type { FieldDescriptor } from '@jobfill/types';
import { matchField } from '@jobfill/field-mapper';

/** Mapped profile key for debug display: the key, 'sensitive', or null. */
export function mappedKey(d: FieldDescriptor): string | null {
  const m = matchField(d);
  return m.kind === 'match' ? m.key : m.kind === 'sensitive' ? 'sensitive' : null;
}
