import { normalizeText } from './normalize';

/**
 * Question classification for application questions that aren't a simple profile
 * field ("Why do you want to work here?", "Describe your experience with React").
 *
 * It only labels questions — it never writes an answer. The planner uses the category
 * to explain why a field was left for the user, and the popup groups by it.
 */

export const QUESTION_CATEGORIES = [
  'PERSONAL',
  'EDUCATION',
  'EXPERIENCE',
  'PROJECT',
  'SKILL',
  'MOTIVATION',
  'CAREER',
  'ACHIEVEMENT',
  'LEADERSHIP',
  'TECHNICAL',
  'LOCATION',
  'AVAILABILITY',
  'SALARY',
  'WORK_AUTHORIZATION',
  'REFERRAL',
  'COMPLIANCE',
  'GENERAL',
  'UNKNOWN',
] as const;

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number];

/** Checked in order — the first match wins, so specific categories come first. */
const PATTERNS: Array<[QuestionCategory, RegExp]> = [
  [
    'WORK_AUTHORIZATION',
    /\b(authori[sz]ed to work|legally (authori[sz]ed|eligible|able)|eligible to work|right to work|work permit|sponsor(ship)?|visa|immigration|citizen(ship)?)\b/,
  ],
  [
    'COMPLIANCE',
    /\b(background (check|verification|screening)|criminal|convicted|conviction|felony|drug (test|screen)|non disclosure|nda|non compete|conflict of interest|relatives? (working|employed)|previously (worked|employed|applied|interviewed)|worked (here|for us) before|applied (here|to us|before))\b/,
  ],
  ['SALARY', /\b(salary|ctc|compensation|pay|remuneration|package|stipend|wage|rate)\b/],
  [
    'AVAILABILITY',
    /\b(notice period|start date|when can you (start|join)|availability|available to (start|join)|earliest|joining date|date of joining|serving notice)\b/,
  ],
  [
    'LOCATION',
    /\b(relocat\w*|location|where are you (based|located)|commute|remote|on ?site|hybrid|work from (home|office)|time ?zone|travel)\b/,
  ],
  [
    'REFERRAL',
    /\b(how did you (hear|find|learn|come)|where did you (hear|find)|referr(al|ed|er)|employee referral|know anyone|source)\b/,
  ],
  ['PROJECT', /\b(project|projects|portfolio piece|something you (built|made|created))\b/],
  [
    'LEADERSHIP',
    /\b(lead|leadership|led|mentor\w*|managed (a )?team|manage people|team lead|took charge|influence)\b/,
  ],
  [
    'ACHIEVEMENT',
    /\b(achievement|accomplishment|proud(est)?|award|recognition|biggest win|success story)\b/,
  ],
  [
    'MOTIVATION',
    /\b(why (do|would) you (want|like)|why are you interested|why (this|our|us|join|here)|interest in (this|the|our)|what (attracts|excites|interests) you|what motivates|motivat\w*|why should we hire|why (are|would) you (be )?a (good|great) fit|passion)\b/,
  ],
  [
    'CAREER',
    /\b(career (goals?|plans?|aspirations?)|where do you see yourself|long term|five years|5 years|aspirations?|reason for (leaving|change)|why (are you|do you want to) leav\w*|looking for a change|next step)\b/,
  ],
  [
    'TECHNICAL',
    /\b(experience (with|in|using) [a-z0-9+#.]+|technical|architecture|system design|algorithm|debug\w*|code|coding|programming|stack|framework|database|api|cloud|deploy\w*|testing)\b/,
  ],
  ['SKILL', /\b(skills?|strengths?|weakness(es)?|proficien\w*|expertise|good at|competenc\w*)\b/],
  [
    'EXPERIENCE',
    /\b(experience|previous (role|job|company|employer)|worked (with|at|in)|startups?|current (role|job)|responsibilit\w*|day to day)\b/,
  ],
  [
    'EDUCATION',
    /\b(degree|universit\w*|college|school|gpa|cgpa|course|studies|graduat\w*|education)\b/,
  ],
  [
    'PERSONAL',
    /\b(about yourself|tell us about you|describe yourself|introduce yourself|hobbies|interests outside|fun fact|who are you)\b/,
  ],
  [
    'GENERAL',
    /\b(anything else|additional (information|comments|details)|other information|comments|questions for us|cover letter)\b/,
  ],
];

export function classifyQuestion(text: string): QuestionCategory {
  // normalizeText drops filler words; keep the punctuation-free lower-case form.
  const t = normalizeText(text);
  if (!t) return 'UNKNOWN';
  for (const [category, pattern] of PATTERNS) if (pattern.test(t)) return category;
  return 'UNKNOWN';
}

/** Short human label for a category, for the popup and debug view. */
export const CATEGORY_LABELS: Record<QuestionCategory, string> = {
  PERSONAL: 'About you',
  EDUCATION: 'Education',
  EXPERIENCE: 'Experience',
  PROJECT: 'Project',
  SKILL: 'Skills',
  MOTIVATION: 'Motivation',
  CAREER: 'Career',
  ACHIEVEMENT: 'Achievement',
  LEADERSHIP: 'Leadership',
  TECHNICAL: 'Technical',
  LOCATION: 'Location',
  AVAILABILITY: 'Availability',
  SALARY: 'Salary',
  WORK_AUTHORIZATION: 'Work authorization',
  REFERRAL: 'Referral',
  COMPLIANCE: 'Background / compliance',
  GENERAL: 'General',
  UNKNOWN: 'Question',
};

/** Why an unanswered question is left for the user, by category. */
export function reviewReasonFor(category: QuestionCategory): string {
  switch (category) {
    case 'WORK_AUTHORIZATION':
      return 'Work authorization — JobFill only answers from what you set in your profile';
    case 'COMPLIANCE':
      return 'Background / compliance question — answer it yourself';
    case 'SALARY':
      return 'Salary question — add it to your profile or answer it yourself';
    case 'MOTIVATION':
    case 'CAREER':
    case 'ACHIEVEMENT':
    case 'LEADERSHIP':
    case 'PERSONAL':
      return 'Open question — write it in your own words (or draft it with AI)';
    case 'TECHNICAL':
    case 'EXPERIENCE':
    case 'SKILL':
    case 'PROJECT':
      return 'Experience question — write it yourself (or draft it with AI from your profile)';
    case 'REFERRAL':
      return 'Referral question — answer it yourself';
    default:
      return 'Open question — write it yourself or use AI';
  }
}
