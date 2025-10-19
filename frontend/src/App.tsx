import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { Header } from "./components/landingPage/header";
import { EarthBackground } from "./components/landingPage/earthBackground";
import { Footer } from "./components/landingPage/footer";
import { HeroSection } from "./components/landingPage/heroSection";
import { MissionSection } from "./components/landingPage/missionSection";
import { FeaturesSection } from "./components/landingPage/featureSection";
import { ImpactSection } from "./components/landingPage/impactSection";
import { InteractiveAvatarSystem } from "./components/avatar";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { Spinner } from "./components/ui/button";
import { CommunityLayout } from "./components/layout/CommunityLayout";

// ============================================================================
// LAZY LOADED COMPONENTS
// ============================================================================

const SortingPage = lazy(() => import("./components/webCamLayout/page"));
const RealTimeStats = lazy(() =>
  import("./components/dashboard/RealTimeStats").then((module) => ({
    default: module.RealTimeStats,
  }))
);
const Leaderboard = lazy(() =>
  import("./components/Leaderboard").then((module) => ({
    default: module.Leaderboard,
  }))
);
const ChallengeSystem = lazy(() =>
  import("./components/ChallengeSystem").then((module) => ({
    default: module.ChallengeSystem,
  }))
);
const AchievementSystem = lazy(() =>
  import("./components/AchievementSystem").then((module) => ({
    default: module.AchievementSystem,
  }))
);
const LoginForm = lazy(() =>
  import("./components/auth/LoginForm").then((module) => ({
    default: module.LoginForm,
  }))
);
const RegisterForm = lazy(() =>
  import("./components/auth/RegisterForm").then((module) => ({
    default: module.RegisterForm,
  }))
);
const AuthCallback = lazy(() =>
  import("./components/auth/AuthCallback").then((module) => ({
    default: module.AuthCallback,
  }))
);
const ResetPasswordForm = lazy(() =>
  import("./components/auth/ResetPasswordForm").then((module) => ({
    default: module.ResetPasswordForm,
  }))
);

// ============================================================================
// QUERY CLIENT SETUP
// ============================================================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
});

// ============================================================================
// LOADING COMPONENT
// ============================================================================

const LoadingFallback: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// ============================================================================
// PROTECTED ROUTE COMPONENT
// ============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [localLoading, setLocalLoading] = React.useState(true);
  
  // Use an effect to handle the loading state with a short timeout
  // This prevents flickering and gives auth a moment to initialize
  React.useEffect(() => {
    // If auth is clearly determined, update immediately
    if (!isLoading || user !== null) {
      setLocalLoading(false);
      return;
    }
    
    // Otherwise, give a short grace period for auth to resolve
    const timer = setTimeout(() => {
      setLocalLoading(false);
    }, 800); // Short timeout to prevent long waits
    
    return () => clearTimeout(timer);
  }, [isLoading, user]);

  // Only show loading briefly while auth initializes
  if (localLoading && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Use state in the navigation to indicate this was a redirect
    return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  }

  // Render protected content if authenticated
  return <>{children}</>;
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen flex flex-col">
              <OfflineIndicator />

              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  {/* Landing Page */}
                  <Route
                    path="/"
                    element={
                      <div className="min-h-screen flex flex-col bg-background">
                        <EarthBackground />
                        <Header />
                        <main className="flex-1 relative z-10">
                          <HeroSection />
                          <MissionSection />
                          <FeaturesSection />
                          <ImpactSection />
                        </main>
                        <Footer />
                        <InteractiveAvatarSystem />
                      </div>
                    }
                  />

                  {/* Authentication Routes */}
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/register" element={<RegisterForm />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route
                    path="/reset-password"
                    element={<ResetPasswordForm />}
                  />

                  {/* Protected Routes */}
                  <Route
                    path="/sorting"
                    element={
                      <ProtectedRoute>
                        <SortingPage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <CommunityLayout 
                          title="Dashboard" 
                          description="Track your environmental impact and progress!"
                          maxWidth="6xl"
                        >
                          <RealTimeStats />
                        </CommunityLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/stats"
                    element={
                      <ProtectedRoute>
                        <CommunityLayout 
                          title="Statistics" 
                          description="View your detailed statistics and analytics!"
                          maxWidth="6xl"
                        >
                          <RealTimeStats />
                        </CommunityLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/leaderboard"
                    element={
                      <ProtectedRoute>
                        <CommunityLayout 
                          title="Community Leaderboard" 
                          description="See how you rank against other eco-warriors!"
                        >
                          <Leaderboard />
                        </CommunityLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/challenges"
                    element={
                      <ProtectedRoute>
                        <CommunityLayout 
                          title="Community Challenges" 
                          description="Join challenges and compete with the community!"
                        >
                          <ChallengeSystem />
                        </CommunityLayout>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/achievements"
                    element={
                      <ProtectedRoute>
                        <CommunityLayout 
                          title="Achievements" 
                          description="Track your progress and unlock rewards!"
                          maxWidth="6xl"
                        >
                          <AchievementSystem />
                        </CommunityLayout>
                      </ProtectedRoute>
                    }
                  />

                  {/* Redirect old routes */}
                  <Route
                    path="/stats"
                    element={<Navigate to="/dashboard" replace />}
                  />

                  {/* 404 Route */}
                  <Route
                    path="*"
                    element={
                      <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                          <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            404
                          </h1>
                          <p className="text-gray-600 mb-8">Page not found</p>
                          <a
                            href="/"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          >
                            Go Home
                          </a>
                        </div>
                      </div>
                    }
                  />
                </Routes>
              </Suspense>
            </div>
          </ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
