/* JSON-LD builders that reproduce, 1:1, the schema blocks from the Webflow export.
   Every static literal (types, inLanguage, @id anchors, sameAs order, knowsAbout,
   occupation) is preserved. Dynamic values come from Sanity + siteSettings. */
import { SITE_URL } from './site';

export type PersonSettings = {
  name: string;
  jobTitle: string;
  description?: string;
  imageUrl?: string;
  imageCaption?: string;
  sameAs: string[];
  knowsAbout?: string[];
  occupationCountry?: string;
  occupationSkills?: string;
};

export type HomeReview = {
  authorName: string;
  authorJobTitle?: string;
  authorCompany?: string;
  reviewBody: string;
};

const CTX = 'https://schema.org';

/* --- Person variants (matching each page's exact shape) --- */

// index.html mainEntity
function personFull(p: PersonSettings) {
  return {
    '@type': 'Person',
    name: p.name,
    jobTitle: p.jobTitle,
    ...(p.description ? { description: p.description } : {}),
    ...(p.imageUrl
      ? {
          image: {
            '@type': 'ImageObject',
            url: p.imageUrl,
            ...(p.imageCaption ? { caption: p.imageCaption } : {}),
          },
        }
      : {}),
    sameAs: p.sameAs,
    ...(p.knowsAbout?.length ? { knowsAbout: p.knowsAbout } : {}),
    hasOccupation: {
      '@type': 'Occupation',
      name: p.jobTitle,
      occupationLocation: {
        '@type': 'Country',
        name: p.occupationCountry || 'Serbia',
      },
      ...(p.occupationSkills ? { skills: p.occupationSkills } : {}),
    },
  };
}

// contact.html about / case-study.html + events.html about
function personShort(p: PersonSettings) {
  return {
    '@type': 'Person',
    name: p.name,
    jobTitle: p.jobTitle,
    sameAs: p.sameAs,
  };
}

// resources.html author
function personAuthorWithTitle(p: PersonSettings) {
  return {
    '@type': 'Person',
    name: p.name,
    jobTitle: p.jobTitle,
    url: '/',
    sameAs: p.sameAs,
  };
}

// detail_case-study.html author
function personAuthor(p: PersonSettings) {
  return {
    '@type': 'Person',
    name: p.name,
    url: '/',
    sameAs: p.sameAs,
  };
}

function reviews(list: HomeReview[]) {
  return list.map((r) => ({
    '@type': 'Review',
    author: {
      '@type': 'Person',
      name: r.authorName,
      ...(r.authorJobTitle ? { jobTitle: r.authorJobTitle } : {}),
      ...(r.authorCompany
        ? { worksFor: { '@type': 'Organization', name: r.authorCompany } }
        : {}),
    },
    reviewBody: r.reviewBody,
  }));
}

/* --- Page builders --- */

// index.html
export function buildProfilePageLd(opts: {
  title: string;
  description: string;
  person: PersonSettings;
  reviews: HomeReview[];
}) {
  return {
    '@context': CTX,
    '@type': 'ProfilePage',
    name: opts.title,
    description: opts.description,
    url: '/',
    inLanguage: 'en',
    mainEntity: personFull(opts.person),
    review: reviews(opts.reviews),
  };
}

// contact.html
export function buildContactPageLd(opts: {
  title: string;
  description: string;
  person: PersonSettings;
}) {
  return {
    '@context': CTX,
    '@type': 'ContactPage',
    name: opts.title,
    description: opts.description,
    url: '/contact',
    inLanguage: 'en',
    about: personShort(opts.person),
  };
}

// case-study.html (list)
export function buildCaseStudyListLd(opts: {
  person: PersonSettings;
  reviews: HomeReview[];
  items: { name: string; description: string; slug: string; image?: string }[];
}) {
  return {
    '@context': CTX,
    '@type': 'WebPage',
    name: 'A closer look at my work',
    description:
      'Explore selected projects I’ve designed and built, from the initial concept and visual direction to the final Webflow development.',
    url: '/case-studies',
    inLanguage: 'en',
    about: personShort(opts.person),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: opts.items.map((it, i) => ({
        '@type': 'CreativeWork',
        position: i + 1,
        name: it.name,
        description: it.description,
        url: `/case-studies/${it.slug}`,
        ...(it.image ? { image: it.image } : {}),
      })),
    },
    review: reviews(opts.reviews),
  };
}

