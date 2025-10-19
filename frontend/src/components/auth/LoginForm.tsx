import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToastNotifications } from "../../contexts/ToastContext";
import { SecuritySchemas, RateLimiter } from "../../lib/security";
import { Form, FormField, Input } from "../ui/form";
import { Button } from "../ui/button";
import { Icons } from "../ui/icons";
import { Link } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";

// ============================================================================
// LOGIN FORM COMPONENT
// ============================================================================

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    login,
    isLoading,
    error,
    clearError,
    isAuthenticated,
    resendConfirmation,
  } = useAuth();
  const { showError, showSuccess } = useToastNotifications();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Handle email verification message and redirect after login
  useEffect(() => {
    const message = searchParams.get("message");
    if (message === "verify-email") {
      showSuccess(
        "Check Your Email",
        "Please check your email and click the verification link to complete your registration."
      );
    }
  }, [searchParams, showSuccess]);

  // Get redirect location from state if available
  const location = useLocation();
  const from = location.state?.from || "/dashboard";
  
  // Redirect to dashboard or previous location if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Clear errors when form data changes
  const handleInputChange = useCallback(
    (field: string, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }

      // Clear auth error
      if (error) {
        clearError();
      }
    },
    [errors, error, clearError]
  );

  const validateForm = useCallback(() => {
    try {
      SecuritySchemas.LoginSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error: any) {
      const fieldErrors: Record<string, string> = {};

      if (error.errors) {
        error.errors.forEach((err: any) => {
          if (err.path && err.path[0]) {
            fieldErrors[err.path[0]] = err.message;
          }
        });
      }

      setErrors(fieldErrors);
      return false;
    }
  }, [formData]);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      try {
        await login(formData);
        showSuccess(
          "Welcome back!",
          "You have successfully logged in. Redirecting to dashboard..."
        );
        // Redirect to previous location or dashboard after successful login
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 1000);
      } catch (error) {
        // Error is already handled by the auth context
        console.error("Login failed:", error);
      }
    },
    [formData, validateForm, login, showSuccess, navigate]
  );

  const handleSocialLogin = useCallback(
    async (provider: "google" | "github") => {
      try {
        // TODO: Implement social login with Supabase
        showError("Coming Soon", `${provider} login is not yet implemented.`);
      } catch (error) {
        showError(
          "Login Failed",
          `Failed to login with ${provider}. Please try again.`
        );
      }
    },
    [showError]
  );

  const getRemainingAttempts = useCallback(() => {
    return RateLimiter.getRemainingAttempts("login", formData.email);
  }, [formData.email]);

  const remainingAttempts = getRemainingAttempts();

  const handleResendConfirmation = useCallback(async () => {
    if (!formData.email) {
      showError("Email Required", "Please enter your email address first.");
      return;
    }

    try {
      await resendConfirmation(formData.email);
      showSuccess(
        "Confirmation Email Sent",
        "Please check your email inbox and spam folder for the confirmation link."
      );
    } catch (error) {
      // Error is already handled by the auth context
      console.error("Failed to resend confirmation:", error);
    }
  }, [formData.email, resendConfirmation, showError, showSuccess]);

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-300 p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-100">
                <Icons.leaf className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2">
                Welcome Back
              </h1>
              <p className="text-muted-foreground">
                Sign in to your ReBin Pro account
              </p>
            </div>

            <Form
              onSubmit={handleSubmit}
              loading={isLoading}
              showActions={false}
            >
              <div className="space-y-6">
                {/* Email Field */}
                <FormField label="Email Address" error={errors.email} required>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter your email"
                    leftIcon={<Icons.mail className="w-4 h-4" />}
                    error={!!errors.email}
                    autoComplete="email"
                    required
                  />
                </FormField>

                {/* Password Field */}
                <FormField label="Password" error={errors.password} required>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    placeholder="Enter your password"
                    leftIcon={<Icons.lock className="w-4 h-4" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-gray-400 hover:text-gray-600 focus:outline-none"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <Icons.eyeOff className="w-4 h-4" />
                        ) : (
                          <Icons.eye className="w-4 h-4" />
                        )}
                      </button>
                    }
                    error={!!errors.password}
                    autoComplete="current-password"
                    required
                  />
                </FormField>

                {/* Rate Limiting Warning */}
                {remainingAttempts < 3 && remainingAttempts > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <div className="flex">
                      <Icons.alertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                      <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                          {remainingAttempts} login attempt
                          {remainingAttempts !== 1 ? "s" : ""} remaining.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auth Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex">
                      <Icons.alertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div className="ml-3 flex-1">
                        <p className="text-sm text-red-800">{error}</p>
                        {error.includes("confirmation") && (
                          <button
                            type="button"
                            onClick={handleResendConfirmation}
                            className="mt-2 text-sm text-red-600 hover:text-red-500 underline focus:outline-none"
                          >
                            Resend confirmation email
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Forgot Password Link */}
                <div className="text-right">
                  <Link
                    to="/reset-password"
                    className="text-sm text-primary-600 hover:text-primary-500 focus:outline-none focus:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                  disabled={isLoading || remainingAttempts === 0}
                  style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none' }}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin("google")}
                    disabled={isLoading}
                    leftIcon={<Icons.google className="w-4 h-4" />}
                  >
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialLogin("github")}
                    disabled={isLoading}
                    leftIcon={<Icons.github className="w-4 h-4" />}
                  >
                    GitHub
                  </Button>
                </div>

                {/* Sign Up Link */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link
                      to="/register"
                      className="font-medium text-primary hover:text-primary/80 focus:outline-none focus:underline transition-colors"
                    >
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </Form>
          </div>
        </div>
    </AuthLayout>
  );
};
