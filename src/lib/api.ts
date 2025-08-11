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

    // Scans Management
    SCANS: "/api/scans",
    SCAN_BY_ID: "/api/scans/:id",
    SCAN_UPDATE: "/api/scans/:id",
    SCAN_APPROVE_REJECT: "/api/scans/:id/status",
    SCAN_EXPORT: "/api/scans/export",
    SCAN_AUDIT: "/api/scans/:id/audit",

    // Store Content Moderation
    STORE_CONTENT: "/api/stores/:id/content",
    STORE_CONTENT_APPROVE: "/api/stores/:id/content/approve",
    STORE_CONTENT_ROLLBACK: "/api/stores/:id/content/rollback",
    STORE_ANALYTICS: "/api/stores/:id/analytics",

    // Analytics & Trends
    ANALYTICS: {
      USER_GROWTH: "/api/analytics/user-growth",
      STORE_RESELLER_TRENDS: "/api/analytics/trends",
      REVENUE_BREAKDOWN: "/api/analytics/revenue-breakdown",
      SENTIMENT_TRENDS: "/api/analytics/sentiment",
      GOALS_PROGRESS: "/api/analytics/goals"
    },

    // Reseller Performance
    RESELLER_PERFORMANCE: "/api/resellers/:id/performance",
    RESELLER_RESOURCES: "/api/resellers/resources",

    // Feedback Analytics
    FEEDBACK_STATS: "/api/feedback/stats",
    FEEDBACK_SENTIMENT: "/api/feedback/sentiment",

    // Locations
    LOCATIONS: "/api/locations",
    LOCATIONS_VERIFICATION: "/api/locations/verification",

    // Trending
    TRENDING: "/api/trending",

    // Partnership Subscriptions
    PARTNERSHIP_SUBSCRIPTIONS: "/api/partnership-subscriptions",
    ASSIGN_PARTNERSHIP_PLAN: "/api/partnership-subscriptions/assign",

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
