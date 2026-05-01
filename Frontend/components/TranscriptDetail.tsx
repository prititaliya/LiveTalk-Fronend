"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, MessageSquare, ArrowLeft, Calendar, Clock, FileText } from "lucide-react";
import { Transcript } from "@/lib/transcripts";
import { formatDate, calculateDuration } from "@/lib/mockTranscripts";
import { useRouter } from "next/navigation";
import { Chatbot } from "./Chatbot";
import { ParticipantManagement } from "./ParticipantManagement";
import { getUserId, getUserEmail } from "@/lib/auth";

interface TranscriptDetailProps {
  transcript: Transcript;
  onEdit?: () => void;
  onDelete?: () => void;
  deleteLoading?: boolean;
}

export function TranscriptDetail({ transcript, onEdit, onDelete, deleteLoading = false }: TranscriptDetailProps) {
  const router = useRouter();
  const [showChatbot, setShowChatbot] = useState(false);
  
  // Check if current user is the owner
  const currentUserId = getUserId();
  const isOwner = currentUserId && transcript.user_id && currentUserId === transcript.user_id;
  const ownerEmail = getUserEmail();

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => router.push("/transcripts")}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Transcripts
            </Button>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    {transcript.meeting_name}
                  </h1>
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
                  </div>
                </div>
                {isOwner && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={handleEdit}
                      className="flex items-center gap-2"
                      disabled={deleteLoading}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDelete}
                      className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      disabled={deleteLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleteLoading ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transcript Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              Transcript
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {transcript.transcripts.map((entry, index) => (
                <div
                  key={index}
                  className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-r transition-colors"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {entry.speaker}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(entry.timestamp)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{entry.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Participants Section */}
          {transcript.end_time && (
            <div className="mb-6">
              <ParticipantManagement 
                meetingId={transcript.meeting_id} 
                isOwner={!!isOwner}
                ownerEmail={ownerEmail || undefined}
              />
            </div>
          )}

          {/* Chatbot Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                Chat with Transcript
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowChatbot(!showChatbot)}
              >
                {showChatbot ? "Hide" : "Show"} Chatbot
              </Button>
            </div>

            {showChatbot && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <Chatbot transcript={transcript} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

