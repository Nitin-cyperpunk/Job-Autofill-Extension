import type { EmploymentType } from '@jobfill/types';

/**
 * Heuristic, local résumé parser: plain text → structured fields.
 *
 * Résumés vary endlessly, so this aims for "right or empty": it only fills what it
 * can recognise with reasonable confidence, and everything goes through a review
 * screen before touching the profile.
 */

export interface ExtractedEducation {
  degree: string;
  fieldOfStudy: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  description: string;
}

export interface ExtractedExperience {
  company: string;
  jobTitle: string;
  employmentType: EmploymentType | '';
  location: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  description: string;
  skills: string[];
  /** Dates had no month; January was assumed. */
  monthAssumed: boolean;
}

export interface ExtractedProject {
  name: string;
  description: string;
  technologies: string[];
  url: string;
  githubUrl: string;
}

export interface ExtractedCertification {
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export interface ExtractedResume {
  personal: {
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    phone: string;
    city: string;
    state: string;
    country: string;
  };
  professional: {
    currentTitle: string;
    currentCompany: string;
    summary: string;
    yearsOfExperience: string;
  };
  skills: { technical: string[]; languages: string[] };
  education: ExtractedEducation[];
  experience: ExtractedExperience[];
  projects: ExtractedProject[];
  certifications: ExtractedCertification[];
  links: { linkedin: string; github: string; portfolio: string; website: string };
}

// ---- Sections ------------------------------------------------------------------------------------

type Section =
  | 'header'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | 'other';

const HEADINGS: Record<Exclude<Section, 'header'>, string[]> = {
  summary: [
    'summary',
    'professional summary',
    'profile',
    'professional profile',
    'about me',
    'about',
    'objective',
    'career objective',
    'career summary',
    'personal statement',
  ],
  experience: [
    'experience',
    'work experience',
    'professional experience',
    'employment',
    'employment history',
    'work history',
    'relevant experience',
    'career history',
    'professional background',
  ],
  education: [
    'education',
    'academic background',
    'education and training',
    'education & training',
    'qualifications',
    'academic qualifications',
    'academics',
  ],
  skills: [
    'skills',
    'technical skills',
    'core skills',
    'key skills',
    'core competencies',
    'competencies',
    'technologies',
    'tools',
    'skills & tools',
    'skills and tools',
    'tech stack',
    'expertise',
    'areas of expertise',
    'skills & technologies',
    'technical proficiencies',
  ],
  projects: [
    'projects',
    'personal projects',
    'selected projects',
    'key projects',
    'side projects',
    'open source',
    'academic projects',
    'project experience',
  ],
  certifications: [
    'certifications',
    'certificates',
    'certification',
    'licenses & certifications',
    'licenses and certifications',
    'licences & certifications',
    'courses',
    'certifications & courses',
    'training & certifications',
  ],
  languages: ['languages', 'language skills', 'spoken languages'],
  other: [
    'interests',
    'hobbies',
    'references',
    'volunteering',
    'volunteer experience',
    'awards',
    'honors',
    'honours',
    'publications',
    'achievements',
    'activities',
    'leadership',
    'extracurricular activities',
  ],
};

const HEADING_LOOKUP = new Map<string, Section>(
  Object.entries(HEADINGS).flatMap(([section, names]) => names.map((n) => [n, section as Section])),
);

function headingOf(line: string): Section | null {
  if (line.length > 45) return null;
  const key = line
    .toLowerCase()
    .replace(/[:.]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  return HEADING_LOOKUP.get(key) ?? null;
}

const BULLET = /^[\s•·▪●◦○■□➢➤►\-–—*]+/;
const stripBullet = (line: string) => line.replace(BULLET, '').trim();
const isBullet = (line: string) => BULLET.test(line) && /^[\s•·▪●◦○■□➢➤►*]|^[-–—]\s/.test(line);

function splitSections(text: string): Map<Section, string[]> {
  const sections = new Map<Section, string[]>([['header', []]]);
  let current: Section = 'header';
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    const heading = headingOf(line);
    if (heading) {
      current = heading;
      if (!sections.has(current)) sections.set(current, []);
      continue;
    }
    sections.get(current)!.push(raw.trim());
  }
  return sections;
}

// ---- Contact details ---------------------------------------------------------------------------

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE = /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{1,4}\)[\s.-]?)?\d[\d\s.-]{6,}\d/;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s|,;()]*)?/gi;

