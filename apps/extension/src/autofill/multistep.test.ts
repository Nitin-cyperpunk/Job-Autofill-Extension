// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '@jobfill/types';
import type { FillSummary } from '@jobfill/shared';
import { FieldWatcher } from '@/field-detection';
import { sampleProfile } from '../../../../packages/field-mapper/src/test-helpers';
import { ContinueSession } from './continue-session';
import { fillPage } from './run-autofill';

/**
 * A realistic multi-step application: the user clicks Autofill on step 1, then moves
 * through the steps themself. Each new step renders (like a single-page app) and the
 * "keep filling new steps" session must fill it — without ever clicking Next/Submit,
 * guessing missing answers, overwriting what the user typed or ticking consent.
 */

let profile: Profile;
vi.mock('@/storage', () => ({
  loadProfile: async () => structuredClone(profile),
  loadResume: async () => null,
}));

function withPersonalDetails(): Profile {
  const p = sampleProfile();
  p.personal = {
    ...p.personal,
    firstName: 'Nitin',
    lastName: 'Singh',
    email: 'nitin@example.com',
    phone: '+91 98765 43210',
    address: 'Flat 302, MG Road',
    addressLine2: 'Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560038',
    country: 'India',
    dateOfBirth: '1999-04-21',
    gender: 'Male',
  };
  p.professional = { ...p.professional, authorizedCountries: ['India'], willingToRelocate: 'yes' };
  return p;
}

const STEPS: Record<number, string> = {
  1: `<h2>Your details</h2>
      <label>First Name <input id="first" name="first_name"></label>
      <label>Last Name <input id="last" name="last_name"></label>
      <label>Email <input id="email" type="email" name="email"></label>
      <label>Phone <input id="phone" type="tel" name="phone"></label>`,
  2: `<fieldset><legend>Education</legend>
        <label>College / University <input id="college" name="college"></label>
        <label>Degree <input id="degree" name="degree"></label>
      </fieldset>`,
  3: `<fieldset><legend>Current Address</legend>
        <label>Address Line 1 <input id="addr1" name="addr1"></label>
        <label>Address Line 2 <input id="addr2" name="addr2"></label>
        <label>City <input id="city" name="city"></label>
        <label>State <input id="state" name="state"></label>
        <label>Country <input id="country" name="country"></label>
        <label>PIN Code <input id="pin" name="pin"></label>
      </fieldset>`,
  4: `<fieldset><legend>Gender</legend>
        <label><input type="radio" name="gender" value="male"> Male</label>
        <label><input type="radio" name="gender" value="female"> Female</label>
        <label><input type="radio" name="gender" value="other"> Other</label>
        <label><input type="radio" name="gender" value="na"> Prefer not to say</label>
      </fieldset>
      <label>Date of Birth <input id="dob" type="date" name="dob"></label>
      <label>Birth date (text) <input id="dob-text" name="dob2" placeholder="DD/MM/YYYY"></label>
      <fieldset><legend>Are you legally authorized to work in India?</legend>
        <label><input type="radio" name="auth" value="yes"> Yes</label>
        <label><input type="radio" name="auth" value="no"> No</label>
      </fieldset>
      <fieldset><legend>Are you willing to relocate?</legend>
        <label><input type="radio" name="reloc" value="yes"> Yes</label>
        <label><input type="radio" name="reloc" value="no"> No</label>
      </fieldset>`,
  5: `<label>Why do you want to join us? <textarea id="why" name="why"></textarea></label>
      <label><input id="consent" type="checkbox" name="consent" required> I agree to the terms and privacy policy</label>`,
};

let watcher: FieldWatcher;
let session: ContinueSession;
let runs: FillSummary[];
let buttonClicks: number;
let submits: number;

/** The user clicks "Next": the app swaps in the next step. */
async function userGoesToStep(n: number) {
  document.getElementById('step')!.innerHTML = STEPS[n]!;
  await settle();
}

async function settle(ms = 900) {
  await new Promise((r) => setTimeout(r, ms));
}

const value = (id: string) => document.querySelector<HTMLInputElement>(`#${id}`)!.value;
const checked = (sel: string) => document.querySelector<HTMLInputElement>(sel)!.checked;

beforeEach(async () => {
  profile = withPersonalDetails();
  document.body.innerHTML = `<form id="app"><div id="step">${STEPS[1]}</div>
    <button type="button" id="next">Next</button><button type="submit">Submit</button></form>`;
  buttonClicks = 0;
  submits = 0;
  document
    .querySelectorAll('button')
    .forEach((b) => b.addEventListener('click', () => buttonClicks++));
  document.querySelector('form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    submits++;
  });
  watcher = new FieldWatcher(document, {
    isVisible: () => true, // jsdom has no layout
    debounceMs: 50,
    maxWaitMs: 200,
    minIntervalMs: 50,
  });
  watcher.start();
  runs = [];
  session = new ContinueSession({
    subscribe: (l) => watcher.subscribe(l),
    getFields: () => watcher.getFields(),
    run: (skip) => fillPage(() => watcher.scanNow(), { skipIds: skip, settleMs: 0 }),
    onRun: (s) => runs.push(s),
    debounceMs: 100,
    minIntervalMs: 0,
  });
  // The user's own Autofill click on step 1, then the session starts.
  await fillPage(() => watcher.scanNow(), { settleMs: 0 });
  session.start(watcher.getFields().map((f) => f.descriptor.id));
});

