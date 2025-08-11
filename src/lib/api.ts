/**
 * API Configuration for binIQ Backend Integration
 * Repository: https://github.com/rj8b0000/binIQ-Backend.git
 */

export const API_CONFIG = {
  BASE_URL: (() => {
    // If we're in production or deployed environment, use the production API
    if (window.location.hostname.includes('fly.dev') ||
        window.location.hostname !== 'localhost') {
      // Note: The existing backend structure might be different
      // We'll use the current production backend URL structure
      return "https://api.biniq.net";
    }
    // Otherwise use the environment variable or localhost
    return import.meta.env.VITE_API_URL || "http://localhost:3001";
  })(),
  ENDPOINTS: {
    // Authentication
    LOGIN: "/api/users/login",
    
    // Users & Store Owners
    ALL_STORE_OWNERS: "/api/users/all-details-store-owner",
    ALL_RESELLERS: "/api/users/all-details-resellar", // Note: "resellar" as per current frontend
    DELETE_ACCOUNT: "/api/users/delete-account",
    APPROVE_STORE_OWNER: "/api/users/approve-store-owner",
    REJECT_STORE_OWNER: "/api/users/reject-store-owner",

    // Feedback
    FEEDBACK: "/api/users/feedback",
    FEEDBACK_REPLY: "/api/users/feedback/reply",

    // Subscriptions
    SUBSCRIPTIONS: "/api/subscriptions/all",

    // FAQ
    FAQS: "/api/faqs",

    // Notifications
    NOTIFICATIONS: "/api/notifications",
    
    // Stats
    STATS: {
      PAID_USERS: "/api/stats/paid-users",
      STORE_OWNERS: "/api/stats/store-owners",
      RESELLERS: "/api/stats/resellers",
      REVENUE: "/api/stats/revenue",
      QUICK_STATS: "/api/stats/quick-stats",
      RECENT_ACTIVITY: "/api/stats/recent-activity"
    }
  }
};

/**
 * Helper function to build full API URLs
 */
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

/**
 * Common API response interfaces based on backend patterns
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Common error response format
 */
export interface ApiError {
  message: string;
  error?: string;
  statusCode?: number;
}
