import { Callout, InlineCta, Link } from '@/components/blog';

export default function Post() {
  return (
    <>
      <p>
        A strong application isn’t about clever tricks. It’s about showing, clearly and accurately,
        that you fit what this employer asked for — and making it easy for them to contact you.
        These twelve tips cover the whole process, from reading the posting to following up.
      </p>

      <h2 id="before">Before you apply</h2>

      <h3 id="read-posting">1. Read the posting twice</h3>
      <p>
        First for the overall picture, then with a highlighter: the must-have requirements, the
        responsibilities they mention first, and any instructions (“include a portfolio link”,
        “answer in under 200 words”). Following instructions is itself a signal.
      </p>

      <h3 id="save-posting">2. Save a copy of the posting</h3>
      <p>
        Postings often disappear once a role closes — sometimes before you’re invited to interview.
        Save the text or a PDF so you can prepare later. Our{' '}
        <Link href="/blog/job-application-tracking">tracking guide</Link> shows a simple way to keep
        them organised.
      </p>

      <h3 id="fit">3. Be honest about fit</h3>
      <p>
        You don’t need every “nice to have”, but you should be able to show evidence for most of the
        core requirements. Applying selectively and thoughtfully usually beats applying everywhere.
      </p>

      <h2 id="materials">Your resume and answers</h2>

      <h3 id="tailor">4. Tailor the top third of your resume</h3>
      <p>
        You rarely need a whole new resume. Adjust the summary, reorder bullet points so the most
        relevant come first, and make sure the skills section uses the posting’s own terms where
        they genuinely describe your experience.
      </p>

      <h3 id="evidence">5. Show results, not just duties</h3>
      <p>
        “Managed the reporting pipeline” says what you were responsible for; “Rebuilt the reporting
        pipeline so weekly reports were ready a day earlier” says what changed because of you. Use
        real, checkable outcomes.
      </p>

      <h3 id="open-questions">6. Answer open questions specifically</h3>
      <p>
        “Why do you want to work here?” deserves a reason only this company could receive: its
        product, its customers, its mission, or something concrete in the posting. Generic answers —
        including unedited AI drafts — are easy to spot.
      </p>

      <h3 id="screening">7. Answer screening questions accurately</h3>
      <p>
        Questions about work authorization, notice period, location or salary are often used to
        filter applications. Answer them truthfully and consistently with your resume.
      </p>

      <InlineCta title="Let autofill handle the repetitive parts">
        JobFill fills your details, experience and education from a profile on your device, so your
        attention goes to tailoring.
      </InlineCta>

      <h2 id="form">Filling in the form</h2>

      <h3 id="details">8. Double-check your contact details</h3>
      <p>
        A single wrong digit in your phone number or a typo in your email can make a great
        application unreachable. Using <Link href="/features/autofill">autofill</Link> from a
        checked profile removes that risk; a final glance confirms it.
      </p>

      <h3 id="file">9. Attach the right file, with a clear name</h3>
      <p>
        “Firstname-Lastname-Resume.pdf” is easy for a recruiter to find. Check it’s the tailored
        version, and prefer PDF unless the employer asks otherwise.
      </p>

      <h3 id="optional">10. Don’t skip optional fields that help you</h3>
      <p>
        A portfolio, GitHub or LinkedIn link, or an optional cover letter can be the thing that
        moves you forward. Fill them when you have something worth showing.
      </p>

      <h2 id="after">After you submit</h2>

      <h3 id="record">11. Record what you sent</h3>
      <p>
        Note the date, the role, the resume version and anything you promised in your answers. When
        a recruiter calls weeks later, you’ll know exactly what they read.
      </p>

      <h3 id="follow-up">12. Follow up once, politely</h3>
      <p>
        If you have a contact and haven’t heard back in a week or two, a short note reaffirming your
        interest is reasonable. One follow-up is enough.
      </p>

      <Callout>
        Want to speed up without losing quality? Read{' '}
        <Link href="/blog/how-to-fill-job-applications-faster">
          how to fill out job applications faster
        </Link>
        .
      </Callout>
    </>
  );
}
