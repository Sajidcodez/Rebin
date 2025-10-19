import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  SecuritySchemas,
  XSSProtection,
  CSRFProtection,
  RateLimiter,
  InputSanitizer,
  SecurityError,
  ValidationError,
  RateLimitError,
} from "../lib/security";

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  zipCode?: string;
  acceptTerms: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  zipCode?: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, password: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

// ============================================================================
// AUTHENTICATION CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ============================================================================
// AUTHENTICATION PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const logoutInProgressRef = useRef(false);

  const isAuthenticated = !!user && !!session;

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  const handleError = useCallback((error: unknown, defaultMessage: string) => {
    console.error("Auth error:", error);

    if (error instanceof SecurityError) {
      setError(error.message);
    } else if (error instanceof ValidationError) {
      setError(error.message);
    } else if (error instanceof RateLimitError) {
      setError(error.message);
    } else if (error instanceof AuthError) {
      // Map Supabase auth errors to user-friendly messages
      switch (error.message) {
        case "Invalid login credentials":
          setError(
            "Invalid email or password. If you just registered, please check your email and click the confirmation link first."
          );
          break;
        case "Email not confirmed":
          setError(
            "Please check your email and click the confirmation link to activate your account."
          );
          break;
        case "User already registered":
          setError("An account with this email already exists.");
          break;
        case "Password should be at least 6 characters":
          setError(
            "Password must be at least 8 characters with uppercase, lowercase, number, and special character."
          );
          break;
        default:
          // Check for common email confirmation related errors
          if (
            error.message.includes("email") &&
            error.message.includes("confirm")
          ) {
            setError(
              "Please check your email and click the confirmation link to activate your account."
            );
          } else {
            setError(error.message);
          }
      }
    } else if (error instanceof Error) {
      setError(error.message);
    } else {
      setError(defaultMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // PROFILE MANAGEMENT
  // ============================================================================

  const fetchUserProfile = useCallback(
    async (userId: string): Promise<UserProfile | null> => {
      try {
        // First try to get from our custom users table
        const { data: customUser, error: customError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (customUser && !customError) {
          return {
            id: customUser.id,
            email: customUser.email,
            firstName: customUser.metadata?.first_name || "",
            lastName: customUser.metadata?.last_name || "",
            zipCode: customUser.metadata?.zip_code,
            bio: customUser.metadata?.bio,
            avatar: customUser.avatar_url,
            createdAt: customUser.created_at,
            updatedAt: customUser.updated_at,
          };
        }

        // Fallback to auth.users if custom table doesn't have the user
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData.user) {
          console.error("Error fetching user:", userError);
          return null;
        }

        const user = userData.user;
        const metadata = user.user_metadata || {};

        return {
          id: user.id,
          email: user.email || "",
          firstName: metadata.first_name || "",
          lastName: metadata.last_name || "",
          zipCode: metadata.zip_code,
          bio: metadata.bio,
          avatar: user.user_metadata?.avatar_url,
          createdAt: user.created_at,
          updatedAt: user.updated_at || user.created_at,
        };
      } catch (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
    },
    []
  );

  const createUserProfile = useCallback(
    async (user: User, profileData: Partial<RegisterData>): Promise<void> => {
      try {
        // Check if we have an active session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // If we have a session, update user metadata
        if (session) {
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              first_name: profileData.firstName,
              last_name: profileData.lastName,
              zip_code: profileData.zipCode,
              full_name:
                `${profileData.firstName} ${profileData.lastName}`.trim(),
            },
          });

          if (updateError) {
            console.warn(
              `Failed to update user metadata: ${updateError.message}`
            );
            // Don't throw here - continue with profile creation
          }
        } else {
          console.log("No active session found, skipping metadata update");
        }

        // Create a record in our custom users table (this works regardless of session)
        const { error: insertError } = await supabase.from("users").insert({
          id: user.id,
          email: user.email || "",
          full_name: `${profileData.firstName} ${profileData.lastName}`.trim(),
          metadata: {
            first_name: profileData.firstName,
            last_name: profileData.lastName,
            zip_code: profileData.zipCode,
          },
          email_verified: user.email_confirmed_at ? true : false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("Error inserting user into users table:", insertError);
          // Don't throw here - the user is still created in auth.users
          // We can try to create the profile record later
        } else {
          console.log("Successfully created user profile in users table");
        }
      } catch (error) {
        console.error("Error creating profile:", error);
        throw error;
      }
    },
    []
  );

  const ensureUserProfile = useCallback(
    async (user: User): Promise<UserProfile | null> => {
      try {
        // First, try to fetch existing profile
        let profile = await fetchUserProfile(user.id);

        if (!profile) {
          // Profile doesn't exist, create it from user metadata
          console.log("User profile not found, creating from metadata");

          const profileData = {
            firstName: user.user_metadata?.first_name || "",
            lastName: user.user_metadata?.last_name || "",
            zipCode: user.user_metadata?.zip_code,
          };

          try {
            await createUserProfile(user, profileData);
            // Try to fetch again
            profile = await fetchUserProfile(user.id);
          } catch (profileError) {
            console.warn(
              "Failed to create user profile, using metadata fallback:",
              profileError
            );
            // If profile creation fails, create a basic profile from user metadata
            profile = {
              id: user.id,
              email: user.email || "",
              firstName: user.user_metadata?.first_name || "",
              lastName: user.user_metadata?.last_name || "",
              zipCode: user.user_metadata?.zip_code,
              bio: user.user_metadata?.bio,
              avatar: user.user_metadata?.avatar_url,
              createdAt: user.created_at,
              updatedAt: user.updated_at || user.created_at,
            };
          }
        }

        return profile;
      } catch (error) {
        console.error("Error ensuring user profile:", error);
        // Return a basic profile from user metadata as fallback
        return {
          id: user.id,
          email: user.email || "",
          firstName: user.user_metadata?.first_name || "",
          lastName: user.user_metadata?.last_name || "",
          zipCode: user.user_metadata?.zip_code,
          bio: user.user_metadata?.bio,
          avatar: user.user_metadata?.avatar_url,
          createdAt: user.created_at,
          updatedAt: user.updated_at || user.created_at,
        };
      }
    },
    [fetchUserProfile, createUserProfile]
  );

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<void> => {
      try {
        setIsLoading(true);
        clearError();

        // Validate input
        const validatedData = SecuritySchemas.LoginSchema.parse(credentials);

        // Sanitize inputs
        const sanitizedData = {
          email: InputSanitizer.sanitizeEmail(validatedData.email),
          password: validatedData.password, // Don't sanitize passwords
        };

        // Rate limiting check
        if (!RateLimiter.checkLimit("login", sanitizedData.email)) {
          const retryAfter = RateLimiter.getTimeUntilReset(
            "login",
            sanitizedData.email
          );
          throw new RateLimitError(
            `Too many login attempts. Please try again in ${Math.ceil(
              retryAfter / 60000
            )} minutes.`,
            retryAfter
          );
        }

        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
          email: sanitizedData.email,
          password: sanitizedData.password,
        });

        if (error) {
          throw error;
        }

        // Set user and session
        setUser(data.user);
        setSession(data.session);

        // Ensure user profile exists and fetch it
        if (data.user) {
          const userProfile = await ensureUserProfile(data.user);
          setProfile(userProfile);
        }

        // Generate and store CSRF token
        const csrfToken = CSRFProtection.generateToken();
        CSRFProtection.storeToken(csrfToken);
      } catch (error) {
        handleError(error, "Login failed. Please try again.");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError, fetchUserProfile]
  );

  const register = useCallback(
    async (data: RegisterData): Promise<void> => {
      try {
        setIsLoading(true);
        clearError();

        // Validate input
        const validatedData = SecuritySchemas.RegisterSchema.parse(data);

        // Sanitize inputs
        const sanitizedData = {
          email: InputSanitizer.sanitizeEmail(validatedData.email),
          password: validatedData.password,
          firstName: InputSanitizer.sanitizeFormInput(validatedData.firstName),
          lastName: InputSanitizer.sanitizeFormInput(validatedData.lastName),
          zipCode: validatedData.zipCode
            ? InputSanitizer.sanitizeFormInput(validatedData.zipCode)
            : undefined,
        };

        // Rate limiting check
        if (!RateLimiter.checkLimit("register", sanitizedData.email)) {
          const retryAfter = RateLimiter.getTimeUntilReset(
            "register",
            sanitizedData.email
          );
          throw new RateLimitError(
            `Too many registration attempts. Please try again in ${Math.ceil(
              retryAfter / 60000
            )} minutes.`,
            retryAfter
          );
        }

        // Register with Supabase with email confirmation
        const { data: authData, error } = await supabase.auth.signUp({
          email: sanitizedData.email,
          password: sanitizedData.password,
          options: {
            data: {
              first_name: sanitizedData.firstName,
              last_name: sanitizedData.lastName,
              zip_code: sanitizedData.zipCode,
              full_name:
                `${sanitizedData.firstName} ${sanitizedData.lastName}`.trim(),
            },
            // Enable email confirmation
            emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
          },
        });

        if (error) {
          throw error;
        }

        if (authData.user) {
          // For email confirmation flow, handle both cases
          if (authData.session) {
            // User is immediately confirmed (development mode or email confirmation disabled)
            setUser(authData.user);
            setSession(authData.session);

            // Create user profile in our custom users table
            await createUserProfile(authData.user, sanitizedData);

            // Fetch user profile
            const userProfile = await fetchUserProfile(authData.user.id);
            setProfile(userProfile);

            // Generate and store CSRF token
            const csrfToken = CSRFProtection.generateToken();
            CSRFProtection.storeToken(csrfToken);
          } else {
            // User needs to verify email - create profile anyway for consistency
            await createUserProfile(authData.user, sanitizedData);
            console.log("User created, email confirmation required");
            // The user will be set after email verification via the auth callback
          }
        }
      } catch (error) {
        handleError(error, "Registration failed. Please try again.");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError, createUserProfile, fetchUserProfile]
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      console.log("Starting logout process...");
      if (logoutInProgressRef.current) {
        console.log("Logout already in progress - ignoring duplicate call");
        return;
      }
      logoutInProgressRef.current = true;
      setIsLoading(true);
      clearError();

      // Clear local state first to prevent UI flicker
      setUser(null);
      setProfile(null);
      setSession(null);

      // Clear CSRF token and any local storage items
      CSRFProtection.clearToken();
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.removeItem('supabase.auth.token');

      // Sign out from Supabase with global scope
      console.log("Signing out from Supabase...");
      const { error } = await supabase.auth.signOut({ 
        scope: "global" as any 
      });
      
      if (error) {
        console.error("Supabase signout error:", error);
        throw error;
      }

      console.log("Supabase signout successful");
      
      // Force clear any persisted state in browser storage
      try {
        // Clear any other auth-related items
        Object.keys(localStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('token')) {
            localStorage.removeItem(key);
          }
        });
        
        Object.keys(sessionStorage).forEach(key => {
          if (key.includes('supabase') || key.includes('auth') || key.includes('token')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {
        console.warn("Error clearing storage:", e);
      }
      
      console.log("Logout process complete");
    } catch (error) {
      console.error("Logout error:", error);
      handleError(error, "Logout failed. Please try again.");
      throw error;
    } finally {
      console.log("Setting loading to false after logout");
      setIsLoading(false);
      logoutInProgressRef.current = false;
    }
  }, [handleError, clearError]);

  const refreshToken = useCallback(async (): Promise<void> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        throw error;
      }

      if (data.session) {
        setSession(data.session);
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      handleError(error, "Token refresh failed");
      throw error;
    }
  }, [handleError]);

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>): Promise<void> => {
      try {
        if (!user) {
          throw new Error("User not authenticated");
        }

        setIsLoading(true);
        clearError();

        // Validate input
        const validatedData = SecuritySchemas.ProfileUpdateSchema.parse(data);

        // Sanitize inputs
        const sanitizedData = {
          first_name: InputSanitizer.sanitizeFormInput(validatedData.firstName),
          last_name: InputSanitizer.sanitizeFormInput(validatedData.lastName),
          zip_code: validatedData.zipCode
            ? InputSanitizer.sanitizeFormInput(validatedData.zipCode)
            : undefined,
          bio: validatedData.bio
            ? XSSProtection.sanitizeRichText(validatedData.bio)
            : undefined,
          avatar_url: validatedData.avatar
            ? XSSProtection.sanitizeUrl(validatedData.avatar)
            : undefined,
          updated_at: new Date().toISOString(),
        };

        // Update profile in user metadata
        const { error } = await supabase.auth.updateUser({
          data: {
            first_name: sanitizedData.first_name,
            last_name: sanitizedData.last_name,
            zip_code: sanitizedData.zip_code,
            bio: sanitizedData.bio,
            avatar_url: sanitizedData.avatar_url,
            full_name:
              `${sanitizedData.first_name} ${sanitizedData.last_name}`.trim(),
          },
        });

        if (error) {
          throw new Error(`Failed to update profile: ${error.message}`);
        }

        // Update local profile state
        const updatedProfile = await fetchUserProfile(user.id);
        setProfile(updatedProfile);
      } catch (error) {
        handleError(error, "Profile update failed. Please try again.");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [user, handleError, clearError, fetchUserProfile]
  );

  const resetPassword = useCallback(
    async (email: string): Promise<void> => {
      try {
        setIsLoading(true);
        clearError();

        // Validate input
        const validatedData = SecuritySchemas.PasswordResetSchema.parse({
          email,
        });

        // Sanitize email
        const sanitizedEmail = InputSanitizer.sanitizeEmail(
          validatedData.email
        );

        // Rate limiting check
        if (!RateLimiter.checkLimit("passwordReset", sanitizedEmail)) {
          const retryAfter = RateLimiter.getTimeUntilReset(
            "passwordReset",
            sanitizedEmail
          );
          throw new RateLimitError(
            `Too many password reset attempts. Please try again in ${Math.ceil(
              retryAfter / 60000
            )} minutes.`,
            retryAfter
          );
        }

        // Send password reset email
        const { error } = await supabase.auth.resetPasswordForEmail(
          sanitizedEmail,
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        );

        if (error) {
          throw error;
        }
      } catch (error) {
        handleError(error, "Password reset failed. Please try again.");
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError]
  );

  const confirmPasswordReset = useCallback(
    async (token: string, password: string): Promise<void> => {
      try {
        setIsLoading(true);
        clearError();

        // Validate input
        const validatedData = SecuritySchemas.PasswordResetConfirmSchema.parse({
          token,
          password,
          confirmPassword: password,
        });

        // Update password
        const { error } = await supabase.auth.updateUser({
          password: validatedData.password,
        });

        if (error) {
          throw error;
        }
      } catch (error) {
        handleError(
          error,
          "Password reset confirmation failed. Please try again."
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError]
  );

  const resendConfirmation = useCallback(
    async (email: string): Promise<void> => {
      try {
        setIsLoading(true);
        clearError();

        // Validate email
        const validatedData = SecuritySchemas.PasswordResetSchema.parse({
          email,
        });

        // Sanitize email
        const sanitizedEmail = InputSanitizer.sanitizeEmail(
          validatedData.email
        );

        // Resend confirmation email
        const { error } = await supabase.auth.resend({
          type: "signup",
          email: sanitizedEmail,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
          },
        });

        if (error) {
          throw error;
        }
      } catch (error) {
        handleError(
          error,
          "Failed to resend confirmation email. Please try again."
        );
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [handleError, clearError]
  );

  // ============================================================================
  // INITIALIZATION AND SESSION MANAGEMENT
  // ============================================================================

  useEffect(() => {
    let mounted = true;
    let backupTimeout: NodeJS.Timeout;
    let authInitialized = false;

    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        
        // Add a timeout to prevent hanging, but don't reject - just resolve with null
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((resolve) => 
          setTimeout(() => resolve({ data: { session: null }, error: null }), 8000)
        );
        
        const {
          data: { session },
          error,
        } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (error) {
          console.error("Error getting session:", error);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        console.log("Session retrieved:", session ? "valid" : "null");

        if (mounted) {
          setSession(session);
          if (session?.user) {
            setUser(session.user);
            const userProfile = await ensureUserProfile(session.user);
            setProfile(userProfile);
          } else {
            // Explicitly set null values when no session
            setUser(null);
            setProfile(null);
          }
          authInitialized = true;
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (mounted) {
          // Set null values on error to ensure clean state
          setUser(null);
          setProfile(null);
          setSession(null);
          authInitialized = true;
        }
      } finally {
        if (mounted) {
          console.log("Auth initialization complete, setting loading to false");
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Backup timeout to ensure loading state is cleared even if auth initialization fails
    backupTimeout = setTimeout(() => {
      if (mounted && !authInitialized) {
        console.log("Backup timeout triggered - forcing loading to false");
        setIsLoading(false);
      }
    }, 12000); // 12 second backup timeout

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      console.log("Auth state changed:", event, session?.user?.id);

      // Ignore misleading SIGNED_IN events that can occur right after a global sign-out
      if (logoutInProgressRef.current && event === "SIGNED_IN") {
        console.log("Ignoring SIGNED_IN event during logout");
        return;
      }
      
      // Debounce rapid auth state changes (prevent flickering)
      const stateChangeTimeout = setTimeout(async () => {
        if (!mounted) return;
        
        if (event === "SIGNED_OUT") {
          // Handle sign out - clear all state
          setSession(null);
          setUser(null);
          setProfile(null);
        } else if (session?.user) {
          // Handle sign in or session update
          setSession(session);
          setUser(session.user);
          
          try {
            const userProfile = await ensureUserProfile(session.user);
            if (mounted) {
              setProfile(userProfile);
            }
          } catch (error) {
            console.error("Error fetching user profile:", error);
            if (mounted) {
              setProfile(null);
            }
          }
        } else {
          // No user in session
          setSession(session);
          setUser(null);
          setProfile(null);
        }
        
        // Mark auth as initialized and ensure loading state is cleared
        if (mounted) {
          authInitialized = true;
          console.log("Auth state change complete, setting loading to false");
          setIsLoading(false);
        }
      }, 100); // Small debounce to prevent rapid changes
      
      return () => clearTimeout(stateChangeTimeout);
    });

    return () => {
      mounted = false;
      if (backupTimeout) {
        clearTimeout(backupTimeout);
      }
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AuthContextType = {
    user,
    profile,
    session,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    resetPassword,
    confirmPasswordReset,
    resendConfirmation,
    error,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
