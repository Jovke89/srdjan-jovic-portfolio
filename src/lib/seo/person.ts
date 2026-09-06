import type { PersonSettings } from './jsonld';
import { imgSet } from '../sanity/image';

type SiteSettings = {
  personName?: string;
  jobTitle?: string;
  personDescription?: string;
  personImage?: unknown;
  personImageCaption?: string;
  knowsAbout?: string[];
  occupationCountry?: string;
  occupationSkills?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  githubUrl?: string;
} | null;

/** siteSettings document -> the Person shape the JSON-LD builders expect. */
export function toPerson(settings: SiteSettings): PersonSettings {
  return {
    name: settings?.personName ?? 'Srdjan Jovic',
    jobTitle: settings?.jobTitle ?? 'Webflow Developer',
    description: settings?.personDescription,
    imageUrl: imgSet(settings?.personImage, { width: 1200 })?.src,
    imageCaption: settings?.personImageCaption,
    sameAs: [settings?.linkedinUrl, settings?.instagramUrl, settings?.githubUrl].filter(
      Boolean,
    ) as string[],
    knowsAbout: settings?.knowsAbout,
    occupationCountry: settings?.occupationCountry,
    occupationSkills: settings?.occupationSkills,
  };
}
