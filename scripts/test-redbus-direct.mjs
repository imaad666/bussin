/**
 * Test RedBus direct API with exact URL from the probe
 */
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Try the exact URL pattern from the probe
const urls = [
  // Exact URL from probe (07-Jul-2026, limit=10)
  "https://www.redbus.in/rpw/api/searchResults?fromCity=122&toCity=124&DOJ=07-Jul-2026&limit=10&offset=0&meta=true&groupId=0&sectionId=0&sort=0&sortOrder=0&from=initialLoad&getUuid=true&bT=1&clearLMBFilter=undefined&isFilterApplied=false",
  // Simplified (limit=50, 06-Jul-2026)
  "https://www.redbus.in/rpw/api/searchResults?fromCity=122&toCity=124&DOJ=06-Jul-2026&limit=50&offset=0&meta=true&groupId=0&sectionId=0&sort=0&sortOrder=0&from=initialLoad&getUuid=true&bT=1",
  // Without extra params
  "https://www.redbus.in/rpw/api/searchResults?fromCity=122&toCity=124&DOJ=07-Jul-2026&limit=50&offset=0&meta=true",
];

for (const url of urls) {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept": "application/json",
        "Referer": "https://www.redbus.in/bus-tickets/bangalore-to-hyderabad",
      }
    });
    const text = await resp.text();
    let count = 0;
    try {
      const json = JSON.parse(text);
      count = json?.data?.inventories?.length ?? 0;
    } catch {}
    console.log(`${resp.status} [${text.length}b, ${count} inv] ${url.slice(0, 120)}`);
  } catch(e) {
    console.log(`ERROR: ${e.message} | ${url.slice(0, 80)}`);
  }
}
