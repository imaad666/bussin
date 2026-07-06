/**
 * AbhiBus scraper — uses Playwright to load the search page and intercepts
 * the /buslist/v3/services JSON endpoint.
 * URL: https://www.abhibus.com/bus_search/{fromName}/{fromId}/{toName}/{toId}/{DD-MM-YYYY}/O
 */
import { chromium } from "playwright";
import { enrichListing } from "../matcher";
import type { RawListing } from "../types";
import { ABHIBUS_CITY_IDS, ABHIBUS_CITY_NAMES } from "./city-ids";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

interface AbhiBusTimings {
  startTimeTwfFormat: string; // "22:30"
  arriveTimeTwfFormat: string;
  travelTime: string; // "11:30:00"
}

interface AbhiBusFares {
  fare: number;
  fareList: number[];
}

interface AbhiBusSeatStats {
  availableSeats: number;
}

interface AbhiBusService {
  serviceId: number;
  serviceKey: string;
  travelerAgentName: string;
  busTypeName: string;
  timings: AbhiBusTimings;
  fares: AbhiBusFares;
  seatStats: AbhiBusSeatStats;
  rating: number;
}

/** Convert "11:30:00" → minutes */
function travelTimeToMinutes(tt: string): number {
  const [h, m] = tt.split(":").map(Number);
  return h * 60 + m;
}

/** Convert YYYY-MM-DD → DD-MM-YYYY */
function formatDateForAbhiBus(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  return `${d}-${m}-${y}`;
}

function bookingUrl(
  fromName: string,
  fromId: number,
  toName: string,
  toId: number,
  date: string,
  serviceId: number
): string {
  return `https://www.abhibus.com/book/${serviceId}/${fromName}/${fromId}/${toName}/${toId}/${formatDateForAbhiBus(date)}`;
}

export async function scrapeAbhiBus(
  from: string,
  to: string,
  date: string
): Promise<RawListing[]> {
  const fromId = ABHIBUS_CITY_IDS[from];
  const toId = ABHIBUS_CITY_IDS[to];
  const fromName = ABHIBUS_CITY_NAMES[from];
  const toName = ABHIBUS_CITY_NAMES[to];

  if (!fromId || !toId || !fromName || !toName) {
    console.warn(`[AbhiBus] No city ID for ${from} or ${to}`);
    return [];
  }

  const ddmmyyyy = formatDateForAbhiBus(date);
  const searchUrl = `https://www.abhibus.com/bus_search/${fromName}/${fromId}/${toName}/${toId}/${ddmmyyyy}/O`;

  let services: AbhiBusService[] = [];

  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });

  try {
    const context = await browser.newContext({
      userAgent: UA,
      locale: "en-IN",
      timezoneId: "Asia/Kolkata",
    });
    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    });

    const page = await context.newPage();

    const servicesPromise = new Promise<AbhiBusService[]>((resolve) => {
      const timeout = setTimeout(() => resolve([]), 20_000);
      page.on("response", async (response) => {
        if (response.url().includes("/buslist/v3/services") && !response.url().includes("meta")) {
          try {
            const json = await response.json();
            clearTimeout(timeout);
            resolve(json?.services ?? []);
          } catch {
            resolve([]);
          }
        }
      });
    });

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    services = await servicesPromise;
  } catch (e) {
    console.error("[AbhiBus] scrape error:", e);
  } finally {
    await browser.close();
  }

  return services
    .filter((s) => s.seatStats?.availableSeats > 0 && s.fares?.fare > 0)
    .map((s, i) =>
      enrichListing({
        id: `ab-${s.serviceId ?? s.serviceKey ?? i}`,
        source: "abhibus",
        operator: s.travelerAgentName,
        departureTime: s.timings.startTimeTwfFormat,
        arrivalTime: s.timings.arriveTimeTwfFormat,
        durationMinutes: travelTimeToMinutes(s.timings.travelTime),
        busType: s.busTypeName,
        baseFare: Math.min(...(s.fares.fareList?.length ? s.fares.fareList : [s.fares.fare])),
        fees: 0,
        seatsAvailable: s.seatStats.availableSeats,
        rating: s.rating ?? undefined,
        bookingUrl: bookingUrl(fromName, fromId, toName, toId, date, s.serviceId),
      })
    );
}
