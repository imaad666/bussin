/**
 * Discovery probe v2 — saves HTML regardless of errors, uses stealth mode
 */
import { chromium } from "playwright";
import fs from "fs";

const DATE_REDBUS = "25-07-2025";
const DATE_ABHIBUS = "25-07-2025";

const REDBUS_URL = `https://www.redbus.in/bus-tickets/bangalore-to-hyderabad?onward=${DATE_REDBUS}`;
const ABHIBUS_URL = `https://www.abhibus.com/bus-tickets/Bangalore-to-Hyderabad-bus?journeyDate=${DATE_ABHIBUS}`;

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function probe(name, url, outputPrefix) {
  console.log(`\n=== Probing ${name} ===`);
  const browser = await chromium.launch({
    headless: false, // non-headless to bypass basic bot checks
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    userAgent: UA,
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: {
      "Accept-Language": "en-IN,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    },
  });

  // Remove webdriver flag
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
  });

  const apiCalls = [];
  const page = await context.newPage();

  page.on("response", async (response) => {
    const u = response.url();
    const ct = response.headers()["content-type"] ?? "";
    if (ct.includes("json") && !u.includes("google") && !u.includes("analytics")) {
      try {
        const body = await response.text();
        if (body.length < 500_000 && body.startsWith("{") || body.startsWith("[")) {
          apiCalls.push({ url: u, status: response.status(), body: body.slice(0, 5000) });
        }
      } catch {}
    }
  });

  try {
    console.log(`  Navigating to ${url}`);
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    console.log(`  HTTP status: ${resp?.status()}`);

    // Wait for results to load
    await page.waitForTimeout(8000);

    const html = await page.content();
    fs.mkdirSync("scripts", { recursive: true });
    fs.writeFileSync(`scripts/${outputPrefix}.html`, html);
    console.log(`  HTML saved (${(html.length / 1024).toFixed(0)} KB)`);

    fs.writeFileSync(`scripts/${outputPrefix}-api.json`, JSON.stringify(apiCalls, null, 2));
    console.log(`  JSON API calls: ${apiCalls.length}`);

    // Scan all class names that appear on elements with meaningful text
    const topClasses = await page.evaluate(() => {
      const counts = {};
      document.querySelectorAll("*").forEach(el => {
        const text = el.innerText?.trim();
        if (text && text.length > 10 && text.length < 200 && el.children.length < 5) {
          el.className?.toString().split(/\s+/).forEach(c => {
            if (c.length > 2) counts[c] = (counts[c] || 0) + 1;
          });
        }
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 40)
        .map(([k, v]) => `${v}x .${k}`);
    });
    console.log("  Top classes:");
    topClasses.forEach(c => console.log("   ", c));

  } catch (e) {
    console.error(`  Fatal: ${e.message}`);
    try {
      const html = await page.content();
      fs.mkdirSync("scripts", { recursive: true });
      fs.writeFileSync(`scripts/${outputPrefix}-error.html`, html);
      console.log("  Saved error HTML");
    } catch {}
  } finally {
    await browser.close();
  }
}

await probe("RedBus", REDBUS_URL, "redbus");
await probe("AbhiBus", ABHIBUS_URL, "abhibus");

console.log("\nProbe complete.");
