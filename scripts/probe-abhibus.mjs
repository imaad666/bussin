/**
 * Probe AbhiBus with correct URL format
 */
import { chromium } from "playwright";
import fs from "fs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// AbhiBus URL formats to try
const URLS = [
  "https://www.abhibus.com/bus-tickets/bangalore-to-hyderabad/25-07-2025",
  "https://www.abhibus.com/search?src=bangalore&dst=hyderabad&doj=25-07-2025",
  "https://www.abhibus.com/bus-tickets/bengaluru-to-hyderabad/25-07-2025",
  "https://www.abhibus.com/bus-tickets/Bengaluru-to-Hyderabad/25-07-2025",
];

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  userAgent: UA,
  locale: "en-IN",
  timezoneId: "Asia/Kolkata",
});
await context.addInitScript(() => {
  Object.defineProperty(navigator, "webdriver", { get: () => undefined });
});

for (const url of URLS) {
  const page = await context.newPage();
  const apiCalls = [];

  page.on("response", async (response) => {
    const u = response.url();
    const ct = response.headers()["content-type"] ?? "";
    if (ct.includes("json") && !u.includes("google") && !u.includes("analytics") && !u.includes("clarity")) {
      try {
        const body = await response.text();
        if (body.length < 500_000 && (body.startsWith("{") || body.startsWith("["))) {
          apiCalls.push({ url: u, status: response.status(), body: body.slice(0, 2000) });
        }
      } catch {}
    }
  });

  const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(5000);
  const status = resp?.status();
  const title = await page.title();
  console.log(`${status} | ${title.slice(0, 80)} | ${url}`);
  if (apiCalls.length > 0) {
    console.log(`  API calls: ${apiCalls.length}`);
    apiCalls.forEach(c => console.log(`    ${c.status} ${c.url.slice(0, 100)}`));
    fs.writeFileSync(`scripts/abhibus-probe-${apiCalls.length}.json`, JSON.stringify(apiCalls, null, 2));
  }

  if (status === 200 && apiCalls.length > 0) {
    const html = await page.content();
    fs.writeFileSync("scripts/abhibus-working.html", html);
    console.log("  Saved working HTML!");
    break;
  }
  await page.close();
}

await browser.close();