function findPhone(lines: string[]): string {
  for (const line of lines) {
    for (const segment of line.split(/[|•·]/)) {
      const m = PHONE.exec(segment);
      if (!m) continue;
      const digits = m[0].replace(/\D/g, '');
      // Not a date range ("2019 - 2021") or a postal code.
      if (digits.length < 8 || digits.length > 15 || /^\s*\d{4}\s*[-–]\s*\d{4}\s*$/.test(m[0]))
        continue;
      return m[0].trim();
    }
  }
  return '';
}

function normalizeUrl(url: string): string {
  const clean = url.replace(/[.,;)]+$/, '');
  return /^https?:\/\//i.test(clean) ? clean : `https://${clean}`;
}

function findLinks(text: string) {
  const links = { linkedin: '', github: '', portfolio: '', website: '' };
  for (const m of text.matchAll(URL_RE)) {
    const url = m[0];
    const start = m.index ?? 0;
    // Part of an email address ("ada.lovelace@example.com" → neither side is a website).
    if (text[start - 1] === '@' || text[start + url.length] === '@' || url.includes('@')) continue;
    const host = url
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .toLowerCase();
    if (!/^[a-z0-9-]+\.[a-z]{2,}/.test(host) || /^\d/.test(host)) continue;
    if (host.startsWith('linkedin.com/')) links.linkedin ||= normalizeUrl(url);
    else if (host.startsWith('github.com/') && host.split('/').filter(Boolean).length === 2)
      links.github ||= normalizeUrl(url);
    else if (host.startsWith('github.com/'))
      continue; // a repo link belongs to a project
    else if (/^(gmail|yahoo|outlook|hotmail)\.com/.test(host)) continue;
    else if (!links.portfolio && /portfolio|behance|dribbble|\.dev\b|\.io\b|\.me\b/.test(host))
      links.portfolio = normalizeUrl(url);
    else if (!links.website && host.includes('/') === false) links.website = normalizeUrl(url);
  }
  return links;
}

