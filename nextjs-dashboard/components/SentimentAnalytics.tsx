'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/auth-api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { lusitana } from '@/app/ui/fonts';
import Dropdown from './Dropdown';
import MultiSelect from './MultiSelect';
import DateRangePicker from './DateRangePicker';

interface SentimentData {
  date: string;
  sentiment: number;
  article_count: number;
}

interface Domain {
  id: string;
  name: string;
  description: string;
}

interface AdvancedAnalyticsData {
  articles: Array<{
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
  }>;
  analytics: {
    domain_breakdown: Array<{
      domain: string;
      article_count: number;
      avg_sentiment: number;
      sentiment_distribution: {
        positive: number;
        neutral: number;
        negative: number;
      };
    }>;
    company_breakdown: Array<{
      company: string;
      mention_count: number;
      avg_sentiment: number;
    }>;
    daily_trends: Array<{
      date: string;
      article_count: number;
      avg_sentiment: number;
      sentiment_distribution: {
        positive: number;
        neutral: number;
        negative: number;
      };
    }>;
    total_articles: number;
    date_range: {
      from: number | null;
      to: number | null;
    };
    filters_applied: {
      domains: string[];
      companies: string[];
      sentiment_filter: string;
    };
  };
}

interface SentimentAnalyticsProps {
  domains: Domain[];
  fixedDomain?: string;
  simplified?: boolean;
}

