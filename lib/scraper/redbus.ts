/**
 * RedBus scraper — uses their internal JSON API directly.
 * No browser needed: the API responds to plain fetch with a browser User-Agent.
 * API: GET /rpw/api/searchResults?fromCity={id}&toCity={id}&DOJ={DD-Mon-YYYY}&limit=50
 */
import { enrichListing } from "../matcher";
import type { RawListing } from "../types";
import { REDBUS_CITY_IDS, REDBUS_CITY_SLUGS } from "./city-ids";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

/** Convert YYYY-MM-DD → DD-Mon-YYYY (e.g. 2026-07-06 → 06-Jul-2026) */
function formatDateForRedBus(isoDate: string): string {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [, mm, dd] = isoDate.split("-");
  const month = MONTHS[parseInt(mm, 10) - 1];
  return `${dd}-${month}-${isoDate.slice(0, 4)}`;
}

interface RedBusInventory {
  travelsName: string;
  busType: string;
  departureTime: string; // "2026-07-06 22:30:00"
  arrivalTime: string;
  journeyDurationMin: number;
  fareList: number[];
  availableSeats: number;
  totalRatings: number;
  routeId: number;
  serviceId: string;
}

function toHHMM(datetime: string): string {
  // "2026-07-06 22:30:00" → "22:30"
  return datetime.split(" ")[1]?.slice(0, 5) ?? datetime;
}

function bookingUrl(from: string, to: string, date: string): string {
  const fromSlug = REDBUS_CITY_SLUGS[from] ?? from;
  const toSlug = REDBUS_CITY_SLUGS[to] ?? to;
  // RedBus onward date format: DD-Mon-YYYY
  return `https://www.redbus.in/bus-tickets/${fromSlug}-to-${toSlug}?onward=${formatDateForRedBus(date)}`;
}

export async function scrapeRedBus(
  from: string,
  to: string,
  date: string
): Promise<RawListing[]> {
  const fromId = REDBUS_CITY_IDS[from];
  const toId = REDBUS_CITY_IDS[to];

  if (!fromId || !toId) {
    console.warn(`[RedBus] No city ID for ${from} or ${to}`);
    return [];
  }

  const doj = formatDateForRedBus(date);
  const url = `https://www.redbus.in/rpw/api/searchResults?fromCity=${fromId}&toCity=${toId}&DOJ=${doj}&limit=50&offset=0&meta=true&groupId=0&sectionId=0&sort=0&sortOrder=0&from=initialLoad&getUuid=true&bT=1`;

  let data: { inventories?: RedBusInventory[] } | null = null;

  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept": "application/json",
        "Referer": `https://www.redbus.in/bus-tickets/${REDBUS_CITY_SLUGS[from] ?? from}-to-${REDBUS_CITY_SLUGS[to] ?? to}`,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!resp.ok) {
      console.warn(`[RedBus] HTTP ${resp.status} for ${from}->${to}`);
      return [];
    }

    const json = await resp.json();
    data = json?.data ?? null;
  } catch (e) {
    console.error("[RedBus] fetch error:", e);
    return [];
  }

  if (!data?.inventories?.length) return [];

  const bUrl = bookingUrl(from, to, date);

  return data.inventories
    .filter((inv) => inv.availableSeats > 0 && inv.fareList?.length > 0)
    .map((inv, i) =>
      enrichListing({
        id: `rb-${inv.routeId ?? inv.serviceId ?? i}`,
        source: "redbus",
        operator: inv.travelsName,
        departureTime: toHHMM(inv.departureTime),
        arrivalTime: toHHMM(inv.arrivalTime),
        durationMinutes: inv.journeyDurationMin,
        busType: inv.busType,
        baseFare: Math.min(...inv.fareList),
        fees: 0,
        seatsAvailable: inv.availableSeats,
        rating: inv.totalRatings ?? undefined,
        bookingUrl: bUrl,
      })
    );
}
