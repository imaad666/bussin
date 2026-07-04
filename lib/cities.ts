import type { City } from "./types";

export const CITIES: City[] = [
  { id: "blr", name: "Bangalore", state: "Karnataka" },
  { id: "hyd", name: "Hyderabad", state: "Telangana" },
  { id: "chn", name: "Chennai", state: "Tamil Nadu" },
  { id: "mum", name: "Mumbai", state: "Maharashtra" },
  { id: "del", name: "Delhi", state: "Delhi" },
  { id: "pune", name: "Pune", state: "Maharashtra" },
  { id: "cok", name: "Kochi", state: "Kerala" },
  { id: "goa", name: "Goa", state: "Goa" },
];

export function getCity(id: string): City | undefined {
  return CITIES.find((c) => c.id === id);
}
