import React, { useEffect, useState } from "react";
import {
  Title,
  Grid,
  Card,
  Text,
  Group,
  Badge,
  Stack,
  Button,
  Progress,
  Container,
  Alert,
  Loader,
  Avatar,
  ThemeIcon,
  Center,
  Drawer,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Package,
  Star,
  Clock,
  TrendingUp,
  Plus,
  AlertCircle,
  Crown,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { WelcomeModal } from "../components/WelcomeModal";
import { useSubscription } from "../hooks/useSubscription";
import type { Database } from "../types/database";
import { PersonalStatsPanel } from "../components/PersonalStatsPanel";
import { PlatformStatsPanel } from "../components/PlatformStatsPanel";
import type { PersonalStats } from "../types/personalStats";

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

type Extension = Database["public"]["Tables"]["extensions"]["Row"];
type ReviewAssignment =
  Database["public"]["Tables"]["review_assignments"]["Row"];

// Helper to truncate extension name
function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n - 1) + "…" : str;
}

export function DashboardPage() {
  const {
    profile,
    refreshProfile,
    updateProfile,
    isInitialAuthLoading,
    isProfileRefreshing,
  } = useAuth();
  const { isPremium, planName } = useSubscription();
  const navigate = useNavigate();
  const [extensions, setExtensions] = useState<Extension[]>([]);
  const [assignments, setAssignments] = useState<ReviewAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingAssignment, setRequestingAssignment] = useState(false);
  const [welcomeModalOpened, setWelcomeModalOpened] = useState(false);
  const [statsDrawerOpened, setStatsDrawerOpened] = useState(false);
  const [personalStats, setPersonalStats] = useState<PersonalStats | undefined>(
    undefined,
  );
  const [personalStatsLoading, setPersonalStatsLoading] = useState(true);
  const [personalStatsError, setPersonalStatsError] = useState<
    string | undefined
  >(undefined);

  // Helper function to check if user needs monthly reset
  const checkAndResetMonthlyLimit = async () => {
    if (!profile) return false;

    // Only check for free tier users
    if (profile.subscription_status !== "free") return true;

    const lastResetDate = profile.last_exchange_reset_date
      ? new Date(profile.last_exchange_reset_date)
      : new Date(0);
    const daysSinceReset = Math.floor(
      (Date.now() - lastResetDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // If 28 or more days have passed, reset the counter
    if (daysSinceReset >= 28) {
      console.log("🔄 Resetting monthly exchange count for user");
      await updateProfile({
        exchanges_this_month: 0,
        last_exchange_reset_date: new Date().toISOString(),
      });
      return true;
    }

    return true;
  };

  useEffect(() => {
    // Only fetch dashboard data when:
    // 1. Initial auth loading is complete
    // 2. Profile is available (user is authenticated)
    // 3. Not currently refreshing profile
    if (!isInitialAuthLoading && profile?.id && !isProfileRefreshing) {
      console.log("🚀 Starting dashboard data fetch for user:", profile.id);
      fetchDashboardData();
    } else {
      console.log("⏳ Waiting for auth/profile to be ready:", {
        isInitialAuthLoading,
        hasProfile: !!profile?.id,
        isProfileRefreshing,
      });
    }
  }, [profile?.id, isInitialAuthLoading, isProfileRefreshing]);

  useEffect(() => {
    // Show the welcome modal quickly after profile is available (max 2s delay)
    if (profile && localStorage.getItem("showWelcomeModal") === "true") {
      const timer = setTimeout(() => {
        setWelcomeModalOpened(true);
        localStorage.removeItem("showWelcomeModal");
      }, 1000); // 1 second delay for fast UX
      return () => clearTimeout(timer);
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      if (!profile?.id) {
        console.log("❌ No profile ID available for dashboard data fetch");
        setLoading(false);
        setPersonalStatsLoading(false);
        return;
      }

      console.log("📊 Fetching dashboard data for user:", profile.id);

      // Fetch extensions
      console.log("📦 Fetching user extensions...");
      const { data: extensionsResponse, error: extensionsError } =
        await withTimeout(
          supabase.functions.invoke("fetch-user-extensions", {
            body: { user_id: profile.id },
          }),
          10000, // 10 second timeout for edge function calls
        );

      if (extensionsError) {
        console.error("❌ Extensions Edge Function error:", extensionsError);
        // Don't throw here, just log the error and continue with empty array
      }

      let extensionsData = [];
      if (extensionsResponse?.success) {
        extensionsData = extensionsResponse.data || [];
      } else if (extensionsResponse?.error) {
        console.error(
          "❌ Extensions Edge Function returned error:",
          extensionsResponse.error,
        );
      }

      console.log(
        "✅ Extensions fetch completed:",
        extensionsData.length,
        "extensions",
      );

      // Fetch assignments
      console.log("📝 Fetching review assignments...");
      const { data: assignmentsResponse, error: assignmentsError } =
        await withTimeout(
          supabase.functions.invoke("fetch-review-assignments-for-reviewer", {
            body: { user_id: profile.id },
          }),
          10000, // 10 second timeout for edge function calls
        );

      if (assignmentsError) {
        console.error("❌ Assignments Edge Function error:", assignmentsError);
        // Don't throw here, just log the error and continue with empty array
      }

      let assignmentsData = [];
      if (assignmentsResponse?.success) {
        // Filter to only assigned status and limit to 3 for dashboard
        assignmentsData = (assignmentsResponse.data || [])
          .filter((a) => a.status === "assigned")
          .sort(
            (a, b) =>
              new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
          )
          .slice(0, 3);
      } else if (assignmentsResponse?.error) {
        console.error(
          "❌ Assignments Edge Function returned error:",
          assignmentsResponse.error,
        );
      }

      console.log(
        "✅ Assignments fetch completed:",
        assignmentsData.length,
        "assignments",
      );

      // Fetch personal stats (premium or free based on subscription)
      setPersonalStatsLoading(true);
      setPersonalStatsError(undefined);
      try {
        // Add detailed debugging for premium detection
        console.log('🔍 DEBUG: Premium detection details:', {
          isPremium,
          profileSubscriptionStatus: profile?.subscription_status,
          planName
        });
        
        const functionName = isPremium
          ? "fetch-premium-personal-stats"
          : "fetch-personal-stats";
        
        console.log(`📊 Calling ${functionName} for user:`, profile.id);
        console.log('🔑 isPremium:', isPremium);
        console.log('📋 Function body:', { userId: profile.id });
        
        const { data: statsResponse, error: statsError } = await withTimeout(
          supabase.functions.invoke(functionName, {
            body: { userId: profile.id },
          }),
          10000,
        );
        
        console.log('📊 Personal stats response:', { statsResponse, statsError });
        console.log('📊 Stats response details:', {
          success: statsResponse?.success,
          hasData: !!statsResponse?.data,
          errorMessage: statsResponse?.error,
          functionError: statsError
        });
        
        if (statsError) {
          console.error('❌ Personal stats error:', statsError);
          // FALLBACK: Provide placeholder data instead of failing
          console.log('🔄 Using fallback placeholder data for personal stats');
          const fallbackStats = {
            cycleStart: new Date().toISOString(),
            cycleEnd: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
            daysLeftInCycle: 28,
            reviewsSubmittedThisCycle: 0,
            reviewsReceivedThisCycle: 0,
            reviewsLeftToSubmit: 4,
            reviewsLeftToReceive: 4,
            totalReviewsSubmitted: 0,
            totalReviewsReceived: 0,
          };
          setPersonalStats(fallbackStats);
          setPersonalStatsError("Personal stats temporarily unavailable - showing placeholder data");
        } else if (statsResponse?.success) {
          console.log('✅ Personal stats loaded successfully');
          setPersonalStats(statsResponse.data);
        } else {
          console.error('❌ Personal stats function returned error:', statsResponse);
          // FALLBACK: Provide placeholder data instead of failing
          console.log('🔄 Using fallback placeholder data for personal stats');
          const fallbackStats = {
            cycleStart: new Date().toISOString(),
            cycleEnd: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
            daysLeftInCycle: 28,
            reviewsSubmittedThisCycle: 0,
            reviewsReceivedThisCycle: 0,
            reviewsLeftToSubmit: 4,
            reviewsLeftToReceive: 4,
            totalReviewsSubmitted: 0,
            totalReviewsReceived: 0,
          };
          setPersonalStats(fallbackStats);
          setPersonalStatsError("Personal stats temporarily unavailable - showing placeholder data");
        }
      } catch (err: any) {
        console.error('💥 Personal stats catch error:', err);
        // FALLBACK: Provide placeholder data instead of failing
        console.log('🔄 Using fallback placeholder data for personal stats');
        const fallbackStats = {
          cycleStart: new Date().toISOString(),
          cycleEnd: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
          daysLeftInCycle: 28,
          reviewsSubmittedThisCycle: 0,
          reviewsReceivedThisCycle: 0,
          reviewsLeftToSubmit: 4,
          reviewsLeftToReceive: 4,
          totalReviewsSubmitted: 0,
          totalReviewsReceived: 0,
        };
        setPersonalStats(fallbackStats);
        setPersonalStatsError("Personal stats temporarily unavailable - showing placeholder data");
      } finally {
        setPersonalStatsLoading(false);
      }

      setExtensions(extensionsData);
      setAssignments(assignmentsData);

      console.log("🎉 Dashboard data fetch completed successfully");
    } catch (error) {
      console.error("💥 Critical error fetching dashboard data:", {
        message: error?.message || "Unknown error",
        name: error?.name || "Unknown",
        stack: error?.stack || "No stack trace",
      });
      notifications.show({
        title: "Error",
        message:
          "Failed to load dashboard data. Please try refreshing the page.",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAssignment = async () => {
    if (!profile?.id) return;

    setRequestingAssignment(true);
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke("request-review-assignment", {
          body: { user_id: profile.id },
        }),
        30000, // 30 second timeout
      );

      if (error) {
        console.error("Assignment request error:", error);
        throw error;
      }

      // Check if the function returned a success message without an actual assignment
      if (data?.success && !data?.assignment) {
        notifications.show({
          title: "No Assignments Available",
          message: data.message,
          color: "blue", // Changed color to blue for informational message
          icon: <AlertCircle size={16} />, // Changed icon to AlertCircle
        });
      } else if (!data?.success) {
        throw new Error(data?.error || "Failed to request assignment");
      } else {
        notifications.show({
          title: "Assignment Received!",
          message: data.message,
          color: "green",
          icon: <Star size={16} />,
        });
      }

      // Refresh dashboard data to show the new assignment
      fetchDashboardData();
    } catch (error: any) {
      console.error("Assignment request failed:", error);
      notifications.show({
        title: "Assignment Request Failed",
        message:
          error.message ||
          "An unexpected error occurred while requesting an assignment.", // Generic error message
        color: "red",
      });
    } finally {
      setRequestingAssignment(false);
    }
  };

  const getStatusColor = (status: Extension["status"]) => {
    switch (status) {
      case "verified":
        return "green";
      case "pending_verification":
      case "queued":
        return "blue";
      case "assigned":
        return "purple";
      case "reviewed":
        return "orange";
      case "rejected":
        return "red";
      default:
        return "gray";
    }
  };

  const getStatusLabel = (status: Extension["status"]) => {
    switch (status) {
      case "verified":
        return "In my Library";
      case "queued":
        return "In Review Queue";
      case "assigned":
        return "Selected for Review";
      case "reviewed":
        return "Review Submitted";
      case "rejected":
        return "Rejected";
      default:
        return status.replace("_", " ");
    }
  };

  const handleMoveToLibrary = async (extension: Extension) => {
    try {
      // Use Edge Function to update extension status to avoid RLS issues
      const { data: updateResponse, error } = await supabase.functions.invoke(
        "update-extension-status",
        {
          body: {
            extension_id: extension.id,
            status: "verified",
          },
        },
      );

      if (error || !updateResponse?.success) {
        throw new Error(
          updateResponse?.error ||
            error?.message ||
            "Failed to update extension status",
        );
      }

      notifications.show({
        title: "Success",
        message: "Extension moved back to your library",
        color: "green",
      });
      fetchDashboardData();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to move extension to library",
        color: "red",
      });
    }
  };

  const handleSubmitToQueue = async (extension: Extension) => {
    if (!profile) {
      notifications.show({
        title: "Error",
        message: "Profile not loaded. Please try again.",
        color: "red",
      });
      return;
    }

    if (profile.credit_balance < 1) {
      notifications.show({
        title: "Insufficient Credits",
        message:
          "You need at least 1 credit to submit an extension to the review queue",
        color: "red",
      });
      return;
    }

    // Check freemium limits for free tier users
    if (profile.subscription_status === "free") {
      // First, check if we need to reset the monthly counter
      await checkAndResetMonthlyLimit();

      // Refresh profile to get updated data after potential reset
      await refreshProfile();

      // Get the updated profile data
      const updatedProfile = profile; // This should have the latest data after refresh

      // Check if user has reached their monthly limit (4 submissions for free tier)
      if ((updatedProfile.exchanges_this_month || 0) >= 4) {
        notifications.show({
          title: "Monthly Limit Reached",
          message:
            "You have reached your monthly submission limit of 4 extensions for the free tier. Upgrade to premium for unlimited submissions.",
          color: "orange",
          autoClose: 8000,
        });
        return;
      }
    }

    try {
      // Use Edge Function to update extension status to avoid RLS issues
      const { data: updateResponse, error: extensionError } =
        await supabase.functions.invoke("update-extension-status", {
          body: {
            extension_id: extension.id,
            status: "queued",
            submitted_to_queue_at: new Date().toISOString(),
          },
        });

      if (extensionError || !updateResponse?.success) {
        throw new Error(
          updateResponse?.error ||
            extensionError?.message ||
            "Failed to update extension status",
        );
      }

      const { error: creditError } = await supabase
        .from("credit_transactions")
        .insert({
          user_id: profile.id,
          amount: -1,
          type: "spent",
          description: `Queue submission for ${extension.name}`,
        });

      if (creditError) throw creditError;

      // For free tier users, increment their monthly exchange count
      if (profile.subscription_status === "free") {
        await updateProfile({
          exchanges_this_month: (profile.exchanges_this_month || 0) + 1,
        });
      }

      // Refresh profile to update credit balance display
      await refreshProfile();

      notifications.show({
        title: "Success",
        message:
          "Extension submitted for review! You will be notified by email when the review has been uploaded to the Chrome Web Store.",
        color: "green",
      });
      fetchDashboardData();
    } catch (error: any) {
      notifications.show({
        title: "Error",
        message: error.message || "Failed to submit extension",
        color: "red",
      });
    }
  };

  const handleUpgradeClick = () => {
    navigate("/upgrade");
  };

  // Show loading if initial auth is loading, profile is refreshing, or dashboard data is loading
  if (isInitialAuthLoading || isProfileRefreshing || loading) {
    return (
      <Container size="lg">
        <Center h="100vh">
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text size="lg" c="dimmed">
              {isInitialAuthLoading
                ? "Loading your account..."
                : isProfileRefreshing
                  ? "Refreshing your profile..."
                  : "Loading dashboard..."}
            </Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  // Defensive check: ensure profile exists before rendering dashboard
  if (!profile) {
    return (
      <Container size="lg">
        <Center h="100vh">
          <Stack align="center" gap="md">
            <Text size="lg" c="red">
              Profile not found
            </Text>
            <Text size="sm" c="dimmed">
              Please try refreshing the page
            </Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="md">
        <Title order={1}>Dashboard</Title>
        <Button variant="outline" onClick={() => setStatsDrawerOpened(true)}>
          Platform Stats
        </Button>
      </Group>
      <Group justify="space-between" mb="xl">
        <Stack gap="xs">
          <Title order={1}>Welcome back, {profile?.name}!</Title>
          <Text size="lg" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Here's what's happening with your extensions and reviews
          </Text>
        </Stack>
        <Group>
          {profile?.has_completed_qualification && (
            <Button
              leftSection={
                requestingAssignment ? <Loader size={16} /> : <Plus size={16} />
              }
              onClick={handleRequestAssignment}
              loading={requestingAssignment}
              disabled={assignments.length >= 1}
            >
              Request Review Assignment
            </Button>
          )}
          {!isPremium && (
            <Button
              variant="gradient"
              gradient={{ from: "yellow", to: "orange" }}
              leftSection={<Crown size={16} />}
              onClick={handleUpgradeClick}
            >
              Join Review Fast Track
            </Button>
          )}
          <Badge size="lg" variant="light" color={isPremium ? "green" : "blue"}>
            {planName} Tier
          </Badge>
          <Badge size="lg" variant="light" color="blue">
            {profile?.credit_balance || 0} Credits
          </Badge>
        </Group>
      </Group>

      {!profile?.has_completed_qualification && (
        <Alert
          icon={<AlertCircle size={16} />}
          title="Complete Your Qualification"
          color="blue"
          mb="xl"
        >
          Complete your reviewer qualification to start receiving review
          assignments and earning credits.
          <Button
            component="a"
            href="/qualification"
            variant="light"
            size="sm"
            mt="sm"
          >
            Complete Qualification
          </Button>
        </Alert>
      )}

      {assignments.length >= 1 && (
        <Alert
          icon={<AlertCircle size={16} />}
          title="Active Assignment Limit"
          color="orange"
          mb="xl"
        >
          You have an active assignment. Complete your current review before
          requesting another.
        </Alert>
      )}

      <PersonalStatsPanel
        stats={personalStats}
        loading={personalStatsLoading}
        error={personalStatsError}
        isPremium={isPremium}
        onUpgradeClick={handleUpgradeClick}
      />

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder p="xl" h="100%" className="extensions-card">
            <Group justify="space-between" mb="md">
              <Text fw={600}>Extensions</Text>
              <Package size={20} />
            </Group>
            <Text size="2.5rem" fw={800} mb="xs" className="stats-number" style={{ color: '#06b6d4' }}>
              {extensions.length}
            </Text>
            <Text size="sm">
              Total extensions in your library
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder p="xl" h="100%" className="pending-reviews-card">
            <Group justify="space-between" mb="md">
              <Text fw={600}>Pending Reviews</Text>
              <Star size={20} />
            </Group>
            <Text size="2.5rem" fw={800} mb="xs" className="stats-number" style={{ color: '#ef4444' }}>
              {assignments.length}
            </Text>
            <Text size="sm">
              Reviews assigned to you
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder p="xl" h="100%" className="credits-balance-card">
            <Group justify="space-between" mb="md">
              <Text fw={600}>Credits Balance</Text>
              <TrendingUp size={20} />
            </Group>
            <Text size="2.5rem" fw={800} mb="xs" className="stats-number" style={{ color: '#059669' }}>
              {profile?.credit_balance || 0}
            </Text>
            <Text size="sm">
              Available for queue submissions
            </Text>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 8 }}>
          <Card withBorder p="xl" h="100%">
            <Group justify="space-between" mb="md">
              <Text fw={600}>Recent Extensions</Text>
              <Button
                variant="light"
                size="sm"
                component="a"
                href="/extensions"
              >
                View All
              </Button>
            </Group>
            <Stack gap="md">
              {extensions.length === 0 ? (
                <Stack align="center" gap="md" py="xl">
                  <ThemeIcon size={60} radius="xl" variant="light" color="blue">
                    <Package size={30} />
                  </ThemeIcon>
                  <Stack align="center" gap="xs">
                    <Text fw={600} size="lg">
                      No extensions yet
                    </Text>
                    <Text c="dimmed" size="sm" ta="center">
                      Add your first Chrome extension to get started with
                      authentic reviews!
                    </Text>
                  </Stack>
                  <Button
                    onClick={() => navigate("/extensions")}
                    leftSection={<Plus size={16} />}
                    variant="light"
                  >
                    Add Extension
                  </Button>
                </Stack>
              ) : (
                extensions.map((extension) => (
                  <Card key={extension.id} withBorder p="md" radius="md">
                    <Group>
                      <Avatar size="sm" src={extension.logo_url} />
                      <Stack gap="xs">
                        <Text fw={500}>{extension.name}</Text>
                        <Text size="sm" maw={300} truncate style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          {extension.description || "No description"}
                        </Text>
                        {extension.status === "pending_verification" &&
                          extension.submitted_to_queue_at && (
                            <Text size="xs" style={{ color: '#3b82f6' }}>
                              In queue since{" "}
                              {new Date(
                                extension.submitted_to_queue_at,
                              ).toLocaleDateString()}
                            </Text>
                          )}
                        {extension.status === "assigned" && (
                          <Text size="xs" style={{ color: '#8b5cf6' }}>
                            Currently being reviewed
                          </Text>
                        )}
                        <Group justify="space-between" align="center">
                          <Badge
                            color={getStatusColor(extension.status)}
                            size="sm"
                          >
                            {getStatusLabel(extension.status)}
                          </Badge>
                          <Group gap="xs">
                            {(extension.status === "verified" ||
                              extension.status === "library") &&
                              profile?.credit_balance > 0 &&
                              (profile?.subscription_status !== "free" ||
                                ((profile?.exchanges_this_month || 0) < 4 && (
                                  <Button
                                    size="xs"
                                    onClick={() =>
                                      handleSubmitToQueue(extension)
                                    }
                                    disabled={
                                      profile?.subscription_status === "free" &&
                                      (profile?.exchanges_this_month || 0) >= 4
                                    }
                                  >
                                    {profile?.subscription_status === "free" &&
                                    (profile?.exchanges_this_month || 0) >= 4
                                      ? "Monthly Limit Reached"
                                      : "Submit to Queue"}
                                  </Button>
                                )))}
                            {extension.status === "rejected" &&
                              profile?.credit_balance > 0 &&
                              (profile?.subscription_status !== "free" ||
                                ((profile?.exchanges_this_month || 0) < 4 && (
                                  <Button
                                    size="xs"
                                    color="orange"
                                    onClick={() =>
                                      handleSubmitToQueue(extension)
                                    }
                                    disabled={
                                      !isPremium &&
                                      (profile?.exchanges_this_month || 0) >= 4
                                    }
                                  >
                                    {!isPremium &&
                                    (profile?.exchanges_this_month || 0) >= 4
                                      ? "Monthly Limit Reached"
                                      : "Re-submit to Queue"}
                                  </Button>
                                )))}
                            {extension.status === "reviewed" && (
                              <Button
                                size="xs"
                                color="green"
                                onClick={() => handleMoveToLibrary(extension)}
                              >
                                Add to Library
                              </Button>
                            )}
                          </Group>
                        </Group>
                      </Stack>
                    </Group>
                  </Card>
                ))
              )}
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder p="xl" h="100%">
            <Group justify="space-between" mb="md">
              <Text fw={600}>Pending Reviews</Text>
              <Clock size={20} />
            </Group>
            <Stack gap="md">
              {assignments.length === 0 ? (
                <Stack align="center" gap="md" py="xl">
                  <ThemeIcon
                    size={60}
                    radius="xl"
                    variant="light"
                    color="purple"
                  >
                    <Star size={30} />
                  </ThemeIcon>
                  <Stack align="center" gap="xs">
                    <Text fw={600} size="lg">
                      No pending reviews
                    </Text>
                    <Text c="dimmed" size="sm" ta="center">
                      {profile?.has_completed_qualification
                        ? "Click 'Request Assignment' to get started and earn credits!"
                        : "Complete your qualification to start receiving review assignments."}
                    </Text>
                  </Stack>
                  {profile?.has_completed_qualification && (
                    <Button
                      leftSection={
                        requestingAssignment ? (
                          <Loader size={14} />
                        ) : (
                          <Plus size={14} />
                        )
                      }
                      onClick={handleRequestAssignment}
                      loading={requestingAssignment}
                      disabled={assignments.length >= 1}
                      variant="light"
                    >
                      Request Assignment
                    </Button>
                  )}
                </Stack>
              ) : (
                assignments.map((assignment) => (
                  <Card key={assignment.id} withBorder p="md" radius="md">
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>
                        {assignment.extension?.name
                          ? truncate(assignment.extension.name, 20)
                          : "Unknown Extension"}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Due: {new Date(assignment.due_at).toLocaleDateString()}
                      </Text>
                      <Progress
                        value={Math.max(
                          0,
                          100 -
                            ((new Date(assignment.due_at).getTime() -
                              Date.now()) /
                              (7 * 24 * 60 * 60 * 1000)) *
                              100,
                        )}
                        size="xs"
                        radius="xl"
                        color="blue"
                      />
                    </Stack>
                  </Card>
                ))
              )}
            </Stack>
            {assignments.length > 0 && (
              <Button
                variant="light"
                size="sm"
                fullWidth
                mt="md"
                component="a"
                href="/reviews"
              >
                Go to My Review Assignment(s)
              </Button>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      <WelcomeModal
        opened={welcomeModalOpened}
        onClose={() => setWelcomeModalOpened(false)}
        profile={profile}
        extensions={extensions}
      />

      <Drawer
        opened={statsDrawerOpened}
        onClose={() => setStatsDrawerOpened(false)}
        position="right"
        size="lg"
        title="Platform Stats"
      >
        <PlatformStatsPanel />
      </Drawer>
    </Container>
  );
}
