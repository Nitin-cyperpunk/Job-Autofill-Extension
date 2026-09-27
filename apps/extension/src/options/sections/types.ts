import type { ComponentType, ReactNode } from 'react';
import type { SectionId, SectionValue } from '@jobfill/types';
import type { FieldErrors } from '@jobfill/shared';

export interface SectionFormProps<K extends SectionId> {
  value: SectionValue<K>;
  onChange: (value: SectionValue<K>) => void;
  errors: FieldErrors;
}

export interface SectionDefinition<K extends SectionId> {
  id: K;
  title: string;
  description: string;
  icon: ReactNode;
  /** Optional sections can be skipped during onboarding. */
  optional: boolean;
  Form: ComponentType<SectionFormProps<K>>;
  Summary: ComponentType<{ value: SectionValue<K> }>;
}
