import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";
// import { useAuth } from "../../contexts/AuthContext";
import { useToastNotifications } from "../../contexts/ToastContext";
import { Spinner } from "../ui/button";
import { Icons } from "../ui/icons";
import { AuthLayout } from "./AuthLayout";

// ============================================================================
// AUTH CALLBACK COMPONENT
// ============================================================================

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToastNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback error:", error);
          setError(error.message);
          showError("Authentication Error", error.message);
          return;
        }

        if (data.session) {
          // Check if this is an email confirmation
          const event = searchParams.get("type");

          if (event === "signup") {
            showSuccess(
              "Email Verified!",
              "Your account has been successfully verified. Welcome to ReBin Pro!"
            );
          } else if (event === "recovery") {
            showSuccess(
              "Password Reset",
              "Your password has been reset successfully."
            );
          }

          // Redirect to dashboard after successful authentication
          navigate("/dashboard", { replace: true });
        } else {
          // No session found, redirect to login
          navigate("/login", { replace: true });
        }
      } catch (error) {
        console.error("Unexpected error in auth callback:", error);
        setError("An unexpected error occurred");
        showError(
          "Authentication Error",
          "An unexpected error occurred during authentication."
        );
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams, showSuccess, showError]);

  if (isLoading) {
    return (
      <AuthLayout>
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Verifying your account...</p>
        </div>
      </AuthLayout>
    );
  }

  if (error) {
    return (
      <AuthLayout>
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <Icons.alertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">
              Authentication Error
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => navigate("/login")}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Go to Login
            </button>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return null;
};
