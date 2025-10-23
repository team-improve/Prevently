'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/auth-api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { lusitana } from '@/app/ui/fonts';
import Dropdown from './Dropdown';

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

interface SentimentAnalyticsProps {
  domains: Domain[];
  fixedDomain?: string;
}

function SentimentAnalytics({ domains, fixedDomain }: SentimentAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<SentimentData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [timeRange, setTimeRange] = useState(() => {
    const days = searchParams.get('days');
    return days ? parseInt(days) : 30;
  });

  const [selectedDomain, setSelectedDomain] = useState(() => {
    return fixedDomain || searchParams.get('domain') || 'all';
  });

  const updateURL = (newTimeRange: number, newDomain: string) => {
    if (fixedDomain) return; // Don't update URL if domain is fixed
    
    const params = new URLSearchParams();
    if (newTimeRange !== 30) params.set('days', newTimeRange.toString());
    if (newDomain !== 'all') params.set('domain', newDomain);

    const newURL = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/dashboard${newURL}`, { scroll: false });
  };

  const handleTimeRangeChange = (newTimeRange: number) => {
    setTimeRange(newTimeRange);
    updateURL(newTimeRange, selectedDomain);
  };

  const handleDomainChange = (newDomain: string) => {
    if (fixedDomain) return; // Don't allow domain changes if fixed
    setSelectedDomain(newDomain);
    updateURL(timeRange, newDomain);
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await authApi.getSentimentAnalytics(timeRange, selectedDomain);
        setAnalyticsData(response.analytics);
      } catch (error) {
        console.error('Failed to fetch sentiment analytics:', error);
        setAnalyticsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange, selectedDomain]);

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

  const getOverallSentimentColor = (data: SentimentData[]) => {
    if (data.length === 0) return '#6B7280';
    const avgSentiment = data.reduce((sum, item) => sum + item.sentiment, 0) / data.length;
    return getSentimentColor(avgSentiment);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{formatDate(label)}</p>
          <p className="text-sm text-gray-600">
            Sentiment: <span style={{ color: getSentimentColor(data.sentiment) }}>
              {data.sentiment >= 0 ? '+' : ''}{data.sentiment.toFixed(3)}
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Market Sentiment Analysis</h3>
          <p className="text-gray-600 text-sm">Track sentiment trends across news articles</p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="block text-sm font-medium text-gray-700">
              Time Range:
            </label>
            <Dropdown
              options={[
                { value: '7', label: '7 days' },
                { value: '30', label: '30 days' },
                { value: '90', label: '90 days' }
              ]}
              value={timeRange.toString()}
              onChange={(value) => handleTimeRangeChange(Number(value))}
              className="w-32"
            />
          </div>

          {!fixedDomain && (
            <div className="flex items-center space-x-2">
              <label className="block text-sm font-medium text-gray-700">
                Domain:
              </label>
              <Dropdown
                options={[
                  { value: 'all', label: 'All Domains' },
                  ...domains.map((domain) => ({
                    value: domain.id,
                    label: domain.name
                  }))
                ]}
                value={selectedDomain}
                onChange={handleDomainChange}
                className="w-40"
              />
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading sentiment data...</span>
          </div>
        ) : analyticsData.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <p className="text-gray-600">No sentiment data available for the selected filters.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyticsData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                dataKey="sentiment"
                stroke={getOverallSentimentColor(analyticsData)}
                strokeWidth={2}
                dot={{ fill: getOverallSentimentColor(analyticsData), strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: getOverallSentimentColor(analyticsData), strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
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
  return prevProps.domains === nextProps.domains && prevProps.fixedDomain === nextProps.fixedDomain;
});