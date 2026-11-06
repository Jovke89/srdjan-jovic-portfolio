/* Pricing page content. Prices are edited here (no CMS on purpose: they change rarely). */

/* Currency switch START */
export const currencies = [
  { id: 'usd', symbol: '$', label: '$ USD' },
  { id: 'eur', symbol: '€', label: '€ EUR' },
  { id: 'gbp', symbol: '£', label: '£ GBP' },
] as const;

export type CurrencyId = (typeof currencies)[number]['id'];

/* Fixed rates on purpose, so a price never moves between two visits. Update them by hand.
   ECB reference rates on 2026-11-05: EUR 0.89095, GBP 0.74299 */
const RATE_PER_USD: Record<CurrencyId, number> = { usd: 1, eur: 0.89, gbp: 0.74 };

/* Prices round to the nearest 100 so they read as set prices, not as a conversion */
export function priceParts(usd: number, currency: CurrencyId): { symbol: string; amount: string } {
  const value = Math.round((usd * RATE_PER_USD[currency]) / 100) * 100;
  const parts = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).formatToParts(value);
  return {
    symbol: parts.find((part) => part.type === 'currency')?.value ?? '',
    amount: parts
      .filter((part) => part.type !== 'currency')
      .map((part) => part.value)
      .join(''),
  };
}
/* Currency switch END */

export interface Plan {
  name: string;
  /* Plain size label under the plan name */
  subtitle?: string;
  timeline: string;
  /* A number is a price in USD, a string is shown as is ("Let's talk") */
  price: number | string;
  period?: string;
  bestFor: string;
  includesLead: string;
  includes: string[];
  cta: { label: string; href: string };
  featured?: boolean;
  badge?: string;
}

export const projectPlans: Plan[] = [
  {
    name: 'Web Starter',
    subtitle: 'Small websites',
    timeline: '4 to 6 weeks',
    price: 5_000,
    bestFor: 'Companies that need a fast, credible site with a few pages and simple content.',
    includesLead: 'What you get',
    includes: [
      'Up to 10 pages',
      'Website strategy and sitemap',
      'Custom design, or a build from your Figma file',
      'Webflow build with a clean Client-First structure',
      'Up to 3 CMS collections',
      'Core Web Vitals optimization',
      'Technical SEO',
      'Simple text animations',
      'Webflow forms',
      'GA4 and Search Console',
    ],
    cta: { label: 'Get a project quote', href: '/contact/' },
  },
  {
    name: 'Web Engine',
    subtitle: 'Mid-sized websites',
    timeline: '6 to 8 weeks',
    price: 8_500,
    badge: 'Most popular',
    bestFor: 'Growing B2B and service companies that get most of their leads from the website.',
    includesLead: 'Everything in Web Starter, plus',
    includes: [
      'Unlimited pages',
      'Unlimited CMS collections',
      'Copywriting',
      'Website migration',
      'SEO optimization',
      'AI search visibility (AEO): schema markup and llms.txt',
      'CRM and 3rd party integrations',
      'API integrations',
      'Multi-language setup',
      'GA4 and Search Console',
      'Make automations',
      'Custom animations',
      'Training video for your team',
      '60 days of support',
    ],
    cta: { label: 'Get a project quote', href: '/contact/' },
    featured: true,
  },
  {
    name: 'Web Master',
    subtitle: 'Enterprise websites',
    timeline: '8 to 12 weeks',
    price: 14_000,
    bestFor: 'Companies with a lot of content, several languages or custom integrations.',
    includesLead: 'Everything in Web Engine, plus',
    includes: [
      'Complex CMS structure with linked collections',
      'Custom integrations and API work',
      'Custom code and GSAP animations',
      'Roles and publishing workflow for your team',
      'Live training session for your team',
      '90 days of support',
    ],
    cta: { label: 'Get a project quote', href: '/contact/' },
  },
];

/* Plan compare table START */
/* Only what differs between the three project plans. Every value comes from the plan lists above,
   so update both together. A number is a USD price, true is a check, false is a dash. */
export type PlanCompareCell = number | string | boolean;

export const planCompareRows: { label: string; values: PlanCompareCell[] }[] = [
  { label: 'Starting price', values: projectPlans.map((plan) => plan.price) },
  { label: 'Timeline', values: projectPlans.map((plan) => plan.timeline) },
  { label: 'Pages', values: ['Up to 10', 'Unlimited', 'Unlimited'] },
  { label: 'CMS collections', values: ['Up to 3', 'Unlimited', 'Unlimited, with linked collections'] },
  { label: 'Copywriting', values: [false, true, true] },
  { label: 'Website migration', values: [false, true, true] },
  { label: 'SEO and AI search', values: ['Technical SEO', 'SEO optimization and AEO', 'SEO optimization and AEO'] },
  { label: 'Integrations', values: [false, 'CRM, API and Make automations', 'Custom integrations and API work'] },
  { label: 'Multi-language setup', values: [false, true, true] },
  { label: 'Animations', values: ['Simple text animations', 'Custom animations', 'Custom code and GSAP'] },
  { label: 'Roles and publishing workflow', values: [false, false, true] },
  { label: 'Team training', values: [false, 'Training video', 'Live training session'] },
  { label: 'Support', values: [false, '60 days', '90 days'] },
];
/* Plan compare table END */


