/**
 * RedBus scraper — uses Playwright to load the search page and intercepts
 * the /rpw/api/searchResults JSON endpoint.
 * RedBus blocks plain fetch; the API only responds properly with a real browser session.
 * URL: https://www.redbus.in/bus-tickets/{from}-to-{to}?onward={DD-Mon-YYYY}
 */
import { chromium } from "playwright";
import { enrichListing } from "../matcher";
import type { RawListing } from "../types";
import { REDBUS_CITY_SLUGS } from "./city-ids";

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

export async function scrapeRedBus(
  from: string,
  to: string,
  date: string
): Promise<RawListing[]> {
  const fromSlug = REDBUS_CITY_SLUGS[from];
  const toSlug = REDBUS_CITY_SLUGS[to];

  if (!fromSlug || !toSlug) {
    console.warn(`[RedBus] No city slug for ${from} or ${to}`);
    return [];
  }

  const doj = formatDateForRedBus(date);
  const searchUrl = `https://www.redbus.in/bus-tickets/${fromSlug}-to-${toSlug}?onward=${doj}`;
  const bUrl = searchUrl;

  let inventories: RedBusInventory[] = [];

  const browser = await chromium.launch({
    headless: false,
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

    // Step 1: capture the initial API URL from the page load
    const firstApiUrlPromise = new Promise<string | null>((resolve) => {
      const timeout = setTimeout(() => resolve(null), 20_000);
      page.on("response", (response) => {
        if (response.url().includes("/rpw/api/searchResults")) {
          clearTimeout(timeout);
          resolve(response.url());
        }
      });
    });

    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    const firstApiUrl = await firstApiUrlPromise;

    if (firstApiUrl) {
      // Step 2: re-fetch with limit=200 from inside the browser (carries cookies & headers)
      const allUrl = firstApiUrl
        .replace(/limit=\d+/, "limit=200")
        .replace(/offset=\d+/, "offset=0")
        .replace(/from=initialLoad/, "from=moreresults");

      const result = await page.evaluate(async (url: string) => {
        const resp = await fetch(url, { headers: { "Accept": "application/json" } });
        return resp.ok ? resp.json() : null;
      }, allUrl);

      inventories = result?.data?.inventories ?? [];
    }
  } catch (e) {
    console.error("[RedBus] scrape error:", e);
  } finally {
    await browser.close();
  }

  return inventories
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
