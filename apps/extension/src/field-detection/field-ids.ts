/**
 * Stable ids for detected fields, kept in a WeakMap so we never write to the page
 * (no data-* attributes) and ids disappear with their elements.
 */
const ids = new WeakMap<Element, string>();
let counter = 0;

export function fieldIdFor(el: Element): string {
  let id = ids.get(el);
  if (!id) {
    id = `jf-${++counter}`;
    ids.set(el, id);
  }
  return id;
}
