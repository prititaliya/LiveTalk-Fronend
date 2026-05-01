"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Calendar, Search, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { getAvailableTools, addCalendarEvent, detectFollowUpMeetings, type Tool, type AddCalendarEventRequest, type DetectedMeeting } from "@/lib/tools";

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transcriptText?: string;
  meetingId?: string;
}

export function ToolsModal({ isOpen, onClose, transcriptText = "", meetingId }: ToolsModalProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCalendarForm, setShowCalendarForm] = useState(false);
  const [detectedMeetings, setDetectedMeetings] = useState<DetectedMeeting[]>([]);
  const [calendarForm, setCalendarForm] = useState<AddCalendarEventRequest>({
    event_summary: "",
    date: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      day: new Date().getDate(),
      hour: new Date().getHours(),
      minute: new Date().getMinutes(),
    },
    location: "",
    reminder_before: 15,
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      loadTools();
      if (meetingId) {
        detectMeetings();
      }
    }
  }, [isOpen, meetingId]);

  const loadTools = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAvailableTools();
      setTools(response.tools);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") {
          setError("Please log in to access tools");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to load tools");
      }
    } finally {
      setLoading(false);
    }
  };

  const detectMeetings = async () => {
    if (!meetingId) return;
    
    try {
      const response = await detectFollowUpMeetings(meetingId);
      if (response.meetings && response.meetings.length > 0) {
        setDetectedMeetings(response.meetings);
        // Auto-fill form with first detected meeting if it has a date
        const firstMeeting = response.meetings[0];
        if (firstMeeting.date) {
          setCalendarForm({
            event_summary: firstMeeting.summary || "",
            date: firstMeeting.date,
            location: firstMeeting.location || "",
            reminder_before: 15,
            description: firstMeeting.description || "",
          });
        }
      }
    } catch (err) {
      // Silently fail - detection is optional
      console.warn("Could not detect meetings:", err);
    }
  };

  const handleAddCalendarEvent = async () => {
    if (!calendarForm.event_summary.trim()) {
      setError("Event summary is required");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await addCalendarEvent(calendarForm);
      setSuccess(response.message);
      setShowCalendarForm(false);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setCalendarForm({
          event_summary: "",
          date: {
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1,
            day: new Date().getDate(),
            hour: new Date().getHours(),
            minute: new Date().getMinutes(),
          },
          location: "",
          reminder_before: 15,
          description: "",
        });
        setSuccess(null);
      }, 3000);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === "UNAUTHORIZED") {
          setError("Please log in to add calendar events");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to add calendar event");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const calendarTools = tools.filter((t) => t.category === "calendar");
  const transcriptTools = tools.filter((t) => t.category === "transcript");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Available Tools
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Close
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
              </div>
            </div>
          )}

          {loading && !tools.length ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500 dark:text-gray-400">Loading tools...</span>
            </div>
          ) : (
            <>
              {/* Calendar Tools */}
              {calendarTools.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Calendar Tools
                  </h3>
                  <div className="space-y-3">
                    {calendarTools.map((tool) => (
                      <div
                        key={tool.name}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                              {tool.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {tool.description}
                            </p>
                            {tool.parameters && (
                              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                                <p className="font-medium mb-1">Parameters:</p>
                                <ul className="list-disc list-inside space-y-1">
                                  {Object.entries(tool.parameters).map(([key, value]) => (
                                    <li key={key}>
                                      <span className="font-mono">{key}</span>: {value}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          {tool.name === "add_event" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setShowCalendarForm(!showCalendarForm);
                                // If we have detected meetings and form is empty, use first one
                                if (!showCalendarForm && detectedMeetings.length > 0 && !calendarForm.event_summary) {
                                  const firstMeeting = detectedMeetings[0];
                                  if (firstMeeting.date) {
                                    setCalendarForm({
                                      event_summary: firstMeeting.summary || "",
                                      date: firstMeeting.date,
                                      location: firstMeeting.location || "",
                                      reminder_before: 15,
                                      description: firstMeeting.description || "",
                                    });
                                  }
                                }
                              }}
                              className="ml-4"
                            >
                              Add Event
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Calendar Event Form */}
              {showCalendarForm && (
                <div className="border border-blue-200 dark:border-blue-800 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Add Calendar Event
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Event Summary *
                      </label>
                      <input
                        type="text"
                        value={calendarForm.event_summary}
                        onChange={(e) =>
                          setCalendarForm({ ...calendarForm, event_summary: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Meeting title"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={`${calendarForm.date.year}-${String(calendarForm.date.month).padStart(2, "0")}-${String(calendarForm.date.day).padStart(2, "0")}`}
                          onChange={(e) => {
                            const [year, month, day] = e.target.value.split("-").map(Number);
                            setCalendarForm({
                              ...calendarForm,
                              date: { ...calendarForm.date, year, month, day },
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Time
                        </label>
                        <input
                          type="time"
                          value={`${String(calendarForm.date.hour).padStart(2, "0")}:${String(calendarForm.date.minute).padStart(2, "0")}`}
                          onChange={(e) => {
                            const [hour, minute] = e.target.value.split(":").map(Number);
                            setCalendarForm({
                              ...calendarForm,
                              date: { ...calendarForm.date, hour, minute },
                            });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={calendarForm.location}
                        onChange={(e) =>
                          setCalendarForm({ ...calendarForm, location: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Meeting location"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={calendarForm.description}
                        onChange={(e) =>
                          setCalendarForm({ ...calendarForm, description: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Event description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reminder (minutes before)
                      </label>
                      <input
                        type="number"
                        value={calendarForm.reminder_before}
                        onChange={(e) =>
                          setCalendarForm({
                            ...calendarForm,
                            reminder_before: parseInt(e.target.value) || 15,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        min="0"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddCalendarEvent} disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Adding...
                          </>
                        ) : (
                          "Add to Calendar"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCalendarForm(false);
                          setError(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Transcript Tools */}
              {transcriptTools.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Transcript Tools
                  </h3>
                  <div className="space-y-3">
                    {transcriptTools.map((tool) => (
                      <div
                        key={tool.name}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                          {tool.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {tool.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

