"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Settings, 
  X, 
  Mail, 
  Calendar,
  Shield,
  Eye,
  MessageSquare,
  FileText,
  Edit,
  XCircle
} from "lucide-react";
import { 
  getMeetingParticipants, 
  addParticipant, 
  removeParticipant,
  type Participant 
} from "@/lib/participants";
import { AddParticipantModal } from "./AddParticipantModal";
import { getUserId } from "@/lib/auth";

interface ParticipantManagementProps {
  meetingId: string;
  isOwner: boolean;
  ownerEmail?: string;
}

export function ParticipantManagement({ meetingId, isOwner, ownerEmail }: ParticipantManagementProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (expanded) {
      fetchParticipants();
    }
  }, [expanded, meetingId]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMeetingParticipants(meetingId);
      setParticipants(data);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") {
          setError("Authentication required");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load participants");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async (email: string, role: "viewer" | "collaborator") => {
    try {
      const newParticipant = await addParticipant(meetingId, { email, role });
      setParticipants([...participants, newParticipant]);
      setShowAddModal(false);
    } catch (err) {
      if (err instanceof Error) {
        throw err; // Let the modal handle the error
      }
      throw new Error("Failed to add participant");
    }
  };

  const handleRemoveParticipant = async (userId: string) => {
    if (!window.confirm("Are you sure you want to remove this participant?")) {
      return;
    }

    try {
      await removeParticipant(meetingId, userId);
      setParticipants(participants.filter(p => p.user_id !== userId));
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to remove participant");
      }
    }
  };

  const currentUserId = getUserId();
  const isCurrentUserOwner = isOwner && currentUserId;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Participants
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({participants.length})
          </span>
        </div>
        <div className="flex gap-2">
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add Participant
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2"
          >
            {expanded ? <XCircle className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {expanded ? "Hide" : "Show"}
          </Button>
        </div>
      </div>

      {expanded && (
        <>
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading participants...</p>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No participants added yet.</p>
              {isOwner && (
                <p className="text-sm mt-2">Add participants to share this meeting with others.</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.user_id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {participant.email}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            participant.role === "collaborator"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {participant.role}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 ml-7">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>Added {new Date(participant.added_at).toLocaleDateString()}</span>
                        </div>
                        {participant.last_accessed && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>Last accessed {new Date(participant.last_accessed).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 ml-7">
                        {participant.permissions.can_view_transcript && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded text-xs">
                            View Transcript
                          </span>
                        )}
                        {participant.permissions.can_use_chatbot && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded text-xs">
                            Chatbot
                          </span>
                        )}
                        {participant.permissions.can_annotate && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 rounded text-xs">
                            Annotate
                          </span>
                        )}
                        {participant.permissions.can_comment && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded text-xs">
                            Comment
                          </span>
                        )}
                      </div>
                    </div>
                    {isOwner && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveParticipant(participant.user_id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <AddParticipantModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddParticipant}
          ownerEmail={ownerEmail}
        />
      )}
    </div>
  );
}

