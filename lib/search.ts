import { getCity } from "./cities";
import { matchListings } from "./matcher";
import { fetchAbhiBusListings, fetchRedBusListings } from "./mock/adapters";
import type { SearchParams, SearchResult } from "./types";

export async function searchTrips(params: SearchParams): Promise<SearchResult | null> {
  const from = getCity(params.from);
  const to = getCity(params.to);

  if (!from || !to || from.id === to.id) {
    return null;
  }

  const [redbus, abhibus] = await Promise.all([
    fetchRedBusListings(from.id, to.id, params.date),
    fetchAbhiBusListings(from.id, to.id, params.date),
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
