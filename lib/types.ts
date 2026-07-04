export type Source = "redbus" | "abhibus";

export interface City {
  id: string;
  name: string;
  state: string;
}

export interface RawListing {
  id: string;
  source: Source;
  operator: string;
  operatorNormalized: string;
  departureTime: string; // HH:mm
  arrivalTime: string;
  durationMinutes: number;
  busType: string;
  baseFare: number;
  fees: number;
  seatsAvailable: number;
  rating?: number;
  bookingUrl: string;
}

export interface SourceOffer {
  source: Source;
  baseFare: number;
  fees: number;
  totalFare: number;
  seatsAvailable: number;
  bookingUrl: string;
}

export interface MatchedTrip {
  id: string;
  operator: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  busType: string;
  rating?: number;
  offers: SourceOffer[];
  cheapestSource: Source;
  savings: number;
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
}

export interface SearchResult {
  from: City;
  to: City;
  date: string;
  trips: MatchedTrip[];
  sourcesQueried: Source[];
  searchedAt: string;
}
