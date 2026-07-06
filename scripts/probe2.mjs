/**
 * Direct HTTP probe — no browser needed for RedBus API
 * Also probes AbhiBus with correct URL patterns
 */
import { chromium } from "playwright";
import fs from "fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// RedBus API — direct fetch (city IDs: blr=122, hyd=124)
async function probeRedBusAPI() {
  console.log("\n=== RedBus Direct API ===");
  // Format date as DD-Mon-YYYY e.g. 25-Jul-2025
  const date = "06-Jul-2026";
  const url = `https://www.redbus.in/rpw/api/searchResults?fromCity=122&toCity=124&DOJ=${date}&limit=20&offset=0&meta=true&groupId=0&sectionId=0&sort=0&sortOrder=0&from=initialLoad&getUuid=true&bT=1`;

  const resp = await fetch(url, {
    headers: {
      "User-Agent": UA,
      "Accept": "application/json",
      "Referer": "https://www.redbus.in/bus-tickets/bangalore-to-hyderabad",
    },
  });
  console.log("Status:", resp.status);
  const text = await resp.text();
  console.log("Body length:", text.length);
  fs.writeFileSync("scripts/redbus-direct.json", text);

  const json = JSON.parse(text);
  console.log("Total count:", json.data?.metaData?.totalCount);
  console.log("Inventories returned:", json.data?.inventories?.length);
  const inv = json.data?.inventories?.[0];
  if (inv) {
    console.log("Sample:", {
      operator: inv.travelsName,
      busType: inv.busType,
      depart: inv.departureTime,
      arrive: inv.arrivalTime,
      duration: inv.journeyDurationMin,
      fares: inv.fareList,
      seats: inv.availableSeats,
      rating: inv.totalRatings,
    });
  }
}

// AbhiBus — need to find city IDs via their autocomplete API
async function probeAbhiBusCities() {
  console.log("\n=== AbhiBus City Search ===");

  const queries = ["bangalore", "hyderabad", "chennai"];
  for (const q of queries) {
    const url = `https://www.abhibus.com/api/cities?search=${q}`;
    try {
      const resp = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
      const text = await resp.text();
      console.log(`${q}: ${resp.status} — ${text.slice(0, 300)}`);
    } catch (e) {
      console.log(`${q}: error — ${e.message}`);
    }
  }
}

// AbhiBus — try their search page via browser to intercept real API calls
async function probeAbhiBusSearch() {
  console.log("\n=== AbhiBus Search Page (Browser) ===");
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ userAgent: UA, locale: "en-IN", timezoneId: "Asia/Kolkata" });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const page = await context.newPage();
  const apiCalls = [];

  page.on("response", async (response) => {
    const u = response.url();
    const ct = response.headers()["content-type"] ?? "";
    if ((ct.includes("json") || u.includes("/api/") || u.includes("search") || u.includes("bus")) &&
        !u.includes("google") && !u.includes("analytics") && !u.includes("clarity") && !u.includes("adjust")) {
      try {
        const body = await response.text();
        if (body.length < 2_000_000 && (body.includes("fare") || body.includes("bus") || body.includes("operator") || body.includes("depart"))) {
          apiCalls.push({ url: u, status: response.status(), contentType: ct, bodyLen: body.length, body: body.slice(0, 8000) });
        }
      } catch {}
    }
  });

  // Navigate to abhibus homepage first, then search
  await page.goto("https://www.abhibus.com", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(3000);

  // Try navigating directly to a search result
  const searchUrl = "https://www.abhibus.com/bus-tickets/Bengaluru(Bangalore)-to-Hyderabad-bus?journeyDate=06-07-2026";
  const resp = await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
  console.log("Search page status:", resp?.status());
  await page.waitForTimeout(8000);

  const html = await page.content();
  fs.writeFileSync("scripts/abhibus-search.html", html);
  console.log("HTML saved:", (html.length/1024).toFixed(0), "KB");
  console.log("API calls captured:", apiCalls.length);

  if (apiCalls.length > 0) {
    fs.writeFileSync("scripts/abhibus-search-api.json", JSON.stringify(apiCalls, null, 2));
    apiCalls.forEach(c => console.log(`  ${c.status} [${c.bodyLen}b] ${c.url.slice(0, 120)}`));
  }

  await browser.close();
}

await probeRedBusAPI();
await probeAbhiBusCities();
await probeAbhiBusSearch();

console.log("\nDone.");
