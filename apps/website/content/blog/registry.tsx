import type { ComponentType } from 'react';
import BestTools from './posts/best-job-application-tools';
import ChromeAutofill from './posts/how-to-use-chrome-autofill-for-job-applications';
import Faster from './posts/how-to-fill-job-applications-faster';
import GoogleForms from './posts/how-to-autofill-google-forms';
import HowToAutofill from './posts/how-to-autofill-job-applications';
import Tips from './posts/job-application-tips';
import Tracking from './posts/job-application-tracking';

/** Post bodies by slug. Every entry in POSTS must have one (checked at build). */
export const POST_BODIES: Record<string, ComponentType> = {
  'how-to-autofill-job-applications': HowToAutofill,
  'best-job-application-tools': BestTools,
  'how-to-fill-job-applications-faster': Faster,
  'job-application-tips': Tips,
  'how-to-autofill-google-forms': GoogleForms,
  'how-to-use-chrome-autofill-for-job-applications': ChromeAutofill,
  'job-application-tracking': Tracking,
};
