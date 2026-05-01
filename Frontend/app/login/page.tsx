"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AlertCircle, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { loginUser } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email_or_username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email_or_username.trim()) {
      setErrors({ email_or_username: "Email or username is required" });
      return;
    }
    if (!formData.password) {
      setErrors({ password: "Password is required" });
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const loginResult = await loginUser({
        email_or_username: formData.email_or_username.trim(),
        password: formData.password,
      });

      // Check if email is verified, redirect to verification page if not
      if (loginResult.email_verified === false) {
        router.replace("/verify-email");
      } else {
        // Redirect to home page after successful login (use replace to prevent back navigation)
        router.replace("/");
      }
    } catch (error) {
      setErrors({
        submit: error instanceof Error ? error.message : "Login failed. Please check your credentials.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sign in to your account to continue
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email/Username Field */}
            <div>
              <label htmlFor="email_or_username" className="block text-sm font-medium mb-2">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email_or_username"
                  name="email_or_username"
                  type="text"
                  value={formData.email_or_username}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.email_or_username
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="you@example.com or username"
                />
              </div>
              {errors.email_or_username && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.email_or_username}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-12 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                    errors.password
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 dark:border-gray-600 focus:ring-blue-500"
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{errors.submit}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-6 text-lg"
              size="lg"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            {/* Register Link */}
            <div className="text-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
              </span>
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Create account
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

