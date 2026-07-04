import { enrichListing } from "../matcher";
import type { RawListing } from "../types";

type RouteKey = `${string}-${string}`;

function route(from: string, to: string): RouteKey {
  return `${from}-${to}`;
}

function redbusUrl(from: string, to: string, date: string) {
  return `https://www.redbus.in/bus-tickets/${from}-to-${to}?onward=${date}`;
}

function abhibusUrl(from: string, to: string, date: string) {
  return `https://www.abhibus.com/bus-tickets/${from}-to-${to}?onward=${date}`;
}

// Mock inventory keyed by route. Same trips appear on both sources with different prices/names.
const MOCK_INVENTORY: Record<RouteKey, Omit<RawListing, "operatorNormalized">[]> = {
  "blr-hyd": [
    {
      id: "rb-1",
      source: "redbus",
      operator: "Orange Travels",
      departureTime: "22:30",
      arrivalTime: "06:00",
      durationMinutes: 450,
      busType: "AC Sleeper",
      baseFare: 849,
      fees: 40,
      seatsAvailable: 12,
      rating: 4.2,
      bookingUrl: "",
    },
    {
      id: "ab-1",
      source: "abhibus",
      operator: "Orange Tours & Travels",
      departureTime: "22:35",
      arrivalTime: "06:05",
      durationMinutes: 450,
      busType: "AC Sleeper",
      baseFare: 799,
      fees: 35,
      seatsAvailable: 8,
      rating: 4.1,
      bookingUrl: "",
    },
    {
      id: "rb-2",
      source: "redbus",
      operator: "IntrCity SmartBus",
      departureTime: "23:15",
      arrivalTime: "06:45",
      durationMinutes: 450,
      busType: "AC Sleeper",
      baseFare: 999,
      fees: 45,
      seatsAvailable: 6,
      rating: 4.5,
      bookingUrl: "",
    },
    {
      id: "ab-2",
      source: "abhibus",
      operator: "IntrCity Smart Bus",
      departureTime: "23:15",
      arrivalTime: "06:45",
      durationMinutes: 450,
      busType: "AC Sleeper",
      baseFare: 949,
      fees: 40,
      seatsAvailable: 4,
      rating: 4.5,
      bookingUrl: "",
    },
    {
      id: "rb-3",
      source: "redbus",
      operator: "SRS Travels",
      departureTime: "21:00",
      arrivalTime: "04:30",
      durationMinutes: 450,
      busType: "Non-AC Seater",
      baseFare: 550,
      fees: 30,
      seatsAvailable: 18,
      rating: 3.8,
      bookingUrl: "",
    },
    {
      id: "ab-3",
      source: "abhibus",
      operator: "SRS Travels",
      departureTime: "21:00",
      arrivalTime: "04:30",
      durationMinutes: 450,
      busType: "Non-AC Seater",
      baseFare: 499,
      fees: 45,
      seatsAvailable: 22,
      rating: 3.8,
      bookingUrl: "",
    },
    {
      id: "rb-4",
      source: "redbus",
      operator: "VRL Travels",
      departureTime: "20:45",
      arrivalTime: "04:15",
      durationMinutes: 450,
      busType: "Volvo AC Sleeper",
      baseFare: 1100,
      fees: 50,
      seatsAvailable: 3,
      rating: 4.6,
      bookingUrl: "",
    },
    {
      id: "ab-4",
      source: "abhibus",
      operator: "VRL Travels",
      departureTime: "20:50",
      arrivalTime: "04:20",
      durationMinutes: 450,
      busType: "Volvo AC Sleeper",
      baseFare: 1050,
      fees: 55,
      seatsAvailable: 5,
      rating: 4.6,
      bookingUrl: "",
    },
    {
      id: "rb-5",
      source: "redbus",
      operator: "Kallada Travels",
      departureTime: "19:30",
      arrivalTime: "03:00",
      durationMinutes: 450,
      busType: "AC Seater",
      baseFare: 650,
      fees: 35,
      seatsAvailable: 14,
      rating: 4.0,
      bookingUrl: "",
    },
    // Kallada only on RedBus for this route
    {
      id: "ab-5",
      source: "abhibus",
      operator: "Jabbar Travels",
      departureTime: "18:00",
      arrivalTime: "01:30",
      durationMinutes: 450,
      busType: "AC Sleeper",
      baseFare: 720,
      fees: 30,
      seatsAvailable: 10,
      rating: 4.3,
      bookingUrl: "",
    },
    {
      id: "rb-6",
      source: "redbus",
      operator: "Jabbar Travels",
      departureTime: "18:00",
      arrivalTime: "01:30",
      durationMinutes: 450,
      busType: "AC Sleeper",
      baseFare: 780,
      fees: 40,
      seatsAvailable: 7,
      rating: 4.3,
      bookingUrl: "",
    },
  ],
  "hyd-blr": [],
  "blr-chn": [
    {
      id: "rb-c1",
      source: "redbus",
      operator: "KPN Travels",
      departureTime: "22:00",
      arrivalTime: "05:30",
      durationMinutes: 450,
      busType: "AC Sleeper",
      baseFare: 750,
      fees: 40,
      seatsAvailable: 9,
      rating: 4.1,
      bookingUrl: "",
    },
    {
      id: "ab-c1",
      source: "abhibus",
      operator: "KPN Travels",
      departureTime: "22:00",
      arrivalTime: "05:30",
      durationMinutes: 450,
      busType: "AC Sleeper",
      baseFare: 699,
      fees: 35,
      seatsAvailable: 11,
      rating: 4.1,
      bookingUrl: "",
    },
    {
      id: "rb-c2",
      source: "redbus",
      operator: "Zingbus",
      departureTime: "23:30",
      arrivalTime: "07:00",
      durationMinutes: 450,
      busType: "AC Sleeper",
      baseFare: 899,
      fees: 0,
      seatsAvailable: 5,
      rating: 4.7,
      bookingUrl: "",
    },
    {
      id: "ab-c2",
      source: "abhibus",
      operator: "Zingbus",
      departureTime: "23:30",
      arrivalTime: "07:00",
      durationMinutes: 450,
      busType: "AC Sleeper",
      baseFare: 899,
      fees: 0,
      seatsAvailable: 5,
      rating: 4.7,
      bookingUrl: "",
    },
  ],
};

