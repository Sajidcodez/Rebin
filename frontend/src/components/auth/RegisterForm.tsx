import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useToastNotifications } from "../../contexts/ToastContext";
import {
  SecuritySchemas,
  RateLimiter,
  SecurityValidator,
} from "../../lib/security";
import { Form, FormField, Input, Checkbox } from "../ui/form";
import { Button } from "../ui/button";
import { Icons } from "../ui/icons";
import { Link } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";

// ============================================================================
// REGISTRATION FORM COMPONENT
// ============================================================================

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useToastNotifications();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    zipCode: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] });

  // Clear errors when form data changes
  const handleInputChange = useCallback(
    (field: string, value: string | boolean) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }

      // Clear auth error
      if (error) {
        clearError();
      }

      // Check password strength
      if (field === "password" && typeof value === "string") {
        const strength = SecurityValidator.validatePasswordStrength(value);
        setPasswordStrength(strength);
      }
    },
    [errors, error, clearError]
  );

  const validateForm = useCallback(() => {
    try {
      SecuritySchemas.RegisterSchema.parse(formData);
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
        await register(formData);

        // Check if user is immediately authenticated (development mode)
        if (isAuthenticated) {
          showSuccess(
            "Welcome to ReBin Pro!",
            "Your account has been created successfully. Redirecting to dashboard..."
          );
          // Redirect to dashboard immediately
          setTimeout(() => {
            navigate("/dashboard", { replace: true });
          }, 1500);
        } else {
          // Email confirmation required
          showSuccess(
            "Account Created!",
            "Please check your email and click the verification link to complete your registration."
          );
          // Redirect to login page with a message
          setTimeout(() => {
            navigate("/login?message=verify-email", { replace: true });
          }, 2000);
        }
      } catch (error) {
        // Error is already handled by the auth context
        console.error("Registration failed:", error);
      }
    },
    [formData, validateForm, register, showSuccess, isAuthenticated, navigate]
  );

  const handleSocialRegister = useCallback(
    async (provider: "google" | "github") => {
      try {
        // TODO: Implement social registration with Supabase
        showError(
          "Coming Soon",
          `${provider} registration is not yet implemented.`
        );
      } catch (error) {
        showError(
          "Registration Failed",
          `Failed to register with ${provider}. Please try again.`
        );
      }
    },
    [showError]
  );

  const getRemainingAttempts = useCallback(() => {
    return RateLimiter.getRemainingAttempts("register", formData.email);
  }, [formData.email]);

  const remainingAttempts = getRemainingAttempts();

  const getPasswordStrengthColor = (score: number) => {
    if (score < 2) return "text-red-600";
    if (score < 4) return "text-yellow-600";
    return "text-green-600";
  };

  const getPasswordStrengthText = (score: number) => {
    if (score < 2) return "Weak";
    if (score < 4) return "Medium";
    return "Strong";
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-300 p-8">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-green-100">
                <Icons.leaf className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-primary mb-2 ">
                Create Account
              </h1>
              <p className="text-muted-foreground">
                Join ReBin Pro and start making a difference
              </p>
            </div>

            <Form
              onSubmit={handleSubmit}
              loading={isLoading}
              showActions={false}
            >
              <div className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="First Name"
                    error={errors.firstName}
                    required
                  >
                    <Input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange("firstName", e.target.value)
                      }
                      placeholder="First name"
                      error={!!errors.firstName}
                      autoComplete="given-name"
                      required
                    />
                  </FormField>

                  <FormField label="Last Name" error={errors.lastName} required>
                    <Input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange("lastName", e.target.value)
                      }
                      placeholder="Last name"
                      error={!!errors.lastName}
                      autoComplete="family-name"
                      required
                    />
                  </FormField>
                </div>

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

                {/* ZIP Code Field */}
                <FormField
                  label="ZIP Code"
                  error={errors.zipCode}
                  helpText="Optional - helps provide local recycling guidelines"
                >
                  <Input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) =>
                      handleInputChange("zipCode", e.target.value)
                    }
                    placeholder="12345"
                    leftIcon={<Icons.mapPin className="w-4 h-4" />}
                    error={!!errors.zipCode}
                    autoComplete="postal-code"
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
                    placeholder="Create a strong password"
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

                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          Password strength:
                        </span>
                        <span
                          className={getPasswordStrengthColor(
                            passwordStrength.score
                          )}
                        >
                          {getPasswordStrengthText(passwordStrength.score)}
                        </span>
                      </div>
                      <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.score < 2
                              ? "bg-red-500"
                              : passwordStrength.score < 4
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${(passwordStrength.score / 6) * 100}%`,
                          }}
                        />
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <ul className="mt-2 text-xs text-gray-600">
                          {passwordStrength.feedback.map((feedback, index) => (
                            <li key={index} className="flex items-center">
                              <Icons.check className="w-3 h-3 mr-1 text-green-500" />
                              {feedback}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </FormField>

                {/* Confirm Password Field */}
                <FormField
                  label="Confirm Password"
                  error={errors.confirmPassword}
                  required
                >
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    placeholder="Confirm your password"
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

                {/* Terms and Conditions */}
                <FormField label="" error={errors.acceptTerms}>
                  <Checkbox
                    checked={formData.acceptTerms}
                    onChange={(e) =>
                      handleInputChange("acceptTerms", e.target.checked)
                    }
                    label="I agree to the Terms of Service and Privacy Policy"
                    helpText="You must accept the terms to create an account"
                    error={!!errors.acceptTerms}
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
                          {remainingAttempts} registration attempt
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
                  disabled={isLoading || remainingAttempts === 0}
                  style={{ backgroundColor: '#22c55e', color: '#fff', border: 'none' }}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
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

                {/* Social Registration Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialRegister("google")}
                    disabled={isLoading}
                    leftIcon={<Icons.google className="w-4 h-4" />}
                  >
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSocialRegister("github")}
                    disabled={isLoading}
                    leftIcon={<Icons.github className="w-4 h-4" />}
                  >
                    GitHub
                  </Button>
                </div>

                {/* Sign In Link */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                      to="/login"
                      className="font-medium text-primary hover:text-primary/80 focus:outline-none focus:underline transition-colors"
                    >
                      Sign in
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
