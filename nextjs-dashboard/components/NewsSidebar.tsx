'use client';

import { useState, useEffect } from 'react';
import ArticleCard from './ArticleCard';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  domain: {
    id: string;
    name: string;
    description: string;
  };
  companies: string[] | string;
  source: string;
  source_url: string;
  sentiment_numeric: number;
  sentiment_result: any;
  sentiment_sublabel: string;
  timestamp: number;
}

interface NewsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsSidebar({ isOpen, onClose }: NewsSidebarProps) {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAllNews();
    }
  }, [isOpen]);

  const fetchAllNews = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching all news...');
      const response = await authApi.getAllNews(50);
      console.log('API response:', response);
      console.log('Articles count:', response.articles?.length || 0);
      setArticles(response.articles);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('Failed to load news articles');
    } finally {
      setLoading(false);
    }
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

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateDescription = (description: string, maxLength: number = 150) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const parseCompanies = (companiesStr: string | string[]): string[] => {
    if (Array.isArray(companiesStr)) {
      return companiesStr;
    }
    if (typeof companiesStr === 'string') {
      try {
        const cleaned = companiesStr.replace(/'/g, '"');
        return JSON.parse(cleaned);
      } catch (e) {
        const matches = companiesStr.match(/'([^']+)'/g);
        if (matches) {
          return matches.map(match => match.slice(1, -1));
        }
        return [];
      }
    }
    return [];
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[100] transition-opacity duration-300"
          onClick={onClose}
          onWheel={(e) => e.preventDefault()}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[101] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div>
            <h2 className="text-xl font-bold">News Analysis Panel</h2>
            <p className="text-blue-100 text-sm">All news articles sorted by timestamp</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading news articles...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <button
                onClick={fetchAllNews}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No news articles available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  getCanonicalDomainName={(domain) => domain.name}
                  truncateDescription={truncateDescription}
                  parseCompanies={parseCompanies}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{articles.length} articles loaded</span>
            <button
              onClick={fetchAllNews}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 text-xs"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
    </>
  );
}