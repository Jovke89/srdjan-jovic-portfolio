import type { StructureResolver } from 'sanity/structure';
import { CogIcon } from '@sanity/icons/Cog';

const SINGLETONS = ['siteSettings'];

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site settings')
        .icon(CogIcon)
        .child(S.document().schemaType('siteSettings').documentId('siteSettings').title('Site settings')),

      S.divider(),

      S.documentTypeListItem('caseStudy').title('Case studies'),
      S.documentTypeListItem('resource').title('Resources'),
      S.documentTypeListItem('event').title('Events'),
      S.documentTypeListItem('testimonial').title('Testimonials'),

      S.divider(),

      S.listItem()
        .title('Taxonomies')
        .child(
          S.list()
            .title('Taxonomies')
            .items([
              S.documentTypeListItem('industry').title('Industries'),
              S.documentTypeListItem('techStack').title('Tech stacks'),
              S.documentTypeListItem('resourceCategory').title('Resource categories'),
              S.documentTypeListItem('author').title('Authors'),
            ]),
        ),

      S.divider(),

      ...S.documentTypeListItems().filter((item) => {
        const id = item.getId();
        return (
          id &&
          !SINGLETONS.includes(id) &&
          ![
            'caseStudy',
            'resource',
            'event',
            'testimonial',
            'industry',
            'techStack',
            'resourceCategory',
            'author',
          ].includes(id)
        );
      }),
    ]);
