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
            sentiment: 0.5,
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
    let animationFrame: number;
    const scrollContainer = scrollRef.current;

    const scroll = () => {
      if (scrollContainer) {
        scrollContainer.scrollLeft += 0.5;
        if (
          scrollContainer.scrollLeft >=
          scrollContainer.scrollWidth - scrollContainer.clientWidth
        ) {
          scrollContainer.scrollLeft = 0;
        }
      }
      animationFrame = requestAnimationFrame(scroll);
    };

    animationFrame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [news]);

  const sentimentColor = (s: number) =>
    s > 0.2 ? "text-green-600" : s < -0.2 ? "text-red-600" : "text-gray-700";

  return (
    <div className="flex">

      <div className="flex-1 h-screen overflow-hidden p-6 bg-gray-50">
        <h1 className="text-2xl font-semibold mb-6">Market News</h1>

        {loading ? (
          <div className="text-gray-500 animate-pulse">Loading latest news...</div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          >
            {news.concat(news).map((item) => (
              <a
                key={item.id + Math.random()}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-[300px] max-w-[300px] bg-white rounded-2xl shadow-sm hover:shadow-md transition p-5 border border-gray-100 flex-shrink-0"
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 hover:text-black line-clamp-2">
                    {item.title}
                  </h2>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(item.publishedAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-gray-700 text-sm mb-3 line-clamp-3">
                  {item.summary}
                </p>

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span className="font-medium">{item.source}</span>
                  <span className={`${sentimentColor(item.sentiment)} font-semibold`}>
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
