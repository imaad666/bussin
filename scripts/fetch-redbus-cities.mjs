/**
 * Fetch RedBus city IDs from within a browser page (avoids bot block)
 * Uses the search results page we already know loads fine
 */
import { chromium } from "playwright";
import fs from "fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const CITIES = ["bangalore", "hyderabad", "chennai", "mumbai", "delhi", "pune", "kochi", "goa", "bengaluru"];

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ userAgent: UA, locale: "en-IN", timezoneId: "Asia/Kolkata" });
await context.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); });

const page = await context.newPage();
await page.goto("https://www.redbus.in/bus-tickets/bangalore-to-hyderabad", { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(2000);

const results = {};
for (const city of CITIES) {
  try {
    const resp = await page.request.get(`https://www.redbus.in/search/autoSuggest?query=${city}&type=city`, {
      headers: { "Accept": "application/json", "Referer": "https://www.redbus.in" }
    });
    const json = await resp.json();
    const items = json?.data?.suggestions ?? [];
    if (items.length) {
      const top = items[0];
      results[city] = { id: top.cityId, name: top.cityName };
      console.log(`  ${city}: "${top.cityName}" id=${top.cityId}`);
    } else {
      console.log(`  ${city}: no results`);
    }
  } catch(e) {
    console.log(`  ${city}: ERROR ${e.message}`);
  }
}

fs.writeFileSync("scripts/redbus-city-ids.json", JSON.stringify(results, null, 2));
console.log("\nSaved to scripts/redbus-city-ids.json");
await browser.close();
