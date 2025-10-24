const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface AuthResponse {
  kind?: string;
  localId?: string;
  email?: string;
  displayName?: string;
  idToken?: string;
  registered?: boolean;
  refreshToken?: string;
  expiresIn?: string;
  message?: string;
}

export interface AuthError {
  error?: {
    code: number;
    message: string;
    errors?: Array<{
      domain: string;
      reason: string;
      message: string;
    }>;
  };
  detail?: {
    error?: {
      code: number;
      message: string;
      errors?: Array<{
        domain: string;
        reason: string;
        message: string;
      }>;
    };
  };
}

class ApiError extends Error {
  public code: number;
  public details: any;

  constructor(message: string, code: number, details?: any) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }
}

const getUserFriendlyErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'EMAIL_EXISTS': 'An account with this email already exists',
    'EMAIL_NOT_FOUND': 'No account found with this email address',
    'INVALID_PASSWORD': 'The password is invalid',
    'USER_DISABLED': 'This account has been disabled',
    'TOO_MANY_ATTEMPTS_TRY_LATER': 'Too many failed attempts. Please try again later',
    'INVALID_EMAIL': 'The email address is not valid',
    'WEAK_PASSWORD': 'The password is too weak',
    'MISSING_PASSWORD': 'Password is required',
    'INVALID_LOGIN_CREDENTIALS': 'Invalid email/username or password',
  };

  return errorMessages[errorCode] || `Authentication error: ${errorCode}`;
};

export const authApi = {
  async register(email: string, password: string, username: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username }),
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Registration failed';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_or_username: emailOrUsername, password }),
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;

      if (response.status === 403 && errorData.detail) {
        throw new ApiError(
          errorData.detail.error?.message || JSON.stringify(errorData.detail),
          response.status,
          errorData
        );
      }

      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Login failed';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async resetPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Password reset failed';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async googleAuth(idToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id_token: idToken }),
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Google authentication failed';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async verifyEmail(oobCode: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ oob_code: oobCode }),
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Email verification failed';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async resendVerification(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Failed to resend verification email';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async logout(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Logout failed';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async getDomains(): Promise<{ domains: Array<{ id: string; name: string; description: string }> }> {
    const response = await fetch(`${API_BASE_URL}/auth/domains`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Failed to get domains';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async getNewsByDomain(domain: string, options?: {
    page?: number;
    limit?: number;
    sentimentFilter?: 'all' | 'positive' | 'neutral' | 'negative';
    dateFrom?: number;
    dateTo?: number;
  }): Promise<{
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
    pagination: {
      page: number;
      limit: number;
      total_count: number;
      total_pages: number;
      has_next: boolean;
      has_prev: boolean;
    };
  }> {
    const params = new URLSearchParams();
    if (options?.page) params.set('page', options.page.toString());
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.sentimentFilter) params.set('sentiment_filter', options.sentimentFilter);
    if (options?.dateFrom) params.set('date_from', options.dateFrom.toString());
    if (options?.dateTo) params.set('date_to', options.dateTo.toString());

    const url = params.toString()
      ? `${API_BASE_URL}/auth/news/${domain}?${params}`
      : `${API_BASE_URL}/auth/news/${domain}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Failed to get news articles';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async getLatestNews(limit: number = 20): Promise<{ articles: Array<{
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
  }> }> {
    const response = await fetch(`${API_BASE_URL}/auth/news/latest/${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Failed to get latest news';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async getSentimentAnalytics(days: number = 30, domain: string = 'all'): Promise<{ analytics: Array<{
    date: string;
    sentiment: number;
    article_count: number;
  }> }> {
    const params = new URLSearchParams({
      days: days.toString(),
      domain: domain
    });

    const response = await fetch(`${API_BASE_URL}/auth/analytics/sentiment?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Failed to get sentiment analytics';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async getAdvancedAnalytics(filters: {
    domains?: string[];
    companies?: string[];
    dateFrom?: number;
    dateTo?: number;
    sentimentFilter?: 'all' | 'positive' | 'neutral' | 'negative';
  }): Promise<{
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
  }> {
    const response = await fetch(`${API_BASE_URL}/auth/analytics/advanced`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domains: filters.domains || [],
        companies: filters.companies || [],
        date_from: filters.dateFrom,
        date_to: filters.dateTo,
        sentiment_filter: filters.sentimentFilter || 'all'
      }),
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Failed to get advanced analytics';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async getCompanies(): Promise<{ companies: string[] }> {
    const response = await fetch(`${API_BASE_URL}/auth/companies`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Failed to get companies';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },

  async generateQuery(request: {
    prompt: string;
  }): Promise<{ query: string; explanation: string }> {
    const response = await fetch(`${API_BASE_URL}/api/generate-query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData: AuthError = await response.json();
      const error = errorData.detail?.error || errorData.error;
      const userFriendlyMessage = error?.message ? getUserFriendlyErrorMessage(error.message) : 'Failed to generate query';
      throw new ApiError(
        userFriendlyMessage,
        error?.code || response.status,
        error || errorData
      );
    }

    return response.json();
  },
};

export const authStorage = {
  setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  },

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  },

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  },

  setRefreshToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token);
    }
  },

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  async logout(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch (error) {
        console.warn('Logout API call failed:', error);
      }
    }
    this.removeToken();
  },
};