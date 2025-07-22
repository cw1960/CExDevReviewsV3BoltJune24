import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { Database } from "../types/database";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isInitialAuthLoading: boolean;
  isProfileRefreshing: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateProfileQuick: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateCookiePreferences: (
    preference: "accepted" | "declined",
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to add timeout to promises
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Query timed out after ${timeoutMs}ms`)),
        timeoutMs,
      ),
    ),
  ]);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isInitialAuthLoading, setIsInitialAuthLoading] = useState(true);
  const [isProfileRefreshing, setIsProfileRefreshing] = useState(false);

  // Use useRef to store the ongoing profile fetch promise
  const profileFetchPromiseRef = useRef<Promise<void> | null>(null);

  const fetchProfile = useCallback(async (userId: string): Promise<void> => {
    console.log("🔍 Starting profile fetch for user:", userId);

    // If there's already a profile fetch in progress for this user, return that promise
    if (profileFetchPromiseRef.current) {
      console.log(
        "⏳ Profile fetch already in progress, waiting for existing promise...",
      );
      return profileFetchPromiseRef.current;
    }

    setIsProfileRefreshing(true);

    const fetchProfileWithRetry = async (
      attempt: number = 1,
    ): Promise<void> => {
      const maxAttempts = 2; // Reduced attempts for faster failure
      const baseDelay = 1000; // Delay between retries remains 1s

      try {
        console.log(
          `📡 Profile fetch attempt ${attempt}/${maxAttempts} for user:`,
          userId,
        );
        console.log(
          `⏰ Starting direct database query at:`,
          new Date().toISOString(),
        );

        // CRITICAL FIX: Use Edge Function instead of direct database query to avoid RLS overhead
        const { data, error } = await withTimeout(
          supabase.functions.invoke("fetch-user-profile-for-auth", {
            body: { userId: userId },
          }),
          5000, // 5 second timeout for Edge Function
        );

        console.log(
          `⏰ Database query completed at:`,
          new Date().toISOString(),
        );

        if (error) {
          console.error(`❌ Edge Function error (attempt ${attempt}):`, {
            message: error.message,
            code: error.code || "EDGE_FUNCTION_ERROR",
          });

          // Enhanced retry logic for new user signup scenarios
          const isRetryableError =
            error.message?.includes("timeout") ||
            error.message?.includes("network") ||
            error.message?.includes("connection") ||
            error.message?.includes("fetch") ||
            error.message?.includes("not found") ||
            error.message?.includes("PGRST116") ||
            error.code === "PGRST116";

          if (attempt < maxAttempts && isRetryableError) {
            const delay = baseDelay * attempt; // Progressive delay
            console.log(
              `⏳ Retrying profile fetch in ${delay}ms... (attempt ${attempt + 1}/${maxAttempts})`,
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
            return fetchProfileWithRetry(attempt + 1);
          } else {
            // Only set profile to null after all retries are exhausted
            if (attempt >= maxAttempts && isRetryableError) {
              console.log(
                "ℹ️ Max retries reached for profile fetch - this may be a new user whose profile is still being created",
              );
              setProfile(null);
            } else {
              console.error(
                "💥 Non-retryable error - keeping existing profile state",
              );
            }
            return;
          }
        }

        // Handle Edge Function response
        if (!data?.success) {
          const errorMsg = data?.error || "Unknown error from Edge Function";
          console.error(`❌ Edge Function returned error: ${errorMsg}`);

          // Enhanced handling for "not found" scenarios during signup
          if (errorMsg.includes("not found") || errorMsg.includes("PGRST116")) {
            if (attempt < maxAttempts) {
              const delay = baseDelay * attempt;
              console.log(
                `⏳ Profile not found (attempt ${attempt}/${maxAttempts}) - retrying in ${delay}ms for potential new user...`,
              );
              await new Promise((resolve) => setTimeout(resolve, delay));
              return fetchProfileWithRetry(attempt + 1);
            } else {
              console.log(
                "ℹ️ User profile not found after all retries - this may be a new user whose profile is still being created",
              );
              setProfile(null);
              return;
            }
          }
          throw new Error(errorMsg);
        }

        // CRITICAL FIX: Extract the user profile from the nested data structure
        const profileData = data.data?.user || null;
        console.log(
          "✅ Profile fetch successful:",
          profileData ? "profile found" : "no profile found",
        );

        if (profileData) {
          console.log("📋 Profile data:", {
            id: profileData.id,
            email: profileData.email,
            name: profileData.name,
            credit_balance: profileData.credit_balance,
            has_completed_qualification:
              profileData.has_completed_qualification,
            has_completed_first_review: profileData.has_completed_first_review,
            onboarding_complete: profileData.onboarding_complete,
            cookie_preferences: profileData.cookie_preferences,
            cookie_consent_timestamp: profileData.cookie_consent_timestamp,
          });

          // Save profile to localStorage
          localStorage.setItem("profile", JSON.stringify(profileData));
        }

        // Update profile state with fetched data
        setProfile(profileData);
      } catch (error: any) {
        console.error(`💥 Profile fetch threw error (attempt ${attempt}):`, {
          name: (error as any)?.name,
          message: (error as any)?.message,
        });

        // Check if it's a timeout error
        if ((error as any)?.message?.includes("timed out")) {
          console.error("⏰ Profile fetch timeout detected");
        }

        if (attempt < maxAttempts) {
          const delay = baseDelay * attempt; // Progressive delay
          await new Promise((resolve) => setTimeout(resolve, delay));
          return fetchProfileWithRetry(attempt + 1);
        }
      } finally {
        setIsProfileRefreshing(false);
        setIsInitialAuthLoading(false);
      }
    };

    // Create and store the promise
    const fetchPromise = fetchProfileWithRetry().finally(() => {
      // Clear the promise reference and set loading to false when done
      profileFetchPromiseRef.current = null;
      console.log("🏁 Profile fetch process completed");
    });

    profileFetchPromiseRef.current = fetchPromise;
    return fetchPromise;
  }, []);

  useEffect(() => {
    // Wrap entire auth initialization in try-catch to prevent blank page
    const initializeAuth = async () => {
      try {
        console.log("🚀 Initializing authentication...");

        // Get initial session from localStorage for faster loading
        const initialSession = localStorage.getItem("session");
        const initialProfile = localStorage.getItem("profile");

        if (initialProfile) {
          try {
            setProfile(JSON.parse(initialProfile));
            console.log("📋 Loaded profile from localStorage");
          } catch (parseError) {
            console.error("❌ Error parsing stored profile:", parseError);
            localStorage.removeItem("profile");
          }
        }

        // Get current session from Supabase
        console.log("🔍 Getting current session from Supabase...");
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Error getting initial session:", error);
          setIsInitialAuthLoading(false);
          return;
        }

        console.log(
          "✅ Session retrieved:",
          session ? "authenticated" : "not authenticated",
        );
        setSession(session);
        localStorage.setItem("session", JSON.stringify(session));
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log("👤 User found, fetching profile...");
          await fetchProfile(session.user.id);
        } else {
          console.log("👤 No user found, setting loading to false");
          setIsInitialAuthLoading(false);
        }
      } catch (error) {
        console.error("💥 CRITICAL ERROR during auth initialization:", {
          message: (error as any)?.message || "Unknown error",
          name: (error as any)?.name || "Unknown",
          stack: (error as any)?.stack || "No stack trace",
        });

        // Ensure loading state is reset even on error
        setIsInitialAuthLoading(false);
        setIsProfileRefreshing(false);

        // Clear potentially corrupted data
        localStorage.removeItem("profile");
        localStorage.removeItem("session");
        setProfile(null);
        setSession(null);
        setUser(null);
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes with error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        console.log("🔄 Auth state changed:", event, session?.user?.id);
        setSession(session);
        localStorage.setItem("session", JSON.stringify(session));
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log("👤 User authenticated, fetching profile...");

          // Check if this is a Google OAuth user without a profile
          if (
            event === "SIGNED_IN" &&
            session.user.app_metadata?.provider === "google"
          ) {
            console.log(
              "🔍 Google OAuth user detected, checking for profile...",
            );

            // Try to fetch profile first and get the actual result
            await fetchProfile(session.user.id);

            // Check the localStorage for the latest profile data to avoid state timing issues
            const latestProfileStr = localStorage.getItem("profile");
            let latestProfile = null;
            try {
              latestProfile = latestProfileStr
                ? JSON.parse(latestProfileStr)
                : null;
            } catch (e) {
              console.error(
                "Error parsing latest profile from localStorage:",
                e,
              );
            }

            // If no profile exists after fetch, create one for Google OAuth user
            if (!latestProfile) {
              console.log("🔄 Creating profile for Google OAuth user...");
              try {
                const { data: profileData, error: profileError } =
                  await supabase.functions.invoke("create-user-profile", {
                    body: {
                      user_id: session.user.id,
                      email: session.user.email,
                      name:
                        session.user.user_metadata?.name ||
                        session.user.user_metadata?.full_name ||
                        "Google User",
                    },
                  });

                if (profileError) {
                  console.error(
                    "❌ Error creating Google OAuth profile:",
                    profileError,
                  );
                  // Don't retry - profile creation failed, user needs to try again
                } else if (profileData?.success) {
                  console.log("✅ Google OAuth profile created successfully");
                  // Fetch the newly created profile once
                  await fetchProfile(session.user.id);
                } else {
                  console.error(
                    "❌ Profile creation returned unsuccessful result:",
                    profileData,
                  );
                }
              } catch (createError) {
                console.error(
                  "❌ Failed to create Google OAuth profile:",
                  createError,
                );
                // Don't retry - profile creation failed, user needs to try again
              }
            } else {
              console.log("✅ Google OAuth user profile already exists");
            }
          } else {
            // Regular flow for email/password users
            await fetchProfile(session.user.id);
          }
        } else {
          console.log("👤 User signed out, clearing data...");
          // Only clear profile when user is actually signed out
          localStorage.removeItem("profile");
          localStorage.removeItem("session");
          setProfile(null);
          setIsInitialAuthLoading(false);
        }
      } catch (error) {
        console.error("💥 ERROR in auth state change handler:", {
          message: (error as any)?.message || "Unknown error",
          name: (error as any)?.name || "Unknown",
        });

        // Ensure loading state is reset on error
        setIsInitialAuthLoading(false);
        setIsProfileRefreshing(false);
      }
    });

    return () => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error("Error unsubscribing from auth changes:", error);
      }
    };
  }, [fetchProfile]);

  useEffect(() => {
    // After authentication, sync localStorage cookie preference to DB if needed
    if (user && profile && profile.cookie_preferences === "not_set") {
      const localPref = localStorage.getItem("cookie_preference");
      if (localPref === "accepted" || localPref === "declined") {
        // Update DB with the stored preference
        updateCookiePreferences(localPref as "accepted" | "declined").then(
          () => {
            // Clear the localStorage value after syncing
            localStorage.removeItem("cookie_preference");
            localStorage.setItem("cookie_consent_shown", "true");
          },
        );
      }
    }
  }, [user, profile]);

  // NEW: Direct profile refresh that bypasses Edge Function
  const refreshProfile = useCallback(async () => {
    if (!user) {
      console.log("🔄 No user found for profile refresh");
      return;
    }

    console.log("🔄 Starting direct profile refresh for user:", user.id);
    setIsProfileRefreshing(true);

    try {
      // Direct database query to get the latest profile data
      const { data: profileData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("❌ Direct profile refresh error:", error);
        throw error;
      }

      if (profileData) {
        console.log("✅ Direct profile refresh successful:", {
          id: profileData.id,
          email: profileData.email,
          has_completed_qualification: profileData.has_completed_qualification,
          has_completed_first_review: profileData.has_completed_first_review,
          credit_balance: profileData.credit_balance,
        });

        // Update both state and localStorage
        setProfile(profileData);
        localStorage.setItem("profile", JSON.stringify(profileData));
      } else {
        console.error("❌ No profile data returned from direct refresh");
      }
    } catch (error) {
      console.error("💥 Error in direct profile refresh:", error);
      throw error;
    } finally {
      setIsProfileRefreshing(false);
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log("🚀 Starting user signup process...");
    console.log("📧 Email:", email);
    console.log("👤 Name:", name);

    // Step 1: Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name, // Include name in metadata for Edge Function
        },
      },
    });

    console.log("📥 Auth signup response:", {
      user: data?.user ? { id: data.user.id, email: data.user.email } : null,
      session: data?.session ? "session exists" : "no session",
      error: error ? { message: error.message, status: error.status } : null,
    });

    if (error) {
      console.error("Sign up error:", error);
      throw error;
    }

    // Step 2: Verify user object exists
    if (!data?.user || !data.user.id) {
      console.error("❌ No user object returned from auth signup");
      throw new Error("Authentication failed: No user object returned");
    }

    console.log("✅ Auth user created successfully, ID:", data.user.id);

    // Step 3: Create user profile via Edge Function
    console.log("🔄 Creating user profile via Edge Function...");
    try {
      const { data: profileData, error: profileError } =
        await supabase.functions.invoke("create-user-profile", {
          body: {
            user_id: data.user.id,
            email: data.user.email,
            name: name,
          },
        });

      console.log("📥 Profile creation response:", {
        success: profileData?.success,
        error: profileError ? { message: profileError.message } : null,
        data: profileData?.data ? "profile data exists" : "no profile data",
      });

      if (profileError) {
        console.error("❌ Profile creation error:", profileError);
        throw new Error(
          `Failed to create user profile: ${profileError.message}`,
        );
      }

      if (!profileData?.success) {
        console.error("❌ Profile creation failed:", profileData?.error);
        throw new Error(
          `Database error saving new user: ${profileData?.error || "Unknown error"}`,
        );
      }

      console.log("✅ User profile created successfully");
    } catch (profileError) {
      console.error("❌ Failed to create user profile:", profileError);

      // Clean up the auth user if profile creation fails
      try {
        console.log("🧹 Attempting to clean up auth user...");
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log("✅ Auth user cleaned up successfully");
      } catch (cleanupError) {
        console.error("❌ Failed to cleanup auth user:", cleanupError);
      }

      throw new Error(`Database error saving new user`);
    }
  };

  const signInWithGoogle = async () => {
    console.log("🚀 Starting Google OAuth sign-in...");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth`, // Redirect back to auth page to handle the session
      },
    });

    if (error) {
      console.error("Google OAuth error:", error);
      throw error;
    }

    console.log("✅ Google OAuth initiated successfully");
    // The user will be redirected to Google and then back to our app
    // The session will be handled by the auth state listener
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    console.log("🔄 updateProfile called with updates:", updates);
    console.log(
      "🔄 Current user state:",
      user ? `user exists (${user.id})` : "no user",
    );
    if (!user) throw new Error("No user logged in");

    console.log("🔄 Attempting Supabase update for user ID:", user.id);
    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      console.error("🔄 Supabase update error in updateProfile:", error);
      throw error;
    }

    console.log("🔄 Supabase update successful, refreshing profile...");
    await refreshProfile();
  };

  const updateProfileQuick = async (updates: Partial<UserProfile>) => {
    console.log("⚡ updateProfileQuick called with updates:", updates);
    if (!user) throw new Error("No user logged in");

    console.log("⚡ Attempting direct Supabase update for user ID:", user.id);
    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      console.error("⚡ Supabase update error in updateProfileQuick:", error);
      throw error;
    }

    console.log(
      "⚡ Direct database update successful, updating local state...",
    );

    // Update local profile state immediately without complex refresh
    if (profile) {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      localStorage.setItem("profile", JSON.stringify(updatedProfile));
      console.log("⚡ Local profile state updated successfully");
    }
  };

  const updateCookiePreferences = async (
    preference: "accepted" | "declined",
  ) => {
    console.log("🍪 updateCookiePreferences called with:", preference);
    console.log(
      "🍪 Current user state:",
      user ? `user exists (${user.id})` : "no user",
    );
    if (!user) throw new Error("No user logged in");

    const updates = {
      cookie_preferences: preference,
      cookie_consent_timestamp: new Date().toISOString(),
    };

    console.log("🍪 Calling updateProfile with cookie updates:", updates);
    await updateProfile(updates);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        isInitialAuthLoading,
        isProfileRefreshing,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateProfile,
        updateProfileQuick,
        refreshProfile,
        updateCookiePreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}