afterEach(() => {
  session.stop();
  watcher.stop();
});

describe('multi-step applications: keep filling new steps', () => {
  it('fills each step as it appears — address, gender, DOB, authorization near the end', async () => {
    expect(value('first')).toBe('Nitin');

    await userGoesToStep(2);
    expect(value('college')).toBe('University of London');

    await userGoesToStep(3);
    expect(value('addr1')).toBe('Flat 302, MG Road');
    expect(value('addr2')).toBe('Indiranagar');
    expect(value('city')).toBe('Bengaluru');
    expect(value('state')).toBe('Karnataka');
    expect(value('country')).toBe('India');
    expect(value('pin')).toBe('560038');

    await userGoesToStep(4);
    expect(checked('input[name=gender][value=male]')).toBe(true);
    expect(value('dob')).toBe('1999-04-21');
    expect(value('dob-text')).toBe('21/04/1999');
    expect(checked('input[name=auth][value=yes]')).toBe(true);
    expect(checked('input[name=reloc][value=yes]')).toBe(true);

    await userGoesToStep(5);
    expect(value('why')).toBe(''); // open question: the user's own words
    expect(checked('#consent')).toBe(false); // never ticked
    const last = runs.at(-1)!;
    expect(last.questions?.map((q) => q.label)).toContain('Why do you want to join us?');

    // The user navigates; JobFill never clicks or submits.
    expect(buttonClicks).toBe(0);
    expect(submits).toBe(0);
  });

  it('never guesses a missing gender, DOB or address', async () => {
    profile = sampleProfile(); // no gender / DOB, and a UK address without line 2
    profile.personal.address = '';
    profile.personal.city = '';
    profile.personal.postalCode = '';
    await userGoesToStep(3);
    expect(value('addr1')).toBe('');
    expect(value('city')).toBe('');
    expect(value('pin')).toBe('');
    await userGoesToStep(4);
    expect(
      [...document.querySelectorAll<HTMLInputElement>('input[name=gender]')].some((r) => r.checked),
    ).toBe(false);
    expect(value('dob')).toBe('');
    const outcomes = runs.flatMap((r) => r.outcomes ?? []);
    const gender = outcomes.find((o) => o.key === 'personal.gender');
    const dob = outcomes.find((o) => o.key === 'personal.dateOfBirth');
    expect(gender?.status).toBe('needs-review');
    expect(dob?.status).toBe('needs-review');
    expect(outcomes.some((o) => o.status === 'filled' && o.key === 'personal.gender')).toBe(false);
  });

  it('never overwrites what the user typed on a later step', async () => {
    document.getElementById('step')!.innerHTML = STEPS[3]!;
    document.querySelector<HTMLInputElement>('#city')!.value = 'Mysuru';
    await settle();
    expect(value('city')).toBe('Mysuru');
    expect(value('addr1')).toBe('Flat 302, MG Road');
    const city = runs.flatMap((r) => r.outcomes ?? []).find((o) => o.key === 'personal.city');
    expect(city?.status).toBe('already-filled');
  });

  it('stops when the user stops it', async () => {
    session.stop();
    await userGoesToStep(3);
    expect(value('city')).toBe('');
  });

  it('a gender <select> and a gender text box on a later step', async () => {
    document.getElementById('step')!.innerHTML = `
      <label>Gender <select id="g-select"><option value="">Select</option><option>Female</option><option>Male</option><option>Non-binary</option><option>Prefer not to say</option></select></label>
      <label>Sex <input id="g-text" name="sex"></label>`;
    await settle();
    expect(value('g-select')).toBe('Male');
    expect(value('g-text')).toBe('Male');
  });
});

describe('ContinueSession', () => {
  it('debounces bursts and caps runs', async () => {
    let fields = 0;
    const listeners: Array<() => void> = [];
    let calls = 0;
    const s = new ContinueSession({
      subscribe: (l) => {
        listeners.push(() => l([]));
        return () => undefined;
      },
      getFields: () =>
        Array.from({ length: fields }, (_, i) => ({ descriptor: { id: `f${i}` } }) as never),
      run: async () => {
        calls++;
        return { filledCount: 0, filled: [], review: [], skipped: 0 };
      },
      debounceMs: 20,
      minIntervalMs: 0,
      maxRuns: 2,
    });
    s.start();
    for (let i = 0; i < 5; i++) {
      fields++;
      listeners.forEach((l) => l());
    }
    await new Promise((r) => setTimeout(r, 60));
    expect(calls).toBe(1); // one burst → one run
    for (let round = 0; round < 4; round++) {
      fields++;
      listeners.forEach((l) => l());
      await new Promise((r) => setTimeout(r, 40));
    }
    expect(calls).toBe(2); // capped
    expect(s.active).toBe(false);
  });
});