function SentimentAnalytics({ domains, fixedDomain, simplified = false }: SentimentAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AdvancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState<string[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedDomains, setSelectedDomains] = useState<string[]>(() => {
    const domainsParam = searchParams.get('domains');
    return domainsParam ? domainsParam.split(',') : [];
  });

  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(() => {
    const companiesParam = searchParams.get('companies');
    return companiesParam ? companiesParam.split(',') : [];
  });

  const [startDate, setStartDate] = useState(() => {
    const startParam = searchParams.get('startDate');
    return startParam || '';
  });

  const [endDate, setEndDate] = useState(() => {
    const endParam = searchParams.get('endDate');
    return endParam || '';
  });

  const [sentimentFilter, setSentimentFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>(() => {
    const sentimentParam = searchParams.get('sentiment') as 'all' | 'positive' | 'neutral' | 'negative';
    return sentimentParam || 'all';
  });

  const [filterMode, setFilterMode] = useState<'advanced' | 'query'>('advanced');
  const [queryText, setQueryText] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAiInput, setShowAiInput] = useState(false);
  const [viewMode, setViewMode] = useState<'trends' | 'domains' | 'companies' | 'distribution'>(() => {
    return simplified ? 'trends' : 'trends';
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await authApi.getCompanies();
        setCompanies(response.companies);
      } catch (error) {
        console.error('Failed to fetch companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  const updateURL = () => {
    if (fixedDomain) return;

    const params = new URLSearchParams();
    if (selectedDomains.length > 0) params.set('domains', selectedDomains.join(','));
    if (selectedCompanies.length > 0) params.set('companies', selectedCompanies.join(','));
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (sentimentFilter !== 'all') params.set('sentiment', sentimentFilter);

    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/dashboard${newURL}`, { scroll: false });
  };

  const handleFiltersChange = () => {
    updateURL();
    fetchAnalytics();
  };

  const handleQueryExecute = () => {
    const parsedFilters = parseQuery(queryText);
    if (parsedFilters) {
      setSelectedDomains(parsedFilters.domains || []);
      setSelectedCompanies(parsedFilters.companies || []);
      setStartDate(parsedFilters.startDate || '');
      setEndDate(parsedFilters.endDate || '');
      setSentimentFilter(parsedFilters.sentimentFilter || 'all');
      
      fetchAnalyticsWithFilters(parsedFilters);
    }
  };

  const handleAiGenerateQuery = async () => {
    if (!aiPrompt.trim()) return;

    try {
      setAiLoading(true);
      setAiError(null);

      const response = await authApi.generateQuery({
        prompt: aiPrompt
      });

      setQueryText(response.query);
      console.log('Query explanation:', response.explanation);
    } catch (error) {
      console.error('Failed to generate query:', error);
      setAiError('Failed to generate query. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const parseQuery = (query: string) => {
    try {
      const filters: any = {};
      
      const parts = query.split(/\s+(AND|OR)\s+/i);
      
      for (let i = 0; i < parts.length; i += 2) {
        const part = parts[i].trim();
        
        if (part.includes('domain:')) {
          const domainMatch = part.match(/domain:(\w+)/);
          if (domainMatch) {
            filters.domains = filters.domains || [];
            filters.domains.push(domainMatch[1]);
          }
        }
        
        if (part.includes('company:')) {
          const companyMatch = part.match(/company:"?([^"\s]+)"?/);
          if (companyMatch) {
            filters.companies = filters.companies || [];
            filters.companies.push(companyMatch[1]);
          }
        }
        
        if (part.includes('sentiment:')) {
          const sentimentMatch = part.match(/sentiment:(\w+)/);
          if (sentimentMatch) {
            filters.sentimentFilter = sentimentMatch[1];
          }
        }
        
        if (part.includes('date:')) {
          const dateMatch = part.match(/date:(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            filters.startDate = dateMatch[1];
            filters.endDate = dateMatch[2];
          }
        }
      }
      
      return filters;
    } catch (error) {
      console.error('Failed to parse query:', error);
      return null;
    }
  };

  const fetchAnalyticsWithFilters = async (filters: any) => {
    try {
      setLoading(true);
      const apiFilters = {
        domains: filters.domains || [],
        companies: filters.companies || [],
        dateFrom: filters.startDate ? new Date(filters.startDate).getTime() : undefined,
        dateTo: filters.endDate ? new Date(filters.endDate).getTime() : undefined,
        sentimentFilter: filters.sentimentFilter || 'all'
      };

      const response = await authApi.getAdvancedAnalytics(apiFilters);
      setAnalyticsData(response);
    } catch (error) {
      console.error('Failed to fetch analytics with query:', error);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const filters = {
        domains: selectedDomains.length > 0 ? selectedDomains : undefined,
        companies: selectedCompanies.length > 0 ? selectedCompanies : undefined,
        dateFrom: startDate ? new Date(startDate).getTime() : undefined,
        dateTo: endDate ? new Date(endDate).getTime() : undefined,
        sentimentFilter: sentimentFilter
      };

      const response = await authApi.getAdvancedAnalytics(filters);
      setAnalyticsData(response);
    } catch (error) {
      console.error('Failed to fetch advanced analytics:', error);
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 0.1) return '#10B981';
    if (sentiment >= -0.1) return '#6B7280';
    return '#EF4444';
  };

  const getOverallSentimentColor = (data: any[]) => {
    if (data.length === 0) return '#6B7280';
    const avgSentiment = data.reduce((sum, item) => sum + item.avg_sentiment, 0) / data.length;
    return getSentimentColor(avgSentiment);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{formatDate(label)}</p>
          <p className="text-sm text-gray-600">
            Avg Sentiment: <span style={{ color: getSentimentColor(data.avg_sentiment) }}>
              {data.avg_sentiment >= 0 ? '+' : ''}{data.avg_sentiment.toFixed(3)}
            </span>
          </p>
          <p className="text-sm text-gray-600">
            Articles: {data.article_count}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderTrendsChart = () => {
    if (!analyticsData?.analytics.daily_trends) return null;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={analyticsData.analytics.daily_trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis
            domain={[-1, 1]}
            tickFormatter={(value) => value.toFixed(1)}
            stroke="#6B7280"
            fontSize={12}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="2 2" />
          <Line
            type="monotone"
            dataKey="avg_sentiment"
            stroke={getOverallSentimentColor(analyticsData.analytics.daily_trends)}
            strokeWidth={2}
            dot={{ fill: getOverallSentimentColor(analyticsData.analytics.daily_trends), strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: getOverallSentimentColor(analyticsData.analytics.daily_trends), strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderDomainChart = () => {
    if (!analyticsData?.analytics.domain_breakdown) return null;

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={analyticsData.analytics.domain_breakdown} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="domain"
            stroke="#6B7280"
            fontSize={12}
          />
          <YAxis stroke="#6B7280" fontSize={12} />
          <Tooltip />
          <Bar dataKey="article_count" fill="#3B82F6" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderCompanyChart = () => {
    if (!analyticsData?.analytics.company_breakdown) return null;

    const data = analyticsData.analytics.company_breakdown.slice(0, 10);

    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="company"
            stroke="#6B7280"
            fontSize={10}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#6B7280" fontSize={12} />
          <Tooltip />
          <Bar dataKey="mention_count" fill="#8B5CF6" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderSentimentDistribution = () => {
    if (!analyticsData?.analytics.domain_breakdown) return null;

    const totalDistribution = analyticsData.analytics.domain_breakdown.reduce(
      (acc, domain) => ({
        positive: acc.positive + domain.sentiment_distribution.positive,
        neutral: acc.neutral + domain.sentiment_distribution.neutral,
        negative: acc.negative + domain.sentiment_distribution.negative,
      }),
      { positive: 0, neutral: 0, negative: 0 }
    );

    const data = [
      { name: 'Positive', value: totalDistribution.positive, color: '#10B981' },
      { name: 'Neutral', value: totalDistribution.neutral, color: '#6B7280' },
      { name: 'Negative', value: totalDistribution.negative, color: '#EF4444' }
    ];

    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch (viewMode) {
      case 'trends':
        return renderTrendsChart();
      case 'domains':
        return renderDomainChart();
      case 'companies':
        return renderCompanyChart();
      case 'distribution':
        return renderSentimentDistribution();
      default:
        return renderTrendsChart();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {simplified ? 'Sentiment Trends' : 'Advanced Market Intelligence'}
          </h3>
          <p className="text-gray-600 text-sm">
            {simplified ? 'Sentiment analysis for this domain' : 'Comprehensive sentiment analysis with advanced filtering'}
          </p>
        </div>

        {!simplified && (
          <div className="flex items-center space-x-2">
            <label className="block text-sm font-medium text-gray-700">View:</label>
            <Dropdown
              options={[
                { value: 'trends', label: 'Sentiment Trends' },
                { value: 'domains', label: 'Domain Analysis' },
                { value: 'companies', label: 'Company Mentions' },
                { value: 'distribution', label: 'Sentiment Distribution' }
              ]}
              value={viewMode}
              onChange={(value) => setViewMode(value as typeof viewMode)}
              className="w-48"
            />
          </div>
        )}
      </div>

      {!simplified && (
        <>
          {/* Advanced Filters */}
          <div className="mb-6 space-y-4">
            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setFilterMode('advanced')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  filterMode === 'advanced'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Advanced Filters
              </button>
              <button
                onClick={() => setFilterMode('query')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  filterMode === 'query'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Query Language
              </button>
            </div>

            {filterMode === 'advanced' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Advanced Filters</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Row 1: Domains and Companies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domains</label>
                    <MultiSelect
                      options={domains.map((domain) => ({
                        value: domain.id,
                        label: domain.name
                      }))}
                      value={selectedDomains}
                      onChange={setSelectedDomains}
                      placeholder="All domains"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Companies</label>
                    <input
                      type="text"
                      value={selectedCompanies.join(', ')}
                      onChange={(e) => {
                        const value = e.target.value;
                        const companies = value.split(',').map(c => c.trim()).filter(c => c.length > 0);
                        setSelectedCompanies(companies);
                      }}
                      placeholder="Enter companies separated by commas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate multiple companies with commas</p>
                  </div>

                  {/* Row 2: Date Range and Sentiment */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                    <DateRangePicker
                      startDate={startDate}
                      endDate={endDate}
                      onStartDateChange={setStartDate}
                      onEndDateChange={setEndDate}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sentiment</label>
                    <Dropdown
                      options={[
                        { value: 'all', label: 'All Sentiments' },
                        { value: 'positive', label: 'Positive Only' },
                        { value: 'neutral', label: 'Neutral Only' },
                        { value: 'negative', label: 'Negative Only' }
                      ]}
                      value={sentimentFilter}
                      onChange={(value) => setSentimentFilter(value as typeof sentimentFilter)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Apply Filters Button */}
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleFiltersChange}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? 'Applying...' : 'Apply Filters'}
                  </button>
                </div>
              </div>
            )}

            {filterMode === 'query' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Query Language</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Write your query manually
                    </label>
                    <textarea
                      value={queryText}
                      onChange={(e) => setQueryText(e.target.value)}
                      placeholder={`Example queries:
domain:technology AND company:Apple AND sentiment:positive
date:2024-01-01..2024-01-31 AND sentiment:negative
company:"Microsoft" OR company:"Google"`}
                      className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                      Use AND, OR, NOT operators. Supports domain:, company:, sentiment:, date: filters
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowAiInput(!showAiInput)}
                        className="px-3 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 text-sm flex items-center space-x-2 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>{showAiInput ? 'Hide AI Assistant' : 'Use AI Assistant'}</span>
                      </button>
                      <button
                        onClick={handleQueryExecute}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        disabled={loading || !queryText.trim()}
                      >
                        {loading ? 'Executing...' : 'Execute Query'}
                      </button>
                    </div>
                  </div>
                </div>

                {showAiInput && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">AI Query Assistant</h5>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Describe what you want to find
                        </label>
                        <textarea
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                          placeholder="e.g., Show me positive news about Apple in technology from the last month"
                          className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          disabled={aiLoading}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          The AI will generate a query based on your description
                        </div>
                        <button
                          onClick={handleAiGenerateQuery}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-2"
                          disabled={aiLoading || !aiPrompt.trim()}
                        >
                          {aiLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span>Generate Query</span>
                            </>
                          )}
                        </button>
                      </div>
                      {aiError && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {aiError}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary Stats */}
          {analyticsData && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{analyticsData.analytics.total_articles}</div>
                <div className="text-sm text-blue-800">Total Articles</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analyticsData.analytics.domain_breakdown.length}
                </div>
                <div className="text-sm text-green-800">Domains Analyzed</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analyticsData.analytics.company_breakdown.length}
                </div>
                <div className="text-sm text-purple-800">Companies Mentioned</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-gray-600">
                  {analyticsData.analytics.filters_applied.domains.length > 0 ? 'Active' : 'None'}
                </div>
                <div className="text-sm text-gray-800">Active Filters</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Chart */}
      <div className="h-80">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading analytics data...</span>
          </div>
        ) : !analyticsData ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-600">No analytics data available. Try adjusting your filters.</p>
          </div>
        ) : (
          simplified ? renderTrendsChart() : renderChart()
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Positive (≥ 0.1)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
          <span>Neutral (-0.1 to 0.1)</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Negative (&lt; -0.1)</span>
        </div>
      </div>
    </div>
  );
}

export default memo(SentimentAnalytics, (prevProps, nextProps) => {
  return prevProps.domains === nextProps.domains && 
         prevProps.fixedDomain === nextProps.fixedDomain && 
         prevProps.simplified === nextProps.simplified;
});