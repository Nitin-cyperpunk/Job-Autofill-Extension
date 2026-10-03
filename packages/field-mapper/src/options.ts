import type { FieldOption } from '@jobfill/types';
import { containsPhrase, normalizeText, tokens } from './normalize';
import type { ProfileValue } from './values';

/**
 * Choosing options in selects, radio groups and checkbox groups. Forms phrase
 * choices in endless ways ("Yes, I will", "USA", "B.Sc.", "3-5 years"), so each
 * value kind has its own matching strategy. Returns null rather than guessing.
 */

export interface OptionChoice {
  indices: number[];
  confidence: number;
}

/** Non-answers like "Select…", "-- Choose --", or an empty value. */
export function isPlaceholderOption(option: FieldOption): boolean {
  const label = normalizeText(option.label);
  return (
    (!option.value.trim() && !label) ||
    /^(select|choose|please select|pick|none selected)\b/.test(label) ||
    /^[-—–\s.]*$/.test(option.label) ||
    (!option.value.trim() && /^(select|choose)/.test(label))
  );
}

// ---- Aliases -----------------------------------------------------------------------

/**
 * Different words for the same answer. A stored value matches any option in its group
 * ("Male" ↔ "Man", "Prefer not to say" ↔ "Decline to self-identify", "April" ↔ "04").
 */
const ALIASES: string[][] = [
  ['united states', 'united states of america', 'usa', 'us', 'u s a', 'america'],
  ['united kingdom', 'uk', 'u k', 'great britain', 'britain', 'gb', 'england'],
  ['united arab emirates', 'uae', 'u a e'],
  ['india', 'in', 'bharat'],
  ['germany', 'deutschland', 'de'],
  ['netherlands', 'the netherlands', 'holland', 'nl'],
  ['south korea', 'korea republic of', 'republic of korea', 'korea'],
  ['canada', 'ca'],
  ['australia', 'au'],
  // Gender (only ever used with the user's own explicit answer)
  ['male', 'man', 'm', 'cisgender male', 'cis male'],
  ['female', 'woman', 'f', 'cisgender female', 'cis female'],
  ['non binary', 'nonbinary', 'non-binary', 'genderqueer', 'gender non conforming'],
  // Declining to answer — EEO, disability, veteran…
  [
    'prefer not to say',
    'prefer not to answer',
    'prefer not to disclose',
    'decline to self identify',
    'decline to answer',
    'decline to state',
    'i don t wish to answer',
    'i do not wish to answer',
    'i don t wish to disclose',
    'do not wish to disclose',
    'choose not to disclose',
    'rather not say',
    'not disclosed',
  ],
  // Months
  ['january', 'jan', '01', '1'],
  ['february', 'feb', '02', '2'],
  ['march', 'mar', '03', '3'],
  ['april', 'apr', '04', '4'],
  ['may', '05', '5'],
  ['june', 'jun', '06', '6'],
  ['july', 'jul', '07', '7'],
  ['august', 'aug', '08', '8'],
  ['september', 'sep', 'sept', '09', '9'],
  ['october', 'oct', '10'],
  ['november', 'nov', '11'],
  ['december', 'dec', '12'],
  // Work mode and job type
  ['remote', 'fully remote', 'work from home', 'wfh', 'remote only'],
  ['hybrid', 'hybrid remote'],
  ['on site', 'onsite', 'on-site', 'in office', 'office', 'in person', 'work from office', 'wfo'],
  ['flexible', 'any', 'no preference', 'open to all', 'open to any'],
  ['full time', 'fulltime', 'permanent', 'full time permanent', 'permanent full time'],
  ['part time', 'parttime'],
  ['internship', 'intern'],
  ['contract', 'contractual', 'contractor', 'fixed term'],
  ['freelance', 'freelancer'],
  ['temporary', 'temp'],
  // Marital status
  ['single', 'unmarried', 'never married'],
  ['married'],
].map((group) => group.map(normalizeText));

function aliasGroup(text: string): string[] | undefined {
  return ALIASES.find((group) => group.includes(text));
}

/** Country alias groups (the first entries of ALIASES), canonical name first. */
const COUNTRY_GROUPS = ALIASES.slice(0, 9);

