import { defineType, defineField } from 'sanity';

/* Single document (id "siteSettings"). Global values lifted out of the Webflow
   custom code: the Person identity for JSON-LD, the hard-coded home-page
   reviews, the default OG image, newsletter copy + Mailchimp params, HubSpot id. */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  groups: [
    { name: 'person', title: 'Person (JSON-LD)', default: true },
    { name: 'reviews', title: 'Home reviews' },
    { name: 'social', title: 'Social & sharing' },
    { name: 'newsletter', title: 'Newsletter' },
    { name: 'integrations', title: 'Integrations' },
  ],
  fields: [
    // Person
    defineField({ name: 'personName', title: 'Name', type: 'string', group: 'person', initialValue: 'Srdjan Jovic' }),
    defineField({ name: 'jobTitle', type: 'string', group: 'person', initialValue: 'Webflow Developer' }),
    defineField({ name: 'personDescription', title: 'Description', type: 'text', rows: 3, group: 'person' }),
    defineField({
      name: 'personImage',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      group: 'person',
      fields: [defineField({ name: 'alt', type: 'string' })],
    }),
    defineField({ name: 'personImageCaption', title: 'Photo caption (schema)', type: 'string', group: 'person' }),
    defineField({ name: 'knowsAbout', title: 'Knows about', type: 'array', of: [{ type: 'string' }], group: 'person' }),
    defineField({ name: 'occupationCountry', title: 'Occupation country', type: 'string', group: 'person', initialValue: 'Serbia' }),
    defineField({ name: 'occupationSkills', title: 'Occupation skills', type: 'string', group: 'person' }),

    // Home reviews (hard-coded in the Webflow JSON-LD, not the testimonials collection)
    defineField({
      name: 'homeReviews',
      title: 'Home / case-study list reviews',
      type: 'array',
      group: 'reviews',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'authorName', type: 'string' }),
            defineField({ name: 'authorJobTitle', type: 'string' }),
            defineField({ name: 'authorCompany', type: 'string' }),
            defineField({ name: 'reviewBody', type: 'text', rows: 3 }),
          ],
          preview: { select: { title: 'authorName', subtitle: 'authorCompany' } },
        },
      ],
    }),

    // Social & sharing
    defineField({ name: 'linkedinUrl', title: 'LinkedIn URL', type: 'url', group: 'social' }),
    defineField({ name: 'instagramUrl', title: 'Instagram URL', type: 'url', group: 'social' }),
    defineField({
      name: 'defaultOgImage',
      title: 'Default social share image',
      type: 'image',
      options: { hotspot: true },
      group: 'social',
    }),

    // Newsletter
    defineField({ name: 'newsletterHeading', type: 'string', group: 'newsletter' }),
    defineField({ name: 'newsletterCopy', type: 'text', rows: 2, group: 'newsletter' }),
    defineField({ name: 'mailchimpAction', title: 'Mailchimp form action URL', type: 'url', group: 'newsletter' }),
    defineField({ name: 'mailchimpHiddenField', title: 'Mailchimp hidden anti-bot field name', type: 'string', group: 'newsletter' }),

    // Integrations
    defineField({ name: 'hubspotPortalId', type: 'string', group: 'integrations' }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
});
