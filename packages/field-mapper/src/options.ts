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

const COUNTRY_ALIASES: string[][] = [
  ['united states', 'united states of america', 'usa', 'us', 'u s a', 'america'],
  ['united kingdom', 'uk', 'u k', 'great britain', 'britain', 'gb', 'england'],
  ['united arab emirates', 'uae', 'u a e'],
  ['india', 'in', 'bharat'],
  ['germany', 'deutschland', 'de'],
  ['netherlands', 'the netherlands', 'holland', 'nl'],
  ['south korea', 'korea republic of', 'republic of korea', 'korea'],
  ['canada', 'ca'],
  ['australia', 'au'],
].map((group) => group.map(normalizeText));

function aliasGroup(text: string): string[] | undefined {
  return COUNTRY_ALIASES.find((group) => group.includes(text));
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
