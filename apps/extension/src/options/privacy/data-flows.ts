import {
  NEVER_SENT_TO_AI,
  PROVIDERS,
  createProvider,
  describeDestination,
  type AISettings,
} from '@jobfill/ai';
import { STORAGE_KEYS } from '@jobfill/shared';

/**
 * The privacy page's statements, derived from the actual configuration so the page
 * can't drift into claiming more than the code does. Keep this in sync with
 * docs/PRIVACY_ARCHITECTURE.md — a test pins the key facts.
 */

export interface StoredItem {
  key: string;
  label: string;
  detail: string;
}

/** Everything JobFill writes to chrome.storage.local (the only place it stores data). */
export const STORED_ITEMS: StoredItem[] = [
  {
    key: STORAGE_KEYS.profile,
    label: 'Your profile',
    detail:
      'Personal and professional details, education, experience, projects, certifications, skills and links you entered or imported.',
  },
  {
    key: STORAGE_KEYS.resume,
    label: 'Your resume file',
    detail: 'Only if you chose to keep it, for attaching to application forms. Up to 5 MB.',
  },
  {
    key: STORAGE_KEYS.settings,
    label: 'App settings',
    detail: '“Preview fields before filling” and “Debug mode”.',
  },
  {
    key: STORAGE_KEYS.ai,
    label: 'AI settings',
    detail:
      'Only if you set up AI answers: on/off, provider, model, endpoint and your own API key.',
  },
];

/** Things users might expect JobFill to keep, which it deliberately doesn't. */
export const NOT_STORED = [
  'AI prompts and generated answers — they exist only while the popup is open (no AI history).',
  'A history of the sites you applied to or the forms you filled.',
  'Page contents, job descriptions or form values from the sites you visit.',
  'Anything in Chrome sync storage — JobFill data doesn’t follow your Google account to other devices.',
];

export interface DataFlow {
  id: 'autofill' | 'ai' | 'export';
  feature: string;
  /** Is this path active in the current configuration? */
  active: boolean;
  /** What may leave the device. */
  what: string;
  /** Why it is sent. */
  why: string;
  /** Which party receives it. */
  who: string;
  /** What triggers it. */
  when: string;
}

export function aiConfigured(settings: AISettings): boolean {
  try {
    createProvider(settings);
    return true;
  } catch {
    return false;
  }
}

export function dataFlows(ai: AISettings): DataFlow[] {
  const aiOn = ai.enabled;
  return [
    {
      id: 'autofill',
      feature: 'Autofill',
      active: true,
      what: 'The profile values that match fields on the form you’re filling — and your resume file if the form has a resume upload field.',
      why: 'To fill in the application you asked JobFill to fill.',
      who: 'The website you’re on. Like anything typed into a form, its page can read filled fields straight away and receives them when you submit.',
      when: 'Only when you click “Autofill Application” (use “Preview fields before filling” to choose field by field). JobFill never submits a form.',
    },
    {
      id: 'ai',
      feature: 'AI answers',
      active: aiOn,
      what: aiOn
        ? `The question, the job title, company and description from the page, and only the profile details you tick on the consent screen (current role, relevant skills, experience highlights, education, summary). Your API key is sent to authenticate. Never sent: ${NEVER_SENT_TO_AI.join(', ')}.`
        : 'Nothing — AI answers are off.',
      why: aiOn
        ? 'To draft an answer to that one question.'
        : 'Turn AI answers on in your profile settings if you want draft answers.',
      who: aiOn
        ? `${describeDestination(ai)} — the provider you chose, directly from your browser. Its own privacy policy and retention apply; it also sees your IP address, like any website.`
        : 'No one.',
      when: aiOn
        ? 'Only when you click “Generate Answer” for a specific question, after seeing exactly what will be used.'
        : 'Never while AI answers are off.',
    },
    {
      id: 'export',
      feature: 'Export profile',
      active: true,
      what: 'Your profile (and your resume file, if you include it) as a JSON file.',
      why: 'To back up your data or move it to another browser.',
      who: 'A file saved to your computer. Where it goes from there is up to you.',
      when: 'Only when you click “Export profile”.',
    },
  ];
}

/** Providers the user could pick, for the "Which provider receives it" explanation. */
export function availableProviders(): string[] {
  return Object.values(PROVIDERS)
    .filter((p) => p.available)
    .map((p) => p.label);
}
