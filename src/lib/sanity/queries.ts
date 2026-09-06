import { defineQuery } from 'groq';

const IMG = /* groq */ `{ ..., asset->{ _id, url, metadata { lqip, dimensions } } }`;

const SEO = /* groq */ `seo{ title, description, noIndex, ogImage${IMG} }`;

/* --- Site settings singleton --- */
export const SITE_SETTINGS_QUERY = defineQuery(`*[_id == "siteSettings"][0]{
  personName, jobTitle, personDescription, personImageCaption,
  personImage${IMG},
  knowsAbout, occupationCountry, occupationSkills,
  linkedinUrl, instagramUrl, githubUrl,
  defaultOgImage${IMG},
  newsletterHeading, newsletterCopy, mailchimpAction, mailchimpHiddenField
}`);

/* --- Home --- */
export const HOME_QUERY = defineQuery(`{
  "caseStudies": *[_type == "caseStudy"] | order(cardNumber asc)[0...3]{
    name, "slug": slug.current, year, clientDescription, cardNumber,
    "industry": industry->name,
    "tech": techStack[]->name,
    cardThumbnail${IMG}, coverImage${IMG}
  },
  "resources": *[_type == "resource"] | order(publishDate desc)[0...2]{
    name, "slug": slug.current, timeToRead,
    "excerpt": seo.description,
    "category": category->name,
    "author": author->{ name, photo${IMG} },
    coverImage${IMG}
  },
  "textTestimonials": *[_type == "testimonial" && !defined(videoUrl)] | order(order asc){
    name, company, quote, photo${IMG}
  },
  "videoTestimonials": *[_type == "testimonial" && defined(videoUrl)] | order(order asc){
    name, company, quote, videoUrl, photo${IMG}, videoPoster${IMG}
  }
}`);

/* --- Case studies --- */
export const CASE_STUDIES_LIST_QUERY = defineQuery(`*[_type == "caseStudy"] | order(order asc, datePublished desc){
  name, "slug": slug.current, year, clientDescription,
  "industry": industry->name,
  "tech": techStack[]->name,
  cardThumbnail${IMG}, coverImage${IMG},
  ${SEO}
}`);

export const CASE_STUDY_SLUGS_QUERY = defineQuery(`*[_type == "caseStudy" && defined(slug.current)]{ "slug": slug.current }`);

export const CASE_STUDY_QUERY = defineQuery(`*[_type == "caseStudy" && slug.current == $slug][0]{
  ...,
  "slug": slug.current,
  "industry": industry->{ name, "slug": slug.current },
  "tech": techStack[]->{ name, "slug": slug.current },
  "testimonial": testimonial->{ name, company, quote, photo${IMG}, videoUrl, videoPoster${IMG} },
  cardThumbnail${IMG}, coverImage${IMG}, challengeImage${IMG}, roleImage${IMG}, approachImage${IMG},
  marqueeImages[]${IMG},
  ${SEO}
}`);

/* --- Events --- */
export const EVENTS_LIST_QUERY = defineQuery(`*[_type == "event"] | order(startDate desc, datePublished desc){
  name, "slug": slug.current, overview, year, host, location,
  thumbnail${IMG}, coverImage${IMG}, ${SEO}
}`);

export const EVENT_SLUGS_QUERY = defineQuery(`*[_type == "event" && defined(slug.current)]{ "slug": slug.current }`);

export const EVENT_QUERY = defineQuery(`*[_type == "event" && slug.current == $slug][0]{
  ..., "slug": slug.current,
  coverImage${IMG}, thumbnail${IMG},
  ${SEO}
}`);

/* --- Resources --- */
export const RESOURCES_LIST_QUERY = defineQuery(`{
  "resources": *[_type == "resource"] | order(publishDate desc){
    name, "slug": slug.current, timeToRead, featured, publishDate,
    "category": category->{ name, "slug": slug.current },
    "author": author->{ name, photo${IMG} },
    coverImage${IMG}, ${SEO}
  },
  "categories": *[_type == "resourceCategory"] | order(order asc){ name, "slug": slug.current }
}`);

export const RESOURCE_SLUGS_QUERY = defineQuery(`*[_type == "resource" && defined(slug.current)]{ "slug": slug.current }`);

export const RESOURCE_QUERY = defineQuery(`*[_type == "resource" && slug.current == $slug][0]{
  ..., "slug": slug.current,
  "category": category->{ name, "slug": slug.current },
  "author": author->{ name, "slug": slug.current, photo${IMG}, bio },
  coverImage${IMG},
  ${SEO}
}`);

export const RELATED_RESOURCES_QUERY = defineQuery(`*[_type == "resource" && slug.current != $slug && category._ref == $categoryId] | order(publishDate desc)[0...3]{
  name, "slug": slug.current, timeToRead,
  "category": category->name,
  "author": author->{ name, photo${IMG} },
  coverImage${IMG}
}`);

/* --- Taxonomy pages --- */
export const INDUSTRY_SLUGS_QUERY = defineQuery(`*[_type == "industry" && defined(slug.current)]{ "slug": slug.current }`);
export const TECH_SLUGS_QUERY = defineQuery(`*[_type == "techStack" && defined(slug.current)]{ "slug": slug.current }`);
export const AUTHOR_SLUGS_QUERY = defineQuery(`*[_type == "author" && defined(slug.current)]{ "slug": slug.current }`);
export const CATEGORY_SLUGS_QUERY = defineQuery(`*[_type == "resourceCategory" && defined(slug.current)]{ "slug": slug.current }`);
export const TESTIMONIAL_SLUGS_QUERY = defineQuery(`*[_type == "testimonial" && defined(slug.current)]{ "slug": slug.current }`);

export const INDUSTRY_PAGE_QUERY = defineQuery(`*[_type == "industry" && slug.current == $slug][0]{
  name, "slug": slug.current,
  "caseStudies": *[_type == "caseStudy" && references(^._id)] | order(order asc){
    name, "slug": slug.current, year, clientDescription, cardThumbnail${IMG}
  }
}`);

export const TECH_PAGE_QUERY = defineQuery(`*[_type == "techStack" && slug.current == $slug][0]{
  name, "slug": slug.current,
  "caseStudies": *[_type == "caseStudy" && references(^._id)] | order(order asc){
    name, "slug": slug.current, year, clientDescription, cardThumbnail${IMG}
  }
}`);

export const AUTHOR_PAGE_QUERY = defineQuery(`*[_type == "author" && slug.current == $slug][0]{
  name, "slug": slug.current, bio, photo${IMG},
  "resources": *[_type == "resource" && references(^._id)] | order(publishDate desc){
    name, "slug": slug.current, timeToRead, "category": category->name, coverImage${IMG}
  }
}`);

export const CATEGORY_PAGE_QUERY = defineQuery(`*[_type == "resourceCategory" && slug.current == $slug][0]{
  name, "slug": slug.current,
  "resources": *[_type == "resource" && references(^._id)] | order(publishDate desc){
    name, "slug": slug.current, timeToRead, "author": author->{ name, photo${IMG} }, coverImage${IMG}
  }
}`);

export const TESTIMONIAL_PAGE_QUERY = defineQuery(`*[_type == "testimonial" && slug.current == $slug][0]{
  name, company, quote, photo${IMG}, videoUrl, videoPoster${IMG}
}`);
