/**
 * Check how many RedBus listings we can get — does the API paginate?
 */
import { chromium } from "playwright";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ userAgent: UA, locale: "en-IN", timezoneId: "Asia/Kolkata" });
await context.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); });

const page = await context.newPage();
const calls = [];

page.on("response", async (response) => {
  const u = response.url();
  if (u.includes("/rpw/api/searchResults")) {
    const json = await response.json().catch(() => null);
    const params = Object.fromEntries(new URL(u).searchParams);
    calls.push({
      url: u,
      offset: params.offset,
      limit: params.limit,
      total: json?.data?.metaData?.totalCount,
      returned: json?.data?.inventories?.length,
    });
    console.log(`API call: offset=${params.offset} limit=${params.limit} total=${json?.data?.metaData?.totalCount} returned=${json?.data?.inventories?.length}`);
  }
});

await page.goto("https://www.redbus.in/bus-tickets/bangalore-to-hyderabad?onward=07-Jul-2026", { waitUntil: "domcontentloaded", timeout: 30000 });
// Wait for multiple loads
await page.waitForTimeout(8000);

console.log("\nTotal API calls:", calls.length);
console.log("Calls:", JSON.stringify(calls, null, 2));
await browser.close();