/** Countries forms commonly name in work-authorization questions. */
const COMMON_COUNTRIES = [
  'india',
  'united states',
  'united kingdom',
  'canada',
  'australia',
  'germany',
  'france',
  'netherlands',
  'ireland',
  'singapore',
  'united arab emirates',
  'japan',
  'south korea',
  'china',
  'new zealand',
  'sweden',
  'norway',
  'denmark',
  'finland',
  'switzerland',
  'austria',
  'belgium',
  'spain',
  'portugal',
  'italy',
  'poland',
  'czech republic',
  'israel',
  'saudi arabia',
  'qatar',
  'brazil',
  'mexico',
  'argentina',
  'south africa',
  'nigeria',
  'kenya',
  'egypt',
  'philippines',
  'indonesia',
  'malaysia',
  'vietnam',
  'thailand',
  'pakistan',
  'bangladesh',
  'sri lanka',
  'nepal',
  'european union',
  'eu',
].map(normalizeText);

/** Two-letter aliases that are also common English words ("in", "us"): never matched alone in prose. */
const AMBIGUOUS_SHORT = new Set(['in', 'us', 'ca', 'de', 'au', 'gb', 'nl', 'u s']);

/** True when two country names refer to the same country ("USA" ≈ "United States"). */
export function sameCountry(a: string, b: string): boolean {
  const x = normalizeText(a);
  const y = normalizeText(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const group = aliasGroup(x);
  return !!group && group.includes(y);
}

/**
 * The country a question names ("…authorized to work in India?"), as written in the
 * user's own list when it matches one of theirs. Null when no country is named.
 */
export function countryInText(text: string, userCountries: string[] = []): string | null {
  const t = normalizeText(text);
  if (!t) return null;
  if (containsPhrase(t, 'the us')) return 'united states';
  const candidates: string[] = [
    ...userCountries.map(normalizeText),
    ...COUNTRY_GROUPS.flat(),
    ...COMMON_COUNTRIES,
  ].filter((c) => c && !AMBIGUOUS_SHORT.has(c) && (c.length > 2 || c === 'uk' || c === 'eu'));
  // Longest first: "united arab emirates" before "emirates"-like partials.
  candidates.sort((a, b) => b.length - a.length);
  const found = candidates.find((c) => containsPhrase(t, c));
  if (!found) return null;
  return userCountries.find((u) => sameCountry(u, found)) ?? aliasGroup(found)?.[0] ?? found;
}

const DEGREE_LEVELS: Array<[level: string, pattern: RegExp]> = [
  ['phd', /\b(ph d|phd|doctorate|doctoral|doctor of|dphil)\b/],
  [
    'master',
    /\b(master|masters|m sc|msc|m s|ms|m a|ma|mba|m tech|mtech|m eng|meng|m e|mca|m com|mcom|m phil|mphil|post ?graduate|pg)\b/,
  ],
  [
    'bachelor',
    /\b(bachelor|bachelors|b sc|bsc|b s|bs|b a|ba|b tech|btech|b eng|beng|b e|bca|b com|bcom|undergraduate|ug)\b/,
  ],
  ['associate', /\bassociate\b/],
  ['diploma', /\bdiploma\b/],
  ['highschool', /\b(high school|secondary|ged|12th|hsc|a levels?)\b/],
];

export function degreeLevel(text: string): string | null {
  const normalized = normalizeText(text);
  for (const [level, pattern] of DEGREE_LEVELS) if (pattern.test(normalized)) return level;
  return null;
}

// ---- Yes / No ---------------------------------------------------------------------------

export function optionPolarity(label: string): boolean | null {
  const t = normalizeText(label);
  if (
    /^(no|n|false|not|none)\b/.test(t) ||
    /\b(i am not|i do not|i don t|i will not|i won t|not required|do not require|no i)\b/.test(t)
  ) {
    return false;
  }
  if (/^(yes|y|true)\b/.test(t) || /\b(i am|i do|i will|i require|i would|yes i)\b/.test(t))
    return true;
  return null;
}

// ---- Numeric ranges ("0-2 years", "5+", "More than 10") ---------------------------------------

export function parseRange(label: string): [number, number] | null {
  const t = label.toLowerCase().replace(/,/g, '');
  let m = /(\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(\d+(?:\.\d+)?)/.exec(t);
  if (m) return [Number(m[1]), Number(m[2])];
  m = /(\d+(?:\.\d+)?)\s*(?:\+|or more|and above|and more|plus)/.exec(t);
  if (m) return [Number(m[1]), Infinity];
  m = /(?:more than|over|above|greater than|>)\s*(\d+(?:\.\d+)?)/.exec(t);
  if (m) return [Number(m[1]) + 1e-9, Infinity];
  m = /(?:less than|under|below|fewer than|<)\s*(\d+(?:\.\d+)?)/.exec(t);
  if (m) return [0, Number(m[1]) - 1e-9];
  if (/\b(fresher|no experience|none)\b/.test(t)) return [0, 0];
  m = /^\D*(\d+(?:\.\d+)?)\D*$/.exec(t);
  if (m) return [Number(m[1]), Number(m[1])];
  return null;
}

// ---- Text ------------------------------------------------------------------------------------

function textScore(option: FieldOption, value: string): number {
  // Phone country codes: "+91" must match "India (+91)" exactly, never "+911" or "+9".
  if (/^\+\d{1,4}$/.test(value.trim())) {
    const code = new RegExp(`\\${value.trim()}(?!\\d)`);
    return code.test(option.label) || code.test(option.value) ? 0.9 : 0;
  }
  const want = normalizeText(value);
  if (!want) return 0;
  let best = 0;
  for (const candidate of [option.label, option.value]) {
    const have = normalizeText(candidate);
    if (!have) continue;
    if (have === want) return 1;
    const group = aliasGroup(want);
    if (group?.includes(have)) best = Math.max(best, 0.95);
    const wantLevel = degreeLevel(want);
    if (wantLevel && wantLevel === degreeLevel(have)) best = Math.max(best, 0.85);
    // "London" vs "London, UK"; "Computer Science" vs "Computer Science & Engineering"
    if (
      want.length >= 3 &&
      have.length >= 3 &&
      (containsPhrase(have, want) || containsPhrase(want, have))
    ) {
      best = Math.max(best, 0.75);
    }
    const a = new Set(tokens(want));
    const b = new Set(tokens(have));
    const overlap = [...a].filter((x) => b.has(x)).length / Math.max(a.size, b.size);
    if (overlap >= 0.6) best = Math.max(best, 0.6);
  }
  return best;
}

function bestByScore(
  options: FieldOption[],
  score: (o: FieldOption) => number,
  min: number,
): OptionChoice | null {
  let best: OptionChoice | null = null;
  options.forEach((option, index) => {
    if (isPlaceholderOption(option)) return;
    const s = score(option);
    if (s >= min && (!best || s > best.confidence)) best = { indices: [index], confidence: s };
  });
  return best;
}

/**
 * Pick the option(s) that express `value`.
 * `multiple` = checkbox group / multi-select: every matching option is chosen.
 */
export function chooseOptions(
  options: FieldOption[],
  value: ProfileValue,
  multiple = false,
): OptionChoice | null {
  switch (value.kind) {
    case 'bool':
      return bestByScore(options, (o) => (optionPolarity(o.label) === value.value ? 0.9 : 0), 0.9);

    case 'number':
      return bestByScore(
        options,
        (o) => {
          const range = parseRange(o.label) ?? parseRange(o.value);
          return range && value.value >= range[0] && value.value <= range[1] ? 0.85 : 0;
        },
        0.85,
      );

    case 'date':
      // A full date in a single dropdown has no reliable match; split Day/Month/Year
      // dropdowns map to their own keys instead.
      return null;

    case 'month': {
      // Year-only dropdowns ("2024") are the common case.
      const year = value.month.slice(0, 4);
      return bestByScore(
        options,
        (o) => (normalizeText(o.label) === year || o.value === year ? 0.9 : 0),
        0.9,
      );
    }

    case 'list': {
      if (!multiple) {
        for (const item of value.items) {
          const choice = bestByScore(options, (o) => textScore(o, item), 0.75);
          if (choice) return choice;
        }
        return null;
      }
      const indices: number[] = [];
      options.forEach((option, index) => {
        if (
          !isPlaceholderOption(option) &&
          value.items.some((item) => textScore(option, item) >= 0.95)
        ) {
          indices.push(index);
        }
      });
      return indices.length ? { indices, confidence: 0.9 } : null;
    }

    case 'text':
      return bestByScore(options, (o) => textScore(o, value.text), 0.6);

    case 'file':
      return null;
  }
}
