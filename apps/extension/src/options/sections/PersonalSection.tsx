import type { Address, PersonalInfo } from '@jobfill/types';
import { fullName } from '@jobfill/shared';
import { TextField } from '@/components/ui/Field';
import { answerLabel } from './answer';
import { AnswerField, FormGroup, Suggestions } from './form-ui';
import type { SectionFormProps } from './types';
import { DetailList } from './summary-ui';

const GENDER_SUGGESTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const PRONOUN_SUGGESTIONS = ['He/Him', 'She/Her', 'They/Them', 'Prefer not to say'];
const MARITAL_SUGGESTIONS = ['Single', 'Married', 'Prefer not to say'];

export function PersonalForm({ value, onChange, errors }: SectionFormProps<'personal'>) {
  const set =
    <F extends keyof PersonalInfo>(field: F) =>
    (v: PersonalInfo[F]) =>
      onChange({ ...value, [field]: v });
  const setPermanent = (field: keyof Address) => (v: string) =>
    onChange({ ...value, permanentAddress: { ...value.permanentAddress, [field]: v } });
  const permErr = (field: keyof Address) => errors[`permanentAddress.${field}`];

  return (
    <div className="space-y-6">
      <FormGroup
        title="Name & contact"
        description="How employers reach you. Name and email are required."
      >
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
          placeholder="+91 98765 43210"
          hint="Include your country code — forms with a separate code field get it split out."
          value={value.phone}
          onChange={set('phone')}
          error={errors.phone}
        />
        <TextField
          label="Alternate phone"
          type="tel"
          placeholder="Optional"
          value={value.alternatePhone}
          onChange={set('alternatePhone')}
          error={errors.alternatePhone}
        />
      </FormGroup>

      <FormGroup title="Current address">
        <TextField
          label="Address line 1"
          autoComplete="address-line1"
          placeholder="House / flat number, street"
          className="sm:col-span-2"
          value={value.address}
          onChange={set('address')}
          error={errors.address}
        />
        <TextField
          label="Address line 2"
          autoComplete="address-line2"
          placeholder="Area / locality"
          value={value.addressLine2}
          onChange={set('addressLine2')}
          error={errors.addressLine2}
        />
        <TextField
          label="Landmark"
          placeholder="Optional"
          value={value.landmark}
          onChange={set('landmark')}
          error={errors.landmark}
        />
        <TextField
          label="City"
          autoComplete="address-level2"
          value={value.city}
          onChange={set('city')}
          error={errors.city}
        />
        <TextField
          label="District"
          placeholder="Optional"
          value={value.district}
          onChange={set('district')}
          error={errors.district}
        />
        <TextField
          label="State / Province"
          autoComplete="address-level1"
          value={value.state}
          onChange={set('state')}
          error={errors.state}
        />
        <TextField
          label="ZIP / PIN / Postal code"
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
      </FormGroup>

      <FormGroup
        title="Permanent address"
        description="Some applications ask for a permanent (home-town) address as well."
      >
        <AnswerField
          label="Same as current address?"
          className="sm:col-span-2"
          value={value.permanentSameAsCurrent}
          onChange={set('permanentSameAsCurrent')}
          error={errors.permanentSameAsCurrent}
        />
        {value.permanentSameAsCurrent === 'no' && (
          <>
            <TextField
              label="Address line 1"
              className="sm:col-span-2"
              value={value.permanentAddress.line1}
              onChange={setPermanent('line1')}
              error={permErr('line1')}
            />
            <TextField
              label="Address line 2"
              value={value.permanentAddress.line2}
              onChange={setPermanent('line2')}
              error={permErr('line2')}
            />
            <TextField
              label="Landmark"
              value={value.permanentAddress.landmark}
              onChange={setPermanent('landmark')}
              error={permErr('landmark')}
            />
            <TextField
              label="City"
              value={value.permanentAddress.city}
              onChange={setPermanent('city')}
              error={permErr('city')}
            />
            <TextField
              label="District"
              value={value.permanentAddress.district}
              onChange={setPermanent('district')}
              error={permErr('district')}
            />
            <TextField
              label="State / Province"
              value={value.permanentAddress.state}
              onChange={setPermanent('state')}
              error={permErr('state')}
            />
            <TextField
              label="ZIP / PIN / Postal code"
              value={value.permanentAddress.postalCode}
              onChange={setPermanent('postalCode')}
              error={permErr('postalCode')}
            />
            <TextField
              label="Country"
              value={value.permanentAddress.country}
              onChange={setPermanent('country')}
              error={permErr('country')}
            />
          </>
        )}
      </FormGroup>

      <FormGroup
        title="Optional personal details"
        description="Only filled when a form asks, exactly as you enter them here. JobFill never guesses these — leave any blank to answer on each form yourself."
      >
        <TextField
          label="Date of birth"
          type="date"
          autoComplete="bday"
          value={value.dateOfBirth}
          onChange={set('dateOfBirth')}
          error={errors.dateOfBirth}
        />
        <TextField
          label="Gender"
          list="jobfill-gender"
          placeholder="e.g. Male, Female, Non-binary"
          value={value.gender}
          onChange={set('gender')}
          error={errors.gender}
        />
        <Suggestions id="jobfill-gender" values={GENDER_SUGGESTIONS} />
        <TextField
          label="Pronouns"
          list="jobfill-pronouns"
          placeholder="e.g. She/Her"
          value={value.pronouns}
          onChange={set('pronouns')}
          error={errors.pronouns}
        />
        <Suggestions id="jobfill-pronouns" values={PRONOUN_SUGGESTIONS} />
        <TextField
          label="Nationality"
          placeholder="e.g. Indian"
          value={value.nationality}
          onChange={set('nationality')}
          error={errors.nationality}
        />
        <TextField
          label="Citizenship"
          placeholder="e.g. India"
          value={value.citizenship}
          onChange={set('citizenship')}
          error={errors.citizenship}
        />
        <TextField
          label="Marital status"
          list="jobfill-marital"
          value={value.maritalStatus}
          onChange={set('maritalStatus')}
          error={errors.maritalStatus}
        />
        <Suggestions id="jobfill-marital" values={MARITAL_SUGGESTIONS} />
      </FormGroup>
    </div>
  );
}

function addressLine(parts: string[]): string {
  return parts.filter(Boolean).join(', ');
}

export function PersonalSummary({ value }: { value: PersonalInfo }) {
  const current = addressLine([
    value.address,
    value.addressLine2,
    value.landmark,
    value.city,
    value.district,
    value.state,
    value.postalCode,
    value.country,
  ]);
  const p = value.permanentAddress;
  const permanent =
    value.permanentSameAsCurrent === 'yes'
      ? 'Same as current'
      : addressLine([
          p.line1,
          p.line2,
          p.landmark,
          p.city,
          p.district,
          p.state,
          p.postalCode,
          p.country,
        ]);
  return (
    <DetailList
      rows={[
        ['Name', fullName(value)],
        ['Preferred name', value.preferredName],
        ['Email', value.email],
        ['Phone', value.phone],
        ['Alternate phone', value.alternatePhone],
        ['Current address', current],
        ['Permanent address', permanent || answerLabel(value.permanentSameAsCurrent)],
        ['Date of birth', value.dateOfBirth],
        ['Gender', value.gender],
        ['Pronouns', value.pronouns],
        ['Nationality', value.nationality],
        ['Citizenship', value.citizenship],
        ['Marital status', value.maritalStatus],
      ]}
    />
  );
}
