const fs = require('fs');

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const CITIES = ["bangalore", "hyderabad", "chennai", "mumbai", "delhi", "pune", "kochi", "goa"];

async function redbusCities() {
  console.log("=== RedBus City IDs ===");
  const results = {};
  for (const city of CITIES) {
    try {
      const url = `https://www.redbus.in/search/autoSuggest?query=${city}&type=city`;
      const resp = await fetch(url, {
        headers: { "User-Agent": UA, "Accept": "application/json", "Referer": "https://www.redbus.in" }
      });
      const text = await resp.text();
      const json = JSON.parse(text);
      const items = json?.data?.suggestions ?? json?.suggestions ?? [];
      if (Array.isArray(items) && items.length) {
        const top = items[0];
        results[city] = { id: top.cityId ?? top.id, name: top.cityName ?? top.name };
        console.log(`  ${city}: "${results[city].name}" id=${results[city].id}`);
      } else {
        console.log(`  ${city}: no results. body=${text.slice(0, 200)}`);
      }
    } catch(e) {
      console.log(`  ${city}: ERROR ${e.message}`);
    }
  }
  fs.writeFileSync('scripts/redbus-city-ids.json', JSON.stringify(results, null, 2));
}

async function abhiCities() {
  console.log("\n=== AbhiBus City IDs ===");
  const results = {};
  for (const city of CITIES) {
    try {
      const url = `https://www.abhibus.com/wap/SearchStations?s=${city}`;
      const resp = await fetch(url, { headers: { "User-Agent": UA, "Accept": "application/json" } });
      const json = await resp.json();
      const items = Array.isArray(json) ? json : (json?.data ?? json?.cities ?? []);
      if (Array.isArray(items) && items.length) {
        const top = items[0];
        const id = top.cityId ?? top.id ?? top.stationId ?? top.citycode;
        const name = top.cityName ?? top.name ?? top.stationName;
        results[city] = { id, name, raw: top };
        console.log(`  ${city}: "${name}" id=${id} → keys: ${Object.keys(top).join(',')}`);
      } else {
        console.log(`  ${city}: ${JSON.stringify(json).slice(0, 300)}`);
      }
    } catch(e) {
      console.log(`  ${city}: ERROR ${e.message}`);
    }
  }
  fs.writeFileSync('scripts/abhibus-city-ids.json', JSON.stringify(results, null, 2));
}

(async () => {
  await redbusCities();
  await abhiCities();
})();
