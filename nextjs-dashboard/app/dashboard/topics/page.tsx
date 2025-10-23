"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/lib/api";
import SideBar from "@/app/ui/dashboard/sidebar";

type Topic = {
  id: string;
  name: string;
  sentiment: number; // -1 to +1
  impact: number; // 0–100
  newsCount: number;
  trend: string; // up, down, stable
  description?: string;
};

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Fetch live topics from backend if ready
        const data = await api<Topic[]>("/topics");
        setTopics(data);
      } catch {
        // Fallback mock data for now
        setTopics([
          {
            id: "1",
            name: "Healthcare IT",
            sentiment: 0.68,
            impact: 82,
            newsCount: 120,
            trend: "up",
            description: "Rising interest in digital health and AI diagnostics.",
          },
          {
            id: "2",
            name: "FinTech",
            sentiment: -0.25,
            impact: 70,
            newsCount: 95,
            trend: "down",
            description:
              "Regulatory scrutiny and market uncertainty affecting valuations.",
          },
          {
            id: "3",
            name: "Renewable Energy",
            sentiment: 0.45,
            impact: 88,
            newsCount: 140,
            trend: "up",
            description: "Positive momentum in solar and battery tech sectors.",
          },
          {
            id: "4",
            name: "Semiconductors",
            sentiment: 0.1,
            impact: 75,
            newsCount: 87,
            trend: "stable",
            description:
              "Chip demand steady with slight growth in automotive markets.",
          },
          {
            id: "5",
            name: "Cybersecurity",
            sentiment: 0.5,
            impact: 90,
            newsCount: 155,
            trend: "up",
            description: "High-profile breaches driving investment in defense tech.",
          },
          {
            id: "6",
            name: "Real Estate",
            sentiment: -0.4,
            impact: 65,
            newsCount: 80,
            trend: "down",
            description: "Higher interest rates impacting housing affordability.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getSentimentColor = (value: number) => {
    if (value > 0.3) return "bg-green-100 text-green-700 border-green-200";
    if (value < -0.3) return "bg-red-100 text-red-700 border-red-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return "▲";
      case "down":
        return "▼";
      default:
        return "▬";
    }
  };

  return (
    <div className="flex">
      <SideBar />

      <div className="flex-1 p-6 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-semibold mb-6">Market Topics</h1>

        {loading ? (
          <div className="text-gray-500 animate-pulse">Loading topics...</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${getSentimentColor(
                  topic.sentiment
                )}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="font-semibold text-lg">{topic.name}</h2>
                  <div className="flex items-center text-sm font-medium">
                    <span
                      className={`mr-1 ${
                        topic.sentiment > 0.3
                          ? "text-green-600"
                          : topic.sentiment < -0.3
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {topic.sentiment > 0
                        ? `+${(topic.sentiment * 100).toFixed(0)}%`
                        : `${(topic.sentiment * 100).toFixed(0)}%`}
                    </span>
                    <span className="text-xs">{getTrendIcon(topic.trend)}</span>
                  </div>
                </div>

                <p className="text-sm mb-3 line-clamp-3">{topic.description}</p>

                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>News Impact: {topic.impact}</span>
                  <span>{topic.newsCount} articles</span>
                </div>

                <div className="w-full bg-gray-200 h-2 mt-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      topic.sentiment > 0.3
                        ? "bg-green-500"
                        : topic.sentiment < -0.3
                        ? "bg-red-500"
                        : "bg-gray-500"
                    }`}
                    style={{ width: `${topic.impact}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
