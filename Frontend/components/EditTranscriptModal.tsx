"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Transcript, TranscriptEntry, updateTranscript, renameSpeaker } from "@/lib/transcripts";
import { X, Save, AlertCircle } from "lucide-react";

interface EditTranscriptModalProps {
  transcript: Transcript;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTranscript: Transcript) => void;
}

export function EditTranscriptModal({
  transcript,
  isOpen,
  onClose,
  onSave,
}: EditTranscriptModalProps) {
  const [meetingName, setMeetingName] = useState(transcript.meeting_name);
  const [entries, setEntries] = useState<TranscriptEntry[]>(transcript.transcripts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speakerRenamePending, setSpeakerRenamePending] = useState<{
    oldSpeaker: string;
    newSpeaker: string;
    entryIndex: number;
  } | null>(null);
  
  // Track original speaker names to detect changes on blur
  const originalSpeakersRef = useRef<Map<number, string>>(new Map());
  
  // Track the last meeting_id we initialized with to prevent unnecessary resets
  const lastMeetingIdRef = useRef<string | null>(null);

  // Update state only when modal opens or transcript ID changes
  useEffect(() => {
    if (isOpen && transcript.meeting_id !== lastMeetingIdRef.current) {
      setMeetingName(transcript.meeting_name);
      const copiedEntries = JSON.parse(JSON.stringify(transcript.transcripts)); // Deep copy
      setEntries(copiedEntries);
      setError(null);
      setSpeakerRenamePending(null);
      
      // Store original speaker names
      originalSpeakersRef.current = new Map(
        copiedEntries.map((entry: TranscriptEntry, index: number) => [index, entry.speaker])
      );
      
      lastMeetingIdRef.current = transcript.meeting_id;
    } else if (!isOpen) {
      // Reset ref when modal closes
      lastMeetingIdRef.current = null;
      originalSpeakersRef.current.clear();
    }
  }, [isOpen, transcript.meeting_id, transcript.meeting_name, transcript.transcripts]);

  if (!isOpen) return null;

  const handleSpeakerChange = (index: number, newSpeaker: string) => {
    // Just update the entry immediately without checking for other occurrences
    const updatedEntries = [...entries];
    updatedEntries[index] = { ...updatedEntries[index], speaker: newSpeaker };
    setEntries(updatedEntries);
  };

  const handleSpeakerBlur = (index: number, newSpeaker: string) => {
    // Only check for other occurrences when the user finishes editing (on blur)
    const originalSpeaker = originalSpeakersRef.current.get(index);
    const entry = entries[index];
    
    // If the speaker hasn't changed from original, no action needed
    if (originalSpeaker === newSpeaker) {
      return;
    }

    // Check if the original speaker appears elsewhere
    const otherOccurrences = entries.filter(
      (e, i) => i !== index && e.speaker === originalSpeaker
    );

    if (otherOccurrences.length > 0 && originalSpeaker) {
      // Show confirmation for bulk rename
      setSpeakerRenamePending({
        oldSpeaker: originalSpeaker,
        newSpeaker: newSpeaker,
        entryIndex: index,
      });
    } else {
      // Update the original speaker reference since it's a unique change
      originalSpeakersRef.current.set(index, newSpeaker);
    }
  };

  const handleConfirmSpeakerRename = async () => {
    if (!speakerRenamePending) return;

    const { oldSpeaker, newSpeaker, entryIndex } = speakerRenamePending;
    setLoading(true);
    setError(null);

    try {
      // Call API to rename speaker across all occurrences
      const updatedTranscript = await renameSpeaker(
        transcript.meeting_id,
        oldSpeaker,
        newSpeaker
      );

      // Update local state with the response
      setEntries(updatedTranscript.transcripts);
      
      // Update original speakers map for all entries that were renamed
      updatedTranscript.transcripts.forEach((entry: TranscriptEntry, index: number) => {
        if (entry.speaker === newSpeaker) {
          originalSpeakersRef.current.set(index, newSpeaker);
        }
      });
      
      setSpeakerRenamePending(null);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") {
          setError("Your session has expired. Please log in again.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to rename speaker. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSpeakerRename = () => {
    // Revert the change in the entry
    if (speakerRenamePending) {
      const updatedEntries = [...entries];
      updatedEntries[speakerRenamePending.entryIndex] = {
        ...updatedEntries[speakerRenamePending.entryIndex],
        speaker: speakerRenamePending.oldSpeaker,
      };
      setEntries(updatedEntries);
      setSpeakerRenamePending(null);
    }
  };

  const handleTextChange = (index: number, newText: string) => {
    const updatedEntries = [...entries];
    updatedEntries[index] = { ...updatedEntries[index], text: newText };
    setEntries(updatedEntries);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate
      if (!meetingName.trim()) {
        throw new Error("Meeting name cannot be empty");
      }

      if (entries.length === 0) {
        throw new Error("Transcript must have at least one entry");
      }

      // Update transcript
      const updatedTranscript = await updateTranscript(transcript.meeting_id, {
        meeting_name: meetingName.trim(),
        transcripts: entries,
      });

      onSave(updatedTranscript);
      onClose();
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") {
          setError("Your session has expired. Please log in again.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to update transcript. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Transcript
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Speaker Rename Confirmation */}
          {speakerRenamePending && (
            <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200 mb-3">
                Update all occurrences of <strong>"{speakerRenamePending.oldSpeaker}"</strong> to{" "}
                <strong>"{speakerRenamePending.newSpeaker}"</strong> in this transcript?
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleConfirmSpeakerRename}
                  disabled={loading}
                >
                  Yes, Update All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelSpeakerRename}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Meeting Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Meeting Name
            </label>
            <input
              type="text"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading || !!speakerRenamePending}
            />
          </div>

          {/* Transcript Entries */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Transcript Entries ({entries.length})
            </label>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {entries.map((entry, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Speaker
                      </label>
                      <input
                        type="text"
                        value={entry.speaker}
                        onChange={(e) =>
                          handleSpeakerChange(index, e.target.value)
                        }
                        onBlur={(e) =>
                          handleSpeakerBlur(index, e.target.value)
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={loading || !!speakerRenamePending}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                        Timestamp
                      </label>
                      <input
                        type="text"
                        value={new Date(entry.timestamp).toLocaleString()}
                        disabled
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Text
                    </label>
                    <textarea
                      value={entry.text}
                      onChange={(e) => handleTextChange(index, e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      disabled={loading || !!speakerRenamePending}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose} disabled={loading || !!speakerRenamePending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || !!speakerRenamePending}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

