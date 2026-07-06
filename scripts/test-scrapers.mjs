/**
 * End-to-end test of both scrapers.
 * Run: node scripts/test-scrapers.mjs
 */
import { scrapeRedBus } from "../lib/scraper/redbus.js";
import { scrapeAbhiBus } from "../lib/scraper/abhibus.js";

// Use a date ~1 week out to ensure buses are available
const FROM = "blr";
const TO = "hyd";
const DATE = "2026-07-06";

console.log(`Testing scrapers: ${FROM} → ${TO} on ${DATE}\n`);

console.log("=== RedBus (direct API fetch) ===");
const t1 = Date.now();
try {
  const redbus = await scrapeRedBus(FROM, TO, DATE);
  console.log(`Fetched ${redbus.length} listings in ${Date.now() - t1}ms`);
  if (redbus.length) {
    const s = redbus[0];
    console.log("Sample:", {
      operator: s.operator,
      dep: s.departureTime,
      arr: s.arrivalTime,
      type: s.busType,
      fare: s.baseFare,
      seats: s.seatsAvailable,
      rating: s.rating,
    });
  }
} catch(e) {
  console.error("RedBus error:", e.message);
}

console.log("\n=== AbhiBus (Playwright browser) ===");
const t2 = Date.now();
try {
  const abhibus = await scrapeAbhiBus(FROM, TO, DATE);
  console.log(`Fetched ${abhibus.length} listings in ${Date.now() - t2}ms`);
  if (abhibus.length) {
    const s = abhibus[0];
    console.log("Sample:", {
      operator: s.operator,
      dep: s.departureTime,
      arr: s.arrivalTime,
      type: s.busType,
      fare: s.baseFare,
      seats: s.seatsAvailable,
      rating: s.rating,
    });
  }
} catch(e) {
  console.error("AbhiBus error:", e.message);
}

console.log("\nDone.");
