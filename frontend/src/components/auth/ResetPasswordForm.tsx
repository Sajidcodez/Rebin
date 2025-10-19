import React, { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToastNotifications } from "../../contexts/ToastContext";
import { SecuritySchemas } from "../../lib/security";
import { Form, FormField, Input } from "../ui/form";
import { Button } from "../ui/button";
import { Icons } from "../ui/icons";
import { Link } from "react-router-dom";
import { EarthBackground } from "../landingPage/earthBackground";
import { Header } from "../landingPage/header";
import { Footer } from "../landingPage/footer";

// ============================================================================
// RESET PASSWORD FORM COMPONENT
// ============================================================================

export const ResetPasswordForm: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, confirmPasswordReset, isLoading, error, clearError } =
    useAuth();
  const { showError, showSuccess } = useToastNotifications();

  const [step, setStep] = useState<"request" | "confirm">("request");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if we have a token from URL (password reset confirmation)
  const token = searchParams.get("token");
  const type = searchParams.get("type");

  React.useEffect(() => {
    if (token && type === "recovery") {
      setStep("confirm");
    }
  }, [token, type]);

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

  const validateRequestForm = useCallback(() => {
    try {
      SecuritySchemas.PasswordResetSchema.parse({ email: formData.email });
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
  }, [formData.email]);

  const validateConfirmForm = useCallback(() => {
    try {
      SecuritySchemas.PasswordResetConfirmSchema.parse({
        password: formData.password,
        confirmPassword: formData.confirmPassword,
      });
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
  }, [formData.password, formData.confirmPassword]);

  const handleRequestReset = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!validateRequestForm()) {
        return;
      }

      try {
        await resetPassword(formData.email);
        showSuccess(
          "Reset Email Sent",
          "Please check your email and click the reset link to continue."
        );
        // Don't navigate away, let user know to check email
      } catch (error) {
        // Error is already handled by the auth context
        console.error("Password reset request failed:", error);
      }
    },
    [formData.email, validateRequestForm, resetPassword, showSuccess]
  );

  const handleConfirmReset = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!validateConfirmForm()) {
        return;
      }

      if (!token) {
        showError("Invalid Link", "The reset link is invalid or expired.");
        return;
      }

      try {
        await confirmPasswordReset(token, formData.password);
        showSuccess(
          "Password Reset Successful",
          "Your password has been updated. You can now log in with your new password."
        );
        // Redirect to login page
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 2000);
      } catch (error) {
        // Error is already handled by the auth context
        console.error("Password reset confirmation failed:", error);
      }
    },
    [
      formData.password,
      validateConfirmForm,
      token,
      confirmPasswordReset,
      showSuccess,
      showError,
      navigate,
    ]
  );

  if (step === "confirm") {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <EarthBackground />
        <Header />

        <main className="flex-1 relative z-10 flex items-center justify-center py-12">
          <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-border/20 p-8">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10">
                  <Icons.lock className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Set New Password
                </h1>
                <p className="text-muted-foreground">
                  Enter your new password below
                </p>
              </div>

              <Form
                onSubmit={handleConfirmReset}
                loading={isLoading}
                showActions={false}
              >
                <div className="space-y-6">
                  {/* New Password Field */}
                  <FormField
                    label="New Password"
                    error={errors.password}
                    required
                  >
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange("password", e.target.value)
                      }
                      placeholder="Enter your new password"
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
                      autoComplete="new-password"
                      required
                    />
                  </FormField>

                  {/* Confirm Password Field */}
                  <FormField
                    label="Confirm New Password"
                    error={errors.confirmPassword}
                    required
                  >
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("confirmPassword", e.target.value)
                      }
                      placeholder="Confirm your new password"
                      leftIcon={<Icons.lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="text-gray-400 hover:text-gray-600 focus:outline-none"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <Icons.eyeOff className="w-4 h-4" />
                          ) : (
                            <Icons.eye className="w-4 h-4" />
                          )}
                        </button>
                      }
                      error={!!errors.confirmPassword}
                      autoComplete="new-password"
                      required
                    />
                  </FormField>

                  {/* Auth Error */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex">
                        <Icons.alertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isLoading}
                  >
                    {isLoading ? "Updating Password..." : "Update Password"}
                  </Button>

                  {/* Back to Login Link */}
                  <div className="text-center">
                    <Link
                      to="/login"
                      className="text-sm text-primary hover:text-primary/80 focus:outline-none focus:underline transition-colors"
                    >
                      Back to Login
                    </Link>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <EarthBackground />
      <Header />

      <main className="flex-1 relative z-10 flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-border/20 p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10">
                <Icons.lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Reset Password
              </h1>
              <p className="text-muted-foreground">
                Enter your email address and we'll send you a link to reset your
                password
              </p>
            </div>

            <Form
              onSubmit={handleRequestReset}
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
                    placeholder="Enter your email address"
                    leftIcon={<Icons.mail className="w-4 h-4" />}
                    error={!!errors.email}
                    autoComplete="email"
                    required
                  />
                </FormField>

                {/* Auth Error */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <div className="flex">
                      <Icons.alertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isLoading}
                >
                  {isLoading ? "Sending Reset Email..." : "Send Reset Email"}
                </Button>

                {/* Back to Login Link */}
                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-sm text-primary hover:text-primary/80 focus:outline-none focus:underline transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </Form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
