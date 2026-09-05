/* One-shot, idempotent content migration: Webflow CSV export -> Sanity.
   Run:  node --env-file=.env sanity/migrations/run.ts
   Re-runnable: documents are matched by legacyId (Webflow Item ID). */
import { client } from './lib/client.ts';
import { readCsv, toIso, splitRefs, bool } from './lib/csv.ts';
import { uploadImage } from './lib/assets.ts';
import { htmlToPortableText } from './lib/htmlToBlocks.ts';
import { retry, sleep } from './lib/retry.ts';

type Doc = Record<string, unknown>;

async function findIdByLegacy(type: string, legacyId: string): Promise<string | undefined> {
  // `raw` so an already-unpublished (draft-only) document is still matched and
  // reused instead of being duplicated on re-run.
  return retry(
    () =>
      client.fetch(
        `*[_type == $type && legacyId == $legacyId] | order(_id asc)[0]._id`,
        { type, legacyId },
        { perspective: 'raw' },
      ),
    `fetch ${type}`,
  );
}

async function upsert(
  type: string,
  legacyId: string,
  fields: Doc,
  opts: { draft?: boolean } = {},
): Promise<string> {
  const existing = await findIdByLegacy(type, legacyId);
  const base: Doc = { _type: type, legacyId, ...fields };

  // Source-CMS drafts stay as Sanity drafts so they never go live.
  if (opts.draft) {
    const baseId = (existing ?? `${type}.${legacyId}`).replace(/^drafts\./, '');
    const draftId = `drafts.${baseId}`;
    const saved = await retry(
      () => client.createOrReplace({ ...base, _id: draftId } as never),
      `save draft ${type}`,
    );
    if (existing && !existing.startsWith('drafts.')) {
      await retry(() => client.delete(existing), `unpublish ${type}`);
    }
    await sleep(80);
    return saved._id;
  }

  const saved = await retry(
    () =>
      existing
        ? client.createOrReplace({ ...base, _id: existing.replace(/^drafts\./, '') } as never)
        : client.create(base as never),
    `save ${type}`,
  );
  await sleep(80);
  return saved._id;
}

function slugField(value: string) {
  return { _type: 'slug', current: value };
}

