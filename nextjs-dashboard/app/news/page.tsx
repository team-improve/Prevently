'use client';

import { useState, useEffect } from 'react';
import ArticleCard from '@/components/ArticleCard';

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

const ARTICLES_PER_PAGE = 10;

export default function NewsPage() {
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedSentiment, setSelectedSentiment] = useState<string>('all');
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [domainObjects, setDomainObjects] = useState<any[]>([]);

  useEffect(() => {
    fetchAllNews();
    fetchDomains();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDomains, selectedSentiment]);

  const fetchAllNews = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching all news...');
      const response = await authApi.getAllNews(500);
      console.log('API response:', response);
      console.log('Articles count:', response.articles?.length || 0);
      setAllArticles(response.articles || []);
    } catch (err) {
      console.error('Failed to fetch news:', err);
      setError('Failed to load news articles');
    } finally {
      setLoading(false);
    }
  };

  const fetchDomains = async () => {
    try {
      const response = await authApi.getDomains();
      const domains = response.domains;
      setDomainObjects(domains);
      const domainNames = domains.map((domain: any) => domain.name);
      setAvailableDomains(domainNames.sort());
    } catch (err) {
      console.error('Failed to fetch domains:', err);
      const articleDomains = Array.from(new Set(allArticles.map(article => article.domain))).sort();
      setAvailableDomains(articleDomains);
      setDomainObjects([]);
    }
  };

  const filteredArticles = allArticles.filter(article => {
    const domainMatch = selectedDomains.length === 0 || selectedDomains.includes(article.domain.name);
    const sentimentMatch = selectedSentiment === 'all' ||
      (selectedSentiment === 'positive' && article.sentiment_numeric >= 0.1) ||
      (selectedSentiment === 'neutral' && article.sentiment_numeric >= -0.1 && article.sentiment_numeric <= 0.1) ||
      (selectedSentiment === 'negative' && article.sentiment_numeric <= -0.1);
    return domainMatch && sentimentMatch;
  });

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const endIndex = startIndex + ARTICLES_PER_PAGE;
  const currentArticles = filteredArticles.slice(startIndex, endIndex);

  const handleDomainChange = (domain: string, checked: boolean) => {
    if (checked) {
      setSelectedDomains(prev => [...prev, domain]);
    } else {
      setSelectedDomains(prev => prev.filter(d => d !== domain));
    }
  };

  const handleSelectAllDomains = () => {
    setSelectedDomains(availableDomains);
  };

  const handleClearAllDomains = () => {
    setSelectedDomains([]);
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

  const calculateNewsPulse = () => {
    if (filteredArticles.length === 0) return { average: 0, trend: 'neutral' };
    
    const average = filteredArticles.reduce((sum, article) => sum + article.sentiment_numeric, 0) / filteredArticles.length;
    
    let trend = 'neutral';
    if (average >= 0.1) trend = 'positive';
    else if (average <= -0.1) trend = 'negative';
    
    return { average, trend };
  };

  const newsPulse = calculateNewsPulse();

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

  const getCanonicalDomainName = (articleDomain: { id: string; name: string; description: string }) => {
    return articleDomain.name;
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title Section */}
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                News Intelligence Hub
              </h1>
              <p className="text-gray-600 text-lg">Real-time market insights and sentiment analysis</p>
            </div>

            {/* News Pulse - Prominent */}
            <div className="flex-shrink-0">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/30">
                <div className="text-center">
                  <div className="text-sm font-semibold text-gray-700 mb-2">Market Sentiment</div>
                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                    newsPulse.trend === 'positive'
                      ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-green-200 shadow-lg'
                      : newsPulse.trend === 'negative'
                      ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-red-200 shadow-lg'
                      : 'bg-gradient-to-r from-gray-400 to-slate-500 text-white shadow-gray-200 shadow-lg'
                  }`}>
                    <span className="text-lg mr-2">
                      {newsPulse.trend === 'positive' ? '📈' : newsPulse.trend === 'negative' ? '📉' : '➡️'}
                    </span>
                    <span className="mr-2">
                      {newsPulse.trend === 'positive' ? 'Bullish' : newsPulse.trend === 'negative' ? 'Bearish' : 'Neutral'}
                    </span>
                    <span className="text-xs opacity-90">
                      {newsPulse.average >= 0 ? '+' : ''}{newsPulse.average.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modern Filters */}
          <div className="mt-8 bg-white/40 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/30">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Domain Filter - Modern Dropdown */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Filter by Sectors
                </label>
                <div className="relative">
                  <div className="flex flex-wrap gap-2 p-3 bg-white/60 rounded-xl border border-gray-200/50 shadow-sm">
                    {selectedDomains.length === 0 ? (
                      <span className="text-gray-500 text-sm">All sectors selected</span>
                    ) : (
                      selectedDomains.map(domain => (
                        <span
                          key={domain}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                        >
                          {domain}
                          <button
                            onClick={() => handleDomainChange(domain, false)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={handleSelectAllDomains}
                      className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleClearAllDomains}
                      className="px-4 py-2 text-sm font-medium bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      Clear All
                    </button>
                    {availableDomains.filter(domain => !selectedDomains.includes(domain)).slice(0, 8).map(domain => (
                      <button
                        key={domain}
                        onClick={() => handleDomainChange(domain, true)}
                        className="px-3 py-1 text-sm font-medium bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
                      >
                        + {domain}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sentiment Filter */}
              <div className="lg:w-48">
                <label htmlFor="sentiment-filter" className="block text-sm font-semibold text-gray-700 mb-3">
                  Sentiment Filter
                </label>
                <select
                  id="sentiment-filter"
                  value={selectedSentiment}
                  onChange={(e) => setSelectedSentiment(e.target.value)}
                  className="w-full px-4 py-3 bg-white/60 border border-gray-200/50 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm backdrop-blur-sm"
                >
                  <option value="all">All Sentiments</option>
                  <option value="positive">📈 Positive</option>
                  <option value="neutral">➡️ Neutral</option>
                  <option value="negative">📉 Negative</option>
                </select>
              </div>
            </div>

            {/* Results Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{filteredArticles.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{allArticles.length}</span> articles
                  {selectedDomains.length > 0 && (
                    <span className="ml-2 text-blue-600">
                      • {selectedDomains.length} sector{selectedDomains.length !== 1 ? 's' : ''} filtered
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  Updated {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="space-y-6">
            {/* Loading Header */}
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-white border-t-transparent"></div>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Market Intelligence</h3>
              <p className="text-gray-600">Fetching latest news and sentiment data...</p>
            </div>

            {/* Loading Cards */}
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-32 h-8 bg-gray-200 rounded-full"></div>
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="mb-4">
                  <div className="w-3/4 h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="w-full h-4 bg-gray-200 rounded mb-1"></div>
                  <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
                  <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
                  <div className="w-24 h-6 bg-gray-200 rounded-full ml-auto"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-100 to-rose-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load News</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
            <button
              onClick={fetchAllNews}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        ) : allArticles.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-100 to-slate-100 rounded-full mb-6">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No News Available</h3>
            <p className="text-gray-600">There are currently no news articles to display.</p>
          </div>
        ) : (
          <>
            {/* Articles Grid */}
            <div className="grid gap-6 mb-8">
              {currentArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  getCanonicalDomainName={getCanonicalDomainName}
                  truncateDescription={truncateDescription}
                  parseCompanies={parseCompanies}
                />
              ))}
            </div>

            {/* Modern Pagination */}
            {totalPages > 1 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/30 p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 shadow-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                              pageNum === currentPage
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white transition-all duration-200 shadow-sm"
                    >
                      Next
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                    <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span> pages
                    <span className="mx-2">•</span>
                    <span className="font-semibold text-blue-600">{filteredArticles.length}</span> articles
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}