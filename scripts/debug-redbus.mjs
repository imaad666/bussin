/**
 * Debug RedBus page loading
 */
import { chromium } from "playwright";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const d = new Date();
d.setDate(d.getDate() + 7);
const dateStr = d.toISOString().split("T")[0];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const [, mm, dd] = dateStr.split("-");
const doj = `${dd}-${MONTHS[parseInt(mm) - 1]}-${dateStr.slice(0, 4)}`;

const searchUrl = `https://www.redbus.in/bus-tickets/bangalore-to-hyderabad?onward=${doj}`;
console.log("URL:", searchUrl);

const browser = await chromium.launch({ headless: false, args: ["--disable-blink-features=AutomationControlled"] });
const context = await browser.newContext({ userAgent: UA, locale: "en-IN", timezoneId: "Asia/Kolkata" });
await context.addInitScript(() => { Object.defineProperty(navigator, "webdriver", { get: () => undefined }); });

const page = await context.newPage();

page.on("response", async (response) => {
  const u = response.url();
  if (!u.includes("static") && !u.includes(".js") && !u.includes(".css") && !u.includes(".png") && !u.includes("clarity") && !u.includes("google")) {
    console.log(`  Response: ${response.status()} ${u.slice(0, 120)}`);
  }
});

console.log("Navigating...");
const resp = await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 30000 });
console.log("Page status:", resp?.status());
console.log("Waiting 10s for API calls...");
await page.waitForTimeout(10000);
console.log("Done waiting.");

await browser.close();
