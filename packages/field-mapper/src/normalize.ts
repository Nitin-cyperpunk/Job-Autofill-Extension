/**
 * Text normalization shared by field labels and dictionary phrases, so both sides
 * are always compared in the same form:
 *
 *   "Candidate's First-Name *"  →  "first name"
 *   "emailAddress"              →  "email address"
 *   "Mobile No."                →  "mobile number"
 *   "E-mail"                    →  "email"
 */

/** Joined forms that real forms use in names/ids, expanded into words. */
const COMPOUNDS: Array<[RegExp, string]> = [
  [/\bfirstname\b/g, 'first name'],
  [/\blastname\b/g, 'last name'],
  [/\bmiddlename\b/g, 'middle name'],
  [/\bfullname\b/g, 'full name'],
  [/\bsurname\b/g, 'last name'],
  [/\bfname\b/g, 'first name'],
  [/\blname\b/g, 'last name'],
  [/\bgivenname\b/g, 'given name'],
  [/\bfamilyname\b/g, 'family name'],
  [/\be mail\b/g, 'email'],
  [/\bemailaddress\b/g, 'email address'],
  [/\bphonenumber\b/g, 'phone number'],
  [/\bmobilenumber\b/g, 'mobile number'],
  [/\b(mobile|phone|contact|telephone|cell|tel) no\b/g, '$1 number'],
  [/\btel\b/g, 'telephone'],
  [/\bzipcode\b/g, 'zip code'],
  [/\bpostcode\b/g, 'postal code'],
  [/\bpincode\b/g, 'pin code'],
  [/\baddr\b/g, 'address'],
  [/\blinked in\b/g, 'linkedin'],
  [/\bgit hub\b/g, 'github'],
  [/\bjobtitle\b/g, 'job title'],
  [/\bcv\b/g, 'resume'],
  [/\bcurriculum vitae\b/g, 'resume'],
  [/\bre sum[eé]\b/g, 'resume'],
  [/\brésumé\b/g, 'resume'],
  [/\bdob\b/g, 'date of birth'],
  [/\byrs\b/g, 'years'],
  [/\bexp\b/g, 'experience'],
  [/\buni\b/g, 'university'],
];

/** Words that carry no meaning for mapping ("Please enter your candidate first name"). */
const FILLER = new Set([
  'your',
  'please',
  'enter',
  'provide',
  'candidate',
  'applicant',
  'the',
  'a',
  'an',
  's',
  'my',
  'here',
  'below',
  'eg',
  'e',
  'g',
  'optional',
  'required',
]);

export function normalizeText(input: string | null | undefined): string {
  if (!input) return '';
  let text = input
    .replace(/([a-z])([A-Z])/g, '$1 $2') // firstName → first Name
    .replace(/([a-zA-Z])(\d)/g, '$1 $2') // address1 → address 1
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents: é → e
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  for (const [pattern, replacement] of COMPOUNDS) text = text.replace(pattern, replacement);
  return text
    .split(' ')
    .filter((word) => word && !FILLER.has(word))
    .join(' ');
}

export function tokens(normalized: string): string[] {
  return normalized ? normalized.split(' ') : [];
}

/** True when `needle` occurs in `haystack` as a whole-word sequence. */
export function containsPhrase(haystack: string, needle: string): boolean {
  if (!needle) return false;
  return ` ${haystack} `.includes(` ${needle} `);
}
