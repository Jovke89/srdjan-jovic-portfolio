import { readFileSync } from 'node:fs';
import { parse } from 'csv-parse/sync';
import { CMS_DIR } from './client.ts';

export function readCsv(file: string): Record<string, string>[] {
  const raw = readFileSync(new URL(file, CMS_DIR), 'utf8');
  return parse(raw, { columns: true, skip_empty_lines: true, bom: true });
}

/** Webflow exports dates as "Fri Aug 28 2026 10:16:29 GMT+0000 (...)". Return ISO or undefined. */
export function toIso(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

/** Split a Webflow multi-reference cell ("a; b; c" or "a,b,c") into slugs. */
export function splitRefs(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export const bool = (v: string | undefined) => String(v).toLowerCase() === 'true';
