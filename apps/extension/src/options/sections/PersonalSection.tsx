import type { PersonalInfo } from '@jobfill/types';
import { fullName } from '@jobfill/shared';
import { TextField } from '@/components/ui/Field';
import type { SectionFormProps } from './types';
import { DetailList } from './summary-ui';

export function PersonalForm({ value, onChange, errors }: SectionFormProps<'personal'>) {
  const set = (field: keyof PersonalInfo) => (v: string) => onChange({ ...value, [field]: v });
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField
        label="First name"
        required
        autoComplete="given-name"
        value={value.firstName}
        onChange={set('firstName')}
        error={errors.firstName}
      />
      <TextField
        label="Middle name"
        autoComplete="additional-name"
        value={value.middleName}
        onChange={set('middleName')}
        error={errors.middleName}
      />
      <TextField
        label="Last name"
        required
        autoComplete="family-name"
        value={value.lastName}
        onChange={set('lastName')}
        error={errors.lastName}
      />
      <TextField
        label="Preferred name"
        hint="What you like to be called, if different."
        value={value.preferredName}
        onChange={set('preferredName')}
        error={errors.preferredName}
      />
      <TextField
        label="Email"
        type="email"
        required
        autoComplete="email"
        value={value.email}
        onChange={set('email')}
        error={errors.email}
      />
      <TextField
        label="Phone"
        type="tel"
        autoComplete="tel"
        placeholder="+1 555 010 0000"
        hint="Include your country code."
        value={value.phone}
        onChange={set('phone')}
        error={errors.phone}
      />
      <TextField
        label="Address"
        autoComplete="street-address"
        className="sm:col-span-2"
        value={value.address}
        onChange={set('address')}
        error={errors.address}
      />
      <TextField
        label="City"
        autoComplete="address-level2"
        value={value.city}
        onChange={set('city')}
        error={errors.city}
      />
      <TextField
        label="State / Province"
        autoComplete="address-level1"
        value={value.state}
        onChange={set('state')}
        error={errors.state}
      />
      <TextField
        label="ZIP / PIN code"
        autoComplete="postal-code"
        value={value.postalCode}
        onChange={set('postalCode')}
        error={errors.postalCode}
      />
      <TextField
        label="Country"
        autoComplete="country-name"
        value={value.country}
        onChange={set('country')}
        error={errors.country}
      />
    </div>
  );
}

export function PersonalSummary({ value }: { value: PersonalInfo }) {
  const location = [value.city, value.state, value.postalCode, value.country]
    .filter(Boolean)
    .join(', ');
  return (
    <DetailList
      rows={[
        ['Name', fullName(value)],
        ['Preferred name', value.preferredName],
        ['Email', value.email],
        ['Phone', value.phone],
        ['Address', value.address],
        ['Location', location],
      ]}
    />
  );
}