const US_STATES = new Set(
  'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY DC'.split(
    ' ',
  ),
);
const LOCATION = /^([A-Z][A-Za-z .'-]+?),\s*([A-Z][A-Za-z .'-]+?)(?:,\s*([A-Z][A-Za-z .'-]+))?$/;

function parseLocation(segment: string): { city: string; state: string; country: string } | null {
  const m = LOCATION.exec(segment.trim());
  if (!m || /\d|@/.test(segment) || segment.length > 60) return null;
  const [, city, second, third] = m;
  if (third) return { city: city!, state: second!, country: third };
  if (US_STATES.has(second!)) return { city: city!, state: second!, country: 'United States' };
  return { city: city!, state: '', country: second! };
}

function titleCase(s: string): string {
  return s === s.toUpperCase() ? s.toLowerCase().replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : s;
}

function looksLikeName(line: string): boolean {
  const words = line.trim().split(/\s+/);
  return (
    words.length >= 2 &&
    words.length <= 4 &&
    line.length <= 50 &&
    !/[\d@/|:]/.test(line) &&
    words.every((w) => /^\p{Lu}[\p{L}'’.-]*$/u.test(w) || /^\p{Lu}+$/u.test(w))
  );
}

// ---- Dates -----------------------------------------------------------------------------------------

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_RE =
  '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const DATE_RE = `(?:${MONTH_RE}\\.?\\s*\\d{4}|\\d{1,2}\\s*[/.-]\\s*\\d{4}|\\d{4})`;
const RANGE = new RegExp(
  `(${DATE_RE})\\s*(?:-|–|—|to|until)\\s*(${DATE_RE}|present|current|now|today|ongoing)`,
  'i',
);

function toMonth(date: string): { value: string; monthAssumed: boolean } {
  const d = date.toLowerCase().trim();
  const named = new RegExp(`^(${MONTH_RE})\\.?\\s*(\\d{4})$`, 'i').exec(d);
  if (named) {
    const month = MONTHS.findIndex((m) => named[1]!.startsWith(m)) + 1;
    return { value: `${named[2]}-${String(month).padStart(2, '0')}`, monthAssumed: false };
  }
  const numeric = /^(\d{1,2})\s*[/.-]\s*(\d{4})$/.exec(d);
  if (numeric && Number(numeric[1]) >= 1 && Number(numeric[1]) <= 12) {
    return { value: `${numeric[2]}-${numeric[1]!.padStart(2, '0')}`, monthAssumed: false };
  }
  const year = /^(\d{4})$/.exec(d);
  if (year) return { value: `${year[1]}-01`, monthAssumed: true };
  return { value: '', monthAssumed: false };
}

function parseRange(text: string) {
  const m = RANGE.exec(text);
  if (!m) return null;
  const start = toMonth(m[1]!);
  const current = /present|current|now|today|ongoing/i.test(m[2]!);
  const end = current ? { value: '', monthAssumed: false } : toMonth(m[2]!);
  return {
    start: start.value,
    end: end.value,
    current,
    monthAssumed: start.monthAssumed || end.monthAssumed,
    match: m[0],
  };
}

// ---- Experience ------------------------------------------------------------------------------------

const TITLE_WORDS =
  /\b(engineer|developer|manager|designer|analyst|scientist|intern|lead|director|consultant|architect|specialist|officer|head|associate|coordinator|administrator|researcher|assistant|founder|co-founder|executive|vp|president|technician|teacher|nurse|accountant|programmer|strategist|advisor|owner|partner|representative|writer|editor|producer|recruiter|product owner|scrum master|sde|swe)\b/i;

function segments(line: string): string[] {
  return line
    .split(/\s+[|•·@]\s+|\s+[—–]\s+|\s+-\s+|\s+at\s+|\t+/i)
    .map((s) => s.replace(/^[,;\s]+|[,;\s]+$/g, '').trim())
    .filter(Boolean);
}

function employmentType(text: string): EmploymentType | '' {
  const t = text.toLowerCase();
  if (/\bintern(ship)?\b/.test(t)) return 'internship';
  if (/\bpart[- ]time\b/.test(t)) return 'part-time';
  if (/\bcontract(or)?\b/.test(t)) return 'contract';
  if (/\bfreelance\b/.test(t)) return 'freelance';
  if (/\bfull[- ]time\b/.test(t)) return 'full-time';
  return '';
}

function isMetaLine(line: string): boolean {
  const parts = line.split(/\s*[|•·,]\s*/).filter(Boolean);
  return (
    line.length < 60 &&
    (Boolean(parseLocation(line)) ||
      parts.every((p) =>
        /^(remote|hybrid|on-?site|full[- ]time|part[- ]time|contract|internship|freelance)$/i.test(
          p,
        ),
      ))
  );
}

function parseExperience(lines: string[]): ExtractedExperience[] {
  const rangeLines = lines.map((l, i) => (RANGE.test(l) ? i : -1)).filter((i) => i >= 0);
  const entries: ExtractedExperience[] = [];
  let prevEnd = -1;
  rangeLines.forEach((r, k) => {
    const h = headerStart(lines, r, prevEnd);
    const nextStart =
      k + 1 < rangeLines.length ? headerStart(lines, rangeLines[k + 1]!, r) : lines.length;
    const range = parseRange(lines[r]!)!;
    const header = lines
      .slice(h, r + 1)
      .map((l, idx) => (h + idx === r ? l.replace(range.match, '') : l));
    // Short metadata lines right under the dates ("London, UK", "Remote · Full-time")
    // belong to the header, not the description.
    let bodyStart = r + 1;
    while (bodyStart < nextStart && !isBullet(lines[bodyStart]!) && isMetaLine(lines[bodyStart]!)) {
      header.push(lines[bodyStart]!);
      bodyStart++;
    }
    const bodyLines = lines.slice(bodyStart, nextStart);
    prevEnd = nextStart - 1;

    const parts = header.flatMap(segments).filter((p) => !/^[()\s,]*$/.test(p));
    let location = '';
    const rest: string[] = [];
    for (const p of parts) {
      if (!location && (parseLocation(p) || /^remote$/i.test(p))) location = p;
      else rest.push(p.replace(/[()]/g, '').trim());
    }
    const titleIdx = rest.findIndex((p) => TITLE_WORDS.test(p));
    const jobTitle = titleIdx >= 0 ? rest[titleIdx]! : (rest[0] ?? '');
    const company =
      rest.find((p, i) => i !== (titleIdx >= 0 ? titleIdx : 0) && !TITLE_WORDS.test(p)) ?? '';
    const description = bodyLines.map(stripBullet).filter(Boolean).join('\n');
    const skillLine = bodyLines.find((l) =>
      /^(skills|tech(nologies)?|stack|tools)\s*:/i.test(stripBullet(l)),
    );

    entries.push({
      jobTitle,
      company,
      employmentType: employmentType(header.join(' ')),
      location,
      startDate: range.start,
      endDate: range.end,
      isCurrent: range.current,
      description,
      skills: skillLine ? splitList(stripBullet(skillLine).replace(/^[^:]+:/, '')) : [],
      monthAssumed: range.monthAssumed,
    });
  });
  return entries.filter((e) => e.jobTitle || e.company);
}

/**
 * Where a role's header starts: the date line, plus up to 2 lines above it that look
 * like header text. Stops at bullets, other date lines and sentences — PDF exports
 * often drop bullet glyphs, so a description line can look like plain text.
 * If the date line itself already names title and company, nothing above is taken.
 */
function headerStart(lines: string[], rangeLine: number, floor: number): number {
  const own = lines[rangeLine]!.replace(RANGE, '');
  if (segments(own).length >= 2) return rangeLine;
  let h = rangeLine;
  while (h - 1 > floor && rangeLine - (h - 1) <= 2) {
    const above = lines[h - 1]!;
    const sentence = /[.!?]$/.test(above.trim()) || above.length > 80;
    if (isBullet(above) || RANGE.test(above) || sentence) break;
    h--;
  }
  return h;
}

// ---- Education -------------------------------------------------------------------------------------

const INSTITUTION =
  /\b(university|college|institute|school|academy|polytechnic|conservatory|iit|nit|mit)\b/i;
const DEGREE =
  /\b(bachelor(?:'s|’s)?(?: of [a-z ]+?)?|master(?:'s|’s)?(?: of [a-z ]+?)?|b\.?\s?sc\.?|m\.?\s?sc\.?|b\.?\s?tech\.?|m\.?\s?tech\.?|b\.?\s?eng\.?|m\.?\s?eng\.?|b\.?a\.|m\.?a\.|b\.?s\.|m\.?s\.|mba|ph\.?\s?d\.?|doctorate|diploma|associate(?:'s)? degree|high school|bca|mca|b\.?\s?com|m\.?\s?com|a[- ]levels?|gcse)(?=[\s,.:;(]|$)/i;
const GPA = /\b(?:c?gpa|grade|cgpa)\s*[:-]?\s*([\d.]+\s*(?:\/\s*[\d.]+)?)/i;

/**
 * "M.Sc. in Mathematics" / "B.Sc. Computer Science" / "Bachelor of Science in Physics"
 * / "MBA, Finance" → degree + field of study.
 */
export function splitDegree(text: string): { degree: string; field: string } {
  const m = DEGREE.exec(text);
  if (!m) return { degree: text.trim(), field: '' };
  let degree = text.slice(0, m.index + m[0].length).trim();
  let rest = text.slice(m.index + m[0].length).replace(/^[\s,:–—-]+/, '');
  const ofIn = /^of\s+(.+?)\s+in\s+(.+)$/i.exec(rest); // "of Science in Physics"
  if (ofIn) return { degree: `${degree} of ${ofIn[1]}`, field: ofIn[2]!.trim() };
  if (/^of\s+/i.test(rest)) {
    degree = `${degree} ${rest}`.trim(); // "Bachelor of Arts": the whole thing is the degree
    rest = '';
  }
  return {
    degree,
    field: rest
      .replace(/^(in|of)\s+/i, '')
      .replace(/[,.]+$/, '')
      .trim(),
  };
}

function parseEducation(lines: string[]): ExtractedEducation[] {
  const entries: ExtractedEducation[] = [];
  let current: ExtractedEducation | null = null;
  const blank = (): ExtractedEducation => ({
    degree: '',
    fieldOfStudy: '',
    institution: '',
    location: '',
    startDate: '',
    endDate: '',
    gpa: '',
    description: '',
  });

  for (const raw of lines) {
    const line = stripBullet(raw);
    const hasInstitution = INSTITUTION.test(line);
    const degreeMatch = DEGREE.exec(line);
    if (
      !current ||
      (hasInstitution && current.institution) ||
      (degreeMatch && current.degree && !hasInstitution)
    ) {
      if (hasInstitution || degreeMatch || !current) {
        current = blank();
        entries.push(current);
      }
    }
    const range = parseRange(line);
    let rest = range ? line.replace(range.match, '') : line;
    if (range) {
      current.startDate ||= range.start;
      current.endDate ||= range.end;
    } else {
      const year = /\b(19|20)\d{2}\b/.exec(line);
      if (year && !current.endDate && (hasInstitution || degreeMatch || line.length < 20)) {
        current.endDate = `${year[0]}-06`;
        rest = rest.replace(year[0], '');
      }
    }
    const gpa = GPA.exec(rest);
    if (gpa) {
      current.gpa ||= gpa[1]!.replace(/\s+/g, '');
      rest = rest.replace(gpa[0], '');
    }
    for (const part of segments(rest)) {
      const p = part.replace(/^[,;\s(]+|[,;\s)]+$/g, '');
      if (!p) continue;
      if (INSTITUTION.test(p) && !current.institution) current.institution = p;
      else if (DEGREE.test(p) && !current.degree) {
        const { degree, field } = splitDegree(p);
        current.degree = degree;
        if (field && !INSTITUTION.test(field)) current.fieldOfStudy ||= field;
      } else if (!current.location && parseLocation(p)) current.location = p;
      else if (
        current.degree &&
        !current.fieldOfStudy &&
        !INSTITUTION.test(p) &&
        p.length < 60 &&
        !/\d/.test(p)
      ) {
        current.fieldOfStudy = p;
      } else if (isBullet(raw))
        current.description = [current.description, p].filter(Boolean).join('\n');
    }
  }
  return entries.filter((e) => e.institution || e.degree);
}

// ---- Skills, projects, certifications ---------------------------------------------------------------

function splitList(text: string): string[] {
  return text
    .split(/[,;|•·]|\s{2,}|\s\/\s/)
    .map((s) => stripBullet(s).replace(/\.$/, '').trim())
    .filter((s) => s.length > 0 && s.length <= 40);
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const k = i.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function parseSkills(lines: string[]) {
  const technical: string[] = [];
  const languages: string[] = [];
  for (const raw of lines) {
    const line = stripBullet(raw);
    const labelled = /^([^:]{2,30}):\s*(.+)$/.exec(line);
    const items = splitList(labelled ? labelled[2]! : line);
    if (labelled && /language/i.test(labelled[1]!) && !/programming/i.test(labelled[1]!))
      languages.push(...items);
    else technical.push(...items);
  }
  return { technical: dedupe(technical), languages: dedupe(languages) };
}

function parseProjects(lines: string[]): ExtractedProject[] {
  const projects: ExtractedProject[] = [];
  let current: ExtractedProject | null = null;
  for (const raw of lines) {
    const line = stripBullet(raw);
    const techLine = /^(tech(nologies)?|stack|built with|tools)\s*:\s*(.+)$/i.exec(line);
    const isTitle =
      !isBullet(raw) &&
      !techLine &&
      line.length <= 90 &&
      (!current || current.description || /[|—–:]/.test(line) || line.length < 50);
    if (isTitle && (!current || current.description || current.technologies.length)) {
      const [name, ...rest] = line.split(/\s+[|—–]\s+|:\s+/);
      current = {
        name: (name ?? line).trim(),
        description: '',
        technologies: [],
        url: '',
        githubUrl: '',
      };
      const tail = rest.join(' ');
      if (tail && /,/.test(tail) && tail.length < 80) current.technologies = splitList(tail);
      else if (tail) current.description = tail;
      projects.push(current);
    } else if (current) {
      if (techLine) current.technologies = splitList(techLine[3]!);
      else current.description = [current.description, line].filter(Boolean).join('\n');
    }
    if (current) {
      for (const m of raw.matchAll(URL_RE)) {
        const url = normalizeUrl(m[0]);
        if (/github\.com\//i.test(url)) current.githubUrl ||= url;
        else if (/\.[a-z]{2,}/i.test(m[0]) && !/@/.test(m[0])) current.url ||= url;
      }
    }
  }
  return projects.filter((p) => p.name);
}

function parseCertifications(lines: string[]): ExtractedCertification[] {
  return lines
    .map(stripBullet)
    .filter(Boolean)
    .map((line) => {
      const dateMatch = new RegExp(DATE_RE, 'i').exec(line);
      const date = dateMatch ? toMonth(dateMatch[0]).value : '';
      const rest = dateMatch ? line.replace(dateMatch[0], '') : line;
      const [name, issuer] = rest
        .split(/\s+[|—–-]\s+|,\s+|\s+\(|\)/)
        .map((s) => s.trim())
        .filter(Boolean);
      const url =
        [...line.matchAll(URL_RE)].map((m) => normalizeUrl(m[0])).find((u) => !/@/.test(u)) ?? '';
      return {
        name: name ?? '',
        issuer: issuer && !/^https?:/.test(issuer) ? issuer : '',
        date,
        url,
      };
    })
    .filter((c) => c.name.length > 2 && c.name.length < 120);
}

// ---- Main -------------------------------------------------------------------------------------------

export function parseResumeText(text: string): ExtractedResume {
  const sections = splitSections(text);
  const header = sections.get('header') ?? [];
  const headerSegments = header
    .flatMap((l) => l.split(/\s*[|•·]\s*|\t+/))
    .map((s) => s.trim())
    .filter(Boolean);

  // Name: the first header line that looks like one.
  const nameLine = header.find(looksLikeName) ?? '';
  const nameWords = titleCase(nameLine).split(/\s+/).filter(Boolean);

  const email = EMAIL.exec(header.join(' '))?.[0] ?? EMAIL.exec(text)?.[0] ?? '';
  const phone = findPhone(header) || findPhone(text.split('\n').slice(0, 15));
  const location = headerSegments.map(parseLocation).find(Boolean) ?? null;

  // A short header line after the name that isn't contact info is usually the headline title.
  const nameIndex = header.indexOf(nameLine);
  const headline = header
    .slice(nameIndex + 1, nameIndex + 3)
    .find(
      (l) =>
        !EMAIL.test(l) &&
        !PHONE.test(l) &&
        !/https?:|www\.|\.com/i.test(l) &&
        !parseLocation(l) &&
        l.length < 70 &&
        TITLE_WORDS.test(l),
    );

  const experience = parseExperience(sections.get('experience') ?? []);
  const current = experience.find((e) => e.isCurrent) ?? experience[0];
  const skills = parseSkills(sections.get('skills') ?? []);
  const languages = dedupe([
    ...skills.languages,
    ...parseSkills(sections.get('languages') ?? []).technical,
  ]);

  const starts = experience
    .map((e) => e.startDate)
    .filter(Boolean)
    .sort();
  const years = starts[0]
    ? (Date.now() - new Date(`${starts[0]}-01`).getTime()) / (365.25 * 24 * 3600 * 1000)
    : 0;

  return {
    personal: {
      firstName: nameWords[0] ?? '',
      middleName: nameWords.length > 2 ? nameWords.slice(1, -1).join(' ') : '',
      lastName: nameWords.length > 1 ? nameWords[nameWords.length - 1]! : '',
      email: email.toLowerCase(),
      phone,
      city: location?.city ?? '',
      state: location?.state ?? '',
      country: location?.country ?? '',
    },
    professional: {
      currentTitle: headline?.split(/\s+[|—–]\s+/)[0]?.trim() ?? current?.jobTitle ?? '',
      currentCompany: current?.isCurrent ? current.company : '',
      summary: (sections.get('summary') ?? []).map(stripBullet).join(' ').trim(),
      yearsOfExperience: years >= 1 ? String(Math.floor(years)) : '',
    },
    skills: { technical: skills.technical, languages },
    education: parseEducation(sections.get('education') ?? []),
    experience,
    projects: parseProjects(sections.get('projects') ?? []),
    certifications: parseCertifications(sections.get('certifications') ?? []),
    links: findLinks(text),
  };
}