/* What you get with a retainer: one card per feature (Greek figure image), detail panel on the right.
   Figures are cut out on a 1000 x 1000 transparent canvas, bottom aligned, exported at 800 px. */
export interface RetainerFeature {
  name: string;
  figure: string;
  plans: string;
  what: string;
  why: string;
  points: string[];
  image: { avif: string; webp: string; alt: string };
}

const figureImage = (file: string, alt: string) => ({
  avif: `/images/pricing/${file}-800.avif`,
  webp: `/images/pricing/${file}-800.webp`,
  alt,
});

export const retainerFeatures: RetainerFeature[] = [
  {
    name: 'Website maintenance',
    figure: 'Atlas',
    plans: 'Web Copilot and Web Autopilot',
    what: 'I keep your Webflow site running every month: fixes, updates, forms, links and security checks.',
    why: 'A site that slowly breaks loses visitors you never hear about. Regular maintenance keeps it fast and working.',
    points: [
      'Monthly check of forms and links',
      'Fixes within one business day',
      'Security and backup check',
      'Webflow updates and cleanup',
    ],
    image: figureImage('atlas', 'Marble statue of Atlas holding a wrench and a shield'),
  },
  {
    name: 'Page updates',
    figure: 'Hephaestus',
    plans: 'Web Copilot and Web Autopilot',
    what: 'New pages, sections and landing pages, plus changes to your CMS content, done for you.',
    why: 'Your website keeps up with your business. New services, offers and team changes go live in days, not months.',
    points: [
      'New landing and static pages, unlimited on Web Autopilot',
      'CMS items, collections and fields',
      'Text, image and layout changes',
      'Built from your existing components',
    ],
    image: figureImage('hephaestus', 'Marble statue of Hephaestus raising a hammer over an anvil'),
  },
  {
    name: 'Blog writing',
    figure: 'Apollo',
    plans: 'Web Copilot and Web Autopilot',
    what: 'Articles every month, planned around the questions your clients search for and written in your voice.',
    why: 'Useful content brings visitors from Google and gets your company quoted in AI answers. It keeps working long after it goes live.',
    points: [
      'Topic plan based on real searches',
      '2 articles a month on Web Copilot, 8 on Web Autopilot',
      'Internal links to your services',
      'Written for Google and AI search',
    ],
    image: figureImage('apollo', 'Marble statue of Apollo writing on a scroll with a quill'),
  },
  {
    name: 'SEO and AI visibility',
    figure: 'Hermes',
    plans: 'Web Autopilot',
    what: 'Technical SEO, schema and AI search optimization, checked and improved every month.',
    why: 'Buyers now ask ChatGPT and Google AI before they visit a site. When your site is clear to search engines and AI, you show up in those answers.',
    points: [
      'Technical SEO audit and fixes',
      'Schema markup and llms.txt',
      'Speed monitoring with a 90+ target',
      'Tracking of Google and AI visibility',
    ],
    image: figureImage('hermes', 'Marble statue of Hermes looking through a magnifying glass'),
  },
  {
    name: 'Reports and growth',
    figure: 'Athena',
    plans: 'Web Autopilot',
    what: 'A short monthly report and a conversion audit every quarter, on the pages that matter most.',
    why: 'You see what the website brings in, and every change is based on numbers, not guesses.',
    points: [
      'Monthly traffic and leads report',
      'Conversion audit every quarter',
      'Clear next steps every month',
    ],
    image: figureImage('athena', 'Marble statue working on a laptop'),
  },
];

/* Process (launch sequence) START */
/* Six steps counted down like a launch, T-5 to T-0. "you" is the client's part of each step.
   One fixed image sits next to the steps (processImage), only the text changes. */
export interface ProcessStep {
  code: string;
  title: string;
  text: string;
  points: string[];
  you: string;
}

export const processImage = {
  avif: '/images/pricing/process-800.avif',
  webp: '/images/pricing/process-800.webp',
  alt: 'Marble statue in a cap and sunglasses sketching a brand on paper',
};

