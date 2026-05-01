"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { TranscriptDetail } from "@/components/TranscriptDetail";
import { EditTranscriptModal } from "@/components/EditTranscriptModal";
import { getTranscriptById, deleteTranscript, type Transcript } from "@/lib/transcripts";
import { isAuthenticated, logoutUser, getUserId } from "@/lib/auth";

export default function TranscriptDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const auth = isAuthenticated();
    setAuthenticated(auth);

    if (auth && params.id) {
      // Fetch transcript from API
      fetchTranscript();
    } else {
      setLoading(false);
    }
  }, [params.id]);

  const fetchTranscript = async () => {
    try {
      setLoading(true);
      setError(null);
      const meetingId = params.id as string;
      const data = await getTranscriptById(meetingId);
      setTranscript(data);
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
        setError("Failed to load transcript. Please try again.");
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

  if (error && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Error Loading Transcript
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={fetchTranscript}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
            <button
              onClick={() => router.push("/transcripts")}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back to Transcripts
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!transcript && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Transcript Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The transcript you're looking for doesn't exist.
          </p>
          <button
            onClick={() => router.push("/transcripts")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Transcripts
          </button>
        </div>
      </div>
    );
  }

  // Check if current user is the owner
  const currentUserId = getUserId();
  const isOwner = transcript && currentUserId && transcript.user_id && currentUserId === transcript.user_id;

  const handleEdit = () => {
    if (!isOwner) return; // Safety check
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!transcript || !isOwner) return; // Safety check
    
    const confirmed = window.confirm(
      "Are you sure you want to delete this transcript? This action cannot be undone."
    );
    
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      await deleteTranscript(transcript.meeting_id);
      // Redirect to transcripts list
      router.push("/transcripts");
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") {
          logoutUser();
          router.push("/login");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to delete transcript. Please try again.");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSave = (updatedTranscript: Transcript) => {
    setTranscript(updatedTranscript);
    setIsEditModalOpen(false);
  };

  return (
    <>
      <TranscriptDetail
        transcript={transcript}
        onEdit={isOwner ? handleEdit : undefined}
        onDelete={isOwner ? handleDelete : undefined}
        deleteLoading={deleteLoading}
      />
      {transcript && isOwner && (
        <EditTranscriptModal
          transcript={transcript}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}

