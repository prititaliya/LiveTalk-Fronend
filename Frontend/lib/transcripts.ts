/**
 * Transcript API Service
 * 
 * Handles API calls for transcript operations.
 */

import { getAuthHeaders } from "./auth";

// Normalize API URL to remove trailing slash
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
  is_final: boolean;
}

export interface Transcript {
  meeting_id: string;
  meeting_name: string;
  room_name: string;
  start_time: string;
  end_time?: string | null;
  transcripts: TranscriptEntry[];
  total_entries: number;
  created_at: string;
  user_id?: string | null;
  participant_count?: number;
  live_participants?: string[];
}

export interface GetTranscriptsResponse {
  transcripts: Transcript[];
  count: number;
}

/**
 * Get all transcripts for the authenticated user
 */
export async function getUserTranscripts(): Promise<Transcript[]> {
  const response = await fetch(`${API_URL}/api/transcripts`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - token expired or invalid
      throw new Error("UNAUTHORIZED");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to fetch transcripts");
  }

  const data: GetTranscriptsResponse = await response.json();
  return data.transcripts;
}

/**
 * Get a single transcript by meeting ID
 * For now, fetches all and filters (can be optimized with a dedicated endpoint later)
 */
export async function getTranscriptById(meetingId: string): Promise<Transcript | null> {
  try {
    const transcripts = await getUserTranscripts();
    return transcripts.find((t) => t.meeting_id === meetingId) || null;
  } catch (error) {
    throw error;
  }
}

export interface UpdateTranscriptRequest {
  meeting_name?: string;
  transcripts?: TranscriptEntry[];
}

export interface RenameSpeakerRequest {
  old_speaker: string;
  new_speaker: string;
}

/**
 * Delete a transcript
 */
export async function deleteTranscript(meetingId: string): Promise<void> {
  // URL encode the meeting_id to handle special characters
  const encodedMeetingId = encodeURIComponent(meetingId);
  const response = await fetch(`${API_URL}/api/transcripts/${encodedMeetingId}`, {
    method: "DELETE",
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
      throw new Error("You don't have permission to delete this transcript");
    }
    if (response.status === 404) {
      throw new Error("Transcript not found");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to delete transcript");
  }
}

/**
 * Update a transcript
 */
export async function updateTranscript(
  meetingId: string,
  data: UpdateTranscriptRequest
): Promise<Transcript> {
  // URL encode the meeting_id to handle special characters
  const encodedMeetingId = encodeURIComponent(meetingId);
  const response = await fetch(`${API_URL}/api/transcripts/${encodedMeetingId}`, {
    method: "PUT",
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
      throw new Error("You don't have permission to modify this transcript");
    }
    if (response.status === 404) {
      throw new Error("Transcript not found");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to update transcript");
  }

  const transcript: Transcript = await response.json();
  return transcript;
}

/**
 * Rename a speaker across all entries in a transcript
 */
export async function renameSpeaker(
  meetingId: string,
  oldSpeaker: string,
  newSpeaker: string
): Promise<Transcript> {
  // URL encode the meeting_id to handle special characters
  const encodedMeetingId = encodeURIComponent(meetingId);
  const response = await fetch(`${API_URL}/api/transcripts/${encodedMeetingId}/speaker`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      old_speaker: oldSpeaker,
      new_speaker: newSpeaker,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("UNAUTHORIZED");
    }
    if (response.status === 403) {
      throw new Error("You don't have permission to modify this transcript");
    }
    if (response.status === 404) {
      throw new Error("Transcript not found");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to rename speaker");
  }

  const transcript: Transcript = await response.json();
  return transcript;
}

