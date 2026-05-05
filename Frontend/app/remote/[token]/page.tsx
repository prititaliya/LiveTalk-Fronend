"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Play,
  Square,
  Pause,
  AlertCircle,
  CheckCircle2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/+$/, "");

type RecordingState = "idle" | "recording" | "paused" | "stopped";
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

export default function RemoteControlPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [roomName, setRoomName] = useState<string>("");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  };

  const handleWebSocketMessage = (message: any) => {
    switch (message.type) {
      case "connection_established":
        setRoomName(message.room_name || "");
        setRecordingState(message.recording_state?.state || "idle");
        break;
      case "recording_state_update":
        setRecordingState(message.state);
        if (message.state === "recording" && !timerRef.current) {
          startTimer();
        } else if (message.state !== "recording" && timerRef.current) {
          stopTimer();
        }
        break;
      case "command_response":
        if (!message.success) {
          setError(message.message);
        }
        break;
      case "error":
        setError(message.message);
        break;
    }
  };

  const connectWebSocket = () => {
    try {
      let wsUrl = API_URL.replace("http://", "ws://").replace("https://", "wss://");
      wsUrl = wsUrl.replace(/\/$/, "");
      const ws = new WebSocket(`${wsUrl}/ws/remote_user_session/${token}?device=mobile`);

      ws.onopen = () => {
        setConnectionStatus("connected");
        setError(null);
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("error");
        setError("Connection error");
      };

      ws.onclose = () => {
        setConnectionStatus("disconnected");
        if (!sessionExpired) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
          }, 3000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect");
      setConnectionStatus("error");
    }
  };

  const sendCommand = (command: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected to server");
      return;
    }

    wsRef.current.send(
      JSON.stringify({
        type: "remote_command",
        command: command,
      })
    );
  };

  const handleStart = () => {
    setError(null);
    sendCommand("start_recording");
  };

  const handleStop = () => {
    sendCommand("stop_recording");
    stopTimer();
    setElapsedTime(0);
  };

  const handlePause = () => {
    sendCommand("pause_recording");
    stopTimer();
  };

  const handleResume = () => {
    sendCommand("resume_recording");
    startTimer();
  };

  useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch(`${API_URL}/api/remote/session/${token}`);
        if (!response.ok) {
          if (response.status === 404) {
            setSessionExpired(true);
            setError("Session not found or expired");
            return;
          }
          throw new Error("Failed to validate session");
        }

        const data = await response.json();
        setRoomName(data.room_name);
        setRecordingState(data.recording_state.state || "idle");
        connectWebSocket();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to validate session");
        setConnectionStatus("error");
      }
    };

    if (token) {
      validateSession();
    }
  }, [token]);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (recordingState === "recording" && !timerRef.current) {
      startTimer();
    } else if (recordingState !== "recording" && timerRef.current) {
      stopTimer();
    }
  }, [recordingState]);

  if (sessionExpired) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Session Expired</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This remote control session has expired. Please scan a new QR code from your laptop.
          </p>
          <Button onClick={() => router.push("/")}>Go to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Remote Control</h1>
            <div className="flex items-center gap-2">
              {connectionStatus === "connected" ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {connectionStatus === "connected"
                  ? "Connected"
                  : connectionStatus === "connecting"
                    ? "Connecting..."
                    : "Disconnected"}
              </span>
            </div>
          </div>

          {roomName && (
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Room: <span className="font-semibold">{roomName}</span>
            </div>
          )}

          {recordingState === "recording" && (
            <div className="mt-4 flex items-center gap-2">
              <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-lg font-mono">{formatTime(elapsedTime)}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
          {recordingState === "idle" || recordingState === "stopped" ? (
            <Button
              onClick={handleStart}
              disabled={connectionStatus !== "connected"}
              className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
            >
              <Play className="h-6 w-6 mr-2" />
              Start Recording
            </Button>
          ) : recordingState === "recording" ? (
            <>
              <Button
                onClick={handlePause}
                disabled={connectionStatus !== "connected"}
                className="w-full h-16 text-lg bg-yellow-600 hover:bg-yellow-700"
              >
                <Pause className="h-6 w-6 mr-2" />
                Pause
              </Button>
              <Button
                onClick={handleStop}
                disabled={connectionStatus !== "connected"}
                className="w-full h-16 text-lg bg-red-600 hover:bg-red-700"
              >
                <Square className="h-6 w-6 mr-2" />
                Stop Recording
              </Button>
            </>
          ) : recordingState === "paused" ? (
            <>
              <Button
                onClick={handleResume}
                disabled={connectionStatus !== "connected"}
                className="w-full h-16 text-lg bg-green-600 hover:bg-green-700"
              >
                <Play className="h-6 w-6 mr-2" />
                Resume Recording
              </Button>
              <Button
                onClick={handleStop}
                disabled={connectionStatus !== "connected"}
                className="w-full h-16 text-lg bg-red-600 hover:bg-red-700"
              >
                <Square className="h-6 w-6 mr-2" />
                Stop Recording
              </Button>
            </>
          ) : null}

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              {connectionStatus === "connected" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Synced with laptop</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <span>Not synced</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}