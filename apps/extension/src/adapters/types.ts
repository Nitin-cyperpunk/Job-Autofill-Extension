import type { FillAction } from '@jobfill/field-mapper';
import type { DetectedField } from '@/types';

/**
 * A site adapter patches a specific application platform where generic detection
 * and filling genuinely can't cope. Everything else must go through the generic
 * pipeline (semantic labels, ARIA roles, data-* hints).
 *
 * Before writing one, check whether the problem is actually generic:
 *  - a naming convention?      → add phrases to the dictionary / DATA_HINT_ATTRIBUTES
 *  - a widget type?            → extend custom-dropdown support (ARIA contract)
 *  - a timing issue?           → the watcher / follow-up pass
 * An adapter is justified only for behaviour no generic rule can express
 * (e.g. a widget that ignores synthetic events and needs a site API).
 */
export interface SiteAdapter {
  /** Stable id, shown in the debug view. */
  id: string;
  /** Does this adapter apply to the page? Keep it cheap: it runs on every scan. */
  matches(url: URL, doc: Document): boolean;
  /** Adjust detected fields in place (add hints, fix labels) after generic detection. */
  refineFields?(fields: DetectedField[], doc: Document): void;
  /**
   * Fill one field. Return `undefined` to let the generic filler handle it,
   * or the result (true = filled and verified) when the adapter handled it.
   */
  fill?(field: DetectedField, action: FillAction): Promise<boolean | undefined>;
}
