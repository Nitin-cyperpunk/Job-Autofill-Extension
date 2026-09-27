import type { Skills } from '@jobfill/types';
import { TagInput } from '@/components/ui/TagInput';
import type { SectionFormProps } from './types';
import { DetailList, TagList } from './summary-ui';

export function SkillsForm({ value, onChange, errors }: SectionFormProps<'skills'>) {
  return (
    <div className="grid gap-5">
      <TagInput
        label="Technical skills"
        placeholder="e.g. Python, Figma, SQL"
        value={value.technical}
        onChange={(technical) => onChange({ ...value, technical })}
        error={errors.technical}
      />
      <TagInput
        label="Soft skills"
        placeholder="e.g. Leadership, Communication"
        value={value.soft}
        onChange={(soft) => onChange({ ...value, soft })}
        error={errors.soft}
      />
      <TagInput
        label="Languages"
        placeholder="e.g. English (native), Spanish (B2)"
        value={value.languages}
        onChange={(languages) => onChange({ ...value, languages })}
        error={errors.languages}
      />
    </div>
  );
}

export function SkillsSummary({ value }: { value: Skills }) {
  const list = (tags: string[]) => tags.length > 0 && <TagList tags={tags} />;
  return (
    <DetailList
      rows={[
        ['Technical', list(value.technical)],
        ['Soft skills', list(value.soft)],
        ['Languages', list(value.languages)],
      ]}
    />
  );
}
