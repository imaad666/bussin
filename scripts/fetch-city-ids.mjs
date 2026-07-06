/**
 * Fetch RedBus city IDs via their autocomplete API
 */
import { chromium } from "playwright";
import fs from "fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const CITIES = ["bangalore", "hyderabad", "chennai", "mumbai", "delhi", "pune", "kochi", "goa"];

// RedBus city search API
async function fetchRedBusCityIds() {
  console.log("=== RedBus City IDs ===");
  for (const city of CITIES) {
    try {
      const url = `https://www.redbus.in/search/autoSuggest?query=${city}&type=city`;
      const resp = await fetch(url, {
        headers: { "User-Agent": UA, "Accept": "application/json", "Referer": "https://www.redbus.in" }
      });
      const text = await resp.text();
      const json = JSON.parse(text);
      const items = json?.data?.suggestions ?? json?.suggestions ?? json;
      if (Array.isArray(items)) {
        const top = items.slice(0, 3).map(i => `${i.cityName ?? i.name} (id=${i.cityId ?? i.id})`);
        console.log(`  ${city}: ${top.join(', ')}`);
      } else {
        console.log(`  ${city}: ${text.slice(0, 200)}`);
      }
    } catch (e) {
      console.log(`  ${city}: ERROR - ${e.message}`);
    }
  }
}

// AbhiBus city search - use their SearchStations endpoint
async function fetchAbhiBusCityIds() {
  console.log("\n=== AbhiBus City IDs ===");
  try {
    const url = "https://www.abhibus.com/wap/SearchStations?s=popular";
    const resp = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
    const json = await resp.json();
    console.log("Popular stations response keys:", Object.keys(json));
    fs.writeFileSync("scripts/abhibus-stations.json", JSON.stringify(json, null, 2));
    // Show first 20 cities
    const cities = json?.data ?? json?.cities ?? json;
    if (Array.isArray(cities)) {
      console.log("Sample cities:");
      cities.slice(0, 20).forEach(c => console.log(`  ${c.cityName ?? c.name} → id=${c.cityId ?? c.id}`));
    } else {
      console.log(JSON.stringify(json).slice(0, 1000));
    }
  } catch (e) {
    console.log("Popular stations error:", e.message);
  }

  // Also try their search
  for (const city of CITIES.slice(0, 4)) {
    try {
      const url = `https://www.abhibus.com/wap/SearchStations?s=${city}`;
      const resp = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
      const json = await resp.json();
      const items = json?.data ?? json?.cities ?? json;
      if (Array.isArray(items)) {
        const top = items.slice(0, 2).map(i => `${i.cityName ?? i.name} (id=${i.cityId ?? i.id ?? i.stationId})`);
        console.log(`  ${city}: ${top.join(', ')}`);
      } else {
        console.log(`  ${city}: ${JSON.stringify(json).slice(0, 300)}`);
      }
    } catch (e) {
      console.log(`  ${city}: ERROR - ${e.message}`);
    }
  }
}

// Also check exact RedBus city IDs from the already-captured API URL
// URL was: fromCity=122&toCity=124 for BLR->HYD
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ userAgent: UA });
const page = await context.newPage();
const cityData = [];

page.on("response", async (r) => {
  if (r.url().includes("autoSuggest") || r.url().includes("city") || r.url().includes("station")) {
    try {
      const body = await r.text();
      cityData.push({ url: r.url(), body: body.slice(0, 2000) });
    } catch {}
  }
});

await page.goto("https://www.redbus.in", { waitUntil: "domcontentloaded", timeout: 20000 });
// Trigger the search form city suggestions
await page.waitForTimeout(2000);
for (const city of CITIES.slice(0, 4)) {
  try {
    const url = `https://www.redbus.in/search/autoSuggest?query=${city}&type=city`;
    const resp = await page.request.get(url);
    const json = await resp.json();
    const items = json?.data?.suggestions ?? [];
    const top = items.slice(0, 2).map(i => `${i.cityName} (id=${i.cityId})`);
    console.log(`  rb ${city}: ${top.join(', ')}`);
  } catch (e) {
    console.log(`  rb ${city}: ${e.message}`);
  }
}
await browser.close();

await fetchRedBusCityIds();
await fetchAbhiBusCityIds();
