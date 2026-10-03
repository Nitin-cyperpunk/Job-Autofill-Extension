import { STEP_ORDER, type StepId } from '../router';

export const STEP_LABELS: Record<StepId, string> = {
  welcome: 'Welcome',
  start: 'Create profile',
  personal: 'Personal info',
  professional: 'Professional',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  certifications: 'Certifications',
  skills: 'Skills',
  links: 'Links',
  additional: 'Additional info',
  resume: 'Resume & Links',
  review: 'Review',
  complete: 'Complete',
};

/** The steps shown in the progress sidebar (the form steps). */
export const FORM_STEPS = STEP_ORDER.slice(
  STEP_ORDER.indexOf('resume'),
  STEP_ORDER.indexOf('review') + 1,
);

export function nextStep(step: StepId): StepId {
  return STEP_ORDER[Math.min(STEP_ORDER.indexOf(step) + 1, STEP_ORDER.length - 1)]!;
}

export function prevStep(step: StepId): StepId {
  return STEP_ORDER[Math.max(STEP_ORDER.indexOf(step) - 1, 0)]!;
}
