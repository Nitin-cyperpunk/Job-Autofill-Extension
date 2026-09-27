import { Callout, InlineCta, Link } from '@/components/blog';

export default function Post() {
  return (
    <>
      <p>
        Google Chrome has autofill built in. Set it up properly and it will fill your name, email,
        phone number and address on many forms — including the first section of most job
        applications. This guide shows how to set it up, how to use it on applications, and where it
        stops being enough.
      </p>

      <h2 id="set-up">Set up Chrome autofill for your contact details</h2>
      <ol>
        <li>
          Open Chrome’s settings (the three-dot menu, then <strong>Settings</strong>).
        </li>
        <li>
          Go to <strong>Autofill and passwords</strong>, then <strong>Addresses and more</strong>.
          (Menu names change occasionally between Chrome versions; searching settings for
          “addresses” finds it.)
        </li>
        <li>Make sure saving and filling addresses is turned on.</li>
        <li>
          <strong>Add</strong> an entry with your full name, email address, phone number and postal
          address, exactly as you want employers to see them.
        </li>
      </ol>
      <p>
        Chrome may also offer to save details as you type them into forms. Check what it saved:
        stale phone numbers and old addresses are a common source of mistakes.
      </p>

      <h2 id="use-it">Using it on a job application</h2>
      <p>
        Click into a field such as “First name” or “Email” and Chrome offers your saved entry. Pick
        it and Chrome fills the related fields it recognises. It works best on forms that use
        standard field names and <code>autocomplete</code> hints — many applicant tracking systems
        do for the contact section.
      </p>

      <h2 id="limits">Where Chrome autofill falls short on job applications</h2>
      <p>Browser autofill was designed for checkout and sign-up forms, not job applications:</p>
      <ul>
        <li>
          <strong>No work history or education.</strong> Chrome doesn’t store job titles, companies,
          dates, degrees or schools, so those sections stay empty.
        </li>
        <li>
          <strong>No professional links.</strong> LinkedIn, GitHub and portfolio URLs aren’t part of
          an address profile.
        </li>
        <li>
          <strong>Custom questions and wording.</strong> Fields titled “Preferred name” or “Where
          are you based?” often don’t carry the hints Chrome needs.
        </li>
        <li>
          <strong>Custom dropdowns and choices.</strong> Many application forms build dropdowns and
          radio buttons from custom components that browser autofill doesn’t fill.
        </li>
        <li>
          <strong>No resume.</strong> It can’t attach your resume file.
        </li>
      </ul>

      <InlineCta title="Fill the rest of the application too">
        JobFill adds what Chrome autofill doesn’t cover: experience, education, links, custom
        dropdowns and your resume file — from a profile stored on your device.
      </InlineCta>

      <h2 id="combine">Using Chrome autofill and a job application extension together</h2>
      <p>
        You don’t have to choose. Keep Chrome autofill for everyday forms, and use a{' '}
        <Link href="/chrome-extension">Chrome extension for job applications</Link> for the rest.
        JobFill leaves fields that already have a value alone, so if Chrome filled your contact
        details first, JobFill fills what’s left rather than overwriting them.
      </p>
      <p>
        When comparing extensions, look at <strong>where your profile is stored</strong>. Your
        application profile contains your full work history and contact details. JobFill keeps it in
        your browser on your device, with no account and no JobFill server.
      </p>
      <Callout>
        Next: follow our{' '}
        <Link href="/blog/how-to-autofill-job-applications">
          step-by-step guide to autofilling job applications
        </Link>
        , or see <Link href="/how-it-works">how JobFill works</Link>.
      </Callout>
    </>
  );
}
