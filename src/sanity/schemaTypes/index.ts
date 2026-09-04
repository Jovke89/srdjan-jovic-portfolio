import { seo } from './objects/seo';
import { blockContent } from './objects/blockContent';
import { faqItem } from './objects/faqItem';
import { statItem } from './objects/statItem';

import { industry } from './documents/industry';
import { techStack } from './documents/techStack';
import { resourceCategory } from './documents/resourceCategory';
import { author } from './documents/author';
import { testimonial } from './documents/testimonial';
import { caseStudy } from './documents/caseStudy';
import { event } from './documents/event';
import { resource } from './documents/resource';

import { siteSettings } from './singletons/siteSettings';

export const schemaTypes = [
  // objects
  seo,
  blockContent,
  faqItem,
  statItem,
  // documents
  industry,
  techStack,
  resourceCategory,
  author,
  testimonial,
  caseStudy,
  event,
  resource,
  // singletons
  siteSettings,
];
