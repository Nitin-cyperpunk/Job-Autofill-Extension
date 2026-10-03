import type { Profile, SectionId, SectionValue } from '@jobfill/types';

/** Paths that are lists: an import adds entries; editing them keeps the "from resume" mark. */
const LIST_PATHS = new Set(['education', 'experience', 'projects', 'certifications']);

/**
 * After the user saves a section, forget "imported from resume" for any single value they
 * changed — it's theirs now. Lists keep the mark unless they were emptied.
 */
export function pruneSources<K extends SectionId>(
  previous: Profile,
  id: K,
  value: SectionValue<K>,
): Profile['sources'] {
  const before = previous[id] as unknown as Record<string, unknown>;
  const after = value as unknown as Record<string, unknown>;
  const resume = previous.sources.resume.filter((path) => {
    if (path === id) return LIST_PATHS.has(id) ? (value as unknown[]).length > 0 : true;
    if (!path.startsWith(`${id}.`)) return true;
    const field = path.slice(id.length + 1);
    const old = before?.[field];
    const now = after?.[field];
    if (Array.isArray(now)) return now.length > 0;
    return JSON.stringify(old) === JSON.stringify(now);
  });
  return { resume };
}

/** Record paths a resume import filled (merged with earlier imports). */
export function withResumeSources(profile: Profile, paths: Iterable<string>): Profile['sources'] {
  return { resume: [...new Set([...profile.sources.resume, ...paths])] };
}
