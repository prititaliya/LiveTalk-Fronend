"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, Mail, ArrowLeft } from "lucide-react";
import { isAuthenticated } from "@/lib/auth";
import { verifyEmail, resendVerificationEmail, getCurrentUser, UserInfo } from "@/lib/account";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [fetchingUser, setFetchingUser] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isAuthenticated()) {
        router.replace("/login");
        return;
      }

      try {
        const info = await getCurrentUser();
        setUserInfo(info);
        if (info.email_verified) {
          router.replace("/account");
        }
      } catch (err) {
        setError("Failed to load user information");
      } finally {
        setFetchingUser(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp.trim()) {
      setError("Please enter the verification code");
      return;
    }

    if (otp.trim().length !== 6) {
      setError("Verification code must be 6 digits");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await verifyEmail(otp.trim());
      setSuccess("Email verified successfully! Redirecting...");
      
      // Update localStorage if needed
      if (typeof window !== "undefined") {
        // Could update a flag here if we store verification status
      }
      
      // Redirect to account page after 1.5 seconds
      setTimeout(() => {
        router.push("/account");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify email. Please check your code and try again.");
      setOtp(""); // Clear OTP on error
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    setSuccess("");

    try {
      await resendVerificationEmail();
      setSuccess("Verification email sent! Please check your inbox.");
      setOtp(""); // Clear existing OTP
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend verification email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Only allow digits
    if (value.length <= 6) {
      setOtp(value);
      setError("");
      setSuccess("");
    }
  };

  if (fetchingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Verify Your Email
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            We sent a verification code to
          </p>
          {userInfo && (
            <p className="text-gray-900 dark:text-white font-medium mt-1">
              {userInfo.email}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <form onSubmit={handleVerify} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label htmlFor="otp" className="block text-sm font-medium mb-2">
                Verification Code
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={handleOtpChange}
                  className={`w-full pl-10 pr-4 py-3 text-center text-2xl tracking-widest border rounded-lg focus:outline-none focus:ring-2 ${
                    error
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono`}
                  placeholder="000000"
                  disabled={loading || resendLoading}
                  autoFocus
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Enter the 6-digit code from your email
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-4 py-3 rounded-lg">
                <CheckCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{success}</span>
              </div>
            )}

            {/* Verify Button */}
            <Button
              type="submit"
              disabled={loading || resendLoading || otp.length !== 6}
              className="w-full py-6 text-lg"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </Button>

            {/* Resend Link */}
            <div className="text-center">
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || resendLoading}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Didn't receive the code? Resend"
                )}
              </button>
            </div>

            {/* Back to Account */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/account")}
                className="w-full flex items-center justify-center gap-2"
                disabled={loading || resendLoading}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Account
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