// Reverse routes share the same inventory with swapped times
function getInventory(from: string, to: string): Omit<RawListing, "operatorNormalized">[] {
  const key = route(from, to);
  const reverseKey = route(to, from);

  if (MOCK_INVENTORY[key]?.length) {
    return MOCK_INVENTORY[key];
  }

  if (MOCK_INVENTORY[reverseKey]?.length) {
    return MOCK_INVENTORY[reverseKey];
  }

  return [];
}

function simulateLatency(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchRedBusListings(
  from: string,
  to: string,
  date: string
): Promise<RawListing[]> {
  await simulateLatency(400 + Math.random() * 300);

  return getInventory(from, to)
    .filter((l) => l.source === "redbus")
    .map((l) =>
      enrichListing({
        ...l,
        bookingUrl: redbusUrl(from, to, date),
      })
    );
}

export async function fetchAbhiBusListings(
  from: string,
  to: string,
  date: string
): Promise<RawListing[]> {
  await simulateLatency(350 + Math.random() * 350);

  return getInventory(from, to)
    .filter((l) => l.source === "abhibus")
    .map((l) =>
      enrichListing({
        ...l,
        bookingUrl: abhibusUrl(from, to, date),
      })
    );
}

export const SUPPORTED_ROUTES = [
  { from: "blr", to: "hyd", label: "Bangalore → Hyderabad" },
  { from: "blr", to: "chn", label: "Bangalore → Chennai" },
];
