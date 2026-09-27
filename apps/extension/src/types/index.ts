import type { FieldDescriptor } from '@jobfill/types';

/** Extension-local types. Cross-package types live in @jobfill/types. */

/** A form control JobFill knows how to write into. */
export type FillableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/** A detected field: the serializable descriptor plus the live DOM elements it describes. */
export interface DetectedField {
  descriptor: FieldDescriptor;
  /** Primary element: the control itself, or the group container for radios/checkbox sets. */
  element: Element;
  /** Every control that makes up the field (one per option for choice groups). */
  elements: Element[];
  /** Option elements of a custom (ARIA) dropdown, when rendered. */
  optionElements?: Element[];
}
