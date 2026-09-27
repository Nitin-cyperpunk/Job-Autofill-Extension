import type { Profile } from '@jobfill/types';
import { planFill, type PlanItem } from '@jobfill/field-mapper';
import type { DetectedField } from '@/types';

/**
 * Bridges live detected fields to the pure planner in @jobfill/field-mapper.
 * All mapping decisions live there (and are unit-tested); this only strips the DOM.
 */
export function planForFields(fields: DetectedField[], profile: Profile): PlanItem[] {
  return planFill(
    fields.map((f) => f.descriptor),
    profile,
  );
}
