import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';
import { sanityClient } from 'sanity:client';

const builder = createImageUrlBuilder(sanityClient);

export function urlFor(source: SanityImageSource) {
  return builder.image(source);
}

type ImgSet = {
  src: string;
  srcset: string;
  width: number;
  height?: number;
  lqip?: string;
};

const DEFAULT_WIDTHS = [500, 800, 1080, 1600, 2000];

/* Build an <img>-ready set from a Sanity image. Mirrors the Webflow
   responsive-variant approach (-p-500/800/1080/1600). */
export function imgSet(
  source: SanityImageSource | undefined | null,
  opts: { width?: number; widths?: number[] } = {},
): ImgSet | null {
  if (!source) return null;
  const width = opts.width ?? 1080;
  const widths = (opts.widths ?? DEFAULT_WIDTHS).filter((w) => w <= width * 2);
  if (!widths.includes(width)) widths.push(width);
  widths.sort((a, b) => a - b);

  const dims =
    typeof source === 'object' && source && 'asset' in source
      ? (source as { asset?: { metadata?: { dimensions?: { width: number; height: number } } } }).asset
          ?.metadata?.dimensions
      : undefined;
  const lqip =
    typeof source === 'object' && source && 'asset' in source
      ? (source as { asset?: { metadata?: { lqip?: string } } }).asset?.metadata?.lqip
      : undefined;

  const ratio = dims ? dims.height / dims.width : undefined;

  return {
    src: urlFor(source).width(width).auto('format').url(),
    srcset: widths
      .map((w) => `${urlFor(source).width(w).auto('format').url()} ${w}w`)
      .join(', '),
    width,
    height: ratio ? Math.round(width * ratio) : undefined,
    lqip,
  };
}
