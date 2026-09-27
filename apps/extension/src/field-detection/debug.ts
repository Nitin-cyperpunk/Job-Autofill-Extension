import type { FieldDescriptor } from '@jobfill/types';
import { debugMapping } from './debug-format';
import type { DetectedField } from '@/types';
import { DEBUG_OVERLAY_TAG } from './constants';
import type { FieldWatcher } from './watcher';

/**
 * Developer tooling for the detector — only loaded in dev/debug builds.
 *
 *  - Logs a table of detected fields to the page console whenever they change.
 *  - `jobfill` object in the content-script console context (DevTools → Console →
 *    context dropdown → "JobFill"): jobfill.fields(), jobfill.scan(), jobfill.stats(),
 *    jobfill.overlay(true|false).
 *  - An overlay outlining every field with its label, type and mapped profile key.
 *
 * The overlay is the only thing that writes to the page. It lives in a closed shadow
 * root under <jobfill-debug>, which the detector and the MutationObserver ignore.
 */

export interface DebugTools {
  setOverlay(show: boolean): void;
}

export function installDebugTools(watcher: FieldWatcher): DebugTools {
  const overlay = new Overlay();

  const log = (fields: DetectedField[]) => {
    const { scans, lastScanMs } = watcher.stats;
    console.groupCollapsed(
      `[JobFill] ${fields.length} fields detected · scan #${scans} · ${lastScanMs} ms`,
    );
    console.table(fields.map(({ descriptor }) => summarize(descriptor)));
    console.groupEnd();
  };

  watcher.subscribe((fields) => {
    log(fields);
    overlay.render(fields);
  });
  log(watcher.getFields());

  const api = {
    fields: () => watcher.getFields().map((f) => f.descriptor),
    detected: () => watcher.getFields(),
    scan: () => watcher.scanNow().map((f) => f.descriptor),
    stats: () => ({ ...watcher.stats }),
    overlay: (show = true) => overlay.toggle(show, watcher.getFields()),
  };
  (globalThis as { jobfill?: typeof api }).jobfill = api;

  return { setOverlay: (show) => overlay.toggle(show, watcher.getFields()) };
}

/**
 * Page field metadata only (labels, names, mapping) — never the field's value and
 * never the profile value it maps to. Keep it that way: this goes to the console.
 */
function summarize(d: FieldDescriptor) {
  const mapping = debugMapping(d);
  return {
    id: d.id,
    type: d.type,
    label: d.label,
    via: d.labelSource,
    name: d.name,
    required: d.required,
    options: d.options.length || '',
    nearby: d.nearbyText,
    section: d.section,
    mapsTo: mapping.key ?? 'unmapped',
    confidence: mapping.confidence === null ? '' : `${Math.round(mapping.confidence * 100)}%`,
    why: mapping.why,
  };
}

// ---------------------------------------------------------------------------

class Overlay {
  private host: HTMLElement | null = null;
  private layer: HTMLDivElement | null = null;
  private fields: DetectedField[] = [];
  private frame = 0;

  toggle(show: boolean, fields: DetectedField[]): void {
    if (show) {
      this.mount();
      this.render(fields);
    } else {
      this.unmount();
    }
  }

  render(fields: DetectedField[]): void {
    this.fields = fields;
    if (!this.layer) return;
    this.layer.replaceChildren(
      ...fields.flatMap(({ element, descriptor }) => {
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return [];
        const { key, confidence } = debugMapping(descriptor);
        // green = mapped, blue = left for the user (sensitive/consent), amber = unmapped
        const tone = key === 'sensitive' ? 'choice' : key ? 'mapped' : 'unmapped';
        const box = document.createElement('div');
        box.className = `box ${tone}`;
        Object.assign(box.style, {
          left: `${rect.left - 2}px`,
          top: `${rect.top - 2}px`,
          width: `${rect.width + 4}px`,
          height: `${rect.height + 4}px`,
        });
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = [
          descriptor.label || '(no label)',
          descriptor.type + (descriptor.required ? '*' : ''),
          key
            ? `→ ${key}${confidence === null ? '' : ` ${Math.round(confidence * 100)}%`}`
            : '→ unmapped',
        ]
          .filter(Boolean)
          .join(' · ');
        box.append(badge);
        return [box];
      }),
    );
  }

  private mount(): void {
    if (this.host) return;
    this.host = document.createElement(DEBUG_OVERLAY_TAG);
    Object.assign(this.host.style, {
      position: 'fixed',
      inset: '0',
      pointerEvents: 'none',
      zIndex: '2147483647',
    });
    const shadow = this.host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `
      .box { position: fixed; box-sizing: border-box; border: 2px solid; border-radius: 4px; }
      .mapped { border-color: #16a34a; background: rgb(22 163 74 / 0.08); }
      .unmapped { border-color: #f59e0b; background: rgb(245 158 11 / 0.08); }
      .choice { border-color: #2f6fed; background: rgb(47 111 237 / 0.08); }
      .badge { position: absolute; left: -2px; bottom: 100%; margin-bottom: 2px; max-width: 420px;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 1px 6px;
        border-radius: 4px; font: 600 11px/16px system-ui, sans-serif; color: #fff; }
      .mapped .badge { background: #16a34a; } .unmapped .badge { background: #d97706; }
      .choice .badge { background: #2f6fed; }`;
    this.layer = document.createElement('div');
    shadow.append(style, this.layer);
    document.documentElement.append(this.host);
    window.addEventListener('scroll', this.reposition, { capture: true, passive: true });
    window.addEventListener('resize', this.reposition, { passive: true });
  }

  private unmount(): void {
    window.removeEventListener('scroll', this.reposition, { capture: true });
    window.removeEventListener('resize', this.reposition);
    cancelAnimationFrame(this.frame);
    this.host?.remove();
    this.host = null;
    this.layer = null;
  }

  private readonly reposition = () => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.render(this.fields));
  };
}
