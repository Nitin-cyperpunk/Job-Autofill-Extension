import type { Address, Answer, FieldKey, Profile } from '@jobfill/types';
import { linkForPlatform, skillsInCategory, type LinkPlatform } from './taxonomy';

/** A profile value in the shape a form needs it. Null = nothing to fill. */
export type ProfileValue =
  | { kind: 'text'; text: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'list'; items: string[] }
  | { kind: 'month'; month: string } // "YYYY-MM"
  | { kind: 'date'; date: string } // "YYYY-MM-DD"
  | { kind: 'number'; value: number; text: string }
  | { kind: 'file'; fileName: string };

const text = (value: string | undefined): ProfileValue | null =>
  value && value.trim() ? { kind: 'text', text: value.trim() } : null;
const month = (value: string | undefined): ProfileValue | null =>
  value && /^\d{4}-\d{2}$/.test(value) ? { kind: 'month', month: value } : null;
const date = (value: string | undefined): ProfileValue | null =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) ? { kind: 'date', date: value } : null;
const list = (items: string[]): ProfileValue | null =>
  items.length ? { kind: 'list', items } : null;
const num = (n: number): ProfileValue => ({ kind: 'number', value: n, text: String(n) });
/** An explicit yes/no answer; '' (never answered) resolves to nothing — never a guess. */
const answer = (a: Answer): ProfileValue | null =>
  a === 'yes' ? { kind: 'bool', value: true } : a === 'no' ? { kind: 'bool', value: false } : null;

const WORK_MODE_LABELS: Record<string, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
  flexible: 'Flexible',
};
const JOB_TYPE_LABELS: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
  freelance: 'Freelance',
  temporary: 'Temporary',
  apprenticeship: 'Apprenticeship',
};
export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** "+91 98765 43210" → "+91". Only when the code is clearly separated from the number. */
export function phoneCountryCode(phone: string): string {
  const m = /^\s*(\+\d{1,3})(?:[\s\-().]|$)/.exec(phone);
  return m ? m[1]! : '';
}

/** The phone without its "+CC" prefix, for forms with a separate country-code field. */
export function nationalNumber(phone: string): string {
  const code = phoneCountryCode(phone);
  return code
    ? phone
        .trim()
        .slice(code.length)
        .replace(/^[\s\-().]+/, '')
        .trim()
    : phone.trim();
}

/** Whole years between `iso` (YYYY-MM-DD) and today. */
export function ageFrom(iso: string, today = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < mo || (today.getMonth() + 1 === mo && today.getDate() < d)) age--;
  return age >= 0 && age < 130 ? age : null;
}

function currentAddress(p: Profile['personal']): Address {
  return {
    line1: p.address,
    line2: p.addressLine2,
    landmark: p.landmark,
    city: p.city,
    district: p.district,
    state: p.state,
    postalCode: p.postalCode,
    country: p.country,
  };
}

/** The permanent address: the current one when the user said they're the same. */
export function permanentAddress(profile: Profile): Address {
  const p = profile.personal;
  return p.permanentSameAsCurrent === 'yes' ? currentAddress(p) : p.permanentAddress;
}

/** One-line address for single "Address" boxes when the form has no separate city etc. */
export function formatAddress(a: Address): string {
  return [a.line1, a.line2, a.landmark, a.city, a.district, a.state, a.postalCode, a.country]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');
}

/** Every user-entered skill, de-duplicated: technical + per-role + per-project. */
function allSkills(profile: Profile): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of [
    ...profile.skills.technical,
    ...profile.experience.flatMap((e) => e.skills),
    ...profile.projects.flatMap((p) => p.technologies),
  ]) {
    const k = s.toLowerCase();
    if (!seen.has(k)) {
      seen.add(k);
      out.push(s);
    }
  }
  return out;
}

/** "Payments dashboard (Lead developer): … Technologies: React, Node.js. Live: https://…" */
export function projectSummary(project: Profile['projects'][number]): string {
  const head = project.role ? `${project.name} (${project.role})` : project.name;
  const parts = [project.description ? `${head}: ${project.description}` : head];
  if (project.technologies.length) parts.push(`Technologies: ${project.technologies.join(', ')}.`);
  if (project.outcome) parts.push(`Outcome: ${project.outcome}`);
  if (project.url) parts.push(`Live: ${project.url}`);
  if (project.githubUrl) parts.push(`Code: ${project.githubUrl}`);
  return parts.join(' ').trim();
}

/**
 * Resolve a field key to a value. `index` selects the Nth education / experience /
 * project entry, so a form's second "School" field gets the second school.
 */