// events.html (list)
export function buildEventsListLd(opts: {
  person: PersonSettings;
  events: { name: string; description: string; slug: string; image?: string }[];
}) {
  return {
    '@context': CTX,
    '@type': 'CollectionPage',
    name: 'Events & Conferences',
    description:
      'A collection of events, conferences, and experiences that have shaped the way I think about design, development, and the web.',
    url: '/events',
    inLanguage: 'en',
    about: personShort(opts.person),
    hasPart: opts.events.map((e) => ({
      '@type': 'Event',
      name: e.name,
      description: e.description,
      url: `/events/${e.slug}`,
      ...(e.image ? { image: { '@type': 'ImageObject', url: e.image } } : {}),
    })),
  };
}

// resources.html (list)
export function buildResourcesListLd(opts: {
  person: PersonSettings;
  articles: {
    headline: string;
    slug: string;
    articleSection?: string;
    image?: string;
  }[];
}) {
  return {
    '@context': CTX,
    '@type': 'CollectionPage',
    name: 'Webflow Resources & Insights',
    description:
      'Practical guides, tutorials, comparisons, and insights on Webflow, SEO, AEO, integrations, and automation, based on real-world development experience.',
    url: '/resource',
    inLanguage: 'en',
    author: personAuthorWithTitle(opts.person),
    hasPart: opts.articles.map((a) => ({
      '@type': 'Article',
      '@id': `/resources/${a.slug}`,
      headline: a.headline,
      author: { '@type': 'Person', name: opts.person.name },
      ...(a.image ? { image: a.image } : {}),
      ...(a.articleSection ? { articleSection: a.articleSection } : {}),
    })),
  };
}

// detail_case-study.html — Article
export function buildArticleLd(opts: {
  headline: string;
  description: string;
  slug: string;
  datePublished?: string;
  dateModified?: string;
  imageUrl?: string;
  person: PersonSettings;
  clientOrg?: { name?: string; description?: string; url?: string };
}) {
  return {
    '@context': CTX,
    '@type': 'Article',
    headline: opts.headline,
    description: opts.description,
    url: `/case-studies/${opts.slug}`,
    datePublished: opts.datePublished || '',
    dateModified: opts.dateModified || opts.datePublished || '',
    inLanguage: 'en',
    author: personAuthor(opts.person),
    image: { '@type': 'ImageObject', url: opts.imageUrl || '' },
    about: {
      '@type': 'Organization',
      name: opts.clientOrg?.name || '',
      description: opts.clientOrg?.description || '',
      url: opts.clientOrg?.url || '',
    },
  };
}

// detail_events.html — Event
export function buildEventLd(opts: {
  name: string;
  description: string;
  slug: string;
  startDate?: string;
  locationName?: string;
  addressLocality?: string;
  organizerName?: string;
  imageUrl?: string;
}) {
  return {
    '@context': CTX,
    '@type': 'Event',
    name: opts.name,
    description: opts.description,
    url: `/events/${opts.slug}`,
    startDate: opts.startDate || '',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: opts.locationName || opts.addressLocality || '',
      address: {
        '@type': 'PostalAddress',
        addressLocality: opts.addressLocality || '',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: opts.organizerName || '',
    },
    image: opts.imageUrl || '',
    inLanguage: 'en',
  };
}

// detail_resources.html — BlogPosting + FAQPage in one @graph
export function buildBlogPostingWithFaqLd(opts: {
  slug: string;
  headline: string;
  description: string;
  imageUrl?: string;
  articleSection?: string;
  datePublished?: string;
  dateModified?: string;
  person: PersonSettings;
  faqs: { question: string; answer: string }[];
}) {
  const pageUrl = `${SITE_URL}/resources/${opts.slug}/`;
  return {
    '@context': CTX,
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${pageUrl}#article`,
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        url: pageUrl,
        headline: opts.headline,
        description: opts.description,
        image: opts.imageUrl || '',
        articleSection: opts.articleSection || '',
        datePublished: opts.datePublished || '',
        dateModified: opts.dateModified || opts.datePublished || '',
        inLanguage: 'en',
        isPartOf: {
          '@type': 'Blog',
          '@id': `${SITE_URL}/resource#blog`,
          name: 'Srdjan Jovic Resources',
        },
        author: {
          '@type': 'Person',
          name: opts.person.name,
          url: `${SITE_URL}/`,
          sameAs: opts.person.sameAs,
        },
        publisher: {
          '@type': 'Person',
          name: opts.person.name,
          url: `${SITE_URL}/`,
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        inLanguage: 'en',
        mainEntity: opts.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  };
}
