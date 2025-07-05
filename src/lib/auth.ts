interface UserDetails {
  _id: string;
  full_name: string;
  store_name: string | null;
  email: string;
  role: number;
  dob: string | null;
  gender: string | null;
  phone_number: string | null;
  address: string | null;
  expertise_level: string | null;
  profile_image: string | null;
  subscription: string;
  subscription_start: string | null;
  subscription_end: string | null;
  card_information: {
    card_number: string | null;
    cardholder_name: string | null;
    expiry_month: string | null;
    expiry_year: string | null;
    cvc: string | null;
    _id: string;
  };
  created_at: string;
  updated_at: string;
  __v: number;
}

interface LoginResponse {
  token: string;
  user_details: UserDetails;
}

interface LoginRequest {
  email: string;
  password: string;
}

export class AuthService {
  private static readonly TOKEN_KEY = "biniq_admin_token";
  private static readonly USER_KEY = "biniq_admin_user";
  private static readonly API_BASE_URL =
    "https://bin-iq-backend.vercel.app/api";

  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Login failed");
      }

      const data: LoginResponse = await response.json();

      // Save token and user details to localStorage
      this.setToken(data.token);
      this.setUser(data.user_details);

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setUser(user: UserDetails): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  static getUser(): UserDetails | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  static logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      return false;
    }

    // Check if token is expired
    if (this.isTokenExpired(token)) {
      this.logout();
      return false;
    }

    return true;
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  static getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }

  static async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    const headers = {
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // If unauthorized, logout and redirect
    if (response.status === 401) {
      this.logout();
      window.location.href = "/login";
    }

    return response;
  }
}

export type { UserDetails, LoginResponse, LoginRequest };
