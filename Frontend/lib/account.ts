/**
 * Account API Service
 * 
 * Handles user account operations (fetching user info, updating email, username, password).
 */

import { getAuthHeaders } from "./auth";

// Normalize API URL to remove trailing slash
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export interface UserInfo {
  user_id: string;
  email: string;
  username: string;
  email_verified: boolean;
  created_at: string;
}

export interface VerifyEmailRequest {
  otp: string;
}

export interface VerifyEmailResponse {
  user_id: string;
  email: string;
  username: string;
  email_verified: boolean;
  created_at: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<UserInfo> {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to fetch user information");
  }

  return response.json();
}

/**
 * Update user email
 */
export async function updateEmail(newEmail: string): Promise<UserInfo> {
  const response = await fetch(`${API_URL}/api/auth/me/email`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ new_email: newEmail }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to update email");
  }

  return response.json();
}

/**
 * Update user username
 */
export async function updateUsername(newUsername: string): Promise<UserInfo> {
  const response = await fetch(`${API_URL}/api/auth/me/username`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ new_username: newUsername }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to update username");
  }

  return response.json();
}

/**
 * Update user password
 */
export async function updatePassword(currentPassword: string, newPassword: string): Promise<UserInfo> {
  const response = await fetch(`${API_URL}/api/auth/me/password`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to update password");
  }

  return response.json();
}

/**
 * Verify email with OTP code
 */
export async function verifyEmail(otp: string): Promise<VerifyEmailResponse> {
  const response = await fetch(`${API_URL}/api/auth/verify-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ otp }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to verify email");
  }

  return response.json();
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(): Promise<ResendVerificationResponse> {
  const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to resend verification email");
  }

  return response.json();
}

