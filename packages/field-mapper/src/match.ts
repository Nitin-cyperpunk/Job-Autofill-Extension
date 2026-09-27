import type { FieldDescriptor, FieldKey } from '@jobfill/types';
import {
  AUTOCOMPLETE,
  CONSENT_PHRASES,
  CONTEXT_WORDS,
  RULES,
  SENSITIVE_PHRASES,
  TEXTUAL,
  type MappingRule,
  type SectionContext,
} from './dictionary';
import { containsPhrase, normalizeText, tokens } from './normalize';

/**
 * Deterministic field → profile mapping.
 *
 * Every text signal the detector collected is normalized and scored against the
 * dictionary. A signal's weight reflects how trustworthy it is (a <label> beats an
 * id), a phrase's score reflects how exactly it matched. The best rule wins.
 */

export type MatchSource =
  | 'autocomplete'
  | 'label'
  | 'ariaLabel'
  | 'placeholder'
  | 'name'
  | 'htmlId'
  | 'dataHints'
  | 'nearbyText'
  | 'type';

export type MatchResult =
  | { kind: 'match'; key: FieldKey; confidence: number; source: MatchSource; phrase: string }
  | { kind: 'sensitive'; reason: 'personal' | 'consent'; phrase: string }
  | { kind: 'none' };

const SOURCE_WEIGHT: Record<Exclude<MatchSource, 'autocomplete' | 'type'>, number> = {
  label: 1,
  ariaLabel: 0.95,
  placeholder: 0.85,
  name: 0.8,
  htmlId: 0.75,
  dataHints: 0.75,
  nearbyText: 0.7,
};

/** Minimum confidence to use a match at all. */
export const MIN_CONFIDENCE = 0.5;
/** Below this, a filled value is flagged for the user to double-check. */
export const REVIEW_CONFIDENCE = 0.72;

interface PreparedRule extends MappingRule {
  normalizedPhrases: string[];
  normalizedExcludes: string[];
}

const PREPARED: PreparedRule[] = RULES.map((rule) => ({
  ...rule,
  normalizedPhrases: [...new Set(rule.phrases.map(normalizeText).filter(Boolean))],
  normalizedExcludes: (rule.exclude ?? []).map(normalizeText).filter(Boolean),
}));
const SENSITIVE = SENSITIVE_PHRASES.map(normalizeText);
const CONSENT = CONSENT_PHRASES.map(normalizeText);

/** How well one normalized text matches one normalized phrase (0–1). */
export function phraseScore(text: string, phrase: string): number {
  if (!text || !phrase) return 0;
  if (text === phrase) return 1;
  const phraseLength = tokens(phrase).length;
  if (containsPhrase(text, phrase)) {
    // Longer phrases are more specific; very long texts (whole sentences) less certain.
    const lengthPenalty = tokens(text).length > 10 ? 0.1 : 0;
    return Math.min(0.95, 0.7 + 0.05 * Math.min(phraseLength, 4)) - lengthPenalty;
  }
  // Joined forms that slipped past the compound list ("candidateemail").
  const compactText = text.replace(/ /g, '');
  const compactPhrase = phrase.replace(/ /g, '');
  if (compactPhrase.length >= 5 && compactText.includes(compactPhrase)) return 0.55;
  return 0;
}

function ruleScore(rule: PreparedRule, text: string): { score: number; phrase: string } {
  if (!text || rule.normalizedExcludes.some((ex) => containsPhrase(text, ex)))
    return { score: 0, phrase: '' };
  let best = { score: 0, phrase: '' };
  for (const phrase of rule.normalizedPhrases) {
    const score = phraseScore(text, phrase);
    // Prefer the longer phrase on ties: "email address" over "address".
    if (
      score > best.score ||
      (score === best.score && score > 0 && phrase.length > best.phrase.length)
    ) {
      best = { score, phrase };
    }
  }
  return best;
}

/** Education / Experience section, from the section heading and the field's name/id. */
export function sectionContext(field: FieldDescriptor): SectionContext | null {
  const texts = [field.section, field.name, field.htmlId].map(normalizeText);
  for (const text of texts) {
    for (const context of ['education', 'experience'] as const) {
      if (CONTEXT_WORDS[context].some((word) => containsPhrase(text, normalizeText(word))))
        return context;
    }
  }
  return null;
}

function signals(
  field: FieldDescriptor,
): Array<[Exclude<MatchSource, 'autocomplete' | 'type'>, string]> {
  return [
    ['label', normalizeText(field.label)],
    ['ariaLabel', normalizeText(field.ariaLabel)],
    ['placeholder', normalizeText(field.placeholder)],
    ['name', normalizeText(field.name)],
    ['htmlId', normalizeText(field.htmlId)],
    ['dataHints', normalizeText(field.dataHints)],
    ['nearbyText', normalizeText(field.nearbyText)],
  ];
}

