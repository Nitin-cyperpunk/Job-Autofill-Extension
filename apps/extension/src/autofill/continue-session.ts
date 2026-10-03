import type { FillSummary } from '@jobfill/shared';
import type { DetectedField } from '@/types';

/**
 * "Keep filling new steps": after the user clicks Autofill, multi-step applications
 * keep rendering new fields as the user moves on (Education → Address → Gender, DOB,
 * work authorization near the end). The session fills each newly rendered set of
 * fields with the normal safety rules — never overwriting, never ticking consent,
 * never guessing — and NEVER clicks Next, Continue, Apply or Submit: the user drives.
 *
 * It only reacts to fields it hasn't handled yet, debounces bursts of DOM changes,
 * and caps its runs so a page that re-renders endlessly can't cause a fill loop.
 */

export interface ContinueDeps {
  /** Notified (by the field watcher) whenever the detected fields change. */
  subscribe(listener: (fields: DetectedField[]) => void): () => void;
  getFields(): DetectedField[];
  /** Fill the page, leaving `skip` alone. */
  run(skip: ReadonlySet<string>): Promise<FillSummary>;
  /** After each automatic run (status reporting). */
  onRun?(summary: FillSummary): void;
  /** Wait for the new step to finish rendering before filling. */
  debounceMs?: number;
  /** Hard cap on automatic runs per page. */
  maxRuns?: number;
  /** Minimum gap between automatic runs. */
  minIntervalMs?: number;
}

export class ContinueSession {
  private handled = new Set<string>();
  private unsubscribe: (() => void) | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private running = false;
  private again = false;
  private runs = 0;
  private lastRun = 0;

  constructor(private readonly deps: ContinueDeps) {}

  get active(): boolean {
    return this.unsubscribe !== null;
  }

  /** Start watching. `alreadyHandled`: fields the user's own Autofill run just covered. */
  start(alreadyHandled: Iterable<string> = []): void {
    for (const id of alreadyHandled) this.handled.add(id);
    if (this.unsubscribe) return;
    this.unsubscribe = this.deps.subscribe(() => this.schedule());
    this.schedule();
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  /** Fields the session hasn't seen yet. */
  private fresh(): DetectedField[] {
    return this.deps.getFields().filter((f) => !this.handled.has(f.descriptor.id));
  }

  private schedule(): void {
    if (!this.active || this.fresh().length === 0) return;
    if (this.timer) clearTimeout(this.timer);
    const wait = Math.max(
      this.deps.debounceMs ?? 600,
      this.lastRun + (this.deps.minIntervalMs ?? 1500) - Date.now(),
    );
    this.timer = setTimeout(() => void this.flush(), wait);
  }

  private async flush(): Promise<void> {
    this.timer = null;
    if (!this.active) return;
    if (this.running) {
      this.again = true;
      return;
    }
    if (this.runs >= (this.deps.maxRuns ?? 25)) {
      this.stop();
      return;
    }
    const fresh = this.fresh();
    if (fresh.length === 0) return;
    this.running = true;
    this.runs++;
    this.lastRun = Date.now();
    try {
      const summary = await this.deps.run(new Set(this.handled));
      // Everything present now has been considered — filled, flagged or left alone.
      for (const f of this.deps.getFields()) this.handled.add(f.descriptor.id);
      for (const o of summary.outcomes ?? []) this.handled.add(o.fieldId);
      this.deps.onRun?.(summary);
    } finally {
      this.running = false;
      if (this.again) {
        this.again = false;
        this.schedule();
      }
    }
  }
}