export const processSteps: ProcessStep[] = [
  {
    code: 'T-5',
    title: 'Discovery call',
    text: 'A video call where I learn how your business works: who your clients are, how they find you and what the website has to do for you. No sales pitch, just questions and honest advice.',
    points: ['Your goals, clients and competitors', 'What works and what is missing on your current site', 'Rough budget and timeline'],
    you: 'Tell me your goals and show me sites you like',
  },
  {
    code: 'T-4',
    title: 'Proposal',
    text: 'You get a written proposal with the exact scope, timeline and price. Every page, feature and integration is listed, so you know exactly what you pay for.',
    points: ['Sitemap and list of pages', 'Timeline with clear milestones', 'Exact price, no hourly billing'],
    you: 'Read it, ask questions, ask for changes',
  },
  {
    code: 'T-3',
    title: 'Contract',
    text: 'We sign a simple contract that protects both sides. After the first payment your project gets its start date in my calendar, and nothing else takes that slot.',
    points: ['Clear scope, and what is not included', '50% to start, 50% at launch', 'Your start date is booked'],
    you: 'Sign and pay the first 50%',
  },
  {
    code: 'T-2',
    title: 'Design',
    text: 'I start with the structure, then design the key pages for desktop and mobile. If you already have a design, I check it and build straight from your Figma file.',
    points: ['Sitemap and page structure first', 'Custom design for desktop and mobile', 'Your feedback before anything is built'],
    you: 'Give feedback on the design',
  },
  {
    code: 'T-1',
    title: 'Development',
    text: 'I build the site in Webflow with a clean Client-First structure, so your team can edit it later without breaking anything. SEO, integrations and animations are done in this step.',
    points: ['Webflow build, CMS and forms', 'SEO, AI search and Core Web Vitals', 'Tested on every screen and browser'],
    you: 'Send your content, or I write it',
  },
  {
    code: 'T-0',
    title: 'Launch',
    text: 'Your site goes live on your domain with redirects, tracking and a final check. After launch you get support, or a retainer if you want me to keep growing the site.',
    points: ['Domain, redirects and GA4', 'Final speed and SEO check', 'Handover and support'],
    you: 'Pay the last 50% and celebrate',
  },
];
/* Process (launch sequence) END */

export const pricingFaqs: { question: string; answer: string }[] = [
  {
    question: 'Why are the prices "starting at"?',
    answer:
      'The final price depends on the number of page layouts, CMS collections and integrations. You get an exact quote in writing after our discovery call, before any work starts.',
  },
  {
    question: 'What is not included in the price?',
    answer:
      'Webflow hosting, your domain and paid tools like Make.com. You pay them directly, in your company name, and I list them in the proposal.',
  },
  {
    question: 'How does payment work?',
    answer:
      'Projects are 50% to start and 50% at launch. Retainers are paid monthly in advance, and you can cancel with 30 days notice.',
  },
  {
    question: 'What if a small site needs more than 3 CMS collections?',
    answer:
      'It moves to the Web Engine plan, or we add the extra collections as a fixed add-on. You see the new price before anything changes.',
  },
  {
    question: 'How long does a project take?',
    answer:
      'Small sites take 4 to 6 weeks, mid-sized 6 to 8 and large 8 to 12. Late content is the most common delay, so we plan it from the first week.',
  },
  {
    question: 'Can I switch or cancel my retainer?',
    answer:
      'Yes. You can move between Web Copilot and Web Autopilot at the start of any month, and cancel with 30 days notice.',
  },
];

export const retainerPlans: Plan[] = [
  {
    name: 'Web Copilot',
    subtitle: 'Growth plan',
    timeline: 'Monthly, cancel with 30 days notice',
    price: 1_900,
    period: '/mo',
    bestFor: 'Companies that want their site fast, safe and up to date, without hiring.',
    includesLead: 'What you get',
    includes: [
      '2 blog articles a month, written for SEO and AI search',
      'New landing pages',
      'New static pages',
      'Website maintenance, fixes and Webflow updates',
      'CMS and content updates',
      'Monthly speed, SEO and security check',
      'Short video updates instead of meetings',
      'Reply within one business day',
    ],
    cta: { label: 'Get a quote', href: '/contact/' },
  },
  {
    name: 'Web Autopilot',
    subtitle: 'Performance plan',
    timeline: 'Monthly, cancel with 30 days notice',
    price: 3_500,
    period: '/mo',
    badge: 'Most popular',
    bestFor: 'Companies that use the website as their main lead channel.',
    includesLead: 'Everything in Web Copilot, plus',
    includes: [
      'Unlimited pages, landing pages and content updates',
      '8 blog articles a month, written for SEO and AI search',
      'AI search optimization (AEO) and schema',
      'Conversion audit every quarter',
      'Monthly report on traffic and leads',
      'Priority queue for your requests',
    ],
    cta: { label: 'Get a quote', href: '/contact/' },
    featured: true,
  },
  {
    name: 'Web Custom',
    subtitle: 'Custom plan',
    timeline: 'Scope made for you',
    price: "Let's talk",
    bestFor: 'Bigger teams, agencies that need a Webflow partner, or anything that does not fit above.',
    includesLead: 'Can include',
    includes: [
      'Scope planned around your roadmap',
      'White-label Webflow work for agencies',
      'Custom integrations and automations',
      'Weekly calls with your team',
    ],
    cta: { label: 'Contact me', href: '/contact/' },
  },
];
