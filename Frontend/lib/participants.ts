/**
 * Participants API Service
 * 
 * Handles API calls for participant management operations.
 */

import { getAuthHeaders } from "./auth";

// Normalize API URL to remove trailing slash
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export interface Participant {
  user_id: string;
  email: string;
  meeting_id: string;
  role: "viewer" | "collaborator";
  permissions: {
    can_view_transcript: boolean;
    can_use_chatbot: boolean;
    can_view_summaries: boolean;
    can_annotate: boolean;
    can_comment: boolean;
  };
  added_at: string;
  added_by: string;
  notifications_enabled: boolean;
  last_accessed: string | null;
}

export interface ParticipantListResponse {
  participants: Participant[];
  count: number;
}

export interface AddParticipantRequest {
  email: string;
  role: "viewer" | "collaborator";
  permissions?: Record<string, boolean>;
}

export interface AddParticipantResponse {
  success: boolean;
  participant: Participant;
  message: string;
}

export interface UpdateParticipantPermissionsRequest {
  permissions: Record<string, boolean>;
}

export interface UpdateParticipantPermissionsResponse {
  success: boolean;
  participant: Participant;
  message: string;
}

export interface Analytics {
  access_count: number;
  chatbot_uses: number;
  transcript_views: number;
  last_accessed: string | null;
}

export interface MeetingAnalytics {
  meeting_id: string;
  analytics: Record<string, Analytics>;
  participant_count: number;
}

/**
 * Get all participants for a meeting
 */
export async function getMeetingParticipants(meetingId: string): Promise<Participant[]> {
  const encodedMeetingId = encodeURIComponent(meetingId);
  const response = await fetch(`${API_URL}/api/transcripts/${encodedMeetingId}/participants`, {
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
    if (response.status === 403) {
      throw new Error("You don't have permission to view participants");
    }
    if (response.status === 404) {
      throw new Error("Meeting not found");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to fetch participants");
  }

  const data: ParticipantListResponse = await response.json();
  return data.participants;
}

/**
 * Add a participant to a meeting
 */
export async function addParticipant(
  meetingId: string,
  data: AddParticipantRequest
): Promise<Participant> {
  const encodedMeetingId = encodeURIComponent(meetingId);
  const response = await fetch(`${API_URL}/api/transcripts/${encodedMeetingId}/participants`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 403) {
      throw new Error("You don't have permission to add participants");
    }
    if (response.status === 404) {
      throw new Error("Meeting not found");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to add participant");
  }

  const result: AddParticipantResponse = await response.json();
  return result.participant;
}

/**
 * Remove a participant from a meeting
 */
export async function removeParticipant(meetingId: string, userId: string): Promise<void> {
  const encodedMeetingId = encodeURIComponent(meetingId);
  const encodedUserId = encodeURIComponent(userId);
  const response = await fetch(
    `${API_URL}/api/transcripts/${encodedMeetingId}/participants/${encodedUserId}`,
    {
      method: "DELETE",
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
      throw new Error("You don't have permission to remove participants");
    }
    if (response.status === 404) {
      throw new Error("Participant not found");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to remove participant");
  }
}

/**
 * Update participant permissions
 */
export async function updateParticipantPermissions(
  meetingId: string,
  userId: string,
  data: UpdateParticipantPermissionsRequest
): Promise<Participant> {
  const encodedMeetingId = encodeURIComponent(meetingId);
  const encodedUserId = encodeURIComponent(userId);
  const response = await fetch(
    `${API_URL}/api/transcripts/${encodedMeetingId}/participants/${encodedUserId}/permissions`,
    {
      method: "PATCH",
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 403) {
      throw new Error("You don't have permission to update permissions");
    }
    if (response.status === 404) {
      throw new Error("Participant not found");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to update permissions");
  }

  const result: UpdateParticipantPermissionsResponse = await response.json();
  return result.participant;
}

/**
 * Get participant details
 */
export async function getParticipant(meetingId: string, userId: string): Promise<Participant> {
  const encodedMeetingId = encodeURIComponent(meetingId);
  const encodedUserId = encodeURIComponent(userId);
  const response = await fetch(
    `${API_URL}/api/transcripts/${encodedMeetingId}/participants/${encodedUserId}`,
    {
      method: "GET",
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
      throw new Error("You don't have permission to view this participant");
    }
    if (response.status === 404) {
      throw new Error("Participant not found");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to fetch participant");
  }

  const participant: Participant = await response.json();
  return participant;
}

/**
 * Get meeting analytics (owner only)
 */
export async function getMeetingAnalytics(meetingId: string): Promise<MeetingAnalytics> {
  const encodedMeetingId = encodeURIComponent(meetingId);
  const response = await fetch(`${API_URL}/api/transcripts/${encodedMeetingId}/analytics`, {
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
    if (response.status === 403) {
      throw new Error("You don't have permission to view analytics");
    }
    if (response.status === 404) {
      throw new Error("Meeting not found");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to fetch analytics");
  }

  const analytics: MeetingAnalytics = await response.json();
  return analytics;
}

