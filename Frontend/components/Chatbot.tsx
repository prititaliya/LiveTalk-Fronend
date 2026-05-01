"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, Trash2, Loader2, AlertCircle, Wrench } from "lucide-react";
import { sendChatMessage, getChatHistory, clearChatHistory, type ChatMessage } from "@/lib/chatbot";
import { Transcript } from "@/lib/transcripts";
import { logoutUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { ToolsModal } from "./ToolsModal";

interface ChatbotProps {
  transcript: Transcript;
  sessionId?: string;
}

export function Chatbot({ transcript, sessionId = "default" }: ChatbotProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    loadChatHistory();
  }, [transcript.meeting_id, sessionId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      setError(null);
      const history = await getChatHistory(transcript.meeting_id, sessionId);
      setMessages(history);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") {
          logoutUser();
          router.push("/login");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load conversation history");
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) {
      return;
    }

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);
    setError(null);
    setStreamingMessage("");
    setIsThinking(true);

    // Add user message to UI immediately
    const newUserMessage: ChatMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newUserMessage]);

    try {
      let hasReceivedChunks = false;
      let streamingContent = "";
      
      await sendChatMessage(
        transcript.meeting_id,
        userMessage,
        sessionId,
        // onChunk - stream token updates
        (chunk: string) => {
          if (!hasReceivedChunks) {
            setIsThinking(false);
            hasReceivedChunks = true;
          }
          streamingContent += chunk;
          setStreamingMessage(streamingContent);
        },
        // onComplete - final response
        (fullResponse: string) => {
          setIsThinking(false);
          // Clear streaming message first
          setStreamingMessage("");
          
          // Add final message to history (only once)
          if (fullResponse) {
            const assistantMessage: ChatMessage = {
              role: "assistant",
              content: fullResponse,
              timestamp: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
        },
        // onError
        (errorMsg: string) => {
          setIsThinking(false);
          setError(errorMsg);
          setStreamingMessage("");
        }
      );
    } catch (err) {
      setIsThinking(false);
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") {
          logoutUser();
          router.push("/login");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to send message. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear the conversation history?")) {
      return;
    }

    try {
      await clearChatHistory(transcript.meeting_id, sessionId);
      setMessages([]);
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") {
          logoutUser();
          router.push("/login");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to clear conversation history");
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[300px] max-h-[400px] p-4 bg-gray-50 dark:bg-gray-900 rounded-lg"
      >
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500 dark:text-gray-400">Loading conversation...</span>
          </div>
        ) : messages.length === 0 && !streamingMessage ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-1">
              Start a conversation about this transcript
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Ask questions, request summaries, or get information about speakers
            </p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            
            {/* Thinking animation */}
            {isThinking && !streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      Reading context...
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Streaming message */}
            {streamingMessage && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                  <p className="text-sm whitespace-pre-wrap">
                    {streamingMessage}
                    <span className="inline-block w-2 h-4 bg-blue-600 animate-pulse ml-1" />
                  </p>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Ask a question about this transcript..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading || isLoadingHistory}
        />
        <Button
          type="submit"
          disabled={isLoading || isLoadingHistory || !inputMessage.trim()}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowToolsModal(true)}
          disabled={isLoading || isLoadingHistory}
          className="flex items-center gap-2"
          title="Open tools"
        >
          <Wrench className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleClearHistory}
          disabled={isLoading || isLoadingHistory || messages.length === 0}
          className="flex items-center gap-2"
          title="Clear conversation history"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </form>

      {/* Tools Modal */}
      <ToolsModal
        isOpen={showToolsModal}
        onClose={() => setShowToolsModal(false)}
        transcriptText={transcript.transcripts
          .map((entry) => `${entry.speaker}: ${entry.text}`)
          .join("\n")}
        meetingId={transcript.meeting_id}
      />
    </div>
  );
}

