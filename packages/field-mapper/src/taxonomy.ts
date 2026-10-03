import { normalizeText } from './normalize';

/**
 * Small, deterministic taxonomies so one profile list can answer more specific
 * questions: "Programming languages" gets only the languages from the user's technical
 * skills, "LeetCode profile" gets whichever saved link points at leetcode.com.
 * Nothing here invents data — it only selects from what the user entered.
 */

export type SkillCategory = 'programmingLanguages' | 'frameworks' | 'databases' | 'cloud';

const SKILLS: Record<SkillCategory, string[]> = {
  programmingLanguages: [
    'javascript',
    'typescript',
    'python',
    'java',
    'c',
    'c++',
    'cpp',
    'c#',
    'csharp',
    'go',
    'golang',
    'rust',
    'ruby',
    'php',
    'swift',
    'kotlin',
    'scala',
    'r',
    'matlab',
    'dart',
    'perl',
    'haskell',
    'elixir',
    'erlang',
    'clojure',
    'lua',
    'objective c',
    'sql',
    'bash',
    'shell',
    'powershell',
    'groovy',
    'julia',
    'f#',
    'ocaml',
    'solidity',
    'vb net',
    'cobol',
    'fortran',
    'assembly',
    'html',
    'css',
  ],
  frameworks: [
    'react',
    'react js',
    'reactjs',
    'next js',
    'nextjs',
    'next',
    'vue',
    'vue js',
    'vuejs',
    'nuxt',
    'angular',
    'angularjs',
    'svelte',
    'sveltekit',
    'solid',
    'ember',
    'jquery',
    'node js',
    'nodejs',
    'node',
    'express',
    'express js',
    'nestjs',
    'nest js',
    'fastify',
    'django',
    'flask',
    'fastapi',
    'spring',
    'spring boot',
    'rails',
    'ruby on rails',
    'laravel',
    'symfony',
    'asp net',
    'net',
    'dotnet',
    'net core',
    'flutter',
    'react native',
    'electron',
    'tailwind',
    'tailwind css',
    'bootstrap',
    'redux',
    'graphql',
    'tensorflow',
    'pytorch',
    'keras',
    'scikit learn',
    'pandas',
    'numpy',
    'spark',
    'hadoop',
    'jest',
    'cypress',
    'playwright',
    'vite',
    'webpack',
    'remix',
    'gatsby',
    'astro',
    'qt',
  ],
  databases: [
    'postgresql',
    'postgres',
    'mysql',
    'mariadb',
    'sqlite',
    'mongodb',
    'mongo',
    'redis',
    'cassandra',
    'dynamodb',
    'firestore',
    'firebase',
    'oracle',
    'sql server',
    'mssql',
    'elasticsearch',
    'neo4j',
    'couchdb',
    'supabase',
    'snowflake',
    'bigquery',
    'clickhouse',
    'cockroachdb',
    'influxdb',
    'prisma',
  ],
  cloud: [
    'aws',
    'amazon web services',
    'azure',
    'microsoft azure',
    'gcp',
    'google cloud',
    'google cloud platform',
    'firebase',
    'heroku',
    'vercel',
    'netlify',
    'cloudflare',
    'digitalocean',
    'docker',
    'kubernetes',
    'k8s',
    'terraform',
    'lambda',
    'ec2',
    's3',
    'cloud run',
    'openshift',
    'ansible',
    'jenkins',
    'github actions',
    'ci cd',
  ],
};

// Compare on a light normalization that keeps "c++" / "c#" distinct from "c".
const skillKey = (s: string) =>
  s
    .toLowerCase()
    .replace(/\+\+/g, ' plus plus')
    .replace(/#/g, ' sharp')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const SKILL_INDEX: Record<SkillCategory, Set<string>> = Object.fromEntries(
  Object.entries(SKILLS).map(([cat, items]) => [cat, new Set(items.map(skillKey))]),
) as Record<SkillCategory, Set<string>>;

/** The user's skills that belong to `category`, in the user's order and spelling. */
export function skillsInCategory(skills: string[], category: SkillCategory): string[] {
  return skills.filter((s) => SKILL_INDEX[category].has(skillKey(s)));
}

/** Link platforms that forms ask for by name, recognised by host. */
export const LINK_PLATFORMS = {
  leetcode: ['leetcode.com', 'leetcode.cn'],
  hackerrank: ['hackerrank.com'],
  codechef: ['codechef.com'],
  kaggle: ['kaggle.com'],
  behance: ['behance.net'],
  dribbble: ['dribbble.com'],
  stackoverflow: ['stackoverflow.com', 'stackexchange.com'],
  medium: ['medium.com'],
} as const;

export type LinkPlatform = keyof typeof LINK_PLATFORMS;

/** Host of a URL, without "www." — parsed by hand (this package has no DOM/URL types). */
export function hostOf(url: string): string {
  const m = /^(?:[a-z][a-z0-9+.-]*:\/\/)?([^/?#:@\s]+)/i.exec(url.trim());
  return m ? m[1]!.toLowerCase().replace(/^www\./, '') : '';
}

/** Path segments of a URL: "https://linkedin.com/in/ada/" → ["in", "ada"]. */
export function pathSegments(url: string): string[] {
  const path =
    url
      .trim()
      .replace(/^(?:[a-z][a-z0-9+.-]*:\/\/)?[^/?#]*/i, '')
      .split(/[?#]/)[0] ?? '';
  return path.split('/').filter(Boolean);
}

/** The first saved link on `platform`'s domain (any subdomain), or ''. */
export function linkForPlatform(urls: string[], platform: LinkPlatform): string {
  const hosts = LINK_PLATFORMS[platform];
  return (
    urls.find((url) => {
      const host = hostOf(url);
      return hosts.some((h) => host === h || host.endsWith(`.${h}`));
    }) ?? ''
  );
}

/** Text tokens worth matching a question against a project ("react", "payments"…). */
export function meaningfulTokens(text: string): Set<string> {
  const STOP = new Set([
    'describe',
    'project',
    'projects',
    'one',
    'where',
    'you',
    'used',
    'using',
    'use',
    'tell',
    'us',
    'about',
    'which',
    'what',
    'how',
    'did',
    'have',
    'built',
    'worked',
    'work',
    'with',
    'in',
    'on',
    'of',
    'and',
    'or',
    'for',
    'to',
    'proud',
    'most',
    'recent',
    'favorite',
    'favourite',
    'best',
    'challenging',
    'example',
    'give',
    'that',
    'this',
    'is',
    'are',
    'was',
    'were',
    'an',
    'experience',
    'please',
    'briefly',
    'share',
    'explain',
    'any',
    'some',
    'something',
    'we',
    'would',
    'like',
    'know',
    'it',
    'its',
  ]);
  return new Set(
    normalizeText(text)
      .split(' ')
      .filter((t) => t.length > 1 && !STOP.has(t)),
  );
}