export function resolveProfileValue(
  profile: Profile,
  key: FieldKey,
  index = 0,
): ProfileValue | null {
  const { personal: p, professional: pro, skills, links, additional: add } = profile;
  const edu = profile.education[index];
  const job = profile.experience[index];
  const project = profile.projects[index];
  const currentJob = profile.experience.find((e) => e.isCurrent) ?? profile.experience[0];
  const perm = permanentAddress(profile);
  const dob = /^(\d{4})-(\d{2})-(\d{2})$/.exec(p.dateOfBirth);

  switch (key) {
    case 'personal.fullName':
      return text([p.firstName, p.lastName].filter(Boolean).join(' '));
    case 'personal.firstName':
      return text(p.firstName);
    case 'personal.middleName':
      return text(p.middleName);
    case 'personal.lastName':
      return text(p.lastName);
    case 'personal.preferredName':
      return text(p.preferredName || p.firstName);
    case 'personal.email':
      return text(p.email);
    case 'personal.phone':
      return text(p.phone);
    case 'personal.phoneCountryCode':
      return text(phoneCountryCode(p.phone));
    case 'personal.alternatePhone':
      return text(p.alternatePhone);
    case 'personal.dateOfBirth':
      return date(p.dateOfBirth);
    case 'personal.birthDay':
      return dob ? num(Number(dob[3])) : null;
    case 'personal.birthMonth':
      return dob ? text(MONTH_NAMES[Number(dob[2]) - 1]) : null;
    case 'personal.birthYear':
      return dob ? num(Number(dob[1])) : null;
    case 'personal.age': {
      const age = ageFrom(p.dateOfBirth);
      return age === null ? null : num(age);
    }
    case 'personal.gender':
      return text(p.gender);
    case 'personal.pronouns':
      return text(p.pronouns);
    case 'personal.nationality':
      return text(p.nationality);
    case 'personal.citizenship':
      return text(p.citizenship || p.nationality);
    case 'personal.maritalStatus':
      return text(p.maritalStatus);

    case 'personal.address':
      return text(p.address);
    case 'personal.addressLine2':
      return text(p.addressLine2);
    case 'personal.landmark':
      return text(p.landmark);
    case 'personal.city':
      return text(p.city);
    case 'personal.district':
      return text(p.district);
    case 'personal.state':
      return text(p.state);
    case 'personal.postalCode':
      return text(p.postalCode);
    case 'personal.country':
      return text(p.country);
    case 'personal.location':
      return text([p.city, p.state, p.country].filter(Boolean).join(', '));

    case 'personal.permanentSameAsCurrent':
      return answer(p.permanentSameAsCurrent);
    case 'permanent.address':
      return text(perm.line1);
    case 'permanent.addressLine2':
      return text(perm.line2);
    case 'permanent.landmark':
      return text(perm.landmark);
    case 'permanent.city':
      return text(perm.city);
    case 'permanent.district':
      return text(perm.district);
    case 'permanent.state':
      return text(perm.state);
    case 'permanent.postalCode':
      return text(perm.postalCode);
    case 'permanent.country':
      return text(perm.country);

    case 'professional.currentTitle':
      return text(pro.currentTitle || currentJob?.jobTitle);
    case 'professional.currentCompany':
      return text(pro.currentCompany || currentJob?.company);
    case 'professional.yearsOfExperience': {
      const years = Number.parseFloat(pro.yearsOfExperience);
      return Number.isFinite(years)
        ? { kind: 'number', value: years, text: pro.yearsOfExperience }
        : null;
    }
    case 'professional.currentSalary':
      return text(pro.currentSalary);
    case 'professional.expectedSalary':
      return text(pro.expectedSalary);
    case 'professional.salaryCurrency':
      return text(pro.salaryCurrency);
    case 'professional.noticePeriod':
      return text(pro.noticePeriod);
    case 'professional.earliestStartDate':
      return date(pro.earliestStartDate);
    case 'professional.reasonForLeaving':
      return text(currentJob?.reasonForLeaving);
    case 'professional.preferredWorkMode':
      return text(WORK_MODE_LABELS[pro.preferredWorkMode]);
    case 'professional.preferredJobTypes':
      return list(pro.preferredJobTypes.map((t) => JOB_TYPE_LABELS[t] ?? t));
    case 'professional.workAuthorization':
      return text(pro.workAuthorization);
    case 'professional.authorizedToWork':
      // Depends on which country the question names — resolved by the planner.
      return null;
    case 'professional.requiresSponsorship':
      return answer(pro.requiresSponsorship);
    case 'professional.willingToRelocate':
      return answer(pro.willingToRelocate);
    case 'professional.summary':
      return text(pro.summary);
    case 'professional.preferredLocations':
      return list(pro.preferredLocations);

    case 'education.level':
      return text(edu?.level);
    case 'education.institution':
      return text(edu?.institution);
    case 'education.degree':
      return text(edu?.degree);
    case 'education.fieldOfStudy':
      return text(edu?.fieldOfStudy);
    case 'education.gpa':
      return text(edu?.gpa);
    case 'education.location':
      return text(edu?.location);
    case 'education.startDate':
      return month(edu?.startDate);
    case 'education.endDate':
      return month(edu?.endDate);
    case 'education.isCurrent':
      return edu ? { kind: 'bool', value: edu.isCurrent } : null;

    case 'experience.company':
      return text(job?.company);
    case 'experience.jobTitle':
      return text(job?.jobTitle);
    case 'experience.location':
      return text(job?.location);
    case 'experience.startDate':
      return month(job?.startDate);
    case 'experience.endDate':
      return job?.isCurrent ? null : month(job?.endDate);
    case 'experience.isCurrent':
      return job ? { kind: 'bool', value: job.isCurrent } : null;
    case 'experience.description':
      return text(job?.description);

    case 'project.name':
      return text(project?.name);
    case 'project.role':
      return text(project?.role);
    case 'project.description':
      return text(project?.description);
    case 'project.summary':
      return project ? text(projectSummary(project)) : null;
    case 'project.technologies':
      return list(project?.technologies ?? []);
    case 'project.url':
      return text(project?.url);
    case 'project.githubUrl':
      return text(project?.githubUrl);
    case 'project.startDate':
      return month(project?.startDate);
    case 'project.endDate':
      return month(project?.endDate);
    case 'project.outcome':
      return text(project?.outcome);

    case 'skills.technical':
      return list(skills.technical.length ? skills.technical : allSkills(profile));
    case 'skills.programmingLanguages':
      return list(skillsInCategory(allSkills(profile), 'programmingLanguages'));
    case 'skills.frameworks':
      return list(skillsInCategory(allSkills(profile), 'frameworks'));
    case 'skills.databases':
      return list(skillsInCategory(allSkills(profile), 'databases'));
    case 'skills.cloud':
      return list(skillsInCategory(allSkills(profile), 'cloud'));
    case 'skills.soft':
      return list(skills.soft);
    case 'skills.languages':
      return list(skills.languages);

    case 'links.resumeUrl':
      return text(links.resumeUrl);
    case 'links.linkedin':
      return text(links.linkedin);
    case 'links.x':
      return text(links.x);
    case 'links.github':
      return text(links.github);
    case 'links.portfolio':
      return text(links.portfolio || links.website);
    case 'links.website':
      return text(links.website || links.portfolio);
    case 'links.leetcode':
    case 'links.hackerrank':
    case 'links.codechef':
    case 'links.kaggle':
    case 'links.behance':
    case 'links.dribbble':
    case 'links.stackoverflow':
    case 'links.medium': {
      const platform = key.slice('links.'.length) as LinkPlatform;
      const urls = [links.portfolio, links.website, ...links.other.map((l) => l.url)];
      return text(linkForPlatform(urls.filter(Boolean), platform));
    }

    case 'additional.disability':
      return text(add.disability);
    case 'additional.veteranStatus':
      return text(add.veteranStatus);
    case 'additional.ethnicity':
      return text(add.ethnicity);
    case 'additional.backgroundCheck':
      return answer(add.backgroundCheck);
    case 'additional.drugTest':
      return answer(add.drugTest);
    case 'additional.criminalRecord':
      return answer(add.criminalRecord);
    case 'additional.referralSource':
      return text(add.referralSource);
    case 'additional.coverLetter':
      return text(add.coverLetter);

    case 'resume':
      return profile.resume ? { kind: 'file', fileName: profile.resume.fileName } : null;
    case 'coverLetterFile':
      // JobFill stores no cover-letter file: the user attaches it themselves.
      return null;
  }
}

/** Keys that index into education[] / experience[] / projects[] by occurrence. */
export function isIndexedKey(key: FieldKey): boolean {
  return (
    key.startsWith('education.') || key.startsWith('experience.') || key.startsWith('project.')
  );
}

/** The profile list an indexed key reads from. */
export function listFor(key: FieldKey): 'education' | 'experience' | 'projects' | null {
  if (key.startsWith('education.')) return 'education';
  if (key.startsWith('experience.')) return 'experience';
  if (key.startsWith('project.')) return 'projects';
  return null;
}

/** Human-readable preview of a value (used in the preview list and summary). */
export function describeValue(value: ProfileValue): string {
  switch (value.kind) {
    case 'text':
      return value.text;
    case 'bool':
      return value.value ? 'Yes' : 'No';
    case 'list':
      return value.items.join(', ');
    case 'month':
      return value.month;
    case 'date':
      return value.date;
    case 'number':
      return value.text;
    case 'file':
      return value.fileName;
  }
}
