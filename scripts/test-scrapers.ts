import { scrapeRedBus } from "../lib/scraper/redbus";
import { scrapeAbhiBus } from "../lib/scraper/abhibus";

// Use a date that's definitely in the future
const d = new Date();
d.setDate(d.getDate() + 7);
const DATE = d.toISOString().split("T")[0];
const FROM = "blr";
const TO = "hyd";

async function main() {
  console.log(`Testing scrapers: ${FROM} → ${TO} on ${DATE}\n`);

  console.log("=== RedBus ===");
  const t1 = Date.now();
  const redbus = await scrapeRedBus(FROM, TO, DATE);
  console.log(`Fetched ${redbus.length} listings in ${Date.now() - t1}ms`);
  if (redbus.length) {
    console.log("Sample:", { operator: redbus[0].operator, dep: redbus[0].departureTime, fare: redbus[0].baseFare });
    console.log("Last:", { operator: redbus[redbus.length-1].operator, fare: redbus[redbus.length-1].baseFare });
  }

  console.log("\n=== AbhiBus ===");
  const t2 = Date.now();
  const abhibus = await scrapeAbhiBus(FROM, TO, DATE);
  console.log(`Fetched ${abhibus.length} listings in ${Date.now() - t2}ms`);
  if (abhibus.length) {
    console.log("Sample:", { operator: abhibus[0].operator, dep: abhibus[0].departureTime, fare: abhibus[0].baseFare });
  }
}

main().catch(console.error);
