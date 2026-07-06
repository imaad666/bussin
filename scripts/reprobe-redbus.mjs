/**
 * Re-probe RedBus to find the current working API endpoint
 */
import { chromium } from "playwright";
import fs from "fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const URL = "https://www.redbus.in/bus-tickets/bangalore-to-hyderabad?onward=06-Jul-2026";

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({ userAgent: UA, locale: "en-IN", timezoneId: "Asia/Kolkata" });
await context.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); });

const page = await context.newPage();
const apiCalls = [];

page.on("response", async (response) => {
  const u = response.url();
  const skip = ["google", "analytics", "clarity", "adjust", "facebook", "doubleclick", "static", ".png", ".jpg", ".css", ".js", "font"];
  if (skip.some(s => u.includes(s))) return;
  try {
    const body = await response.text();
    if (body.startsWith("{") || body.startsWith("[")) {
      apiCalls.push({ url: u, status: response.status(), bodyLen: body.length, body: body.slice(0, 500) });
    }
  } catch {}
});

await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(6000);

console.log("All JSON API calls:");
apiCalls.forEach(c => console.log(`  ${c.status} [${c.bodyLen}b] ${c.url}`));
fs.writeFileSync("scripts/redbus-reprobe.json", JSON.stringify(apiCalls, null, 2));

await browser.close();
