'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { authStorage, authApi } from '@/lib/auth-api';
import { lusitana } from '@/app/ui/fonts';
import Dropdown from '@/components/Dropdown';
import SentimentAnalytics from '@/components/SentimentAnalytics';
import ProfileDropdown from '@/components/ProfileDropdown';

interface Domain {
  id: string;
  name: string;
  description: string;
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

export default function NewsDomainPage() {
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total_count: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  } | null>(null);
  const router = useRouter();
  const params = useParams();
  const domain = params.domain as string;

  const [currentPage, setCurrentPage] = useState(1);
  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const formatDomainName = (domainSlug: string) => {
    return domainSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getDisplayDomainName = () => {
    const matchingDomain = domains.find(d => d.id === domain);
    if (matchingDomain) {
      return matchingDomain.name;
    }
    return formatDomainName(domain);
  };

  const displayDomainName = getDisplayDomainName();

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
      day: 'numeric'
    });
  };

  const truncateDescription = (description: string, maxLength: number = 200) => {
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

  useEffect(() => {
    const token = authStorage.getToken();
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const decoded = decodeJWT(token);
    if (decoded && decoded.name) {
      setUsername(decoded.name);
    }
    setIsLoading(false);
  }, [router]);

  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const response = await authApi.getDomains();
        setDomains(response.domains);
      } catch (error) {
        console.error('Failed to fetch domains:', error);
        setDomains([]);
      }
    };

    fetchDomains();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        setArticlesLoading(true);
        const options: any = {
          page: currentPage,
          limit: 20,
          sentimentFilter: sentimentFilter
        };

        if (dateFrom) {
          options.dateFrom = new Date(dateFrom).getTime();
        }
        if (dateTo) {
          options.dateTo = new Date(dateTo).getTime();
        }

        const response = await authApi.getNewsByDomain(domain, options);
        setArticles(response.articles);
        setPagination(response.pagination);
      } catch (error) {
        console.error('Failed to fetch articles:', error);
        setArticles([]);
        setPagination(null);
      } finally {
        setArticlesLoading(false);
      }
    };

    if (domain) {
      fetchArticles();
    }
  }, [domain, currentPage, sentimentFilter, dateFrom, dateTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="hover:text-blue-600 transition-colors duration-200"
                >
                  Dashboard
                </button>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900 font-medium">News</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-blue-600 font-medium">{displayDomainName}</span>
              </nav>

              {/* Title */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                  {displayDomainName} News & Analysis
                </h1>
                <p className="text-gray-600 text-lg">
                  Stay informed with the latest developments and insights in the {displayDomainName.toLowerCase()} sector.
                </p>
              </div>
            </div>

            {/* Profile Dropdown in Header */}
            <div className="ml-6 flex-shrink-0">
              <ProfileDropdown username={username} inline={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sentiment
              </label>
              <Dropdown
                options={[
                  { value: 'all', label: 'All Sentiments' },
                  { value: 'positive', label: 'Positive' },
                  { value: 'neutral', label: 'Neutral' },
                  { value: 'negative', label: 'Negative' }
                ]}
                value={sentimentFilter}
                onChange={(value) => {
                  setSentimentFilter(value as 'all' | 'positive' | 'neutral' | 'negative');
                  setCurrentPage(1);
                }}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSentimentFilter('all');
                  setDateFrom('');
                  setDateTo('');
                  setCurrentPage(1);
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-all duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Sentiment Analytics */}
        <div className="mb-6">
          <SentimentAnalytics domains={domains} fixedDomain={domain} />
        </div>

        {/* Results Summary */}
        {pagination && (
          <div className="mb-6 text-sm text-gray-600">
            Showing {articles.length > 0 ? ((currentPage - 1) * 20) + 1 : 0} to {Math.min(currentPage * 20, pagination.total_count)} of {pagination.total_count} articles
          </div>
        )}

        {/* News Articles */}
        {articlesLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading articles...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No articles found for this sector.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {articles.map((article) => (
              <article
                key={article.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-200"
              >
                {/* Sentiment Indicator */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(article.sentiment_numeric)}`}>
                    <span className="mr-2">{getSentimentIcon(article.sentiment_numeric)}</span>
                    {article.sentiment_sublabel}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatTimestamp(article.timestamp)}
                  </span>
                </div>

                {/* Title and Description */}
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {article.title}
                  </h2>
                  <p className="text-gray-600">
                    {truncateDescription(article.description)}
                  </p>
                </div>

                {/* Tags and Source */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Companies */}
                  {parseCompanies(article.companies).map((company, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {company}
                    </span>
                  ))}

                  {/* Source */}
                  <a
                    href={article.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors duration-200"
                  >
                    {article.source}
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={!pagination.has_prev}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Previous
              </button>

              <div className="flex items-center space-x-1">
                {/* First page */}
                {pagination.page > 3 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      1
                    </button>
                    {pagination.page > 4 && <span className="px-2 text-gray-500">...</span>}
                  </>
                )}

                {/* Pages around current page */}
                {(() => {
                  const totalPages = pagination.total_pages;
                  const currentPage = pagination.page;
                  const maxVisible = 5;

                  let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                  let endPage = Math.min(totalPages, startPage + maxVisible - 1);

                  if (endPage - startPage + 1 < maxVisible) {
                    startPage = Math.max(1, endPage - maxVisible + 1);
                  }

                  const pages = [];
                  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
                    pages.push(
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                          pageNum === currentPage
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return pages;
                })()}

                {/* Last page */}
                {pagination.page < pagination.total_pages - 2 && (
                  <>
                    {pagination.page < pagination.total_pages - 3 && <span className="px-2 text-gray-500">...</span>}
                    <button
                      onClick={() => setCurrentPage(pagination.total_pages)}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      {pagination.total_pages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.total_pages))}
                disabled={!pagination.has_next}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
              </button>
            </div>

            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.total_pages}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}