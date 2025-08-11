/**
 * API Configuration for binIQ Backend Integration
 * Repository: https://github.com/rj8b0000/binIQ-Backend.git
 */

export const API_CONFIG = {
  BASE_URL: (() => {
    // If we're in production or deployed environment, use the production API
    if (window.location.hostname.includes('fly.dev') ||
        window.location.hostname !== 'localhost') {
      return "https://bin-iq-backend.vercel.app/api";
    }
    // Otherwise use the environment variable or localhost
    return import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  })(),
  ENDPOINTS: {
    // Authentication
    LOGIN: "/users/login",
    
    // Users & Store Owners
    ALL_STORE_OWNERS: "/users/all-details-store-owner",
    ALL_RESELLERS: "/users/all-details-resellar", // Note: "resellar" as per current frontend
    DELETE_ACCOUNT: "/users/delete-account",
    APPROVE_STORE_OWNER: "/users/approve-store-owner",
    REJECT_STORE_OWNER: "/users/reject-store-owner",
    
    // Feedback
    FEEDBACK: "/users/feedback",
    FEEDBACK_REPLY: "/users/feedback/reply",
    
    // Subscriptions
    SUBSCRIPTIONS: "/subscriptions/all",
    
    // FAQ
    FAQS: "/faqs",
    
    // Notifications
    NOTIFICATIONS: "/notifications",
    
    // Stats
    STATS: {
      PAID_USERS: "/stats/paid-users",
      STORE_OWNERS: "/stats/store-owners", 
      RESELLERS: "/stats/resellers",
      REVENUE: "/stats/revenue",
      QUICK_STATS: "/stats/quick-stats",
      RECENT_ACTIVITY: "/stats/recent-activity"
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
