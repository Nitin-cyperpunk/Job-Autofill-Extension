/**
 * Is the element actually shown to the user? Hidden text inputs are skipped:
 * multi-step forms keep future steps hidden, and bot "honeypot" fields are
 * hidden on purpose — filling one can get an application silently discarded.
 */
export function isRendered(el: Element): boolean {
  const withCheck = el as Element & {
    checkVisibility?: (options?: {
      visibilityProperty?: boolean;
      contentVisibilityAuto?: boolean;
    }) => boolean;
  };
  if (typeof withCheck.checkVisibility === 'function') {
    if (!withCheck.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true }))
      return false;
  } else if (el.getClientRects().length === 0) {
    return false;
  }
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  // Classic honeypot trick: positioned far off-screen.
  const view = el.ownerDocument.defaultView;
  const right = rect.right + (view?.scrollX ?? 0);
  const bottom = rect.bottom + (view?.scrollY ?? 0);
  return right > 0 && bottom > 0;
}

/**
 * Radios, checkboxes and file inputs are often visually hidden and replaced by a
 * styled label or button, so they count as visible when their label is.
 */
export function isChoiceVisible(el: Element, isVisible: (el: Element) => boolean): boolean {
  if (isVisible(el)) return true;
  const labels = (el as HTMLInputElement).labels;
  return labels ? Array.from(labels).some((l) => isVisible(l)) : false;
}
