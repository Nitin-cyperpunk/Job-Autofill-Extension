import { Callout, InlineCta, Link } from '@/components/blog';

export default function Post() {
  return (
    <>
      <p>
        Plenty of employers — startups, schools, non-profits, agencies and recruiters running hiring
        drives — collect applications with Google Forms. It’s free and quick for them to set up. For
        you, it means yet another form asking for your name, email, phone, experience and links,
        usually without the conveniences of a dedicated applicant tracking system.
      </p>
      <p>
        Here’s how to autofill Google Forms job applications and what still needs your attention.
      </p>

      <h2 id="why-chrome-autofill-struggles">Why browser autofill often misses Google Forms</h2>
      <p>
        Chrome’s built-in autofill relies on signals in the page’s code — standard field names and
        <code>autocomplete</code> hints like “email” or “tel” — to recognise what a field wants.
        Google Forms questions are free-text titles written by whoever made the form (“Your email”,
        “Contact number”, “Where are you based?”), so those signals are often missing and Chrome may
        not offer suggestions. Choice questions — multiple choice, checkboxes and dropdowns — aren’t
        something browser autofill fills at all.
      </p>

      <h2 id="with-jobfill">Autofilling a Google Form with JobFill</h2>
      <p>
        <Link href="/features/autofill">JobFill’s autofill</Link> reads the question text the way
        you do, so it can match “Contact number” to your phone and “LinkedIn profile” to your
        LinkedIn URL. On Google Forms it handles:
      </p>
      <ul>
        <li>
          <strong>Short answer and paragraph questions</strong> — names, email, phone, location,
          current title, links and similar details.
        </li>
        <li>
          <strong>Multiple choice and checkboxes</strong> — when an option clearly matches your
          profile, for example your highest degree.
        </li>
        <li>
          <strong>Dropdowns</strong> — Google Forms’ custom dropdown lists, opened and chosen the
          way you would with the mouse.
        </li>
        <li>
          <strong>Multi-section forms</strong> — run autofill again after pressing Next on each
          section.
        </li>
      </ul>
      <ol>
        <li>Open the form and make sure you’re on the first section.</li>
        <li>Click the JobFill icon and choose “Autofill Application”.</li>
        <li>Check the summary: filled fields, and anything that needs your review.</li>
        <li>Answer the remaining questions, press Next, and repeat on the next section.</li>
        <li>Review the whole form, then submit it yourself.</li>
      </ol>

      <InlineCta title="Fill your next Google Form in seconds">
        JobFill reads the question text, fills what matches your profile, and leaves the rest for
        you.
      </InlineCta>

      <h2 id="what-needs-you">What still needs you</h2>
      <ul>
        <li>
          <strong>File uploads.</strong> File-upload questions in Google Forms use Google’s own
          Drive file picker and require you to be signed in, so attach your resume there yourself.
        </li>
        <li>
          <strong>Open questions.</strong> “Why do you want this role?” needs your answer. If you
          like, draft one with <Link href="/features/ai-answers">optional AI answers</Link> and edit
          it.
        </li>
        <li>
          <strong>Personal or sensitive questions.</strong> Diversity questions are answered only if
          you’ve added your answer to your profile; declarations and consent boxes are always left
          to you.
        </li>
        <li>
          <strong>Unusual choices.</strong> If a question’s options don’t clearly match your
          profile, JobFill leaves it rather than guessing.
        </li>
      </ul>

      <h2 id="tips">Tips for Google Forms applications</h2>
      <ul>
        <li>
          <strong>Check the email Google Forms collects.</strong> Some forms record the email of the
          Google account you’re signed in with. Make sure it’s the address you want the employer to
          use.
        </li>
        <li>
          <strong>Look for “Send me a copy of my responses”.</strong> If the form offers it, tick
          it: you’ll have a record of what you sent.
        </li>
        <li>
          <strong>Keep your own record</strong> anyway — Google Forms postings are often taken down
          when hiring closes. See our guide to{' '}
          <Link href="/blog/job-application-tracking">job application tracking</Link>.
        </li>
      </ul>
      <Callout>
        JobFill doesn’t keep or send the answers you type into forms, and your profile stays on your
        device. <Link href="/privacy">Read how JobFill handles your data.</Link>
      </Callout>
    </>
  );
}
