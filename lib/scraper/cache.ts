/**
 * Simple in-process LRU-style cache keyed by route+date.
 * TTL: 30 minutes. Prevents re-scraping on every request.
 * This is an in-memory cache — resets on server restart, which is fine for a prototype.
 */
import type { RawListing } from "../types";

interface CacheEntry {
  listings: RawListing[];
  expiresAt: number;
}

const TTL_MS = 30 * 60 * 1000; // 30 minutes
const cache = new Map<string, CacheEntry>();

function key(source: string, from: string, to: string, date: string): string {
  return `${source}:${from}:${to}:${date}`;
}

export function getCached(
  source: string,
  from: string,
  to: string,
  date: string
): RawListing[] | null {
  const entry = cache.get(key(source, from, to, date));
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key(source, from, to, date));
    return null;
  }
  return entry.listings;
}

export function setCached(
  source: string,
  from: string,
  to: string,
  date: string,
  listings: RawListing[]
): void {
  cache.set(key(source, from, to, date), {
    listings,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function clearCache(): void {
  cache.clear();
}
