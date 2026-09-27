import type { FieldKey, Profile } from '@jobfill/types';

/** A profile value in the shape a form needs it. Null = nothing to fill. */
export type ProfileValue =
  | { kind: 'text'; text: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'list'; items: string[] }
  | { kind: 'month'; month: string } // "YYYY-MM"
  | { kind: 'number'; value: number; text: string }
  | { kind: 'file'; fileName: string };

const text = (value: string | undefined): ProfileValue | null =>
  value && value.trim() ? { kind: 'text', text: value.trim() } : null;
const month = (value: string | undefined): ProfileValue | null =>
  value && /^\d{4}-\d{2}$/.test(value) ? { kind: 'month', month: value } : null;
const list = (items: string[]): ProfileValue | null =>
  items.length ? { kind: 'list', items } : null;

/**
 * Resolve a field key to a value. `index` selects the Nth education / experience
 * entry, so a form's second "School" field gets the second school.
 */
export function resolveProfileValue(
  profile: Profile,
  key: FieldKey,
  index = 0,
): ProfileValue | null {
  const { personal: p, professional: pro, skills, links } = profile;
  const edu = profile.education[index];
  const job = profile.experience[index];
  const currentJob = profile.experience.find((e) => e.isCurrent) ?? profile.experience[0];

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
    case 'personal.address':
      return text(p.address);
    case 'personal.city':
      return text(p.city);
    case 'personal.state':
      return text(p.state);
    case 'personal.postalCode':
      return text(p.postalCode);
    case 'personal.country':
      return text(p.country);
    case 'personal.location':
      return text([p.city, p.state, p.country].filter(Boolean).join(', '));

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
    case 'professional.expectedSalary':
      return text(pro.expectedSalary);
    case 'professional.noticePeriod':
      return text(pro.noticePeriod);
    case 'professional.workAuthorization':
      return text(pro.workAuthorization);
    case 'professional.requiresSponsorship':
      // Booleans are only meaningful once the user has saved the professional step.
      return profile.createdAt ? { kind: 'bool', value: pro.requiresSponsorship } : null;
    case 'professional.willingToRelocate':
      return profile.createdAt ? { kind: 'bool', value: pro.willingToRelocate } : null;
    case 'professional.summary':
      return text(pro.summary);
    case 'professional.preferredLocations':
      return list(pro.preferredLocations);

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

    case 'skills.technical':
      return list(skills.technical);
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

    case 'resume':
      return profile.resume ? { kind: 'file', fileName: profile.resume.fileName } : null;
  }
}

/** Keys that index into education[] / experience[] by occurrence. */
export function isIndexedKey(key: FieldKey): boolean {
  return key.startsWith('education.') || key.startsWith('experience.');
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
    case 'number':
      return value.text;
    case 'file':
      return value.fileName;
  }
}
