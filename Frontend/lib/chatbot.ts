/**
 * Chatbot API Service
 * 
 * Handles API calls for chatbot operations with streaming support.
 */

import { getAuthHeaders } from "./auth";

// Normalize API URL to remove trailing slash
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  meeting_id: string;
}

/**
 * Send a chat message and stream the response
 */
export async function sendChatMessage(
  meetingId: string,
  message: string,
  sessionId: string = "default",
  onChunk: (chunk: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: string) => void
): Promise<void> {
  const encodedMeetingId = encodeURIComponent(meetingId);
  
  try {
    const response = await fetch(
      `${API_URL}/api/transcripts/${encodedMeetingId}/chat`,
      {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          session_id: sessionId,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("UNAUTHORIZED");
      }
      if (response.status === 403) {
        throw new Error("You don't have permission to chat about this transcript");
      }
      if (response.status === 404) {
        throw new Error("Transcript not found");
      }
      
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || "Failed to send message");
    }

    // Handle Server-Sent Events (SSE) streaming
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    let buffer = "";
    let fullResponse = "";

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === "chunk") {
              fullResponse += data.content;
              onChunk(data.content);
            } else if (data.type === "done") {
              // Use accumulated fullResponse instead of data.content to avoid duplicates
              onComplete(fullResponse);
            } else if (data.type === "error") {
              onError(data.content);
              return;
            }
          } catch (e) {
            console.error("Error parsing SSE data:", e);
          }
        }
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      onError(error.message);
    } else {
      onError("Failed to send message. Please try again.");
    }
  }
}

/**
 * Get conversation history
 */
export async function getChatHistory(
  meetingId: string,
  sessionId: string = "default"
): Promise<ChatMessage[]> {
  const encodedMeetingId = encodeURIComponent(meetingId);
  
  const response = await fetch(
    `${API_URL}/api/transcripts/${encodedMeetingId}/chat/history?session_id=${encodeURIComponent(sessionId)}`,
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
      throw new Error("You don't have permission to access this conversation");
    }
    if (response.status === 404) {
      throw new Error("Transcript not found");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to get chat history");
  }

  const data: ChatHistoryResponse = await response.json();
  return data.messages;
}

/**
 * Clear conversation history
 */
export async function clearChatHistory(
  meetingId: string,
  sessionId: string = "default"
): Promise<void> {
  const encodedMeetingId = encodeURIComponent(meetingId);
  
  const response = await fetch(
    `${API_URL}/api/transcripts/${encodedMeetingId}/chat/history?session_id=${encodeURIComponent(sessionId)}`,
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
      throw new Error("You don't have permission to clear this conversation");
    }
    if (response.status === 404) {
      throw new Error("Transcript not found");
    }
    
    const error = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(error.detail || "Failed to clear chat history");
  }
}

