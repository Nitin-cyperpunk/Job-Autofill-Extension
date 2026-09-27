// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DetectedField } from '@/types';
import { FieldWatcher } from './watcher';

const isVisible = (el: Element) => !el.closest('.hidden');

/** Let MutationObserver callbacks (microtasks) run. */
const flushMutations = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

let watcher: FieldWatcher;
let notifications: DetectedField[][];

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML =
    '<form><label>Name <input name="name" id="name"></label><div id="slot"></div><span id="ticker"></span></form>';
  notifications = [];
  watcher = new FieldWatcher(document, {
    isVisible,
    debounceMs: 250,
    maxWaitMs: 1500,
    minIntervalMs: 400,
  });
  watcher.start(); // initial scan happens here
  watcher.subscribe((fields) => notifications.push(fields));
});

afterEach(() => {
  watcher.stop();
  vi.useRealTimers();
});

const labels = () => watcher.getFields().map((f) => f.descriptor.label);

describe('FieldWatcher', () => {
  it('scans once on start', () => {
    expect(watcher.stats.scans).toBe(1);
    expect(labels()).toEqual(['Name']);
  });

  it('debounces a burst of inserted fields into a single scan and notification', async () => {
    const slot = document.getElementById('slot')!;
    for (let i = 0; i < 50; i++) {
      slot.insertAdjacentHTML('beforeend', `<label>Q${i} <input name="q${i}"></label>`);
      await flushMutations();
      vi.advanceTimersByTime(10);
    }
    vi.advanceTimersByTime(1000);
    expect(watcher.stats.scans).toBe(2);
    expect(notifications).toHaveLength(1);
    expect(labels()).toHaveLength(51);
  });

  it('ignores text updates and class churn on controls (typing, focus styles)', async () => {
    const input = document.getElementById('name')!;
    for (let i = 0; i < 100; i++) {
      document.getElementById('ticker')!.textContent = String(i);
      input.classList.toggle('focused');
      input.setAttribute('style', `outline: ${i}px solid`);
      await flushMutations();
    }
    vi.advanceTimersByTime(5000);
    expect(watcher.stats.scans).toBe(1);
    expect(watcher.stats.ignoredBatches).toBeGreaterThan(0);
    expect(notifications).toHaveLength(0);
  });

  it('ignores attributes re-set to the same value (React does this every render)', async () => {
    const input = document.getElementById('name')!;
    for (let i = 0; i < 20; i++) {
      input.setAttribute('name', 'name'); // same value
      input.setAttribute('placeholder', ''); // set then removed in one batch: no net change
      input.removeAttribute('placeholder');
      await flushMutations();
    }
    vi.advanceTimersByTime(5000);
    expect(watcher.stats.scans).toBe(1);
  });

  it('rescans when a control attribute really changes', async () => {
    document.getElementById('name')!.setAttribute('type', 'email');
    await flushMutations();
    vi.advanceTimersByTime(1000);
    expect(watcher.getFields()[0]!.descriptor.type).toBe('email');
  });

  it('rescans when a container reveals hidden fields', async () => {
    document.getElementById('slot')!.innerHTML =
      '<div class="step hidden"><label>Salary <input name="salary"></label></div>';
    await flushMutations();
    vi.advanceTimersByTime(1000);
    expect(labels()).toEqual(['Name']);

    document.querySelector('.step')!.classList.remove('hidden');
    await flushMutations();
    vi.advanceTimersByTime(1000);
    expect(labels()).toEqual(['Name', 'Salary']);
  });

  it('notices removed fields', async () => {
    document.getElementById('name')!.closest('label')!.remove();
    await flushMutations();
    vi.advanceTimersByTime(1000);
    expect(labels()).toEqual([]);
  });

  it('bounds scan frequency on a page that never stops mutating', async () => {
    const slot = document.getElementById('slot')!;
    // A relevant mutation every 100 ms for 6 s: debounce alone would starve forever.
    for (let t = 0; t < 6000; t += 100) {
      slot.innerHTML = `<input aria-label="Spinner ${t}">`;
      await flushMutations();
      vi.advanceTimersByTime(100);
    }
    // maxWait (1.5 s) forces progress; minInterval stops it from going faster.
    expect(watcher.stats.scans).toBeGreaterThanOrEqual(4);
    expect(watcher.stats.scans).toBeLessThanOrEqual(7);
  });

  it('does not feed back on itself: a scan causes no further scans', async () => {
    document.getElementById('slot')!.innerHTML = '<input aria-label="Late">';
    await flushMutations();
    vi.advanceTimersByTime(1000);
    const scans = watcher.stats.scans;
    await flushMutations();
    vi.advanceTimersByTime(10_000);
    expect(watcher.stats.scans).toBe(scans);
  });

  it('sees fields added inside an open shadow root', async () => {
    watcher.stop();
    const host = document.createElement('x-apply');
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = '<div id="wrap"><label for="a">First name</label><input id="a"></div>';
    document.body.append(host);
    watcher.start(); // finds the shadow root and starts observing it
    expect(labels()).toContain('First name');

    root
      .getElementById('wrap')!
      .insertAdjacentHTML('beforeend', '<label for="b">Phone</label><input id="b" type="tel">');
    await flushMutations();
    vi.advanceTimersByTime(1000);
    expect(labels()).toContain('Phone');
  });

  it('rescans when a web component with a shadow form is inserted', async () => {
    const host = document.createElement('x-late-form');
    host.attachShadow({ mode: 'open' }).innerHTML =
      '<label for="c">Email</label><input id="c" type="email">';
    document.body.append(host);
    await flushMutations();
    vi.advanceTimersByTime(1000);
    expect(labels()).toContain('Email');
  });

  it('ignores the debug overlay host', async () => {
    const host = document.createElement('jobfill-debug');
    host.innerHTML = '<input aria-label="overlay">';
    document.documentElement.append(host);
    await flushMutations();
    vi.advanceTimersByTime(1000);
    expect(watcher.stats.scans).toBe(1);
    host.remove();
  });

  it('stops observing after stop()', async () => {
    watcher.stop();
    document.getElementById('slot')!.innerHTML = '<input aria-label="After stop">';
    await flushMutations();
    vi.advanceTimersByTime(1000);
    expect(watcher.stats.scans).toBe(1);
  });
});
