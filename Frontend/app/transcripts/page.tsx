"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TranscriptCard } from "@/components/TranscriptCard";
import { getUserTranscripts, type Transcript } from "@/lib/transcripts";
import { isAuthenticated, logoutUser } from "@/lib/auth";
import { FileText, AlertCircle } from "lucide-react";

export default function TranscriptsPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    const auth = isAuthenticated();
    setAuthenticated(auth);

    if (auth) {
      // Fetch transcripts from API
      fetchTranscripts();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchTranscripts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserTranscripts();
      setTranscripts(data);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") {
          // Token expired or invalid - logout and redirect
          logoutUser();
          setAuthenticated(false);
          router.push("/login");
          return;
        }
        setError(err.message);
      } else {
        setError("Failed to load transcripts. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (mounted && !authenticated) {
      router.push("/login");
    }
  }, [mounted, authenticated, router]);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  My Transcripts
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View and manage all your recorded transcripts
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                New Recording
              </Button>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                    Error Loading Transcripts
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchTranscripts}
                  className="text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Transcripts Grid */}
          {!error && transcripts.length === 0 && !loading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
              <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                No Transcripts Yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start recording a meeting to create your first transcript.
              </p>
              <Button onClick={() => router.push("/")}>
                Start Recording
              </Button>
            </div>
          ) : (
            !error && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {transcripts.map((transcript) => (
                  <TranscriptCard
                    key={transcript.meeting_id}
                    transcript={transcript}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

