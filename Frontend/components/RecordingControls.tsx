"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, Square, AlertCircle, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  requestToken,
  generateRoomName,
  connectToRoom,
  disconnectFromRoom,
  requestMicrophonePermission,
  type RoomConnection,
} from "@/lib/livekit";
import { getAuthHeaders, isAuthenticated } from "@/lib/auth";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
  is_final: boolean;
}

export function RecordingControls() {
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptEntry[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [mobileConnected, setMobileConnected] = useState(false);

  const connectionRef = useRef<RoomConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const remoteWsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const cleanupRemoteWebSocket = () => {
    if (remoteWsRef.current) {
      remoteWsRef.current.close();
      remoteWsRef.current = null;
    }
    setMobileConnected(false);
  };

  const connectRemoteWebSocket = (token: string) => {
    try {
      const wsUrl = API_URL.replace(/^http(s?):\/\//, "ws$1://").replace(/\/$/, "");
      const ws = new WebSocket(`${wsUrl}/ws/remote/${token}?device=laptop`);

      ws.onopen = () => {
        console.log("Remote control WebSocket connected");
        setMobileConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "recording_state_update") {
            console.log("State update from mobile:", message.state);
          } else if (message.type === "connection_established") {
            setMobileConnected(true);
          }
        } catch (e) {
          console.error("Error parsing remote WebSocket message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("Remote WebSocket error:", err);
      };

      ws.onclose = () => {
        console.log("Remote WebSocket disconnected");
        setMobileConnected(false);
      };

      remoteWsRef.current = ws;
    } catch (err) {
      console.error("Failed to connect remote WebSocket:", err);
    }
  };

  const handleGenerateRemoteSession = async () => {
    try {
      if (!isAuthenticated()) {
        setError("Please log in to use remote recording");
        return;
      }

      const newRoomName = generateRoomName();
      setRoomName(newRoomName);

      const response = await fetch(`${API_URL}/api/remote/generate-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          room_name: newRoomName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || "Failed to generate remote session");
      }

      const data = await response.json();
      setQrCodeData(data.qr_code_data);
      setSessionToken(data.session_token);
      setShowQRModal(true);

      connectRemoteWebSocket(data.session_token);
    } catch (err) {
      console.error("Error generating remote session:", err);
      setError(err instanceof Error ? err.message : "Failed to generate remote session");
    }
  };

  const connectWebSocket = (room: string) => {
    try {
      const wsUrl = API_URL.replace(/^http(s?):\/\//, "ws$1://").replace(/\/$/, "");
      const ws = new WebSocket(`${wsUrl}/ws/transcripts/${room}`);

      ws.onopen = () => {
        console.log("WebSocket connected for transcripts");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === "initial_data") {
            setTranscripts(data.data.transcripts || []);
          } else if (data.type === "transcript_update") {
            setTranscripts((prev) => [...prev, data.data]);
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message:", e);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
      };

      wsRef.current = ws;
    } catch (err) {
      console.error("Failed to connect WebSocket:", err);
    }
  };

  const handleStart = async () => {
    try {
      setError(null);
      setSuccessMessage(null);
      setIsConnecting(true);

      await requestMicrophonePermission();

      const newRoomName = generateRoomName();
      setRoomName(newRoomName);

      const { token, url } = await requestToken(newRoomName, "user");

      const connection = await connectToRoom(
        token,
        url,
        (room) => {
          console.log("Connected to room:", room.name);
          setIsRecording(true);
          setIsConnecting(false);
          setElapsedTime(0);

          timerRef.current = setInterval(() => {
            setElapsedTime((prev) => prev + 1);
          }, 1000);

          connectWebSocket(newRoomName);
        },
        () => {
          console.log("Disconnected from room");
          handleStop();
        },
        (err) => {
          console.error("Connection error:", err);
          setError(err.message);
          setIsConnecting(false);
        }
      );

      connectionRef.current = connection;
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError(err instanceof Error ? err.message : "Failed to start recording");
      setIsConnecting(false);
      setIsRecording(false);
    }
  };

  const handleStop = async () => {
    try {
      setIsRecording(false);
      setIsConnecting(false);
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      if (connectionRef.current) {
        await disconnectFromRoom(connectionRef.current);
        connectionRef.current = null;
      }

      const currentRoomName = roomName;
      if (currentRoomName) {
        try {
          if (!isAuthenticated()) {
            setError("Please log in to save transcripts");
            return;
          }

          const response = await fetch(`${API_URL}/api/transcripts/save`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            body: JSON.stringify({
              room_name: currentRoomName,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || `Failed to save transcript: ${response.statusText}`);
          }

          const data = await response.json();
          if (data.success) {
            setSuccessMessage(`Transcript saved successfully! Meeting ID: ${data.meeting_id}`);
            setTranscripts([]);
          } else {
            throw new Error(data.message || "Failed to save transcript");
          }
        } catch (saveError) {
          console.error("Error saving transcript:", saveError);
          setError(saveError instanceof Error ? saveError.message : "Failed to save transcript to database");
        }
      }

      setRoomName(null);
    } catch (err) {
      console.error("Error stopping recording:", err);
      setError(err instanceof Error ? err.message : "Failed to stop recording");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      cleanupRemoteWebSocket();
      if (connectionRef.current) {
        disconnectFromRoom(connectionRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      {error && (
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-2 rounded-lg">
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      <div className="relative">
        {isRecording && <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />}
        <div
          className={`relative flex h-32 w-32 items-center justify-center rounded-full transition-colors ${
            isRecording ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
          }`}
        >
          {isRecording ? <Square className="h-12 w-12" /> : <Mic className="h-12 w-12" />}
        </div>
      </div>

      <div className="text-center">
        <div className="text-4xl font-mono font-bold mb-2">{formatTime(elapsedTime)}</div>
        <p className="text-sm text-muted-foreground">
          {isConnecting
            ? "Connecting..."
            : isSaving
            ? "Saving transcript..."
            : isRecording
            ? "Recording in progress..."
            : "Ready to record"}
        </p>
        {roomName && <p className="text-xs text-muted-foreground mt-1">Room: {roomName}</p>}
      </div>

      <div className="flex flex-col gap-4 items-center">
        <div className="flex gap-4">
          {!isRecording ? (
            <Button size="lg" onClick={handleStart} disabled={isConnecting} className="px-8 py-6 text-lg">
              <Mic className="mr-2 h-5 w-5" />
              {isConnecting ? "Connecting..." : "Start Recording"}
            </Button>
          ) : (
            <Button size="lg" variant="destructive" onClick={handleStop} disabled={isSaving} className="px-8 py-6 text-lg">
              <Square className="mr-2 h-5 w-5" />
              {isSaving ? "Saving..." : "Stop Recording"}
            </Button>
          )}
        </div>

        {!isRecording && (
          <Button
            variant="outline"
            onClick={handleGenerateRemoteSession}
            disabled={isConnecting || !isAuthenticated()}
            className="px-6 py-3"
          >
            <QrCode className="mr-2 h-4 w-4" />
            Record Remotely
          </Button>
        )}

        {mobileConnected && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Mobile connected</span>
          </div>
        )}
      </div>

      {showQRModal && qrCodeData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Scan QR Code</h2>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setShowQRModal(false);
                  cleanupRemoteWebSocket();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Scan this QR code with your mobile device to control recording remotely
            </p>
            <div className="flex justify-center mb-4">
              <img src={qrCodeData} alt="QR Code" className="w-64 h-64" />
            </div>
            {mobileConnected && (
              <div className="text-center text-sm text-green-600 dark:text-green-400">
                Mobile device connected
              </div>
            )}
          </div>
        </div>
      )}

      {transcripts.length > 0 && (
        <div className="w-full max-w-2xl mt-8">
          <h3 className="text-lg font-semibold mb-4">Live Transcript</h3>
          <div className="bg-card border rounded-lg p-4 max-h-64 overflow-y-auto">
            {transcripts.map((entry, index) => (
              <div key={index} className="mb-2 last:mb-0">
                <span className="font-semibold text-primary">{entry.speaker}:</span>{" "}
                <span>{entry.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}