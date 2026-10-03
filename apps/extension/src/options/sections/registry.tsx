import type { SectionId } from '@jobfill/types';
import {
  BriefcaseIcon,
  BuildingIcon,
  ClipboardCheckIcon,
  FolderIcon,
  GraduationIcon,
  LinkIcon,
  ShieldCheckIcon,
  StarIcon,
  UserIcon,
} from '@/components/ui/icons';
import { AdditionalForm, AdditionalSummary } from './AdditionalSection';
import { CertificationsForm, CertificationsSummary } from './CertificationsSection';
import { EducationForm, EducationSummary } from './EducationSection';
import { ExperienceForm, ExperienceSummary } from './ExperienceSection';
import { LinksForm, LinksSummary } from './LinksSection';
import { PersonalForm, PersonalSummary } from './PersonalSection';
import { ProfessionalForm, ProfessionalSummary } from './ProfessionalSection';
import { ProjectsForm, ProjectsSummary } from './ProjectsSection';
import { SkillsForm, SkillsSummary } from './SkillsSection';
import type { SectionDefinition } from './types';

/**
 * Every editable profile section in one place. The onboarding wizard, the review
 * step and the profile dashboard are all driven from this table.
 */
export const SECTIONS: { [K in SectionId]: SectionDefinition<K> } = {
  personal: {
    id: 'personal',
    title: 'Personal information',
    description:
      'Name, contact details, current and permanent address, and optional personal details.',
    icon: <UserIcon />,
    optional: false,
    Form: PersonalForm,
    Summary: PersonalSummary,
  },
  professional: {
    id: 'professional',
    title: 'Professional details',
    description: 'Current role, salary, availability, job preferences and work authorization.',
    icon: <BriefcaseIcon />,
    optional: true,
    Form: ProfessionalForm,
    Summary: ProfessionalSummary,
  },
  education: {
    id: 'education',
    title: 'Education',
    description: 'Degrees, diplomas and certifications.',
    icon: <GraduationIcon />,
    optional: true,
    Form: EducationForm,
    Summary: EducationSummary,
  },
  experience: {
    id: 'experience',
    title: 'Experience',
    description: 'Your work history, most recent first.',
    icon: <BuildingIcon />,
    optional: true,
    Form: ExperienceForm,
    Summary: ExperienceSummary,
  },
  projects: {
    id: 'projects',
    title: 'Projects',
    description: 'Work you’re proud of that shows what you can do.',
    icon: <FolderIcon />,
    optional: true,
    Form: ProjectsForm,
    Summary: ProjectsSummary,
  },
  certifications: {
    id: 'certifications',
    title: 'Certifications',
    description: 'Certificates, licences and completed courses.',
    icon: <ClipboardCheckIcon />,
    optional: true,
    Form: CertificationsForm,
    Summary: CertificationsSummary,
  },
  skills: {
    id: 'skills',
    title: 'Skills',
    description: 'Technical skills, soft skills and languages.',
    icon: <StarIcon />,
    optional: true,
    Form: SkillsForm,
    Summary: SkillsSummary,
  },
  links: {
    id: 'links',
    title: 'Links',
    description: 'Resume link, LinkedIn, portfolio, GitHub, X and other profiles.',
    icon: <LinkIcon />,
    optional: true,
    Form: LinksForm,
    Summary: LinksSummary,
  },
  additional: {
    id: 'additional',
    title: 'Additional information',
    description:
      'Equal-opportunity, background and other common questions — used only exactly as you answer them.',
    icon: <ShieldCheckIcon />,
    optional: true,
    Form: AdditionalForm,
    Summary: AdditionalSummary,
  },
};

export const SECTION_ORDER: SectionId[] = [
  'personal',
  'professional',
  'education',
  'experience',
  'projects',
  'certifications',
  'skills',
  'links',
  'additional',
];
