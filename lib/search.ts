import { getCity } from "./cities";
import { matchListings } from "./matcher";
import { getCached, setCached } from "./scraper/cache";
import { scrapeAbhiBus } from "./scraper/abhibus";
import { scrapeRedBus } from "./scraper/redbus";
import type { SearchParams, SearchResult } from "./types";

export async function searchTrips(params: SearchParams): Promise<SearchResult | null> {
  const from = getCity(params.from);
  const to = getCity(params.to);

  if (!from || !to || from.id === to.id) {
    return null;
  }

  // Run both scrapers in parallel, each with their own cache
  const [redbus, abhibus] = await Promise.all([
    getCached("redbus", from.id, to.id, params.date) ??
      scrapeRedBus(from.id, to.id, params.date).then((r) => {
        setCached("redbus", from.id, to.id, params.date, r);
        return r;
      }),
    getCached("abhibus", from.id, to.id, params.date) ??
      scrapeAbhiBus(from.id, to.id, params.date).then((r) => {
        setCached("abhibus", from.id, to.id, params.date, r);
        return r;
      }),
  ]);

  const trips = matchListings([...redbus, ...abhibus]);

  return {
    from,
    to,
    date: params.date,
    trips,
    sourcesQueried: ["redbus", "abhibus"],
    searchedAt: new Date().toISOString(),
  };
}
