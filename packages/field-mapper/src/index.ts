/**
 * @jobfill/field-mapper — deterministic, DOM-free mapping of detected form fields
 * to the candidate profile. No AI: a normalizer, a phrase dictionary, value
 * resolution and option matching. Everything here is pure and unit-tested.
 */
export { normalizeText, containsPhrase } from './normalize';
export {
  RULES,
  NEVER_FILL_PHRASES,
  EXPLICIT_ONLY,
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
export {
  resolveProfileValue,
  describeValue,
  isIndexedKey,
  formatAddress,
  permanentAddress,
  projectSummary,
  type ProfileValue,
} from './values';
export {
  classifyQuestion,
  reviewReasonFor,
  CATEGORY_LABELS,
  QUESTION_CATEGORIES,
  type QuestionCategory,
} from './questions';
export { skillsInCategory, linkForPlatform, LINK_PLATFORMS } from './taxonomy';
export {
  chooseOptions,
  degreeLevel,
  isPlaceholderOption,
  optionPolarity,
  parseRange,
  countryInText,
  sameCountry,
  type OptionChoice,
} from './options';
export {
  planFill,
  planNotes,
  pickProject,
  dateFormatHint,
  handleFromUrl,
  displayLabel,
  isOpenEndedQuestion,
  isYesNoQuestion,
  type FillAction,
  type PlanItem,
  type PlanStatus,
} from './plan';
