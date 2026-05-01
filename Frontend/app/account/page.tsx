"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  Mail, 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2,
  LogOut,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { isAuthenticated, logoutUser, getUserEmail, getUserUsername } from "@/lib/auth";
import { 
  getCurrentUser, 
  updateEmail, 
  updateUsername, 
  updatePassword,
  UserInfo 
} from "@/lib/account";

export default function AccountPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Email update state
  const [emailForm, setEmailForm] = useState({
    new_email: "",
  });
  const [emailError, setEmailError] = useState<string>("");
  const [emailSuccess, setEmailSuccess] = useState<string>("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Username update state
  const [usernameForm, setUsernameForm] = useState({
    new_username: "",
  });
  const [usernameError, setUsernameError] = useState<string>("");
  const [usernameSuccess, setUsernameSuccess] = useState<string>("");
  const [usernameLoading, setUsernameLoading] = useState(false);

  // Password update state
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState<string>("");
  const [passwordSuccess, setPasswordSuccess] = useState<string>("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user info on mount
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!isAuthenticated()) {
        router.replace("/login");
        return;
      }

      try {
        setLoading(true);
        const info = await getCurrentUser();
        setUserInfo(info);
        setEmailForm({ new_email: info.email });
        setUsernameForm({ new_username: info.username });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user information");
        // If unauthorized, redirect to login
        if (err instanceof Error && err.message.includes("401")) {
          logoutUser();
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [router]);

  // Prevent back navigation to login page
  useEffect(() => {
    if (isAuthenticated()) {
      // Intercept browser back button to prevent navigation to login
      const handlePopState = (e: PopStateEvent) => {
        // If user tries to go back to login, redirect to account
        if (window.location.pathname === "/login") {
          window.history.pushState(null, "", "/account");
          router.replace("/account");
        }
      };
      
      // Push current state to history to prevent back navigation to login
      window.history.pushState(null, "", window.location.href);
      
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [router]);

  // Email validation
  const validateEmail = (email: string): string => {
    if (!email.trim()) {
      return "Email is required";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "Invalid email format";
    }
    return "";
  };

  // Username validation
  const validateUsername = (username: string): string => {
    if (!username.trim()) {
      return "Username is required";
    }
    if (username.trim().length < 3) {
      return "Username must be at least 3 characters";
    }
    return "";
  };

  // Password validation
  const validatePassword = (password: string): string => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (password.length > 72) {
      return "Password must be at most 72 characters";
    }
    return "";
  };

  // Handle email update
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");

    const validationError = validateEmail(emailForm.new_email);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    if (emailForm.new_email === userInfo?.email) {
      setEmailError("New email must be different from current email");
      return;
    }

    try {
      setEmailLoading(true);
      const updated = await updateEmail(emailForm.new_email);
      setUserInfo(updated);
      setEmailSuccess("Email updated successfully! Please check your new email for verification code.");
      setEmailForm({ new_email: updated.email });
      
      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user_email", updated.email);
      }
      
      // Redirect to verification page after email update
      setTimeout(() => {
        router.push("/verify-email");
      }, 2000);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to update email");
    } finally {
      setEmailLoading(false);
    }
  };

  // Handle username update
  const handleUsernameUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess("");

    const validationError = validateUsername(usernameForm.new_username);
    if (validationError) {
      setUsernameError(validationError);
      return;
    }

    if (usernameForm.new_username === userInfo?.username) {
      setUsernameError("New username must be different from current username");
      return;
    }

    try {
      setUsernameLoading(true);
      const updated = await updateUsername(usernameForm.new_username);
      setUserInfo(updated);
      setUsernameSuccess("Username updated successfully!");
      setUsernameForm({ new_username: updated.username });
      
      // Update localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("user_username", updated.username);
      }
    } catch (err) {
      setUsernameError(err instanceof Error ? err.message : "Failed to update username");
    } finally {
      setUsernameLoading(false);
    }
  };

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const currentPasswordError = validatePassword(passwordForm.current_password);
    if (currentPasswordError) {
      setPasswordError(currentPasswordError);
      return;
    }

    const newPasswordError = validatePassword(passwordForm.new_password);
    if (newPasswordError) {
      setPasswordError(newPasswordError);
      return;
    }

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordForm.current_password === passwordForm.new_password) {
      setPasswordError("New password must be different from current password");
      return;
    }

    try {
      setPasswordLoading(true);
      await updatePassword(passwordForm.current_password, passwordForm.new_password);
      setPasswordSuccess("Password updated successfully!");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error && !userInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-4">
            <AlertCircle className="h-5 w-5" />
            <h2 className="text-xl font-bold">Error</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
          <Button onClick={() => router.push("/")} variant="outline" className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Account Settings
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* User Information Display */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Account Information</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-medium">{userInfo?.email}</p>
                  {userInfo?.email_verified ? (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Unverified
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Username</p>
                <p className="text-lg font-medium">{userInfo?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Member Since</p>
                <p className="text-lg font-medium">{userInfo ? formatDate(userInfo.created_at) : ""}</p>
              </div>
            </div>
          </div>
          
          {/* Email Verification Banner */}
          {userInfo && !userInfo.email_verified && (
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">
                    Email Verification Required
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-3">
                    Please verify your email address to access all features. Check your inbox for the verification code.
                  </p>
                  <Button
                    onClick={() => router.push("/verify-email")}
                    className="text-sm"
                    size="sm"
                  >
                    Verify Email Now
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Update Email Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Update Email</h2>
          <form onSubmit={handleEmailUpdate} className="space-y-4">
            <div>
              <label htmlFor="new_email" className="block text-sm font-medium mb-2">
                New Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="new_email"
                  type="email"
                  value={emailForm.new_email}
                  onChange={(e) => {
                    setEmailForm({ new_email: e.target.value });
                    setEmailError("");
                    setEmailSuccess("");
                  }}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    emailError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="new@example.com"
                  disabled={emailLoading}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {emailError}
                </p>
              )}
              {emailSuccess && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {emailSuccess}
                </p>
              )}
            </div>
            <Button type="submit" disabled={emailLoading} className="w-full">
              {emailLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Email"
              )}
            </Button>
          </form>
        </div>

        {/* Update Username Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Update Username</h2>
          <form onSubmit={handleUsernameUpdate} className="space-y-4">
            <div>
              <label htmlFor="new_username" className="block text-sm font-medium mb-2">
                New Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="new_username"
                  type="text"
                  value={usernameForm.new_username}
                  onChange={(e) => {
                    setUsernameForm({ new_username: e.target.value });
                    setUsernameError("");
                    setUsernameSuccess("");
                  }}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    usernameError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="newusername"
                  disabled={usernameLoading}
                />
              </div>
              {usernameError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {usernameError}
                </p>
              )}
              {usernameSuccess && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {usernameSuccess}
                </p>
              )}
            </div>
            <Button type="submit" disabled={usernameLoading} className="w-full">
              {usernameLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Username"
              )}
            </Button>
          </form>
        </div>

        {/* Update Password Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-6">Update Password</h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="current_password" className="block text-sm font-medium mb-2">
                Current Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="current_password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordForm.current_password}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, current_password: e.target.value });
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    passwordError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="••••••"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="new_password" className="block text-sm font-medium mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  value={passwordForm.new_password}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, new_password: e.target.value });
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    passwordError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="••••••"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordForm.confirm_password}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, confirm_password: e.target.value });
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    passwordError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="••••••"
                  disabled={passwordLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  {passwordSuccess}
                </p>
              )}
            </div>
            <Button type="submit" disabled={passwordLoading} className="w-full">
              {passwordLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

