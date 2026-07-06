/**
 * Probe AbhiBus with the correct URL format
 * URL: https://www.abhibus.com/bus_search/{fromCity}/{fromId}/{toCity}/{toId}/{date}/O
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
  viewport: { width: 1280, height: 800 },
});
await context.addInitScript(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });
});

const page = await context.newPage();
const apiCalls = [];

page.on("response", async (response) => {
  const u = response.url();
  const ct = response.headers()["content-type"] ?? "";
  const skip = ["google", "analytics", "clarity", "adjust", "facebook", "doubleclick", "static.abhibus"];
  if (skip.some(s => u.includes(s))) return;

  try {
    const body = await response.text();
    if (body.length > 50 && body.length < 5_000_000) {
      apiCalls.push({
        url: u,
        status: response.status(),
        contentType: ct,
        bodyLen: body.length,
        body: body.slice(0, 10000),
      });
    }
  } catch {}
});

console.log("Navigating to:", ABHIBUS_URL);
const resp = await page.goto(ABHIBUS_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
console.log("HTTP status:", resp?.status());

// Wait for results to load
await page.waitForTimeout(10000);

const html = await page.content();
fs.mkdirSync("scripts", { recursive: true });
fs.writeFileSync("scripts/abhibus2.html", html);
console.log("HTML saved:", (html.length / 1024).toFixed(0), "KB");

// Filter to only JSON / API calls
const jsonCalls = apiCalls.filter(c =>
  c.contentType.includes("json") ||
  c.url.includes("/api/") ||
  c.url.includes("search") ||
  c.url.includes("bus")
);

fs.writeFileSync("scripts/abhibus2-api.json", JSON.stringify(jsonCalls, null, 2));
console.log("\nAll captured calls:", apiCalls.length);
console.log("JSON/API calls:", jsonCalls.length);
console.log("\nAll URLs captured:");
apiCalls.forEach(c => console.log(`  ${c.status} [${c.bodyLen}b] ${c.url.slice(0, 140)}`));

await browser.close();
console.log("\nDone.");
