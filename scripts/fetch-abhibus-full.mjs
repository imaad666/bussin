/**
 * Fetch the AbhiBus /buslist/v3/services endpoint directly
 * — no truncation, save full response to disk
 */
import { chromium } from "playwright";
import fs from "fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const ABHIBUS_URL = "https://www.abhibus.com/bus_search/Bangalore/7/Hyderabad/3/06-07-2026/O";

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  userAgent: UA,
  locale: "en-IN",
  timezoneId: "Asia/Kolkata",
});
await context.addInitScript(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });
});

const page = await context.newPage();

// Intercept the specific services endpoint and save full body
page.on("response", async (response) => {
  const u = response.url();
  if (u.includes("/buslist/v3/services") && !u.includes("meta")) {
    try {
      const body = await response.text();
      fs.writeFileSync("scripts/abhibus-services-full.json", body);
      console.log("Saved /buslist/v3/services:", body.length, "bytes");
    } catch (e) {
      console.error("Failed to save:", e.message);
    }
  }
  if (u.includes("/buslist/v3/services/meta")) {
    try {
      const body = await response.text();
      fs.writeFileSync("scripts/abhibus-meta-full.json", body);
      console.log("Saved /buslist/v3/services/meta:", body.length, "bytes");
    } catch (e) {
      console.error("Failed to save meta:", e.message);
    }
  }
});

console.log("Navigating...");
await page.goto(ABHIBUS_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(10000);

await browser.close();
console.log("Done.");
