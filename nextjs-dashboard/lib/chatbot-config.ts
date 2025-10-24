import { authApi } from './auth-api';

export const AVAILABLE_DOMAINS = ["technology", "finance", "healthcare", "consumer goods"];

export const getActiveFiltersFromUrl = (): string => {
  const urlParams = new URLSearchParams(window.location.search);
  const filters: string[] = [];

  if (urlParams.has('sentiment_filter') && urlParams.get('sentiment_filter') !== 'all') {
    filters.push(`sentiment_filter=${urlParams.get('sentiment_filter')}`);
  }
  if (urlParams.has('page') && urlParams.get('page') !== '1') {
    filters.push(`page=${urlParams.get('page')}`);
  }
  if (urlParams.has('limit')) {
    filters.push(`limit=${urlParams.get('limit')}`);
  }
  if (urlParams.has('date_from')) {
    filters.push(`date_from=${urlParams.get('date_from')}`);
  }
  if (urlParams.has('date_to')) {
    filters.push(`date_to=${urlParams.get('date_to')}`);
  }

  return filters.length > 0 ? filters.join('&') : 'none';
};

export const getAvailableDomains = async (): Promise<string[]> => {
  try {
    const response = await authApi.getDomains();
    return response.domains.map(domain => domain.id);
  } catch (error) {
    console.warn('Failed to fetch domains, using fallback:', error);
    return AVAILABLE_DOMAINS;
  }
};