async function main() {
  console.log(`Migrating into ${client.config().projectId}/${client.config().dataset}\n`);

  // 0. Site settings (values lifted from the Webflow custom code / JSON-LD) ---
  await client.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    personName: 'Srdjan Jovic',
    jobTitle: 'Webflow Developer',
    personDescription:
      'Webflow developer with a strong eye for detail, building pixel-perfect sites with client-first architecture. I work with health, fitness and B2B clients, building fast, scalable websites that look great and convert.',
    personImage: await uploadImage(
      'https://cdn.prod.website-files.com/69fdc751840e0f914668bc72/6a2a9b7adc52d9c7f19d78b8_sdadasd.avif',
      'Man with beard and glasses wearing a black Jack & Jones t-shirt with arms crossed.',
    ),
    personImageCaption:
      'Man with beard and glasses wearing a black Jack & Jones t-shirt with arms crossed.',
    knowsAbout: [
      'Webflow Development',
      'JavaScript',
      'Figma Design',
      'API Integration',
      'Make Automation',
      'CMS Architecture',
      'Technical SEO',
      'Core Web Vitals',
    ],
    occupationCountry: 'Serbia',
    occupationSkills:
      'Webflow, JavaScript, Figma, API Integration, Make Automation, CMS, Technical SEO',
    linkedinUrl: 'https://www.linkedin.com/in/srdjanjovic',
    instagramUrl: 'https://www.instagram.com/flowmagiaa/',
    defaultOgImage: await uploadImage(
      'https://cdn.prod.website-files.com/69fdc751840e0f914668bc72/6a115a74d0f7f030975d9933_opengraph.avif',
    ),
    newsletterHeading: 'Stay in the loop',
    newsletterCopy:
      'Subscribe to get new articles on Webflow development, SEO/aeo and Make automations straight to your inbox. No spam, just useful content.',
    mailchimpAction:
      'https://gmail.us12.list-manage.com/subscribe/post?u=b4bc0d2746891d4f56081b70a&id=88b63a715c&f_id=000ec7e1f0',
    mailchimpHiddenField: 'tags',
    hubspotPortalId: '148937674',
  });
  console.log('siteSettings: ok');

  // 1. Taxonomies ------------------------------------------------------------
  const industryMap = new Map<string, string>();
  for (const r of readCsv('industries.csv')) {
    const id = await upsert('industry', r['Item ID'], {
      name: r['Name'],
      slug: slugField(r['Slug']),
    });
    industryMap.set(r['Slug'], id);
  }
  console.log(`industry: ${industryMap.size}`);

  const techMap = new Map<string, string>();
  for (const r of readCsv('tech-stacks.csv')) {
    const id = await upsert('techStack', r['Item ID'], {
      name: r['Name'],
      slug: slugField(r['Slug']),
    });
    techMap.set(r['Slug'], id);
  }
  console.log(`techStack: ${techMap.size}`);

  const catMap = new Map<string, string>();
  for (const r of readCsv('resource-category.csv')) {
    const id = await upsert('resourceCategory', r['Item ID'], {
      name: r['Name'],
      slug: slugField(r['Slug']),
      order: r['Category order'] ? Number(r['Category order']) : undefined,
    });
    catMap.set(r['Slug'], id);
  }
  console.log(`resourceCategory: ${catMap.size}`);

  const authorMap = new Map<string, string>();
  for (const r of readCsv('authors.csv')) {
    const id = await upsert('author', r['Item ID'], {
      name: r['Name'],
      slug: slugField(r['Slug']),
      photo: await uploadImage(r['Author IMG'], r['Name']),
    });
    authorMap.set(r['Slug'], id);
  }
  console.log(`author: ${authorMap.size}`);

  // 2. Testimonials --------------------------------------------------------
  const testimonialMap = new Map<string, string>();
  for (const r of readCsv('testimonials.csv')) {
    const id = await upsert('testimonial', r['Item ID'], {
      name: r['Name'],
      slug: slugField(r['Slug']),
      company: r['Firm or Organization'] || undefined,
      quote: r['Card Description'] || undefined,
      photo: await uploadImage(r['Thumbnail IMG'], r['Name']),
      videoUrl: r['Video Testimonial URL'] || undefined,
      videoPoster: await uploadImage(r['Video Testimonial POSTER']),
      order: r['Testimonial Order'] ? Number(r['Testimonial Order']) : undefined,
    });
    testimonialMap.set(r['Slug'], id);
  }
  console.log(`testimonial: ${testimonialMap.size}`);

  const ref = (id: string | undefined) =>
    id ? { _type: 'reference', _ref: id } : undefined;

  // 3. Case studies ------------------------------------------------------
  let csCount = 0;
  for (const r of readCsv('case-studies.csv')) {
    const marquee: unknown[] = [];
    for (let i = 1; i <= 6; i++) {
      const img = await uploadImage(r[`Marquee img ${i}`]);
      if (img) marquee.push({ ...img, _key: `m${i}` });
    }
    const stats: unknown[] = [];
    if (r['Reults 1 Value'] || r['Results 1 Value'])
      stats.push({ _type: 'statItem', _key: 's1', value: r['Reults 1 Value'] || r['Results 1 Value'], label: r['Result 1 Text'] });
    if (r['Results 2 Value'])
      stats.push({ _type: 'statItem', _key: 's2', value: r['Results 2 Value'], label: r['Result 2 Text'] });

    await upsert('caseStudy', r['Item ID'], {
      name: r['Name'],
      slug: slugField(r['Slug']),
      clientDescription: r['Client Description'] || undefined,
      year: r['Year'] || undefined,
      industry: ref(industryMap.get(r['Industry'])),
      currentWebsite: r['Current Website'] || undefined,
      cardThumbnail: await uploadImage(r['Card Thumbnail'], r['Name']),
      coverImage: await uploadImage(r['Cover Image'], r['Name']),
      techStack: splitRefs(r['Tech Stack'])
        .map((s) => ref(techMap.get(s)))
        .filter(Boolean)
        .map((x, i) => ({ ...(x as object), _key: `t${i}` })),
      testimonial: ref(testimonialMap.get(r['Testimonial'])),
      cardNumber: r['Card Number'] ? Number(r['Card Number']) : undefined,
      order: r['Order'] ? Number(r['Order']) : undefined,
      overviewParagraph: r['Overview Paragraph'] || undefined,
      marqueeImages: marquee.length ? marquee : undefined,
      challengeParagraph1: r['The Challenge Paragraph 1'] || undefined,
      challengeParagraph2: r['The Challenge Paragraph 2'] || undefined,
      challengeImage: await uploadImage(r['The Challenge Image']),
      roleParagraph1: r['My Role Paragraph 1'] || undefined,
      roleParagraph2: r['My Role Paragraph 2'] || undefined,
      roleImage: await uploadImage(r['My Role Image']),
      approachParagraph: r['Technical Approach Paragraph'] || undefined,
      approachImage: await uploadImage(r['Technical Approach Image']),
      stats: stats.length ? stats : undefined,
      keyTakeaway: r['Key Takeaway Paragraph'] || undefined,
      datePublished: toIso(r['Published On']),
      dateModified: toIso(r['Updated On']),
      seo: {
        _type: 'seo',
        title: r['Title Tag'] || undefined,
        description: r['Meta Description'] || undefined,
      },
    });
    csCount++;
  }
  console.log(`caseStudy: ${csCount}`);

  // 4. Events ----------------------------------------------------------
  let evCount = 0;
  for (const r of readCsv('events.csv')) {
    await upsert('event', r['Item ID'], {
      name: r['Name'],
      slug: slugField(r['Slug']),
      overview: r['Event Overview'] || undefined,
      year: r['Year'] || undefined,
      host: r['Host'] || undefined,
      location: r['Location'] || undefined,
      coverImage: await uploadImage(r['Cover IMG'], r['Name']),
      thumbnail: await uploadImage(r['Thumbnail'], r['Name']),
      body: htmlToPortableText(r['Body Text']),
      datePublished: toIso(r['Published On']),
      dateModified: toIso(r['Updated On']),
      seo: {
        _type: 'seo',
        title: r['Title Tag'] || undefined,
        description: r['Meta Description'] || undefined,
      },
    });
    evCount++;
  }
  console.log(`event: ${evCount}`);

  // 5. Resources -----------------------------------------------------
  let rsCount = 0;
  for (const r of readCsv('resources.csv')) {
    const faqs: unknown[] = [];
    for (let i = 1; i <= 6; i++) {
      const q = r[`FAQ Question ${i}`];
      const a = r[`FAQ Answer ${i} (plain)`];
      if (q && a) faqs.push({ _type: 'faqItem', _key: `q${i}`, question: q, answer: a });
    }
    await upsert(
      'resource',
      r['Item ID'],
      {
        name: r['Name'],
        slug: slugField(r['Slug']),
        coverImage: await uploadImage(r['Cover Image'], r['Name']),
        category: ref(catMap.get(r['Category'])),
        author: ref(authorMap.get(r['Author'])),
        publishDate: toIso(r['Publish Date']),
        dateModified: toIso(r['Updated On']),
        featured: bool(r['Featured']),
        timeToRead: r['Time to read'] ? Number(r['Time to read']) : undefined,
        tldr: htmlToPortableText(r['TL;DR']),
        body: htmlToPortableText(r['Body Content']),
        faqs: faqs.length ? faqs : undefined,
        seo: {
          _type: 'seo',
          title: r['Meta Title'] || undefined,
          description: r['Meta Description'] || undefined,
        },
      },
      { draft: bool(r['Draft']) },
    );
    rsCount++;
  }
  console.log(`resource: ${rsCount}`);

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
