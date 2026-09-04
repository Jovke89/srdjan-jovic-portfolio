import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { client } from './client.ts';
import { retry, sleep } from './retry.ts';

const CACHE_PATH = new URL('./asset-cache.json', import.meta.url);

type Cache = Record<string, string>; // source URL -> asset _id

function loadCache(): Cache {
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf8'));
  } catch {
    return {};
  }
}
function saveCache(cache: Cache) {
  try {
    mkdirSync(new URL('.', CACHE_PATH), { recursive: true });
  } catch {}
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

const cache = loadCache();

/** Download an image URL and upload it to Sanity. Returns an image field value
 *  ({_type:'image', asset:{_ref}}) or undefined. Cached by source URL. */
export async function uploadImage(
  url: string | undefined | null,
  alt?: string,
): Promise<{ _type: 'image'; asset: { _type: 'reference'; _ref: string }; alt?: string } | undefined> {
  if (!url || !/^https?:\/\//.test(url)) return undefined;
  let assetId = cache[url];
  if (!assetId) {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`  ! image fetch failed ${res.status}: ${url}`);
      return undefined;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const filename = decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'image');
    const asset = await retry(() => client.assets.upload('image', buf, { filename }), `upload ${filename}`);
    assetId = asset._id;
    cache[url] = assetId;
    saveCache(cache);
    console.log(`  + uploaded ${filename}`);
    await sleep(120); // stay under the 25 req/s write limit
  }
  return {
    _type: 'image',
    asset: { _type: 'reference', _ref: assetId },
    ...(alt ? { alt } : {}),
  };
}
