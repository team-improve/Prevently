"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";

type Company = {
  id: string;
  name: string;
  ticker: string;
  sentiment: number;
  impact: number;
};
import SideNav from '@/app/ui/dashboard/sidenav';
 

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // temporary mock if backend not ready
    const load = async () => {
      setLoading(true);
      try {
        const data = await api<Company[]>("/companies");
        setCompanies(data);
      } catch {
        // fallback mock data
        setCompanies([
          { id: "1", name: "Tesla", ticker: "TSLA", sentiment: 0.8, impact: 85 },
          { id: "2", name: "Apple", ticker: "AAPL", sentiment: 0.3, impact: 72 },
          { id: "3", name: "Google", ticker: "GOOGL", sentiment: -0.2, impact: 60 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = companies.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.ticker.toLowerCase().includes(query.toLowerCase())
  );

  return (
    
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Companies</h1>

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search companies..."
        className="w-full mb-6 p-3 rounded-2xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black"
      />

      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading companies...</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border shadow-sm p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-medium">{c.name}</h2>
                <span className="text-sm text-gray-500">{c.ticker}</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Sentiment:
                <span
                  className={
                    "ml-2 font-semibold " +
                    (c.sentiment > 0.2
                      ? "text-green-600"
                      : c.sentiment < -0.2
                      ? "text-red-600"
                      : "text-gray-700")
                  }
                >
                  {c.sentiment > 0
                    ? `+${(c.sentiment * 100).toFixed(0)}%`
                    : `${(c.sentiment * 100).toFixed(0)}%`}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Impact score:
                <span className="ml-2 font-semibold text-black">
                  {c.impact}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
