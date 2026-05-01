/**
 * Authentication utilities
 * 
 * Handles user authentication, token storage, and API calls.
 */

// Normalize API URL to remove trailing slash
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface RegisterResponse {
  user_id: string;
  email: string;
  username: string;
  email_verified: boolean;
  created_at: string;
}

export interface LoginRequest {
  email_or_username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  username: string;
  email_verified?: boolean;
}

/**
 * Register a new user
 */
export async function registerUser(data: RegisterRequest): Promise<RegisterResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    // Handle network errors (CORS, connection issues, etc.)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Failed to connect to API. Please check:\n` +
        `1. API URL is correct: ${API_URL}\n` +
        `2. Backend server is running\n` +
        `3. CORS is configured to allow this origin`
      );
    }
    throw error;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Registration failed");
  }

  return response.json();
}

/**
 * Login user and store token
 */
export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    // Handle network errors (CORS, connection issues, etc.)
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Failed to connect to API. Please check:\n` +
        `1. API URL is correct: ${API_URL}\n` +
        `2. Backend server is running\n` +
        `3. CORS is configured to allow this origin`
      );
    }
    throw error;
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Login failed");
  }

  const result = await response.json();
  
  // Store token in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", result.access_token);
    localStorage.setItem("user_id", result.user_id);
    localStorage.setItem("user_email", result.email);
    localStorage.setItem("user_username", result.username);
  }

  return result;
}

/**
 * Get stored authentication token
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("auth_token");
}

/**
 * Get stored user ID
 */
export function getUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("user_id");
}

/**
 * Get stored user email
 */
export function getUserEmail(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("user_email");
}

/**
 * Get stored user username
 */
export function getUserUsername(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("user_username");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

/**
 * Logout user (clear stored data)
 */
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_email");
    localStorage.removeItem("user_username");
  }
}

/**
 * Logout user (alias for logout)
 */
export function logoutUser(): void {
  logout();
}

/**
 * Get authorization header for API requests
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

