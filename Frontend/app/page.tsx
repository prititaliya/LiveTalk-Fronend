"use client";

import { RecordingControls } from "@/components/RecordingControls";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, FileText } from "lucide-react";
import { isAuthenticated, logoutUser, getUserUsername } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  // Only check authentication on client side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    const authStatus = isAuthenticated();
    setAuthenticated(authStatus);
    if (authStatus) {
      setUsername(getUserUsername());
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          {mounted && (
            <div className="flex justify-end gap-4 mb-8">
              {!authenticated ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/login")}
                    className="flex items-center gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                  <Button
                    onClick={() => router.push("/register")}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Sign Up
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/transcripts")}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    My Transcripts
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/account")}
                  >
                    {username || "Account"}
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              LiveTalk
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Record your meetings and get real-time transcriptions
            </p>
          </div>
          

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12">
            <RecordingControls />
          </div>
        </div>
      </div>
    </div>
  );
}

