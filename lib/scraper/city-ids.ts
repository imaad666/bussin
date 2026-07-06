/**
 * Platform-specific city ID maps.
 * RedBus IDs: discovered by intercepting /rpw/api/searchResults network calls.
 * AbhiBus IDs: discovered via /wap/SearchStations?s={city} API.
 */

export const REDBUS_CITY_IDS: Record<string, number> = {
  blr: 122,
  hyd: 124,
  chn: 123,
  mum: 462,
  del: 733,
  pune: 130,
  cok: 65791,
  goa: 210,
};

export const ABHIBUS_CITY_IDS: Record<string, number> = {
  blr: 7,
  hyd: 3,
  chn: 6,
  mum: 4,
  del: 344,
  pune: 51,
  cok: 530,
  goa: 102,
};

// Human-readable city slugs for URL construction
export const ABHIBUS_CITY_NAMES: Record<string, string> = {
  blr: "Bangalore",
  hyd: "Hyderabad",
  chn: "Chennai",
  mum: "Mumbai",
  del: "Delhi",
  pune: "Pune",
  cok: "Kochi",
  goa: "Goa",
};

export const REDBUS_CITY_SLUGS: Record<string, string> = {
  blr: "bangalore",
  hyd: "hyderabad",
  chn: "chennai",
  mum: "mumbai",
  del: "delhi",
  pune: "pune",
  cok: "kochi",
  goa: "goa",
};
