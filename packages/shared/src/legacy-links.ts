/**
 * Older builds, imports and hand-edited backups spelled the profile links differently
 * (`linkedinUrl`, `personal.linkedinProfile`, `twitter`, an "Other links" row labelled
 * "LinkedIn"…). The profile schema strips unknown keys, so without this step those
 * links were silently dropped and never filled.
 *
 * `liftLegacyLinks` copies them into the canonical `links.*` keys before parsing.
 * It never overwrites a canonical value, and running it again changes nothing.
 */

type Canonical = 'resumeUrl' | 'linkedin' | 'github' | 'portfolio' | 'x' | 'website';

const ALIASES: Record<Canonical, string[]> = {
  resumeUrl: ['resumeDriveUrl', 'resumeDriveLink', 'resumeLink', 'resumeURL', 'cvUrl', 'cvLink'],
  linkedin: [
    'linkedinUrl',
    'linkedinURL',
    'linkedInUrl',
    'linkedIn',
    'linkedinProfile',
    'linkedinProfileUrl',
    'linkedInProfileUrl',
    'linkedinLink',
  ],
  github: ['githubUrl', 'githubURL', 'gitHub', 'githubProfile', 'githubProfileUrl', 'githubLink'],
  portfolio: ['portfolioUrl', 'portfolioURL', 'portfolioLink', 'portfolioWebsite'],
  x: ['twitter', 'twitterUrl', 'twitterURL', 'twitterProfile', 'xUrl', 'xProfile', 'xLink'],
  website: ['websiteUrl', 'personalWebsite', 'personalSite', 'homepage', 'blog'],
};

/** "Other links" labels that are really one of the main links. */
const OTHER_LABELS: Array<[Canonical, RegExp]> = [
  ['linkedin', /^linked\s*in(\s+(profile|url|link))*$/i],
  ['github', /^git\s*hub(\s+(profile|url|link))*$/i],
  ['x', /^(x|twitter|x\s*[/(]\s*twitter\s*\)?)(\s+(profile|url|link|handle))*$/i],
  ['portfolio', /^portfolio(\s+(site|website|url|link))*$/i],
  ['resumeUrl', /^(resume|cv)(\s+(drive\s+)?(link|url))+$/i],
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const nonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim() !== '';

export function liftLegacyLinks(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const links: Record<string, unknown> = isRecord(raw.links) ? { ...raw.links } : {};
  const sources = [links, raw, isRecord(raw.personal) ? raw.personal : {}];
  const resume = isRecord(raw.resume) ? raw.resume : {};

  for (const [key, aliases] of Object.entries(ALIASES) as Array<[Canonical, string[]]>) {
    if (nonEmpty(links[key])) continue;
    const found = sources
      .flatMap((src) => aliases.map((a) => src[a]))
      .concat(key === 'resumeUrl' ? [resume.resumeDriveUrl, resume.driveUrl] : [])
      .find(nonEmpty);
    if (found) links[key] = found.trim();
  }

  // Promote an "Other links" row only when the main slot is still empty; the row moves.
  if (Array.isArray(links.other)) {
    links.other = links.other.filter((row) => {
      if (!isRecord(row) || !nonEmpty(row.url) || typeof row.label !== 'string') return true;
      const label = row.label.trim();
      const match = OTHER_LABELS.find(([, re]) => re.test(label));
      if (!match || nonEmpty(links[match[0]])) return true;
      links[match[0]] = row.url.trim();
      return false;
    });
  }
  return { ...raw, links };
}
