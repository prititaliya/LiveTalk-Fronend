import { Room, RoomEvent, Track, LocalAudioTrack, createLocalAudioTrack } from "livekit-client";

// Normalize API URL to remove trailing slash
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");
const LIVEKIT_URL = process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

export interface TokenResponse {
  token: string;
  url: string;
}

export interface RoomConnection {
  room: Room;
  audioTrack: LocalAudioTrack | null;
}

/**
 * Request a LiveKit access token from the backend API
 */
export async function requestToken(
  roomName: string,
  participantName: string
): Promise<TokenResponse> {
  try {
    const response = await fetch(`${API_URL}/api/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        room_name: roomName,
        participant_name: participantName,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `Failed to get token: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Failed to request token: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate a unique room name
 */
export function generateRoomName(): string {
  const timestamp = Date.now();
  return `recording-${timestamp}`;
}

/**
 * Connect to a LiveKit room and publish audio track
 */
export async function connectToRoom(
  token: string,
  url: string,
  onConnected?: (room: Room) => void,
  onDisconnected?: () => void,
  onError?: (error: Error) => void
): Promise<RoomConnection> {
  const room = new Room();

  // Set up event handlers
  room.on(RoomEvent.Connected, () => {
    console.log("Connected to LiveKit room");
    onConnected?.(room);
  });

  room.on(RoomEvent.Disconnected, () => {
    console.log("Disconnected from LiveKit room");
    onDisconnected?.();
  });

  room.on(RoomEvent.TrackPublished, (publication, participant) => {
    console.log("Track published:", publication.trackSid, "by", participant.identity);
  });

  room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
    console.log("Track subscribed:", track.kind, "from", participant.identity);
  });

  // Handle errors
  room.on(RoomEvent.ConnectionQualityChanged, (quality, participant) => {
    console.log("Connection quality changed:", quality, participant?.identity);
  });

  try {
    // Connect to room
    await room.connect(url, token);
    console.log("Room connected successfully");

    // Get user media (microphone)
    let audioTrack: LocalAudioTrack | null = null;
    try {
      audioTrack = await createLocalAudioTrack({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      });

      // Publish audio track to room
      await room.localParticipant.publishTrack(audioTrack, {
        source: Track.Source.Microphone,
      });

      console.log("Audio track published successfully");
    } catch (mediaError) {
      console.error("Failed to get microphone access:", mediaError);
      throw new Error(
        `Microphone access denied or unavailable: ${
          mediaError instanceof Error ? mediaError.message : String(mediaError)
        }`
      );
    }

    return { room, audioTrack };
  } catch (error) {
    // Clean up on error
    if (room.state === "connected") {
      await room.disconnect();
    }
    const errorMessage =
      error instanceof Error ? error.message : `Failed to connect: ${String(error)}`;
    onError?.(new Error(errorMessage));
    throw new Error(errorMessage);
  }
}

/**
 * Disconnect from LiveKit room and clean up resources
 */
export async function disconnectFromRoom(connection: RoomConnection | null): Promise<void> {
  if (!connection) return;

  try {
    // Stop and unpublish audio track
    if (connection.audioTrack) {
      connection.audioTrack.stop();
      connection.audioTrack.detach();
      await connection.room.localParticipant.unpublishTrack(connection.audioTrack);
    }

    // Disconnect from room
    await connection.room.disconnect();
    console.log("Disconnected from room and cleaned up resources");
  } catch (error) {
    console.error("Error during disconnect:", error);
    // Try to force disconnect even if cleanup fails
    try {
      await connection.room.disconnect();
    } catch (e) {
      console.error("Force disconnect also failed:", e);
    }
  }
}

/**
 * Check if microphone permissions are available
 */
export async function checkMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately as we're just checking permissions
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Request microphone permission
 */
export async function requestMicrophonePermission(): Promise<MediaStream> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        throw new Error("Microphone permission denied. Please allow microphone access.");
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        throw new Error("No microphone found. Please connect a microphone.");
      }
    }
    throw new Error(
      `Failed to access microphone: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

