"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, AlertCircle, Mail } from "lucide-react";

interface AddParticipantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (email: string, role: "viewer" | "collaborator") => Promise<void>;
  ownerEmail?: string;
}

export function AddParticipantModal({
  isOpen,
  onClose,
  onAdd,
  ownerEmail,
}: AddParticipantModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "collaborator">("viewer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    // Check if user is trying to add themselves (owner)
    if (ownerEmail && email.trim().toLowerCase() === ownerEmail.toLowerCase()) {
      setError("You cannot add yourself as a participant. As the meeting owner, you already have full access.");
      return;
    }

    setLoading(true);
    try {
      await onAdd(email.trim().toLowerCase(), role);
      setEmail("");
      setRole("viewer");
      setError(null);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to add participant. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail("");
      setRole("viewer");
      setError(null);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Add Participant
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                User must be registered before being added as a participant.
              </p>
            </div>

            <div>
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "viewer" | "collaborator")}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="viewer">Viewer (Read-only)</option>
                <option value="collaborator">Collaborator (Can annotate and comment)</option>
              </select>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                {role === "viewer" ? (
                  <>
                    <p>• Can view transcript</p>
                    <p>• Can use chatbot</p>
                    <p>• Can view summaries</p>
                  </>
                ) : (
                  <>
                    <p>• Can view transcript</p>
                    <p>• Can use chatbot</p>
                    <p>• Can view summaries</p>
                    <p>• Can annotate</p>
                    <p>• Can comment</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Participant"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

