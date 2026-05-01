"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, MessageSquare, Calendar, Clock, FileText } from "lucide-react";
import { Transcript, deleteTranscript } from "@/lib/transcripts";
import { formatDate, calculateDuration } from "@/lib/mockTranscripts";
import { useRouter } from "next/navigation";
import { logoutUser, getUserId } from "@/lib/auth";

interface TranscriptCardProps {
  transcript: Transcript;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onChat?: (id: string) => void;
}

export function TranscriptCard({ transcript, onEdit, onDelete, onChat }: TranscriptCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Check if current user is the owner
  const currentUserId = getUserId();
  const isOwner = currentUserId && transcript.user_id && currentUserId === transcript.user_id;

  const handleView = () => {
    router.push(`/transcripts/${transcript.meeting_id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) return; // Safety check
    if (onEdit) {
      onEdit(transcript.meeting_id);
    } else {
      router.push(`/transcripts/${transcript.meeting_id}`);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOwner) return; // Safety check
    
    if (onDelete) {
      onDelete(transcript.meeting_id);
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this transcript? This action cannot be undone."
    );
    
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      await deleteTranscript(transcript.meeting_id);
      // Refresh the page to update the list
      window.location.reload();
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") {
          logoutUser();
          router.push("/login");
        } else {
          alert(`Failed to delete transcript: ${err.message}`);
        }
      } else {
        alert("Failed to delete transcript. Please try again.");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onChat) {
      onChat(transcript.meeting_id);
    } else {
      // Placeholder - will be implemented later
      router.push(`/transcripts/${transcript.meeting_id}?chat=true`);
    }
  };

  // Get preview text (first entry or first 100 chars)
  const previewText = transcript.transcripts[0]?.text || "No transcript available";
  const truncatedPreview = previewText.length > 100 
    ? previewText.substring(0, 100) + "..." 
    : previewText;

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleView}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {transcript.meeting_name}
            </h3>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(transcript.start_time)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{calculateDuration(transcript.start_time, transcript.end_time)}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{transcript.total_entries} entries</span>
              </div>
              {transcript.participant_count !== undefined && transcript.participant_count > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{transcript.participant_count} participant{transcript.participant_count !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mb-4">
          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
            {truncatedPreview}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-2"
              title="Edit transcript"
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleChat}
            className={`flex-1 flex items-center justify-center gap-2 ${!isOwner ? 'flex-1' : ''}`}
            title="Chat with transcript"
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteLoading}
              className="flex-1 flex items-center justify-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

