import { readFileSync } from 'node:fs';
import { deflateRawSync, deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { createEmptyProfile } from '@jobfill/shared';
import { sampleProfile } from '../../field-mapper/src/test-helpers';
import {
  applyReview,
  buildReview,
  docxToText,
  extractResumeText,
  parseResumeText,
  pdfToText,
} from './index';
import { InflateLimitError, inflate } from './inflate';
import { relsToLinks } from './docx';
import { SAMPLE_RESUME } from './test-fixtures';

const RESUME = SAMPLE_RESUME;

describe('parseResumeText', () => {
  const r = parseResumeText(RESUME);

  it('reads the header: name, contact, location, links, headline', () => {
    expect(r.personal).toMatchObject({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '+44 20 7946 0000',
      city: 'London',
      country: 'UK',
    });
    expect(r.links).toMatchObject({
      linkedin: 'https://linkedin.com/in/ada-lovelace',
      github: 'https://github.com/ada',
      portfolio: 'https://ada.dev',
    });
    expect(r.professional.currentTitle).toBe('Staff Software Engineer');
    expect(r.professional.summary).toMatch(/^Engineer with 7 years/);
  });

  it('splits experience by date ranges, with title/company/location/dates', () => {
    expect(r.experience).toHaveLength(2);
    expect(r.experience[0]).toMatchObject({
      jobTitle: 'Staff Software Engineer',
      company: 'Analytical Engines Ltd',
      startDate: '2020-03',
      isCurrent: true,
      location: 'London, UK',
      monthAssumed: false,
    });
    expect(r.experience[0]!.description).toContain('Cut report latency by 40%.');
    expect(r.experience[1]).toMatchObject({
      jobTitle: 'Software Engineer',
      company: 'Babbage & Co',
      startDate: '2016-07',
      endDate: '2020-02',
      isCurrent: false,
    });
    expect(r.professional.currentCompany).toBe('Analytical Engines Ltd');
  });

  it('reads education with degree, field, dates and GPA', () => {
    expect(r.education).toHaveLength(2);
    expect(r.education[0]).toMatchObject({
      institution: 'University of London',
      degree: 'M.Sc.',
      fieldOfStudy: 'Mathematics',
      startDate: '2014-01',
      endDate: '2016-01',
      gpa: '3.9/4.0',
    });
    expect(r.education[1]).toMatchObject({
      institution: 'Cambridge University',
      degree: 'B.Sc.',
      fieldOfStudy: 'Computer Science',
    });
  });

  it('separates spoken languages from technical skills', () => {
    expect(r.skills.languages).toEqual(['English', 'French']);
    expect(r.skills.technical).toEqual([
      'TypeScript',
      'React',
      'SQL',
      'Rust',
      'Leadership',
      'Mentoring',
    ]);
  });

  it('reads projects and certifications', () => {
    expect(r.projects.map((p) => p.name)).toEqual(['Notes App', 'Analytical Engine Emulator']);
    expect(r.projects[0]).toMatchObject({
      technologies: ['React', 'TypeScript'],
      githubUrl: 'https://github.com/ada/notes',
    });
    expect(r.projects[1]!.url).toBe('https://engine.ada.dev');
    expect(r.certifications).toEqual([
      {
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        date: '2022-01',
        url: '',
      },
      { name: 'Certified Scrum Master', issuer: 'Scrum Alliance', date: '2019-05', url: '' },
    ]);
  });

  it('ignores sections it does not use (interests)', () => {
    expect(JSON.stringify(r)).not.toContain('Poetry');
  });

  it('never mistakes parts of an email address for a website', () => {
    const r2 = parseResumeText(
      'Jane Doe\njane.doe@mail.example.org | +1 415 555 0100\n\nSKILLS\nGo',
    );
    expect(r2.personal.email).toBe('jane.doe@mail.example.org');
    expect(r2.links).toEqual({
      resumeUrl: '',
      linkedin: '',
      github: '',
      portfolio: '',
      x: '',
      website: '',
    });
  });

  it('leaves fields empty rather than guessing', () => {
    const sparse = parseResumeText(
      'Just some notes\nabout nothing in particular\n\nHOBBIES\nKnitting',
    );
    expect(sparse.personal).toMatchObject({ firstName: '', email: '', phone: '' });
    expect(sparse.experience).toEqual([]);
  });
});

// ---- Real file formats -----------------------------------------------------------------------

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

/** A minimal but valid .docx (zip with a deflated word/document.xml). */
function makeDocx(paragraphs: string[]): Uint8Array {
  const xml = `<?xml version="1.0"?><w:document xmlns:w="w"><w:body>${paragraphs
    .map(
      (p) =>
        `<w:p><w:r><w:t>${p.replace(/&/g, '&amp;').replace(/\t/g, '</w:t><w:tab/><w:t>')}</w:t></w:r></w:p>`,
    )
    .join('')}</w:body></w:document>`;
  const data = new TextEncoder().encode(xml);
  const compressed = deflateRawSync(data);
  const name = new TextEncoder().encode('word/document.xml');
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(crc32(data), 14);
  local.writeUInt32LE(compressed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(name.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(crc32(data), 16);
  central.writeUInt32LE(compressed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(name.length, 28);
  central.writeUInt32LE(0, 42);
  const cdOffset = local.length + name.length + compressed.length;
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(central.length + name.length, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  return new Uint8Array(Buffer.concat([local, name, compressed, central, name, eocd]));
}

/** Assemble a PDF from object bodies (1-based), with a correct-enough xref. */
function makePdf(objects: Array<string | { dict: string; stream: Buffer }>): Uint8Array {
  const parts: Buffer[] = [Buffer.from('%PDF-1.5\n%\xe2\xe3\xcf\xd3\n', 'latin1')];
  objects.forEach((o, i) => {
    if (typeof o === 'string') parts.push(Buffer.from(`${i + 1} 0 obj\n${o}\nendobj\n`, 'latin1'));
    else {
      parts.push(
        Buffer.from(
          `${i + 1} 0 obj\n${o.dict.replace('>>', ` /Length ${o.stream.length} >>`)}\nstream\n`,
          'latin1',
        ),
      );
      parts.push(o.stream, Buffer.from('\nendstream\nendobj\n', 'latin1'));
    }
  });
  parts.push(Buffer.from('trailer\n<< /Root 1 0 R >>\n%%EOF\n', 'latin1'));
  return new Uint8Array(Buffer.concat(parts));
}

describe('local text extraction', () => {
  it('refuses decompression bombs instead of exhausting memory', async () => {
    const bomb = new Uint8Array(deflateSync(Buffer.alloc(2 * 1024 * 1024)));
    expect(bomb.length).toBeLessThan(10_000);
    await expect(inflate(bomb, 'deflate', 1024 * 1024)).rejects.toBeInstanceOf(InflateLimitError);
    expect((await inflate(bomb, 'deflate')).length).toBe(2 * 1024 * 1024);
  });

  it('reads a .docx (zip + deflate) with paragraphs and tabs', async () => {
    const text = await docxToText(
      makeDocx(['ADA LOVELACE', 'ada@example.com', 'Engineer\tLondon']),
    );
    expect(text).toBe('ADA LOVELACE\nada@example.com\nEngineer\tLondon');
  });

  it('reads a compressed PDF with a simple font (Word-style WinAnsi)', async () => {
    const content = deflateSync(
      Buffer.from(
        'BT /F1 12 Tf 72 720 Td (ADA LOVELACE) Tj 0 -14 Td (ada@example.com) Tj 0 -14 Td [(Staff) -300 (Engineer)] TJ ET',
        'latin1',
      ),
    );
    const pdf = makePdf([
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
      { dict: '<< /Filter /FlateDecode >>', stream: content },
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    ]);
    expect(await pdfToText(pdf)).toBe('ADA LOVELACE\nada@example.com\nStaff Engineer');
  });

  it('tolerates `null` values inside arrays and dictionaries', async () => {
    const content = deflateSync(
      Buffer.from('BT /F1 12 Tf 72 720 Td (ADA LOVELACE) Tj ET', 'latin1'),
    );
    const pdf = makePdf([
      '<< /Type /Catalog /Pages 2 0 R /OpenAction [3 0 R /XYZ null null 0] >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /Annots null /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
      { dict: '<< /Filter /FlateDecode >>', stream: content },
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    ]);
    expect(await pdfToText(pdf)).toBe('ADA LOVELACE');
  });

  it('reads a PDF whose font uses glyph ids + ToUnicode (Google Docs / Word export style)', async () => {
    // Glyph ids 1..5 → "A","d","a"," ","L" etc. via a 2-byte ToUnicode CMap.
    const cmap = `/CIDInit /ProcSet findresource begin 12 dict begin begincmap
1 begincodespacerange <0000> <FFFF> endcodespacerange
2 beginbfchar <0001> <0041> <0002> <0064> endbfchar
1 beginbfrange <0003> <0004> <0061> endbfrange
endcmap end end`;
    const content = deflateSync(
      Buffer.from(
        'BT /F1 11 Tf 1 0 0 1 72 700 Tm <0001000200030004> Tj 1 0 0 1 72 680 Tm <0001> Tj ET',
        'latin1',
      ),
    );
    const pdf = makePdf([
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 /Resources << /Font << /F1 5 0 R >> >> >>',
      '<< /Type /Page /Parent 2 0 R /Contents 4 0 R >>', // resources inherited from the Pages node
      { dict: '<< /Filter /FlateDecode >>', stream: content },
      '<< /Type /Font /Subtype /Type0 /BaseFont /ABC+Inter /Encoding /Identity-H /ToUnicode 6 0 R >>',
      { dict: '<< /Filter /FlateDecode >>', stream: deflateSync(Buffer.from(cmap, 'latin1')) },
    ]);
    expect(await pdfToText(pdf)).toBe('Adab\nA');
  });

  it('reads a real Chrome/Skia PDF (per-glyph positioning, subset CID fonts)', async () => {
    // Printed by Chrome from a fictional résumé. Glyphs are placed one by one with Td,
    // so word breaks must come from glyph widths, not from every reposition.
    const bytes = new Uint8Array(
      readFileSync(new URL('./fixtures/chrome-resume.pdf', import.meta.url)),
    );
    const text = await pdfToText(bytes);
    expect(text).toContain('Ada Lovelace');
    expect(text).toContain('ada.lovelace@example.com | +44 20 7946 0000 | London, UK');
    expect(text).toMatch(/^EXPERIENCE$/m);
    expect(text).toContain('Senior Software Engineer — Difference Labs');
    const parsed = parseResumeText(text);
    expect(parsed.personal).toMatchObject({
      firstName: 'Ada',
      lastName: 'Lovelace',
      phone: '+44 20 7946 0000',
      city: 'London',
    });
    expect(parsed.experience.map((e) => e.company)).toEqual(['Difference Labs', 'Babbage & Co']);
    expect(parsed.certifications[0]?.name).toBe('AWS Certified Developer');
  });

  it('explains image-only PDFs and unsupported formats instead of guessing', async () => {
    const scanned = makePdf([
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R >>',
    ]);
    await expect(extractResumeText(scanned, 'scan.pdf')).rejects.toThrow(/scanned image/);
    await expect(extractResumeText(new Uint8Array([1, 2, 3]), 'old.doc')).rejects.toThrow(
      /Save it as PDF or DOCX/,
    );
  });

  it('end to end: docx → text → structured profile', async () => {
    const bytes = makeDocx(RESUME.split('\n'));
    const { text, format } = await extractResumeText(bytes, 'Ada Lovelace CV.docx');
    expect(format).toBe('docx');
    expect(parseResumeText(text).personal.email).toBe('ada@example.com');
  });
});

describe('review: never overwrite silently', () => {
  const extracted = parseResumeText(RESUME);

  it('pre-accepts new values and entries on an empty profile', () => {
    const review = buildReview(createEmptyProfile(), extracted);
    const scalar = review.items.filter((i) => i.kind === 'scalar');
    expect(scalar.every((i) => i.kind === 'scalar' && i.status === 'new')).toBe(true);
    expect(review.defaults.has('personal.email')).toBe(true);
    expect(review.defaults.has('experience:0')).toBe(true);
    const applied = applyReview(createEmptyProfile(), extracted, review, review.defaults);
    expect(applied.personal.email).toBe('ada@example.com');
    expect(applied.experience).toHaveLength(2);
    expect(applied.certifications).toHaveLength(2);
    expect(applied.experience[0]!.id).toBeTruthy();
    expect(applied.experience[0]).not.toHaveProperty('monthAssumed');
  });

  it('shows conflicts with both values and keeps the existing one by default', () => {
    const profile = sampleProfile();
    profile.professional.currentTitle = 'AI Engineer';
    const review = buildReview(profile, extracted);
    const title = review.items.find((i) => i.id === 'professional.currentTitle');
    expect(title).toMatchObject({
      kind: 'scalar',
      status: 'conflict',
      existing: 'AI Engineer',
      extracted: 'Staff Software Engineer',
    });
    expect(review.defaults.has('professional.currentTitle')).toBe(false);

    const kept = applyReview(profile, extracted, review, review.defaults);
    expect(kept.professional.currentTitle).toBe('AI Engineer');
    const used = applyReview(
      profile,
      extracted,
      review,
      new Set([...review.defaults, 'professional.currentTitle']),
    );
    expect(used.professional.currentTitle).toBe('Staff Software Engineer');
  });

  it('hides values that already match and pre-unticks duplicate entries', () => {
    const review = buildReview(sampleProfile(), extracted);
    expect(review.items.some((i) => i.id === 'personal.email')).toBe(false); // same email
    expect(review.unchanged).toBeGreaterThan(0);
    const dup = review.items.find(
      (i) => i.kind === 'entry' && i.title === 'Staff Software Engineer at Analytical Engines Ltd',
    );
    // Same company + start date, reworded title → recognised as the same role, not re-added.
    expect(dup).toMatchObject({ duplicateOf: 'Staff Engineer at Analytical Engines Ltd' });
    expect(review.defaults.has(dup!.id)).toBe(false);
  });

  it('adds only new skills, individually', () => {
    const profile = sampleProfile(); // already has TypeScript, React, SQL
    const review = buildReview(profile, extracted);
    const tags = review.items
      .filter((i) => i.kind === 'tag' && i.group === 'skills')
      .map((i) => (i.kind === 'tag' ? i.tag : ''));
    expect(tags).toEqual(['Rust', 'Leadership', 'Mentoring']);
    const applied = applyReview(profile, extracted, review, new Set(['skills:Rust']));
    expect(applied.skills.technical).toEqual(['TypeScript', 'React', 'SQL', 'Rust']);
  });

  it('does not mutate the original profile', () => {
    const profile = sampleProfile();
    const before = JSON.stringify(profile);
    const review = buildReview(profile, extracted);
    applyReview(profile, extracted, review, review.defaults);
    expect(JSON.stringify(profile)).toBe(before);
  });
});

describe('links behind the text', () => {
  it('reads hyperlink targets from PDF link annotations ("LinkedIn" with the URL behind it)', async () => {
    const content = deflateSync(
      Buffer.from(
        'BT /F1 12 Tf 72 720 Td (ADA LOVELACE) Tj 0 -14 Td (ada@example.com | LinkedIn | GitHub | Portfolio) Tj 0 -14 Td (Staff Software Engineer at Analytical Engines) Tj ET',
        'latin1',
      ),
    );
    const pdf = makePdf([
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R /Annots [6 0 R 7 0 R 8 0 R 9 0 R] >>',
      { dict: '<< /Filter /FlateDecode >>', stream: content },
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
      '<< /Type /Annot /Subtype /Link /A << /S /URI /URI (https://in.linkedin.com/in/ada-lovelace/) >> >>',
      '<< /Type /Annot /Subtype /Link /A << /S /URI /URI (https://github.com/ada) >> >>',
      '<< /Type /Annot /Subtype /Link /A << /S /URI /URI (https://ada.dev) >> >>',
      '<< /Type /Annot /Subtype /Link /A << /S /URI /URI (mailto:ada@example.com) >> >>',
    ]);
    const { text, links } = await extractResumeText(pdf, 'resume.pdf');
    expect(links).toEqual([
      'https://in.linkedin.com/in/ada-lovelace/',
      'https://github.com/ada',
      'https://ada.dev',
    ]);
    expect(parseResumeText(text, links).links).toMatchObject({
      linkedin: 'https://in.linkedin.com/in/ada-lovelace/',
      github: 'https://github.com/ada',
      portfolio: 'https://ada.dev',
    });
  });

  it('reads DOCX hyperlink relationships', () => {
    const rels = `<?xml version="1.0"?><Relationships>
      <Relationship Id="rId1" Type=".../styles" Target="styles.xml"/>
      <Relationship Id="rId5" Type=".../hyperlink" Target="https://www.linkedin.com/in/ada?trk=a&amp;b=c" TargetMode="External"/>
      <Relationship Id="rId6" Type=".../hyperlink" Target="https://x.com/ada_l" TargetMode="External"/>
    </Relationships>`;
    expect(relsToLinks(rels)).toEqual([
      'https://www.linkedin.com/in/ada?trk=a&b=c',
      'https://x.com/ada_l',
    ]);
  });

  it('recognises X / Twitter profiles and resume drive links, not posts or company pages', () => {
    const r = parseResumeText(
      'Ada Lovelace\nada@example.com\nlinkedin.com/company/engines | x.com/intent/tweet | twitter.com/ada_l | linkedin.com/in/ada\nResume: drive.google.com/file/d/abc123/view',
    );
    expect(r.links).toMatchObject({
      linkedin: 'https://linkedin.com/in/ada',
      x: 'https://twitter.com/ada_l',
      resumeUrl: 'https://drive.google.com/file/d/abc123/view',
    });
  });
});
