import type { SectionId } from '@jobfill/types';

/**
 * Sub-groups of the larger sections, so the UI can show focused cards ("Contact &
 * Address", "Work Authorization") instead of one giant form, while the data stays in
 * one profile section. Each group lists the top-level fields it edits.
 */
export const SECTION_GROUPS = {
  personal: {
    identity: ['firstName', 'middleName', 'lastName', 'preferredName'],
    contact: ['email', 'phone', 'alternatePhone'],
    details: ['dateOfBirth', 'gender', 'pronouns', 'nationality', 'citizenship', 'maritalStatus'],
    current: ['address', 'addressLine2', 'landmark', 'city', 'district', 'state', 'postalCode', 'country'],
    permanent: ['permanentSameAsCurrent', 'permanentAddress'],
  },
  professional: {
    role: ['currentTitle', 'currentCompany', 'yearsOfExperience', 'summary'],
    compensation: ['currentSalary', 'expectedSalary', 'salaryCurrency'],
    availability: ['noticePeriod', 'earliestStartDate'],
    preferences: ['preferredLocations', 'preferredWorkMode', 'willingToRelocate', 'preferredJobTypes'],
    authorization: ['workAuthorization', 'requiresSponsorship', 'authorizedCountries'],
  },
} as const satisfies Partial<Record<SectionId, Record<string, readonly string[]>>>;

export type PersonalGroup = keyof (typeof SECTION_GROUPS)['personal'];
export type ProfessionalGroup = keyof (typeof SECTION_GROUPS)['professional'];

/** Show a group when no filter is given, or when it's in the filter. */
export function groupVisible(groups: readonly string[] | undefined, group: string): boolean {
  return !groups || groups.includes(group);
}

/** Top-level fields covered by these groups of a section (all fields when unfiltered). */
export function fieldsForGroups(id: SectionId, groups: readonly string[] | undefined): Set<string> | null {
  const map = (SECTION_GROUPS as Partial<Record<SectionId, Record<string, readonly string[]>>>)[id];
  if (!groups || !map) return null;
  return new Set(groups.flatMap((g) => map[g] ?? []));
}
