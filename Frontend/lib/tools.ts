/**
 * Tools API Service
 * 
 * Handles API calls for tool operations.
 */

import { getAuthHeaders } from "./auth";

// Normalize API URL to remove trailing slash
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export interface Tool {
  name: string;
  description: string;
  category: "transcript" | "calendar";
  parameters?: {
    [key: string]: string;
  };
}

export interface ToolsResponse {
  tools: Tool[];
  count: number;
}

export interface AddCalendarEventRequest {
  event_summary: string;
  date: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  };
  location?: string;
  reminder_before?: number;
  description?: string;
}

export interface AddCalendarEventResponse {
  success: boolean;
  message: string;
}

export interface DetectedMeeting {
  summary: string;
  date: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
  } | null;
  location: string | null;
  description: string | null;
  participants: string[] | null;
}

export interface DetectMeetingsResponse {
  meetings: DetectedMeeting[];
  error?: string;
  message?: string;
}

/**
 * Get list of available tools
 */
export async function getAvailableTools(): Promise<ToolsResponse> {
  const response = await fetch(`${API_URL}/api/tools`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to get available tools");
  }

  return response.json();
}

/**
 * Add a calendar event
 */
export async function addCalendarEvent(
  request: AddCalendarEventRequest
): Promise<AddCalendarEventResponse> {
  const response = await fetch(`${API_URL}/api/tools/calendar/add-event`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 400) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || "Invalid request");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to add calendar event");
  }

  return response.json();
}

/**
 * Detect follow-up meetings from a transcript
 */
export async function detectFollowUpMeetings(
  meetingId: string
): Promise<DetectMeetingsResponse> {
  const encodedMeetingId = encodeURIComponent(meetingId);
  
  const response = await fetch(
    `${API_URL}/api/transcripts/${encodedMeetingId}/detect-meetings`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 403) {
      throw new Error("You don't have permission to access this transcript");
    }
    if (response.status === 404) {
      throw new Error("Transcript not found");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to detect follow-up meetings");
  }

  return response.json();
}
