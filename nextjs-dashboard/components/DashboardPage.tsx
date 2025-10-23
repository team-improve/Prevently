import { lusitana } from '@/app/ui/fonts';
import { authStorage, authApi } from '@/lib/auth-api';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SentimentAnalytics from './SentimentAnalytics';

interface DashboardPageProps {
  onLogout: () => void;
}

interface Domain {
  id: string;
  name: string;
  description: string;
}

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  domain: string;
  companies: string[];
  source: string;
  source_url: string;
  sentiment_numeric: number;
  sentiment_result: any;
  sentiment_sublabel: string;
  timestamp: number;
}

function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

const newsItems = [
  {
    id: 1,
    title: "Market Analysis: Q4 Economic Outlook",
    excerpt: "Latest insights on market trends and economic indicators...",
    date: "2025-01-15"
  },
  {
    id: 2,
    title: "Healthcare Sector Shows Strong Growth",
    excerpt: "Healthcare companies report record earnings this quarter...",
    date: "2025-01-14"
  },
  {
    id: 3,
    title: "Technology Stocks Rally on AI Developments",
    excerpt: "Major tech companies announce breakthrough AI technologies...",
    date: "2025-01-13"
  }
];

export default function DashboardPage({ onLogout }: DashboardPageProps) {
  const [username, setUsername] = useState<string>('');
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [newsLoading, setNewsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = authStorage.getToken();
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.name) {
        setUsername(decoded.name);
      }
    }
  }, []);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await authApi.getDomains();
        setDomains(response.domains);
      } catch (error) {
        console.error('Failed to fetch domains:', error);
        setDomains([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, []);

  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        const response = await authApi.getLatestNews(10);
        setLatestNews(response.articles);
      } catch (error) {
        console.error('Failed to fetch latest news:', error);
        setLatestNews([]);
      } finally {
        setNewsLoading(false);
      }
    };

    fetchLatestNews();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex((prevIndex) =>
        prevIndex === latestNews.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [latestNews.length]);

  const handleDomainClick = (domainId: string) => {
    router.push(`/news/${domainId}`);
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const truncateDescription = (description: string, maxLength: number = 150) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.5) return 'text-green-600 bg-green-100';
    if (sentiment >= 0.1) return 'text-green-500 bg-green-50';
    if (sentiment >= -0.1) return 'text-gray-600 bg-gray-100';
    if (sentiment >= -0.5) return 'text-red-500 bg-red-50';
    return 'text-red-600 bg-red-100';
  };

  const getSentimentIcon = (sentiment: number) => {
    if (sentiment >= 0.1) return '😊';
    if (sentiment >= -0.1) return '😐';
    return '😔';
  };

  const nextNews = () => {
    setCurrentNewsIndex((prevIndex) =>
      prevIndex === latestNews.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevNews = () => {
    setCurrentNewsIndex((prevIndex) =>
      prevIndex === 0 ? latestNews.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Dashboard Navigation */}
      <nav className="flex items-center justify-between p-6 lg:px-8">
        <div className="flex items-center">
          <h1 className={`${lusitana.className} text-2xl font-bold text-gray-900`}>Prevently</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-gray-600">Welcome back{username ? `, ${username}` : ''}!</span>
          <button
            onClick={onLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-all duration-200"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Your Economic Intelligence
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Dashboard</span>
          </h1>
        </div>

        {/* News Carousel */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Latest News</h2>
          {newsLoading ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="py-8 px-20">
                <div className="flex justify-center items-center min-h-[120px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading latest news...</span>
                </div>
              </div>
            </div>
          ) : latestNews.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="py-8 px-20">
                <div className="text-center min-h-[120px] flex items-center justify-center">
                  <p className="text-gray-600">No news articles available.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="py-8 px-20">
                <div className="min-h-[120px]">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {latestNews[currentNewsIndex]?.title || 'No title available'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {truncateDescription(latestNews[currentNewsIndex]?.description || '')}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-500">
                      {latestNews[currentNewsIndex] ? formatTimestamp(latestNews[currentNewsIndex].timestamp) : ''}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(latestNews[currentNewsIndex]?.sentiment_numeric || 0)}`}>
                        <span className="mr-1">{getSentimentIcon(latestNews[currentNewsIndex]?.sentiment_numeric || 0)}</span>
                        {latestNews[currentNewsIndex]?.sentiment_sublabel || 'Neutral'}
                      </span>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {latestNews[currentNewsIndex]?.domain || ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carousel Navigation */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {latestNews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentNewsIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentNewsIndex ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Previous/Next Buttons */}
              <button
                onClick={prevNews}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={nextNews}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white rounded-full p-2 shadow-md transition-all duration-200"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Sentiment Analytics */}
        <div className="mb-12">
          <SentimentAnalytics domains={domains} />
        </div>

        {/* News Sidepanel Section */}
        <div className="mb-12 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">News Analysis Panel</h3>
              <p className="text-gray-600">
                Access detailed news analysis and insights across all sectors.
                Open the news sidepanel to explore comprehensive market intelligence.
              </p>
            </div>
            <div className="ml-6">
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 flex items-center space-x-2">
                <span>Open News Panel</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Domain Cards */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Explore News by Sector</h2>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading sectors...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {domains.map((domain) => (
                <div
                  key={domain.id}
                  onClick={() => handleDomainClick(domain.id)}
                  className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl hover:scale-105 transition-all duration-200 border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{domain.name}</h3>
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {domain.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}