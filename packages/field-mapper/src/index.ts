/**
 * @jobfill/field-mapper — deterministic, DOM-free mapping of detected form fields
 * to the candidate profile. No AI: a normalizer, a phrase dictionary, value
 * resolution and option matching. Everything here is pure and unit-tested.
 */
export { normalizeText, containsPhrase } from './normalize';
export {
  RULES,
  SENSITIVE_PHRASES,
  CONSENT_PHRASES,
  AUTOCOMPLETE,
  type MappingRule,
} from './dictionary';
export {
  matchField,
  explainMatch,
  phraseScore,
  sectionContext,
  MIN_CONFIDENCE,
  REVIEW_CONFIDENCE,
  type MatchResult,
  type MatchSource,
} from './match';
export { resolveProfileValue, describeValue, isIndexedKey, type ProfileValue } from './values';
export {
  chooseOptions,
  degreeLevel,
  isPlaceholderOption,
  optionPolarity,
  parseRange,
  type OptionChoice,
} from './options';
export {
  planFill,
  displayLabel,
  isOpenEndedQuestion,
  isYesNoQuestion,
  type FillAction,
  type PlanItem,
  type PlanStatus,
} from './plan';
