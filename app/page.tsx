"use client";

import { useCallback, useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { TripCard } from "@/components/TripCard";
import type { SearchResult } from "@/lib/types";

function tomorrowISO(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function Home() {
  const [from, setFrom] = useState("blr");
  const [to, setTo] = useState("hyd");
  const [date, setDate] = useState(tomorrowISO());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({ from, to, date });
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setResult(null);
        setError(data.error ?? "Search failed");
        return;
      }

      setResult(data);
    } catch {
      setResult(null);
      setError("Could not reach the server");
    } finally {
      setLoading(false);
    }
  }, [from, to, date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const comparableTrips = result?.trips.filter((t) => t.offers.length > 1) ?? [];
  const singleSourceTrips = result?.trips.filter((t) => t.offers.length === 1) ?? [];

  return (
    <div className="min-h-full bg-[#faf8f5]">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-lg font-bold tracking-tight text-stone-900">
              bussin
            </p>
            <p className="text-xs text-stone-500">
              Compare bus fares across booking sites
            </p>
          </div>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
            Prototype
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <section className="mb-8">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-stone-900">
            Find the cheapest bus ticket
          </h1>
          <p className="text-sm text-stone-600">
            We match the same trip across RedBus and AbhiBus so you don&apos;t
            have to open both apps.
          </p>
        </section>

        <SearchForm
          from={from}
          to={to}
          date={date}
          loading={loading}
          onFromChange={setFrom}
          onToChange={setTo}
          onDateChange={setDate}
          onSwap={handleSwap}
          onSubmit={handleSubmit}
        />

        {error && (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {loading && (
          <div className="mt-8 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl bg-stone-200/60"
              />
            ))}
          </div>
        )}

        {!loading && result && (
          <section className="mt-8">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold text-stone-900">
                {result.from.name} → {result.to.name}
              </h2>
              <p className="text-xs text-stone-500">
                {result.trips.length} trips ·{" "}
                {comparableTrips.length} matched across sites
              </p>
            </div>

            {result.trips.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
                <p className="font-medium text-stone-700">No buses found</p>
                <p className="mt-1 text-sm text-stone-500">
                  Try Bangalore → Hyderabad or Bangalore → Chennai for demo
                  data.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comparableTrips.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                      Best deals — on both sites
                    </p>
                    {comparableTrips.map((trip) => (
                      <TripCard key={trip.id} trip={trip} />
                    ))}
                  </div>
                )}

                {singleSourceTrips.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
                      Only on one site
                    </p>
                    {singleSourceTrips.map((trip) => (
                      <TripCard key={trip.id} trip={trip} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {!loading && !result && !hasSearched && (
          <p className="mt-8 text-center text-sm text-stone-500">
            Pick a route and hit Compare prices to see matched trips.
          </p>
        )}
      </main>
    </div>
  );
}
