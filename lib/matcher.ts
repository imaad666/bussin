import { normalizeOperator, parseTimeToMinutes } from "./normalize";
import type { MatchedTrip, RawListing, Source, SourceOffer } from "./types";

const TIME_TOLERANCE_MINUTES = 15;

function listingKey(listing: RawListing): string {
  return [
    listing.operatorNormalized,
    listing.departureTime,
    listing.busType.toLowerCase(),
  ].join("|");
}

function timesClose(a: string, b: string): boolean {
  return Math.abs(parseTimeToMinutes(a) - parseTimeToMinutes(b)) <= TIME_TOLERANCE_MINUTES;
}

function toOffer(listing: RawListing): SourceOffer {
  return {
    source: listing.source,
    baseFare: listing.baseFare,
    fees: listing.fees,
    totalFare: listing.baseFare + listing.fees,
    seatsAvailable: listing.seatsAvailable,
    bookingUrl: listing.bookingUrl,
  };
}

function buildTrip(listings: RawListing[]): MatchedTrip {
  const primary = listings[0];
  const offers = listings
    .map(toOffer)
    .sort((a, b) => a.totalFare - b.totalFare);

  const cheapest = offers[0];
  const mostExpensive = offers[offers.length - 1];

  return {
    id: listingKey(primary),
    operator: primary.operator,
    departureTime: primary.departureTime,
    arrivalTime: primary.arrivalTime,
    durationMinutes: primary.durationMinutes,
    busType: primary.busType,
    rating: primary.rating,
    offers,
    cheapestSource: cheapest.source,
    savings: offers.length > 1 ? mostExpensive.totalFare - cheapest.totalFare : 0,
  };
}

export function matchListings(listings: RawListing[]): MatchedTrip[] {
  const groups = new Map<string, RawListing[]>();

  for (const listing of listings) {
    let matched = false;

    for (const [, group] of groups) {
      const ref = group[0];
      if (
        listing.operatorNormalized === ref.operatorNormalized &&
        timesClose(listing.departureTime, ref.departureTime) &&
        listing.busType.toLowerCase() === ref.busType.toLowerCase()
      ) {
        group.push(listing);
        matched = true;
        break;
      }
    }

    if (!matched) {
      groups.set(listing.id, [listing]);
    }
  }

  return [...groups.values()]
    .map(buildTrip)
    .sort(
      (a, b) =>
        parseTimeToMinutes(a.departureTime) - parseTimeToMinutes(b.departureTime)
    );
}

export function enrichListing(listing: Omit<RawListing, "operatorNormalized">): RawListing {
  return {
    ...listing,
    operatorNormalized: normalizeOperator(listing.operator),
  };
}

export const SOURCE_LABELS: Record<Source, string> = {
  redbus: "RedBus",
  abhibus: "AbhiBus",
};

export const SOURCE_COLORS: Record<Source, string> = {
  redbus: "bg-red-600",
  abhibus: "bg-emerald-600",
};
