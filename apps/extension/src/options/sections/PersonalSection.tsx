import type { Address, PersonalInfo } from '@jobfill/types';
import { fullName } from '@jobfill/shared';
import { SelectField, TextField } from '@/components/ui/Field';
import { answerLabel } from './answer';
import { AnswerField, FormGroup, Suggestions } from './form-ui';
import { groupVisible } from './groups';
import type { SectionFormProps, SectionSummaryProps } from './types';
import { StatusList, type StatusRow } from './summary-ui';

/** The options the user picks from — JobFill never infers a gender. */
export const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other', 'Prefer not to say'] as const;
const PRONOUN_SUGGESTIONS = ['He/Him', 'She/Her', 'They/Them', 'Prefer not to say'];
const MARITAL_SUGGESTIONS = ['Single', 'Married', 'Prefer not to say'];

export function PersonalForm({ value, onChange, errors, groups }: SectionFormProps<'personal'>) {
  const set =
    <F extends keyof PersonalInfo>(field: F) =>
    (v: PersonalInfo[F]) =>
      onChange({ ...value, [field]: v });
  const setPermanent = (field: keyof Address) => (v: string) =>
    onChange({ ...value, permanentAddress: { ...value.permanentAddress, [field]: v } });
  const permErr = (field: keyof Address) => errors[`permanentAddress.${field}`];
  const show = (group: string) => groupVisible(groups, group);
  // Keep a value saved before the fixed list existed (e.g. typed free text) selectable.
  const genderOptions = [
    ...GENDER_OPTIONS,
    ...(value.gender && !(GENDER_OPTIONS as readonly string[]).includes(value.gender)
      ? [value.gender]
      : []),
  ].map((g) => ({ value: g, label: g }));

  return (
    <div className="space-y-6">
      {show('identity') && (
      <FormGroup title="Name" description="First and last name are required.">
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
      </FormGroup>
      )}

      {show('contact') && (
      <FormGroup title="Contact" description="How employers reach you. Email is required.">
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
      )}

      {show('current') && (
      <FormGroup
        title="Current address"
        description="Résumés rarely include a full address, so add it here. Every part is optional."
      >
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
      )}

      {show('permanent') && (
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
      )}

      {show('details') && (
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
        <SelectField
          label="Gender"
          placeholder="Not provided"
          value={value.gender}
          onChange={set('gender')}
          options={genderOptions}
          error={errors.gender}
        />
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
      )}
    </div>
  );
}

function addressLine(parts: string[]): string {
  return parts.filter(Boolean).join(', ');
}

export function PersonalSummary({ value, groups }: SectionSummaryProps<'personal'>) {
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
  // A résumé gives at most city / state / country — never the street, PIN, gender or DOB.
  const addressFromResume = !value.address && !value.postalCode && current !== '';
  const rows: Record<string, StatusRow[]> = {
    identity: [
      { label: 'Name', value: fullName(value), path: 'personal.firstName', need: 'core' },
      { label: 'Preferred name', value: value.preferredName },
    ],
    contact: [
      { label: 'Email', value: value.email, path: 'personal.email', need: 'core' },
      { label: 'Phone', value: value.phone, path: 'personal.phone', need: 'core' },
      { label: 'Alternate phone', value: value.alternatePhone },
    ],
    current: [
      {
        label: 'Current address',
        value: current,
        path: addressFromResume ? 'personal.city' : undefined,
        need: 'manual',
      },
      ...(addressFromResume
        ? [{ label: 'Street & PIN / postal code', value: '', need: 'manual' as const }]
        : []),
    ],
    permanent: [
      {
        label: 'Permanent address',
        value: permanent || answerLabel(value.permanentSameAsCurrent),
      },
    ],
    details: [
      { label: 'Date of birth', value: value.dateOfBirth },
      { label: 'Gender', value: value.gender },
      { label: 'Pronouns', value: value.pronouns },
      { label: 'Nationality', value: value.nationality },
      { label: 'Citizenship', value: value.citizenship },
      { label: 'Marital status', value: value.maritalStatus },
    ],
  };
  return (
    <StatusList
      rows={Object.entries(rows).flatMap(([group, list]) =>
        groupVisible(groups, group) ? list : [],
      )}
    />
  );
}
