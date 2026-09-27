import { Callout, InlineCta, Link } from '@/components/blog';

const COLUMNS: Array<[string, string]> = [
  ['Company', 'Who you applied to.'],
  ['Role', 'The exact job title from the posting.'],
  ['Link', 'The posting URL — plus a saved copy, because postings disappear.'],
  ['Date applied', 'When you submitted.'],
  ['Resume version', 'Which file you sent, e.g. “Resume – product v3”.'],
  ['Status', 'One of a fixed set of values (see below).'],
  ['Next step', 'What happens next and who owns it: “Wait for reply”, “Send thank-you”.'],
  ['Follow-up date', 'When to check in if you haven’t heard back.'],
  ['Contact', 'Recruiter or hiring manager, if you know them.'],
  ['Notes', 'Salary range discussed, interview feedback, questions to ask.'],
];

export default function Post() {
  return (
    <>
      <p>
        Once you’re applying to more than a handful of roles, memory stops being a reliable system.
        Which version of your resume did you send? Did you already apply to that company last month?
        Is it time to follow up? A simple tracker answers all of these in seconds, and it takes less
        than a minute per application to keep up to date.
      </p>

      <h2 id="spreadsheet">Start with a spreadsheet</h2>
      <p>
        You don’t need special software. A spreadsheet is flexible, sortable, private if you want it
        to be, and yours to keep. Create one row per application and these columns:
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Column</th>
            <th scope="col">What to record</th>
          </tr>
        </thead>
        <tbody>
          {COLUMNS.map(([name, text]) => (
            <tr key={name}>
              <td>
                <strong>{name}</strong>
              </td>
              <td>{text}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 id="statuses">Use a small, fixed set of statuses</h2>
      <p>
        Free-text statuses become impossible to sort. Pick a short list and stick to it, for
        example:
      </p>
      <ol>
        <li>
          <strong>Saved</strong> — interested, not applied yet.
        </li>
        <li>
          <strong>Applied</strong>
        </li>
        <li>
          <strong>Screening</strong> — recruiter call or assessment.
        </li>
        <li>
          <strong>Interviewing</strong>
        </li>
        <li>
          <strong>Offer</strong>
        </li>
        <li>
          <strong>Closed</strong> — rejected, withdrawn or no response after follow-up.
        </li>
      </ol>
      <p>
        Filter by status to see what needs attention, and sort by follow-up date to plan your week.
      </p>

      <h2 id="save-postings">Save every posting</h2>
      <p>
        Job postings are frequently taken down once a role closes — often while you’re still in the
        process. Save the full text (a PDF from your browser’s print dialog works) and link it from
        your tracker. You’ll want it when preparing for interviews.
      </p>

      <InlineCta title="Spend less time on the form itself">
        Tracking takes a minute. Filling in the application can take much longer — JobFill fills the
        repetitive fields from a profile stored on your device.
      </InlineCta>

      <h2 id="routine">A weekly routine</h2>
      <ul>
        <li>
          <strong>After every application:</strong> add the row immediately, while the details are
          fresh.
        </li>
        <li>
          <strong>Once a week:</strong> sort by follow-up date, send the follow-ups that are due,
          and move stale applications to Closed.
        </li>
        <li>
          <strong>After every interview:</strong> note the questions you were asked and who you met.
        </li>
      </ul>

      <h2 id="jobfill">Does JobFill track applications?</h2>
      <p>
        No — deliberately. JobFill keeps no history of the sites you visit or the applications you
        fill, as part of keeping your data on your device and to itself. Keep your tracker wherever
        you’re comfortable, and let <Link href="/features/autofill">JobFill’s autofill</Link> save
        you time on the forms.
      </p>
      <Callout>
        Related: <Link href="/blog/best-job-application-tools">the best job application tools</Link>{' '}
        and <Link href="/blog/job-application-tips">job application tips</Link>.
      </Callout>
    </>
  );
}
