import type { Profile } from '@jobfill/types';
import type { AnswerRequest, CandidateContext, JobContext } from './types';

/**
 * Data minimization for AI answers.
 *
 * buildContextItems() proposes the smallest useful set of information for ONE
 * question, as separate items the user can see and untick. buildRequest() then
 * turns only the approved items into the AnswerRequest that is sent.
 *
 * Never included, whatever the question: name, email, phone, address, links,
 * salary, work authorization / sponsorship, demographics, resume file.
 */

/** What is never part of an AI request — shown to users on the consent and privacy screens. */
export const NEVER_SENT_TO_AI = [
  'your name',
  'email',
  'phone',
  'address',
  'links',
  'salary',
  'work authorization',
  'demographic answers',
  'resume file',
] as const;

export type ContextItemId =
  | 'jobTitle'
  | 'company'
  | 'jobDescription'
  | 'currentRole'
  | 'skills'
  | 'experience'
  | 'education'
  | 'summary';

export interface ContextItem {
  id: ContextItemId;
  /** "Job title", "Relevant skills"… */
  label: string;
  /** The exact text that will be sent, shown on the consent screen. */
  preview: string;
  source: 'page' | 'profile';
  /** Pre-ticked on the consent screen. */
  selected: boolean;
}

export interface QuestionInput {
  question: string;
  maxLength?: number;
  kind: 'short' | 'long';
}

export const LIMITS = {
  jobDescription: 3000,
  highlights: 300,
  summary: 600,
  skills: 12,
  roles: 2,
} as const;

const STOPWORDS = new Set(
  'a an and are as at be by do does for from have how i in is it me my of on or our that the this to we what when where which who why will with would you your yourself about tell us describe please'.split(
    ' ',
  ),
);

function words(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.]+/g, ' ')
      .split(' ')
      .filter((w) => w.length > 1 && !STOPWORDS.has(w)),
  );
}

function overlap(text: string, vocabulary: Set<string>): number {
  let score = 0;
  for (const w of words(text)) if (vocabulary.has(w)) score++;
  return score;
}

function truncate(text: string, max: number): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

function period(start: string, end: string, current: boolean): string {
  return [start, current ? 'present' : end].filter(Boolean).join(' – ');
}

const EDUCATION_QUESTION =
  /\b(degree|study|studies|studied|education|university|college|school|course|graduat|academic|major)/i;

interface Selection {
  candidate: CandidateContext;
  job: JobContext;
}

/** Everything that COULD be relevant for this question, already minimized. */
function select(question: QuestionInput, profile: Profile, job: JobContext): Selection {
  const vocabulary = words(`${question.question} ${job.title ?? ''} ${job.description ?? ''}`);
  const { professional: pro } = profile;

  // Skills mentioned by the question or the job; otherwise a few top skills.
  const allSkills = [...profile.skills.technical, ...profile.skills.soft];
  const relevantSkills = allSkills.filter((s) => [...words(s)].some((w) => vocabulary.has(w)));
  const skills = (
    relevantSkills.length ? relevantSkills : profile.skills.technical.slice(0, 5)
  ).slice(0, LIMITS.skills);

  // The roles closest to the job, or the most recent one.
  const ranked = profile.experience
    .map((e, index) => ({
      e,
      index,
      score: overlap(`${e.jobTitle} ${e.description} ${e.skills.join(' ')}`, vocabulary),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  const roles = (
    ranked.some((r) => r.score > 0) ? ranked.filter((r) => r.score > 0) : ranked.slice(0, 1)
  )
    .slice(0, LIMITS.roles)
    .map(({ e }) => ({
      title: e.jobTitle,
      company: e.company,
      period: period(e.startDate, e.endDate, e.isCurrent),
      highlights: truncate(e.description, LIMITS.highlights),
    }));

  const education = EDUCATION_QUESTION.test(question.question)
    ? profile.education
        .slice(0, 2)
        .map((e) => ({ degree: e.degree, field: e.fieldOfStudy, institution: e.institution }))
    : [];

  return {
    job: {
      title: job.title?.trim() || undefined,
      company: job.company?.trim() || undefined,
      description: job.description ? truncate(job.description, LIMITS.jobDescription) : undefined,
    },
    candidate: {
      currentRole: [pro.currentTitle, pro.currentCompany].filter(Boolean).join(' at ') || undefined,
      yearsOfExperience: pro.yearsOfExperience || undefined,
      skills: skills.length ? skills : undefined,
      experience: roles.length ? roles : undefined,
      education: education.length ? education : undefined,
      summary: pro.summary ? truncate(pro.summary, LIMITS.summary) : undefined,
    },
  };
}

/** The consent-screen items for one question. Empty items are not offered. */
export function buildContextItems(
  question: QuestionInput,
  profile: Profile,
  job: JobContext,
): ContextItem[] {
  const { job: j, candidate: c } = select(question, profile, job);
  const items: ContextItem[] = [];
  const add = (
    id: ContextItemId,
    label: string,
    preview: string | undefined,
    source: ContextItem['source'],
    selected = true,
  ) => {
    if (preview) items.push({ id, label, preview, source, selected });
  };
  add('jobTitle', 'Job title', j.title, 'page');
  add('company', 'Company', j.company, 'page');
  add('jobDescription', 'Job description (from this page)', j.description, 'page');
  add(
    'currentRole',
    'Current role',
    [c.currentRole, c.yearsOfExperience && `${c.yearsOfExperience} years of experience`]
      .filter(Boolean)
      .join(' · '),
    'profile',
  );
  add('skills', 'Relevant skills', c.skills?.join(', '), 'profile');
  add(
    'experience',
    'Relevant experience',
    c.experience
      ?.map(
        (e) => `${e.title} at ${e.company} (${e.period})${e.highlights ? `: ${e.highlights}` : ''}`,
      )
      .join('\n'),
    'profile',
  );
  add(
    'education',
    'Education',
    c.education?.map((e) => `${e.degree} ${e.field}, ${e.institution}`.trim()).join('\n'),
    'profile',
  );
  // The free-text summary is the most personal item: offered, but not pre-ticked.
  add('summary', 'Your professional summary', c.summary, 'profile', false);
  return items;
}

/** Build the request from approved items only. Anything unticked is not sent. */
export function buildRequest(
  question: QuestionInput,
  profile: Profile,
  job: JobContext,
  approved: ReadonlySet<ContextItemId>,
): AnswerRequest {
  const { job: j, candidate: c } = select(question, profile, job);
  const has = (id: ContextItemId) => approved.has(id);
  return {
    question: question.question,
    constraints: {
      kind: question.kind,
      ...(question.maxLength ? { maxLength: question.maxLength } : {}),
    },
    job: {
      ...(has('jobTitle') && j.title ? { title: j.title } : {}),
      ...(has('company') && j.company ? { company: j.company } : {}),
      ...(has('jobDescription') && j.description ? { description: j.description } : {}),
    },
    candidate: {
      ...(has('currentRole') && c.currentRole ? { currentRole: c.currentRole } : {}),
      ...(has('currentRole') && c.yearsOfExperience
        ? { yearsOfExperience: c.yearsOfExperience }
        : {}),
      ...(has('skills') && c.skills ? { skills: c.skills } : {}),
      ...(has('experience') && c.experience ? { experience: c.experience } : {}),
      ...(has('education') && c.education ? { education: c.education } : {}),
      ...(has('summary') && c.summary ? { summary: c.summary } : {}),
    },
  };
}
