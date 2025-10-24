import React from 'react';

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

interface ArticleCardProps {
  article: NewsArticle;
  getCanonicalDomainName?: (domain: { id: string; name: string; description: string }) => string;
  truncateDescription?: (description: string, maxLength?: number) => string;
  parseCompanies?: (companiesStr: string | string[]) => string[];
}

const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  getCanonicalDomainName,
  truncateDescription,
  parseCompanies
}) => {
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

  const defaultTruncateDescription = (description: string, maxLength: number = 200) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  const defaultParseCompanies = (companiesStr: string | string[]): string[] => {
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

  const truncateDesc = truncateDescription || defaultTruncateDescription;
  const parseComp = parseCompanies || defaultParseCompanies;
  const domainName = getCanonicalDomainName ? getCanonicalDomainName(article.domain) : article.domain.name;

  return (
    <article className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/30 hover:border-white/50 overflow-hidden">
      {/* Sentiment Banner */}
      <div className={`h-1 bg-gradient-to-r ${
        article.sentiment_numeric >= 0.1
          ? 'from-green-400 to-emerald-500'
          : article.sentiment_numeric <= -0.1
          ? 'from-red-400 to-rose-500'
          : 'from-gray-400 to-slate-500'
      }`} />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
            article.sentiment_numeric >= 0.1
              ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
              : article.sentiment_numeric <= -0.1
              ? 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
              : 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200'
          }`}>
            <span className="text-lg mr-2">{getSentimentIcon(article.sentiment_numeric)}</span>
            {article.sentiment_sublabel}
            <span className="ml-2 text-xs opacity-75">
              {article.sentiment_numeric >= 0 ? '+' : ''}{article.sentiment_numeric.toFixed(2)}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {formatTimestamp(article.timestamp).split(',')[0]}
            </div>
            <div className="text-xs text-gray-500">
              {formatTimestamp(article.timestamp).split(',')[1]}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300 leading-tight">
            {article.title}
          </h3>
          <p className="text-gray-600 text-base leading-relaxed">
            {truncateDesc(article.description, 200)}
          </p>
        </div>

        {/* Tags and Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Domain Tag */}
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md">
              <span className="w-2 h-2 bg-white/30 rounded-full mr-2"></span>
              {domainName}
            </span>

            {/* Company Tags */}
            {parseComp(article.companies).slice(0, 2).map((company, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border border-purple-200"
              >
                {company}
              </span>
            ))}
          </div>

          {/* Source Link */}
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all duration-300 border border-gray-200 hover:border-gray-300 group/link"
          >
            <span className="mr-2">{article.source}</span>
            <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
};

export default ArticleCard;