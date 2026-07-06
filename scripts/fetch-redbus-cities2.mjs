/**
 * Fetch RedBus city IDs by loading each route page and intercepting the API call
 * The search results URL contains fromCity and toCity IDs
 */
import { chromium } from "playwright";
import fs from "fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Routes to probe - each one will reveal city IDs
const ROUTES = [
  { url: "https://www.redbus.in/bus-tickets/bangalore-to-hyderabad?onward=06-Jul-2026", from: "bangalore", to: "hyderabad" },
  { url: "https://www.redbus.in/bus-tickets/bangalore-to-chennai?onward=06-Jul-2026", from: "bangalore", to: "chennai" },
  { url: "https://www.redbus.in/bus-tickets/mumbai-to-pune?onward=06-Jul-2026", from: "mumbai", to: "pune" },
  { url: "https://www.redbus.in/bus-tickets/delhi-to-jaipur?onward=06-Jul-2026", from: "delhi", to: "jaipur" },
  { url: "https://www.redbus.in/bus-tickets/bangalore-to-goa?onward=06-Jul-2026", from: "bangalore", to: "goa" },
  { url: "https://www.redbus.in/bus-tickets/kochi-to-bangalore?onward=06-Jul-2026", from: "kochi", to: "bangalore" },
];

const cityIds = {};

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  userAgent: UA, locale: "en-IN", timezoneId: "Asia/Kolkata",
});
await context.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); });

for (const route of ROUTES) {
  const page = await context.newPage();
  let found = false;

  page.on("response", async (response) => {
    const u = response.url();
    if (u.includes("/rpw/api/searchResults") && !found) {
      found = true;
      const params = new URL(u).searchParams;
      const fromId = params.get("fromCity");
      const toId = params.get("toCity");
      if (fromId) cityIds[route.from] = parseInt(fromId);
      if (toId) cityIds[route.to] = parseInt(toId);
      console.log(`  ${route.from}=${fromId}, ${route.to}=${toId}`);
    }
  });

  try {
    await page.goto(route.url, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(4000);
  } catch(e) {
    console.log(`  ${route.from}->${route.to}: ${e.message.slice(0, 80)}`);
  }
  await page.close();
}

console.log("\nFinal city IDs:", cityIds);
fs.writeFileSync("scripts/redbus-city-ids.json", JSON.stringify(cityIds, null, 2));
await browser.close();
