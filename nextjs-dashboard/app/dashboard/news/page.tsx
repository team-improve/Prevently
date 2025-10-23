"use client";

import { useEffect, useState, useRef } from "react";
import { api } from "@/app/lib/api";
import SideNav from "@/app/ui/dashboard/sidenav";

type NewsItem = {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: number;
  summary: string;
};

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api<NewsItem[]>("/news");
        setNews(data);
      } catch {
        setNews([
          {
            id: "1",
            title: "Tesla stock surges after strong Q3 earnings",
            source: "Reuters",
            url: "#",
            publishedAt: "2025-10-23T10:00:00Z",
            sentiment: 0.75,
            summary:
              "Tesla’s Q3 results beat expectations, sending shares up 8%. Analysts highlight continued EV demand growth.",
          },
          {
            id: "2",
            title: "Apple faces supply chain delays ahead of holiday season",
            source: "Bloomberg",
            url: "#",
            publishedAt: "2025-10-22T18:30:00Z",
            sentiment: -0.35,
            summary:
              "Apple warned of shipment delays due to manufacturing slowdowns in Asia, sparking concerns among investors.",
          },
          {
            id: "3",
            title: "Google launches new AI-driven ad platform",
            source: "TechCrunch",
            url: "#",
            publishedAt: "2025-10-21T15:00:00Z",
            sentiment: 0.4,
            summary:
              "Google unveiled an AI-powered ad optimization tool, expected to improve campaign performance globally.",
          },
          {
            id: "4",
            title: "Amazon expands drone delivery program in the U.S.",
            source: "The Verge",
            url: "#",
            publishedAt: "2025-10-20T09:00:00Z",
            sentiment: 0.6,
            summary:
              "Amazon’s Prime Air drones will start delivering to new states, pushing forward its logistics innovation goals.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollPos = 0;
    let animationFrame: number;

    const scroll = () => {
      if (container) {
        scrollPos += 0.2;
        if (scrollPos >= container.scrollWidth / 2) {
          scrollPos = 0;
        }
        container.scrollLeft = scrollPos;
      }
      animationFrame = requestAnimationFrame(scroll);
    };

    animationFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [news]);

  const sentimentStyle = (s: number) => {
    if (s > 0.3)
      return "bg-gradient-to-br from-green-50 to-green-100 border-green-200";
    if (s < -0.3)
      return "bg-gradient-to-br from-red-50 to-red-100 border-red-200";
    return "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200";
  };

  const sentimentText = (s: number) =>
    s > 0.2 ? "text-green-700" : s < -0.2 ? "text-red-700" : "text-gray-700";

  return (
    <div className="flex">

      <div className="flex-1 h-screen overflow-hidden p-6 bg-gray-50">
        <h1 className="text-2xl font-semibold mb-6">Market News</h1>

        {loading ? (
          <div className="text-gray-500 animate-pulse">Loading latest news...</div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-hidden relative pb-4"
          >
            {/* Duplicate list for seamless infinite scroll */}
            {[...news, ...news].map((item, idx) => (
              <a
                key={item.id + "-" + idx}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`min-w-[320px] max-w-[320px] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-5 border flex-shrink-0 ${sentimentStyle(
                  item.sentiment
                )}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 hover:text-black line-clamp-2">
                    {item.title}
                  </h2>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                  {item.summary}
                </p>

                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-600">{item.source}</span>
                  <span className={`${sentimentText(item.sentiment)} font-semibold`}>
                    {item.sentiment > 0
                      ? `+${(item.sentiment * 100).toFixed(0)}%`
                      : `${(item.sentiment * 100).toFixed(0)}%`}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