function findPhrase(texts: string[], phrases: string[]): string | null {
  for (const text of texts)
    for (const phrase of phrases) if (containsPhrase(text, phrase)) return phrase;
  return null;
}

export function matchField(field: FieldDescriptor): MatchResult {
  const texts = signals(field);
  // Sensitive/consent checks only look at what a human reads, not ids.
  const humanTexts = texts
    .filter(
      ([source]) =>
        source === 'label' ||
        source === 'ariaLabel' ||
        source === 'placeholder' ||
        source === 'nearbyText',
    )
    .map(([, text]) => text);

  // 1. Never answer demographic, identity or consent questions for the user.
  const sensitive = findPhrase(humanTexts, SENSITIVE);
  if (sensitive) return { kind: 'sensitive', reason: 'personal', phrase: sensitive };
  if (field.type === 'checkbox' || field.type === 'radio') {
    const consent = findPhrase(humanTexts, CONSENT);
    if (consent) return { kind: 'sensitive', reason: 'consent', phrase: consent };
  }

  // 2. autocomplete="given-name" etc. is authoritative when present.
  for (const token of field.autocomplete.toLowerCase().split(/\s+/).reverse()) {
    const key = AUTOCOMPLETE[token];
    if (key) return { kind: 'match', key, confidence: 1, source: 'autocomplete', phrase: token };
  }

  // 3. Dictionary scoring across every signal.
  const context = sectionContext(field);
  let best: Extract<MatchResult, { kind: 'match' }> | null = null;
  let bestSource: MatchSource | null = null;
  let bestPosition = -1;
  for (const rule of PREPARED) {
    if (!(rule.types ?? TEXTUAL).includes(field.type)) continue;
    if (rule.context && rule.context !== context) continue;
    if (rule.avoidContext && context) continue;
    for (const [source, text] of texts) {
      const { score, phrase } = ruleScore(rule, text);
      if (!score) continue;
      // A context rule that fits its section is more specific than a generic one.
      const confidence = Math.min(1, score * SOURCE_WEIGHT[source] + (rule.context ? 0.05 : 0));
      // Ties go to the phrase found later in the text: ids and labels run from general
      // to specific ("legalNameSection_firstName", "addressSection_city").
      const position = ` ${text} `.lastIndexOf(` ${phrase} `);
      if (
        !best ||
        round(confidence) > best.confidence ||
        (round(confidence) === best.confidence && source === bestSource && position > bestPosition)
      ) {
        best = { kind: 'match', key: rule.key, confidence: round(confidence), source, phrase };
        bestSource = source;
        bestPosition = position;
      }
    }
  }
  if (best && best.confidence >= MIN_CONFIDENCE) return best;

  // 4. The input type alone is a decent hint for email / phone.
  if (field.type === 'email')
    return {
      kind: 'match',
      key: 'personal.email',
      confidence: 0.75,
      source: 'type',
      phrase: 'email',
    };
  if (field.type === 'tel')
    return {
      kind: 'match',
      key: 'personal.phone',
      confidence: 0.75,
      source: 'type',
      phrase: 'tel',
    };
  return { kind: 'none' };
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

const SOURCE_LABELS: Record<MatchSource, string> = {
  autocomplete: 'autocomplete',
  label: 'label',
  ariaLabel: 'aria-label',
  placeholder: 'placeholder',
  name: 'name',
  htmlId: 'id',
  dataHints: 'data attribute',
  nearbyText: 'nearby text',
  type: 'input type',
};

/** One-line human explanation of a mapping decision, for the debug view. */
export function explainMatch(field: FieldDescriptor, result: MatchResult): string {
  if (result.kind === 'none')
    return 'No dictionary phrase matched the label, name, id or nearby text';
  if (result.kind === 'sensitive') {
    return result.reason === 'consent'
      ? `Consent question ("${result.phrase}") — never answered automatically`
      : `Personal question ("${result.phrase}") — never answered automatically`;
  }
  switch (result.source) {
    case 'autocomplete':
      return `autocomplete="${result.phrase}"`;
    case 'type':
      return `input type="${field.type}"`;
    default: {
      const raw: Record<string, string> = {
        label: field.label,
        ariaLabel: field.ariaLabel,
        placeholder: field.placeholder,
        name: field.name,
        htmlId: field.htmlId,
        dataHints: field.dataHints,
        nearbyText: field.nearbyText,
      };
      const text = raw[result.source] ?? '';
      const shown = text.length > 60 ? `${text.slice(0, 57)}…` : text;
      return `${SOURCE_LABELS[result.source]} "${shown}" matched "${result.phrase}"`;
    }
  }
}
